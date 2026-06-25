import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { createBooking, checkout, getMyOrders } from "./bookings.controller.js";

const router = Router();
router.use(protect);
router.post("/",        createBooking);
router.post("/checkout", checkout);
router.get("/my-orders", getMyOrders);

export default router;
