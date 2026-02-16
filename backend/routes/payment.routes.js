import express from "express";
import {
    initiateMpesaStkPush,
    handleMpesaCallback,
    processEscrowAutoRelease,
    processEscrowReleaseQueue,
    releaseEscrowToProvider,
    handleMpesaB2CResultCallback,
    handleMpesaB2CTimeoutCallback,
    getEscrowReconciliation,
    raiseEscrowDispute,
    listEscrowDisputes,
    getDisputes,
    resolveEscrowDispute,
    extendEscrowHold,
    overrideEscrowReleaseApproval,
    getEscrowOpsSummary,
} from "../controllers/payment.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";
import { verifyMpesaWebhook } from "../middleware/webhookAuth.middleware.js";

const router = express.Router();

router.post("/mpesa/stk-push", protect, initiateMpesaStkPush);
router.post("/mpesa/callback", verifyMpesaWebhook("STK"), handleMpesaCallback);
router.post("/mpesa/b2c/result", verifyMpesaWebhook("B2C"), handleMpesaB2CResultCallback);
router.post("/mpesa/b2c/timeout", verifyMpesaWebhook("B2C"), handleMpesaB2CTimeoutCallback);
router.get("/escrow/ops-summary", protect, adminOnly, getEscrowOpsSummary);
router.post("/escrow/process-auto-release", protect, adminOnly, processEscrowAutoRelease);
router.post("/escrow/process-release-queue", protect, adminOnly, processEscrowReleaseQueue);
router.post("/escrow/:escrowId/release", protect, adminOnly, releaseEscrowToProvider);
router.get("/escrow/:escrowId/reconciliation", protect, adminOnly, getEscrowReconciliation);
router.post("/escrow/:escrowId/disputes", protect, raiseEscrowDispute);
router.get("/escrow/:escrowId/disputes", protect, listEscrowDisputes);
router.get("/disputes", protect, getDisputes);
router.post("/disputes/:disputeId/resolve", protect, adminOnly, resolveEscrowDispute);
router.post("/escrow/:escrowId/hold/extend", protect, adminOnly, extendEscrowHold);
router.post("/escrow/:escrowId/override-release-approval", protect, adminOnly, overrideEscrowReleaseApproval);

export default router;
