import { Router } from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role } from "@repo/types";
import { getDashboard, signup, listVendorServices, createService, toggleService, getTransactions, getReports, getProfile, updateProfile } from "./vendors.controller.js";

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
router.patch("/services/:id/toggle", authorize([Role.VENDOR]), toggleService);

export default router;
