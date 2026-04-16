import express from "express";
import {
  initiateSafepay,
  handleSafepayWebhook,
  handlePaymentSuccess,
  getPaymentStatus,
} from "../controllers/payment.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();

/**
 * 1. Initiate Safepay Checkout
 * Used by the mobile app to get the tracker and checkout URL.
 */
router.post("/safepay-init", authMiddleware, initiateSafepay);

/**
 * 2. Safepay Webhook
 * CRITICAL: This route must be PUBLIC. Safepay servers will hit this
 * to notify your backend about the "PAID" status so you can update the balance.
 */
router.post("/safepay-webhook", handleSafepayWebhook);

/**
 * 3. Payment Success Redirect
 * This is where Safepay sends the user's browser after a successful payment.
 * It renders the HTML with the deep link to take the user back to the app.
 */
router.get("/payment-success", handlePaymentSuccess);

/**
 * 4. Status Check
 * The mobile app calls this after the WebView closes to verify
 * that the availableBalance was actually updated in the DB.
 */
router.get("/status/:txnRefNo", authMiddleware, getPaymentStatus);

export default router;
