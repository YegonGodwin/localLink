import express from "express";
import { getMyOrders, getOrderById } from "../controllers/order.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/my-orders", protect, getMyOrders);
router.get("/:id", protect, getOrderById);

export default router;

