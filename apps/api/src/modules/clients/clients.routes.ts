import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { searchServices, getService, submitReview } from "./clients.controller.js";

const router = Router();
router.get("/services/search",    searchServices);
router.get("/services/:id",       getService);
router.post("/services/:id/review", protect, submitReview);

export default router;
