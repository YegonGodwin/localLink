import express from "express";
import {
    getServices,
    getServiceById,
    createService,
    updateService,
    deleteService,
    getServicesByProvider,
} from "../controllers/service.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = express.Router();

router.route("/").get(getServices).post(protect, authorize("PROVIDER", "ADMIN"), createService);

router
    .route("/:id")
    .get(getServiceById)
    .put(protect, authorize("PROVIDER", "ADMIN"), updateService)
    .delete(protect, authorize("PROVIDER", "ADMIN"), deleteService);

router.get("/provider/:id", getServicesByProvider);

export default router;
