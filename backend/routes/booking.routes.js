import express from "express";
import {
    createBooking,
    getBookingById,
    updateBookingStatus,
    getMyBookings,
    getMyJobs,
} from "../controllers/booking.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

router.route("/").post(protect, createBooking);
router.get("/my-bookings", protect, getMyBookings);
router.get("/my-jobs", protect, authorize("PROVIDER", "ADMIN"), getMyJobs);
router.route("/:id").get(protect, getBookingById);
router.put("/:id/status", protect, updateBookingStatus);

export default router;
