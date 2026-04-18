"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentStatus = exports.handlePaymentSuccess = exports.handleSafepayWebhook = exports.initiateSafepay = void 0;
const crypto = __importStar(require("crypto"));
const db_1 = require("../config/db");
const User_1 = require("../entities/User");
const transactions_1 = require("../entities/transactions");
const SafepaySDK = require("@sfpy/node-sdk");
const safePayEnvironment = process.env.SAFEPAY_ENVIRONMENT || "sandbox";
const sfpy = new SafepaySDK.Safepay({
    environment: safePayEnvironment,
    apiKey: process.env.SAFEPAY_API_KEY,
    v1Secret: process.env.SAFEPAY_SECRET_KEY,
    webhookSecret: process.env.SAFEPAY_WEBHOOK_SECRET,
});
const hasMatchingSignature = (received, expected) => {
    const receivedBuffer = Buffer.from(received, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");
    if (receivedBuffer.length !== expectedBuffer.length) {
        return false;
    }
    return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
};
const initiateSafepay = async (req, res) => {
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
        await db_1.AppDataSource.getRepository(transactions_1.Payment).save({
            txnRefNo: session.token,
            amount: parsedAmount,
            userId,
            status: "PENDING",
        });
        const auth = await sfpy.authorization.create();
        const host = safePayEnvironment === "production"
            ? "api.getsafepay.com"
            : "sandbox.api.getsafepay.com";
        const returnUrl = `${backendUrl}/api/payments/payment-success`;
        const checkoutUrl = `https://${host}/checkout/pay?beacon=${session.token}&tbt=${auth}&env=${safePayEnvironment}&source=mobile&return_url=${encodeURIComponent(returnUrl)}`;
        return res.json({ url: checkoutUrl, tracker: session.token });
    }
    catch (error) {
        console.error("Safepay initiate error:", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.initiateSafepay = initiateSafepay;
const handleSafepayWebhook = async (req, res) => {
    const signature = req.headers["x-sfpy-signature"];
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
    let match = hasMatchingSignature(signature, tokenSignature) ||
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
            await db_1.AppDataSource.transaction(async (manager) => {
                const payment = await manager.findOne(transactions_1.Payment, {
                    where: { txnRefNo: notification.tracker },
                    lock: { mode: "pessimistic_write" },
                });
                if (!payment || payment.status === "SUCCESS") {
                    return;
                }
                const user = await manager.findOne(User_1.User, {
                    where: { id: payment.userId },
                    lock: { mode: "pessimistic_write" },
                });
                if (!user) {
                    throw new Error(`User ${payment.userId} not found for payment`);
                }
                user.availableBalance = Number((Number(user.availableBalance || 0) + Number(payment.amount)).toFixed(2));
                payment.status = "SUCCESS";
                await manager.save(User_1.User, user);
                await manager.save(transactions_1.Payment, payment);
            });
        }
        return res.status(200).send("OK");
    }
    catch (err) {
        console.error("Safepay webhook processing error:", err.message);
        return res.status(200).send("Error");
    }
};
exports.handleSafepayWebhook = handleSafepayWebhook;
const handlePaymentSuccess = async (req, res) => {
    res.setHeader("Content-Type", "text/html").send(`
    <html><body style="text-align:center;padding-top:100px;font-family:sans-serif;">
      <h2 style="color:#00A99D;">Payment Successful</h2>
      <p>Redirecting you back to the app...</p>
      <script>setTimeout(() => { window.location.href="highwayhelp://profile"; }, 1500);</script>
    </body></html>
  `);
};
exports.handlePaymentSuccess = handlePaymentSuccess;
const getPaymentStatus = async (req, res) => {
    const { txnRefNo } = req.params;
    const authReq = req;
    const payment = await db_1.AppDataSource.getRepository(transactions_1.Payment).findOne({
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
exports.getPaymentStatus = getPaymentStatus;
