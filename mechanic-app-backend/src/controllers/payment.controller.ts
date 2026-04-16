import { Request, Response } from "express";
import { AppDataSource } from "../config/db";
import { User } from "../entities/User";
import { Payment } from "../entities/transactions";
import * as crypto from "crypto";
const SafepaySDK = require("@sfpy/node-sdk");

const sfpy = new SafepaySDK.Safepay({
  environment: "sandbox",
  apiKey: process.env.SAFEPAY_API_KEY,
  v1Secret: process.env.SAFEPAY_SECRET_KEY,
  webhookSecret: process.env.SAFEPAY_WEBHOOK_SECRET,
});

export const initiateSafepay = async (req: any, res: Response) => {
  console.log("\n--- 💳 [STEP 1: INITIATE] Start ---");
  const userId = req.user.id;
  const { amount } = req.body;

  try {
    const session = await sfpy.payments.create({
      amount: Number(amount),
      currency: "PKR",
    });

    await AppDataSource.getRepository(Payment).save({
      txnRefNo: session.token,
      amount: Number(amount),
      userId,
      status: "PENDING",
    });

    const auth = await sfpy.authorization.create();
    const returnUrl = `${process.env.BACKEND_URL}/payments/payment-success`;
    const checkoutUrl = `https://sandbox.api.getsafepay.com/checkout/pay?beacon=${session.token}&tbt=${auth}&env=sandbox&source=mobile&return_url=${encodeURIComponent(returnUrl)}`;

    res.json({ url: checkoutUrl, tracker: session.token });
  } catch (error: any) {
    console.error("❌ [INITIATE] Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const handleSafepayWebhook = async (req: any, res: Response) => {
  console.log("\n--- 📥 [STEP 2: WEBHOOK] Received ---");

  const signature = req.headers["x-sfpy-signature"] as string;
  const secret = process.env.SAFEPAY_WEBHOOK_SECRET;
  const body = req.body;
  const token = body.data?.token;

  if (!token || !secret || !signature) {
    console.error("⚠️ [WEBHOOK] Missing required fields for verification.");
    return res.status(200).send("Ignored");
  }

  // 1. Try Token Verification (Standard)
  const tokenSha512 = crypto
    .createHmac("sha512", secret)
    .update(token)
    .digest("hex");

  // 2. Try Data String Verification (Fallback)
  const dataString = JSON.stringify(body.data);
  const dataSha512 = crypto
    .createHmac("sha512", secret)
    .update(dataString)
    .digest("hex");

  console.log(`> Header Signature: ${signature}`);
  console.log(`> Token HMAC:      ${tokenSha512}`);
  console.log(`> Data HMAC:       ${dataSha512}`);

  let match = signature === tokenSha512 || signature === dataSha512;

  // 3. Try Raw Body (Final Fallback if middleware preserves it)
  if (!match && req.rawBody) {
    const rawSha512 = crypto
      .createHmac("sha512", secret)
      .update(req.rawBody)
      .digest("hex");
    if (signature === rawSha512) match = true;
  }

  if (!match) {
    console.error(
      "❌ [WEBHOOK] Signature Mismatch! None of the 3 methods matched.",
    );
    return res.status(200).send("Signature Mismatch");
  }

  try {
    const notification = body.data?.notification;
    console.log("✅ Webhook Verified. Tracker:", notification?.tracker);

    if (notification?.state === "PAID") {
      const trackerId = notification.tracker;

      await AppDataSource.transaction(async (manager) => {
        const payment = await manager.findOne(Payment, {
          where: { txnRefNo: trackerId },
          lock: { mode: "pessimistic_write" },
        });

        if (payment && payment.status !== "SUCCESS") {
          const user = await manager.findOne(User, {
            where: { id: payment.userId },
          });

          if (user) {
            const oldBalance = Number(user.availableBalance || 0);
            user.availableBalance = oldBalance + Number(payment.amount);
            await manager.save(User, user);
            console.log(
              `💰 [WEBHOOK] Balance Updated: ${oldBalance} -> ${user.availableBalance}`,
            );
          }

          payment.status = "SUCCESS";
          await manager.save(Payment, payment);
          console.log("🏁 [WEBHOOK] DB Records Updated.");
        } else {
          console.warn(`⚠️ No pending record for tracker: ${trackerId}`);
        }
      });
    }

    res.status(200).send("OK");
  } catch (err: any) {
    console.error("🔥 Webhook processing error:", err.message);
    res.status(200).send("Error");
  }
};

export const handlePaymentSuccess = async (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html").send(`
    <html><body style="text-align:center;padding-top:100px;font-family:sans-serif;">
      <h2 style="color:#00A99D;">✓ Payment Successful</h2>
      <p>Redirecting you back to the app...</p>
      <script>setTimeout(() => { window.location.href="highwayhelp://profile"; }, 1500);</script>
    </body></html>
  `);
};

export const getPaymentStatus = async (req: Request, res: Response) => {
  const { txnRefNo } = req.params;
  const payment = await AppDataSource.getRepository(Payment).findOne({
    where: { txnRefNo },
  });
  res.json({ status: payment?.status || "NOT_FOUND" });
};
