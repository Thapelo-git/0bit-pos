import { Router } from "express";
import {
  adminDashboard, listUsers, inviteUser, updateUserStatus, updateUserRole,
  inviteManager, listManagers, adminActivity, listPendingVendors, approveVendor,
  listAllVendors, updateVendorStatus, listAllServices, approveService, rejectService, verifyVendor,
  getPendingPayouts, markPayoutPaid, getPayoutsHistory,
} from "./admin.controller.js";
import { protect }   from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/role.middleware.js";
import { Role }      from "@repo/types";

const router = Router();
router.use(protect);
router.use(authorize([Role.ADMIN, Role.SUPER_ADMIN]));

router.get("/dashboard",          adminDashboard);
router.get("/activity",           adminActivity);

// Users
router.get("/users",              listUsers);
router.get("/vendors",             listAllVendors);
router.get("/vendors/pending",     listPendingVendors);
router.patch("/vendors/:id/status", updateVendorStatus);
router.post("/users/invite",      inviteUser);
router.patch("/users/:id/status", updateUserStatus);
router.patch("/users/:id/role",   updateUserRole);
router.patch("/vendors/:id/approve", approveVendor);
router.patch("/vendors/:id/verify",  verifyVendor);

// Managers
router.get("/managers",           listManagers);
router.post("/managers/invite",   inviteManager);

// Services
router.get("/services",                listAllServices);
router.patch("/services/:id/approve",  approveService);
router.patch("/services/:id/reject",   rejectService);

// Payouts
router.get("/payouts",                 getPendingPayouts);
router.get("/payouts/history",         getPayoutsHistory);
router.patch("/payouts/:id/mark-paid", markPayoutPaid);

export default router;
