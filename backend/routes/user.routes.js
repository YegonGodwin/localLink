import express from "express";
import { getUserProfile, updateUserProfile, getProviders, getProviderById, getUserById } from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/profile").get(protect, getUserProfile).put(protect, updateUserProfile);
router.get("/providers", getProviders);
router.get("/providers/:id", getProviderById);
router.get("/:id", protect, getUserById);

export default router;
