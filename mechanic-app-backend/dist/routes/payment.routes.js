"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const payment_secure_controller_1 = require("../controllers/payment.secure.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
/**
 * 1. Initiate Safepay Checkout
 * Used by the mobile app to get the tracker and checkout URL.
 */
router.post("/safepay-init", auth_middleware_1.authMiddleware, payment_secure_controller_1.initiateSafepay);
/**
 * 2. Safepay Webhook
 * CRITICAL: This route must be PUBLIC. Safepay servers will hit this
 * to notify your backend about the "PAID" status so you can update the balance.
 */
router.post("/safepay-webhook", payment_secure_controller_1.handleSafepayWebhook);
/**
 * 3. Payment Success Redirect
 * This is where Safepay sends the user's browser after a successful payment.
 * It renders the HTML with the deep link to take the user back to the app.
 */
router.get("/payment-success", payment_secure_controller_1.handlePaymentSuccess);
/**
 * 4. Status Check
 * The mobile app calls this after the WebView closes to verify
 * that the availableBalance was actually updated in the DB.
 */
router.get("/status/:txnRefNo", auth_middleware_1.authMiddleware, payment_secure_controller_1.getPaymentStatus);
exports.default = router;
