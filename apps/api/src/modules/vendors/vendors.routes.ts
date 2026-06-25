import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role } from "@repo/types";
import { getDashboard, signup, listVendorServices, createService, toggleService, toggleDeal, getTransactions, getReports, getProfile, updateProfile, deleteService, acceptBooking, rejectBooking, completeBooking } from "./vendors.controller.js";

const router = Router();
router.post("/signup", signup);
router.use(protect);

router.get("/dashboard",    getDashboard);
router.get("/profile",     authorize([Role.VENDOR]), getProfile);
router.patch("/profile",   authorize([Role.VENDOR]), updateProfile);
router.get("/transactions", authorize([Role.VENDOR]), getTransactions);
router.get("/reports",      authorize([Role.VENDOR]), getReports);
router.get("/services",     authorize([Role.VENDOR]), listVendorServices);
router.post("/services",    authorize([Role.VENDOR]), createService);
router.patch("/services/:id/toggle",   authorize([Role.VENDOR]), toggleService);
router.patch("/services/:id/deal",     authorize([Role.VENDOR]), toggleDeal);
router.delete("/services/:id",         authorize([Role.VENDOR]), deleteService);
router.patch("/bookings/:id/accept",   authorize([Role.VENDOR]), acceptBooking);
router.patch("/bookings/:id/reject",   authorize([Role.VENDOR]), rejectBooking);
router.patch("/bookings/:id/complete", authorize([Role.VENDOR]), completeBooking);

export default router;
