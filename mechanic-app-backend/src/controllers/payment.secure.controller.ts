import { Request, Response } from "express";
import * as crypto from "crypto";
import { AppDataSource } from "../config/db";
import { User } from "../entities/User";
import { Payment } from "../entities/transactions";
import { AuthRequest } from "../middlewares/auth.middleware";

const SafepaySDK = require("@sfpy/node-sdk");

const safePayEnvironment = process.env.SAFEPAY_ENVIRONMENT || "sandbox";
const sfpy = new SafepaySDK.Safepay({
  environment: safePayEnvironment,
  apiKey: process.env.SAFEPAY_API_KEY,
  v1Secret: process.env.SAFEPAY_SECRET_KEY,
  webhookSecret: process.env.SAFEPAY_WEBHOOK_SECRET,
});

const hasMatchingSignature = (received: string, expected: string) => {
  const receivedBuffer = Buffer.from(received, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
};

export const initiateSafepay = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const parsedAmount = Number(req.body?.amount);

  try {
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      return res.status(500).json({ message: "BACKEND_URL is not configured" });
    }

    const session = await sfpy.payments.create({
      amount: parsedAmount,
      currency: "PKR",
    });

    await AppDataSource.getRepository(Payment).save({
      txnRefNo: session.token,
      amount: parsedAmount,
      userId,
      status: "PENDING",
    });

    const auth = await sfpy.authorization.create();
    const host =
      safePayEnvironment === "production"
        ? "api.getsafepay.com"
        : "sandbox.api.getsafepay.com";
    const returnUrl = `${backendUrl}/api/payments/payment-success`;
    const checkoutUrl = `https://${host}/checkout/pay?beacon=${session.token}&tbt=${auth}&env=${safePayEnvironment}&source=mobile&return_url=${encodeURIComponent(returnUrl)}`;

    return res.json({ url: checkoutUrl, tracker: session.token });
  } catch (error: any) {
    console.error("Safepay initiate error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const handleSafepayWebhook = async (req: any, res: Response) => {
  const signature = req.headers["x-sfpy-signature"] as string | undefined;
  const secret = process.env.SAFEPAY_WEBHOOK_SECRET;
  const body = req.body;
  const token = body?.data?.token;

  if (!token || !secret || !signature) {
    return res.status(200).send("Ignored");
  }

  const tokenSignature = crypto
    .createHmac("sha512", secret)
    .update(token)
    .digest("hex");
  const dataSignature = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(body.data))
    .digest("hex");

  let match =
    hasMatchingSignature(signature, tokenSignature) ||
    hasMatchingSignature(signature, dataSignature);

  if (!match && req.rawBody) {
    const rawSignature = crypto
      .createHmac("sha512", secret)
      .update(req.rawBody)
      .digest("hex");
    match = hasMatchingSignature(signature, rawSignature);
  }

  if (!match) {
    return res.status(200).send("Signature Mismatch");
  }

  try {
    const notification = body?.data?.notification;

    if (notification?.state === "PAID" && notification.tracker) {
      await AppDataSource.transaction(async (manager) => {
        const payment = await manager.findOne(Payment, {
          where: { txnRefNo: notification.tracker },
          lock: { mode: "pessimistic_write" },
        });

        if (!payment || payment.status === "SUCCESS") {
          return;
        }

        const user = await manager.findOne(User, {
          where: { id: payment.userId },
          lock: { mode: "pessimistic_write" },
        });

        if (!user) {
          throw new Error(`User ${payment.userId} not found for payment`);
        }

        user.availableBalance = Number(
          (Number(user.availableBalance || 0) + Number(payment.amount)).toFixed(
            2,
          ),
        );
        payment.status = "SUCCESS";

        await manager.save(User, user);
        await manager.save(Payment, payment);
      });
    }

    return res.status(200).send("OK");
  } catch (err: any) {
    console.error("Safepay webhook processing error:", err.message);
    return res.status(200).send("Error");
  }
};

export const handlePaymentSuccess = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html").send(`
    <html><body style="text-align:center;padding-top:100px;font-family:sans-serif;">
      <h2 style="color:#00A99D;">Payment Successful</h2>
      <p>Redirecting you back to the app...</p>
      <script>setTimeout(() => { window.location.href="highwayhelp://profile"; }, 1500);</script>
    </body></html>
  `);
};

export const getPaymentStatus = async (req: Request, res: Response) => {
  const { txnRefNo } = req.params;
  const authReq = req as AuthRequest;

  const payment = await AppDataSource.getRepository(Payment).findOne({
    where: { txnRefNo },
  });

  if (!payment) {
    return res.status(404).json({ status: "NOT_FOUND" });
  }

  if (payment.userId !== authReq.user?.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  return res.json({ status: payment.status });
};
