import express from "express";
import { getAdminOverview, getAdminUsers, updateUserStatus } from "../controllers/admin.controller.js";
import { getSettings, updateSettings } from "../controllers/settings.controller.js";
import { protect, adminOnly } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/overview", protect, adminOnly, getAdminOverview);
router.get("/users", protect, adminOnly, getAdminUsers);
router.put("/users/:id/status", protect, adminOnly, updateUserStatus);
router.get("/settings", protect, adminOnly, getSettings);
router.put("/settings", protect, adminOnly, updateSettings);

export default router;
