import express from "express";
import { getTransactions, getTransactionById, createTransaction } from "../controllers/transaction.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/").get(protect, getTransactions).post(protect, createTransaction);
router.get("/:id", protect, getTransactionById);

export default router;
