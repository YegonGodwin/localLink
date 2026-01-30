import express from "express";
import { getMessages, sendMessage, getChatContacts, markAsRead } from "../controllers/chat.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/contacts", protect, getChatContacts);
router.get("/messages/:userId", protect, getMessages);
router.post("/messages", protect, sendMessage);
router.put("/read/:userId", protect, markAsRead);

export default router;
