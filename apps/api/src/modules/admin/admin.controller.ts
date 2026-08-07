import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus, Role } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError }   from "../../utils/appError.js";
import { sendInviteEmail, sendVendorApprovalEmail } from "../../services/mail.service.js";
import { notify, notifyAdmins } from "../../utils/notify.js";

// ── Admin dashboard ────────────────────────────────────────────────────────────

export const adminDashboard = catchAsync(async (_req: Request, res: Response) => {
  const [totalUsers, totalManagers, pendingUsers, activeUsers, recentSignups, recentActivity] =
    await Promise.all([
      prisma.user.count({ where: { role: "USER",    accountStatus: { not: "DELETED" } } }),
      prisma.user.count({ where: { role: "MANAGER", accountStatus: { not: "DELETED" } } }),
      prisma.user.count({ where: { role: "USER",    accountStatus: "PENDING" } }),
      prisma.user.count({ where: { role: "USER",    accountStatus: "ACTIVE"  } }),
      prisma.user.findMany({
        where:   { role: "USER" },
        orderBy: { createdAt: "desc" },
        take:    5,
        select:  { id: true, email: true, displayName: true, firstName: true, lastName: true,
                   accountStatus: true, createdAt: true },
      }),
      prisma.auditLog.findMany({
        where:   { user: { role: { in: ["USER", "MANAGER"] } } },
        orderBy: { createdAt: "desc" },
        take:    8,
        include: { user: { select: { email: true, displayName: true, firstName: true, lastName: true } } },
      }),
    ]);

  return res.status(HttpStatus.OK).json({
    status: "success",
    data:   { totalUsers, totalManagers, pendingUsers, activeUsers, recentSignups, recentActivity },
  });
});

// ── List users (supports ?role=USER|MANAGER, ?status=, ?page=) ────────────────

export const listUsers = catchAsync(async (req: Request, res: Response) => {
  const page   = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit  = 50;
  const skip   = (page - 1) * limit;
  const roleQ  = (req.query.role as string)?.toUpperCase();
  const status = req.query.status as string | undefined;

  const validRoles = ["USER", "MANAGER", "VENDOR", "CLIENT"];
  if (roleQ && !validRoles.includes(roleQ))
    throw new AppError("Invalid role filter", HttpStatus.BAD_REQUEST);

  const where: any = {
    role:          roleQ ? { equals: roleQ } : { in: ["USER", "MANAGER", "VENDOR", "CLIENT"] },
    accountStatus: status ? { equals: status } : { not: "DELETED" },
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, email: true, role: true,
        firstName: true, lastName: true, displayName: true,
        accountStatus: true, createdAt: true, lastActiveAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return res.status(HttpStatus.OK).json({
    status: "success",
    data:   { users, pagination: { total, page, pages: Math.ceil(total / limit) } },
  });
});

// ── Activity log (paginated audit for admin) ───────────────────────────────────

export const adminActivity = catchAsync(async (req: Request, res: Response) => {
  const page   = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit  = 30;
  const action = req.query.action as string | undefined;

  const where: any = {
    user: { role: { in: ["USER", "MANAGER", "ADMIN"] } },
  };
  if (action) where.action = { contains: action.toUpperCase() };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
      include: {
        user: { select: { email: true, displayName: true, firstName: true, lastName: true, role: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return res.status(HttpStatus.OK).json({
    status: "success",
    data:   { logs, pagination: { total, page, pages: Math.ceil(total / limit) } },
  });
});

// ── Invite user (role: USER) ───────────────────────────────────────────────────

export const inviteUser = catchAsync(async (req: Request, res: Response) => {
  const { email, firstName, lastName } = req.body;
  if (!email) throw new AppError("Email is required", HttpStatus.BAD_REQUEST);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError("User already exists", HttpStatus.CONFLICT);

  const code    = Math.random().toString(36).slice(2, 10).toUpperCase();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      email,
      password:            "",
      role:                "USER",
      accountStatus:       "PENDING",
      firstName:           firstName ?? null,
      lastName:            lastName  ?? null,
      invitedById:         req.user!.userId,
      verificationCode:    code,
      verificationExpires: expires,
    },
  });

  const inviteLink = `${process.env.FRONTEND_URL}/set-password?token=${code}&email=${encodeURIComponent(email)}`;
  await sendInviteEmail(email, inviteLink, firstName ?? "User");

  await prisma.auditLog.create({
    data: { userId: req.user!.userId, action: "USER_INVITED", meta: { email } },
  });
  req.auditLogged = true;

  return res.status(HttpStatus.CREATED).json({
    status:  "success",
    message: "User invited successfully",
    data:    { id: user.id, email: user.email },
  });
});

// ── Invite manager (role: MANAGER) ────────────────────────────────────────────

export const inviteManager = catchAsync(async (req: Request, res: Response) => {
  const { email, firstName, lastName } = req.body;
  if (!email) throw new AppError("Email is required", HttpStatus.BAD_REQUEST);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError("User already exists", HttpStatus.CONFLICT);

  const code    = Math.random().toString(36).slice(2, 10).toUpperCase();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const manager = await prisma.user.create({
    data: {
      email,
      password:            "",
      role:                "MANAGER",
      accountStatus:       "PENDING",
      firstName:           firstName ?? null,
      lastName:            lastName  ?? null,
      invitedById:         req.user!.userId,
      verificationCode:    code,
      verificationExpires: expires,
    },
  });

  const inviteLink = `${process.env.FRONTEND_URL}/set-password?token=${code}&email=${encodeURIComponent(email)}`;
  await sendInviteEmail(email, inviteLink, firstName ?? "Manager");

  await prisma.auditLog.create({
    data: { userId: req.user!.userId, action: "MANAGER_INVITED", meta: { email } },
  });
  req.auditLogged = true;

  return res.status(HttpStatus.CREATED).json({
    status:  "success",
    message: "Manager invited successfully",
    data:    { id: manager.id, email: manager.email },
  });
});

// ── List managers ──────────────────────────────────────────────────────────────

export const listManagers = catchAsync(async (_req: Request, res: Response) => {
  const managers = await prisma.user.findMany({
    where:   { role: "MANAGER", accountStatus: { not: "DELETED" } },
    select:  {
      id: true, email: true, firstName: true, lastName: true,
      displayName: true, accountStatus: true, createdAt: true, lastActiveAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: { managers } });
});

// ── List all vendors (admin oversight) ────────────────────────────────────────

export const listAllVendors = catchAsync(async (_req: Request, res: Response) => {
  const vendors = await prisma.user.findMany({
    where: { role: "VENDOR", accountStatus: { not: "DELETED" } },
    select: {
      id: true, email: true, displayName: true, accountStatus: true, createdAt: true,
      vendorProfile: {
        select: {
          id: true, businessName: true, phone: true, locationText: true, isActive: true, isVerified: true,
          services: { select: { id: true, isActive: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const vendorData = await Promise.all(vendors.map(async (v) => {
    const [bookingCount, completedAgg] = await Promise.all([
      prisma.booking.count({ where: { service: { vendorProfile: { userId: v.id } } } }),
      prisma.booking.aggregate({
        where: { service: { vendorProfile: { userId: v.id } }, status: "COMPLETED" },
        _sum: { totalAmount: true }
      })
    ]);
    return { ...v, revenueEarned: completedAgg._sum.totalAmount ?? 0, totalBookings: bookingCount };
  }));

  return res.status(HttpStatus.OK).json({ status: "success", data: { vendors: vendorData } });
});

// ── Update vendor status ───────────────────────────────────────────────────────

export const updateVendorStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { accountStatus } = req.body;

  const valid = ["ACTIVE", "SUSPENDED", "PENDING"];
  if (!valid.includes(accountStatus))
    throw new AppError("Invalid status value", HttpStatus.BAD_REQUEST);

  const vendor = await prisma.user.findUnique({ where: { id }, include: { vendorProfile: true } });
  if (!vendor || vendor.role !== "VENDOR")
    throw new AppError("Vendor not found", HttpStatus.NOT_FOUND);

  await prisma.user.update({ where: { id }, data: { accountStatus } });

  if (vendor.vendorProfile) {
    const profileActive = accountStatus === "ACTIVE";
    await prisma.vendorProfile.update({ where: { id: vendor.vendorProfile.id }, data: { isActive: profileActive } });
    await prisma.service.updateMany({ where: { vendorProfileId: vendor.vendorProfile.id }, data: { isActive: profileActive } });
  }

  const statusMsg = accountStatus === "ACTIVE"   ? { title: "Account Reactivated", body: "Your vendor account has been reactivated. Your services are now live." }
                  : accountStatus === "SUSPENDED" ? { title: "Account Suspended",   body: "Your vendor account has been suspended. Please contact support." }
                  : { title: "Account Status Updated", body: `Your account status changed to ${accountStatus}.` };
  await notify(id, statusMsg.title, statusMsg.body, "/dashboard");

  return res.status(HttpStatus.OK).json({ status: "success", message: "Vendor status updated" });
});

// ── List pending vendors ─────────────────────────────────────────────────────────

export const listPendingVendors = catchAsync(async (_req: Request, res: Response) => {
  const vendors = await prisma.user.findMany({
    where: { role: "VENDOR", accountStatus: "PENDING" },
    select: {
      id: true,
      email: true,
      displayName: true,
      firstName: true,
      lastName: true,
      accountStatus: true,
      createdAt: true,
      vendorProfile: {
        select: {
          businessName: true,
          description: true,
          phone: true,
          bankDetails: true,
          proofDocs: true,
          locationText: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: { vendors } });
});

// ── Approve vendor ─────────────────────────────────────────────────────────────

export const approveVendor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const vendor = await prisma.user.findUnique({
    where: { id },
    include: { vendorProfile: true },
  });

  if (!vendor || vendor.role !== "VENDOR") {
    throw new AppError("Vendor not found", HttpStatus.NOT_FOUND);
  }

  if (vendor.accountStatus === "ACTIVE") {
    return res.status(HttpStatus.OK).json({ status: "success", message: "Vendor is already active" });
  }

  await prisma.user.update({
    where: { id },
    data: { accountStatus: "ACTIVE" },
  });

  if (vendor.vendorProfile) {
    await prisma.vendorProfile.update({
      where: { id: vendor.vendorProfile.id },
      data: { isActive: true },
    });
    // Auto-activate all services belonging to this vendor
    await prisma.service.updateMany({
      where: { vendorProfileId: vendor.vendorProfile.id },
      data:  { isActive: true },
    });
  }

  const loginLink = `${process.env.FRONTEND_URL ?? "http://localhost:3000"}/vendor/dashboard`;
  await sendVendorApprovalEmail(vendor.email, loginLink, vendor.displayName || vendor.email);

  await prisma.auditLog.create({
    data: { userId: req.user!.userId, action: "VENDOR_APPROVED", meta: { vendorId: id, email: vendor.email } },
  });
  req.auditLogged = true;

  await notify(id, "Account Approved!", "Your vendor account is now live. Start accepting bookings on kasiFix.", "/dashboard");

  return res.status(HttpStatus.OK).json({ status: "success", message: "Vendor approved successfully" });
});

// ── List all services (admin view) ────────────────────────────────────────────

export const listAllServices = catchAsync(async (_req: Request, res: Response) => {
  const services = await prisma.service.findMany({
    include: {
      vendorProfile: {
        select: {
          id: true, businessName: true, locationText: true, phone: true,
          user: { select: { id: true, email: true, displayName: true, accountStatus: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  return res.status(HttpStatus.OK).json({ status: "success", data: { services } });
});

// ── Approve a service ──────────────────────────────────────────────────────────

export const approveService = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) throw new AppError("Service not found", HttpStatus.NOT_FOUND);

  const svcWithVendor = await prisma.service.findUnique({ where: { id }, include: { vendorProfile: true } });
  await prisma.service.update({ where: { id }, data: { isActive: true } });

  await prisma.auditLog.create({
    data: { userId: req.user!.userId, action: "SERVICE_APPROVED", meta: { serviceId: id } }
  });
  req.auditLogged = true;

  if (svcWithVendor) {
    await notify(svcWithVendor.vendorProfile.userId, "Service Approved & Live!", `Your service "${svcWithVendor.name}" is now live on kasiFix.`, "/dashboard");
  }

  return res.status(HttpStatus.OK).json({ status: "success", message: "Service approved and now live" });
});

// ── Reject / deactivate a service ─────────────────────────────────────────────

export const rejectService = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) throw new AppError("Service not found", HttpStatus.NOT_FOUND);

  const svcOff = await prisma.service.findUnique({ where: { id }, include: { vendorProfile: true } });
  await prisma.service.update({ where: { id }, data: { isActive: false } });

  await prisma.auditLog.create({
    data: { userId: req.user!.userId, action: "SERVICE_REJECTED", meta: { serviceId: id } }
  });
  req.auditLogged = true;

  if (svcOff) {
    await notify(svcOff.vendorProfile.userId, "Service Taken Offline", `Your service "${svcOff.name}" has been taken offline by an admin.`, "/dashboard");
  }

  return res.status(HttpStatus.OK).json({ status: "success", message: "Service deactivated" });
});

// ── Toggle vendor verification badge ─────────────────────────────────────────

export const verifyVendor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params; // vendor profile id
  const profile = await prisma.vendorProfile.findUnique({ where: { id } });
  if (!profile) throw new AppError("Vendor profile not found", HttpStatus.NOT_FOUND);

  const updated = await prisma.vendorProfile.update({
    where: { id },
    data:  { isVerified: !profile.isVerified },
  });

  await prisma.auditLog.create({
    data: { userId: req.user!.userId, action: updated.isVerified ? "VENDOR_VERIFIED" : "VENDOR_UNVERIFIED", meta: { vendorProfileId: id } }
  });
  req.auditLogged = true;

  return res.status(HttpStatus.OK).json({
    status:  "success",
    message: updated.isVerified ? "Vendor verification badge granted" : "Verification badge removed",
    data:    { isVerified: updated.isVerified },
  });
});

// ── Update user status ─────────────────────────────────────────────────────────

export const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const { id }     = req.params;
  const { status } = req.body;

  const valid = ["ACTIVE", "SUSPENDED", "DELETED"];
  if (!valid.includes(status))
    throw new AppError("Invalid status value", HttpStatus.BAD_REQUEST);

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError("User not found", HttpStatus.NOT_FOUND);

  await prisma.user.update({ where: { id }, data: { accountStatus: status } });

  return res.status(HttpStatus.OK).json({ status: "success", message: "User status updated" });
});

// ── Update user role ───────────────────────────────────────────────────────────

export const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const { id }   = req.params;
  const { role } = req.body;

  const allowedRoles = [Role.USER, Role.MANAGER];
  if (!allowedRoles.includes(role))
    throw new AppError("Admins can only assign USER or MANAGER roles", HttpStatus.BAD_REQUEST);

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError("User not found", HttpStatus.NOT_FOUND);

  await prisma.user.update({ where: { id }, data: { role } });

  return res.status(HttpStatus.OK).json({ status: "success", message: "User role updated" });
});

// ── Get pending payouts (completed bookings not yet paid out) ─────────────────

export const getPendingPayouts = catchAsync(async (_req: Request, res: Response) => {
  const bookings = await prisma.booking.findMany({
    where:   { status: "COMPLETED", payoutStatus: "PENDING" },
    include: {
      client:  { select: { displayName: true, firstName: true, email: true, phone: true } },
      service: {
        include: {
          vendorProfile: {
            select: { id: true, businessName: true, bankDetails: true, phone: true, userId: true },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Platform fee per booking is R30 — vendor receives totalAmount - 30
  const payouts = bookings.map(b => ({
    id:            b.id,
    clientName:    b.client.displayName || `${b.client.firstName || ""}`.trim() || b.client.email,
    serviceName:   b.service.name,
    totalAmount:   b.totalAmount,
    vendorAmount:  b.totalAmount - 30,
    paymentMethod: b.paymentMethod,
    completedAt:   b.updatedAt,
    vendor: {
      profileId:    b.service.vendorProfile.id,
      businessName: b.service.vendorProfile.businessName,
      bankDetails:  b.service.vendorProfile.bankDetails,
      phone:        b.service.vendorProfile.phone,
      userId:       b.service.vendorProfile.userId,
    },
  }));

  const totalOwed = payouts.reduce((s, p) => s + p.vendorAmount, 0);

  return res.status(HttpStatus.OK).json({ status: "success", data: { payouts, totalOwed } });
});

// ── Mark a booking payout as paid ────────────────────────────────────────────

export const markPayoutPaid = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const booking = await prisma.booking.findUnique({
    where:   { id },
    include: { service: { include: { vendorProfile: true } } },
  });
  if (!booking) throw new AppError("Booking not found", HttpStatus.NOT_FOUND);
  if (booking.status !== "COMPLETED")
    throw new AppError("Only completed bookings can be marked as paid out", HttpStatus.BAD_REQUEST);
  if (booking.payoutStatus === "PAID")
    throw new AppError("This booking has already been paid out", HttpStatus.BAD_REQUEST);

  await prisma.booking.update({
    where: { id },
    data:  { payoutStatus: "PAID", payoutDate: new Date() },
  });

  await prisma.auditLog.create({
    data: { userId: req.user!.userId, action: "PAYOUT_MARKED_PAID", meta: { bookingId: id } },
  });
  req.auditLogged = true;

  // Notify the vendor
  await notify(
    booking.service.vendorProfile.userId,
    "Payout Processed!",
    `Your payout of R ${(booking.totalAmount - 30).toFixed(2)} for "${booking.service.name}" has been sent to your bank account.`,
    "/dashboard",
  );

  return res.status(HttpStatus.OK).json({ status: "success", message: "Payout marked as paid" });
});

// ── Get all payouts history (paid + pending) ──────────────────────────────────

export const getPayoutsHistory = catchAsync(async (req: Request, res: Response) => {
  const page  = Math.max(1, parseInt(String(req.query.page || "1")));
  const limit = 50;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where:   { status: "COMPLETED" },
      include: {
        service: {
          include: { vendorProfile: { select: { businessName: true, bankDetails: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
  ]);

  const rows = bookings.map(b => ({
    id:            b.id,
    serviceName:   b.service.name,
    businessName:  b.service.vendorProfile.businessName,
    bankDetails:   b.service.vendorProfile.bankDetails,
    totalAmount:   b.totalAmount,
    vendorAmount:  b.totalAmount - 30,
    payoutStatus:  b.payoutStatus,
    payoutDate:    b.payoutDate,
    completedAt:   b.updatedAt,
  }));

  return res.status(HttpStatus.OK).json({ status: "success", data: { rows, total, page } });
});
