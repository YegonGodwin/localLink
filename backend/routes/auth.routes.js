import express from "express";
import { login, register, verifyEmail, resendVerification } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerification);

export default router;
