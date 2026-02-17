import express from "express";
import { createReview, getServiceReviews } from "../controllers/review.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

router.route("/").post(protect, authorize("CONSUMER", "ADMIN"), createReview);
router.get("/service/:serviceId", getServiceReviews);

export default router;
