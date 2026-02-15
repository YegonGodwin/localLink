import express from "express";
import {
    initiateMpesaStkPush,
    handleMpesaCallback,
    processEscrowAutoRelease,
    processEscrowReleaseQueue,
    releaseEscrowToProvider,
    handleMpesaB2CResultCallback,
    handleMpesaB2CTimeoutCallback,
} from "../controllers/payment.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/mpesa/stk-push", protect, initiateMpesaStkPush);
router.post("/mpesa/callback", handleMpesaCallback);
router.post("/mpesa/b2c/result", handleMpesaB2CResultCallback);
router.post("/mpesa/b2c/timeout", handleMpesaB2CTimeoutCallback);
router.post("/escrow/process-auto-release", protect, adminOnly, processEscrowAutoRelease);
router.post("/escrow/process-release-queue", protect, adminOnly, processEscrowReleaseQueue);
router.post("/escrow/:escrowId/release", protect, adminOnly, releaseEscrowToProvider);

export default router;
