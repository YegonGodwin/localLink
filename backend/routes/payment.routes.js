import express from "express";
import { initiateMpesaStkPush, handleMpesaCallback } from "../controllers/payment.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/mpesa/stk-push", protect, initiateMpesaStkPush);
router.post("/mpesa/callback", handleMpesaCallback);

export default router;
