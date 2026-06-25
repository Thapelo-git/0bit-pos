import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { AuthService } from "../auth/auth.service.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";

const authService = new AuthService();

// ── Vendor Signup ──────────────────────────────────────────────────────────────
export const signup = catchAsync(async (req: Request, res: Response) => {
  const {
    email,
    password,
    businessName,
    phone,
    bankDetails,
    proofDocs,
    servicesOffered,
    locationText,
  } = req.body;

  if (!email || !password || !businessName || !phone || !bankDetails || !proofDocs || !servicesOffered || !locationText) {
    throw new AppError("All fields are required", HttpStatus.BAD_REQUEST);
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    throw new AppError("Email already in use", HttpStatus.CONFLICT);
  }

  const hashedPassword = await authService.hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email:         normalizedEmail,
      password:      hashedPassword,
      displayName:   businessName,
      role:          "VENDOR",
      accountStatus: "PENDING",
      phone,
    },
  });

  await prisma.vendorProfile.create({
    data: {
      userId:       user.id,
      businessName,
      description:  servicesOffered,
      phone,
      bankDetails,
      proofDocs,
      locationText,
      isActive:     false,
    },
  });

  await prisma.auditLog.create({
    data: { userId: user.id, action: "VENDOR_SIGNUP" },
  });
  req.auditLogged = true;

  return res.status(HttpStatus.CREATED).json({
    status:  "success",
    message: "Vendor registration submitted. Your account is pending approval.",
  });
});

// ── List vendor's own services ────────────────────────────────────────────────
export const listVendorServices = catchAsync(async (req: Request, res: Response) => {
  const vendorProfile = await prisma.vendorProfile.findUnique({
    where:   { userId: req.user!.userId },
    include: { services: { orderBy: { createdAt: "desc" } } },
  });

  if (!vendorProfile) {
    return res.status(HttpStatus.OK).json({ status: "success", data: { services: [] } });
  }

  return res.status(HttpStatus.OK).json({ status: "success", data: { services: vendorProfile.services } });
});

// ── Create a service ──────────────────────────────────────────────────────────
export const createService = catchAsync(async (req: Request, res: Response) => {
  const { name, description, price, category, imageUrl } = req.body;

  if (!name || !description || !price || !category)
    throw new AppError("Name, description, price, and category are required", HttpStatus.BAD_REQUEST);

  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user || user.accountStatus !== "ACTIVE")
    throw new AppError("Your account must be active to create services", HttpStatus.FORBIDDEN);

  let vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!vendorProfile) {
    // Auto-create a profile for vendors whose profile was missing due to a prior signup bug
    vendorProfile = await prisma.vendorProfile.create({
      data: {
        userId:       req.user!.userId,
        businessName: user.displayName || user.email,
        phone:        user.phone       || null,
        isActive:     false,
        bankDetails:  null,
        proofDocs:    null,
      },
    });
  }

  const service = await prisma.service.create({
    data: {
      name:           name.trim(),
      description:    description.trim(),
      price:          parseFloat(String(price)),
      category,
      imageUrl:       imageUrl?.trim() || null,
      vendorProfileId: vendorProfile.id,
      isActive:       false, // requires admin approval before going live
    }
  });

  return res.status(HttpStatus.CREATED).json({ status: "success", data: service });
});

// ── Toggle service active/inactive ────────────────────────────────────────────
export const toggleService = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!vendorProfile) throw new AppError("Vendor profile not found", HttpStatus.NOT_FOUND);

  const service = await prisma.service.findUnique({ where: { id } });
  if (!service || service.vendorProfileId !== vendorProfile.id)
    throw new AppError("Service not found", HttpStatus.NOT_FOUND);

  const updated = await prisma.service.update({ where: { id }, data: { isActive: !service.isActive } });
  return res.status(HttpStatus.OK).json({ status: "success", data: updated });
});

// ── Get all transactions (paginated) ─────────────────────────────────────────
export const getTransactions = catchAsync(async (req: Request, res: Response) => {
  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!vendorProfile) throw new AppError("Vendor profile not found", HttpStatus.NOT_FOUND);

  const page   = Math.max(1, parseInt(String(req.query.page  || "1")));
  const limit  = Math.min(50, parseInt(String(req.query.limit || "20")));
  const status = req.query.status as string | undefined;

  const where = {
    service: { vendorProfileId: vendorProfile.id },
    ...(status ? { status: status as any } : {}),
  };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: { client: true, service: true },
      orderBy: { createdAt: "desc" },
      skip:  (page - 1) * limit,
      take:  limit,
    }),
    prisma.booking.count({ where }),
  ]);

  const transactions = bookings.map(b => ({
    id:          b.id,
    clientName:  b.client.displayName || `${b.client.firstName || ""} ${b.client.lastName || ""}`.trim() || "Unknown",
    clientEmail: b.client.email,
    clientPhone: b.client.phone || "N/A",
    service:     b.service.name,
    category:    b.service.category,
    amount:      b.totalAmount,
    status:      b.status,
    notes:       b.notes,
    date:        b.createdAt,
  }));

  return res.status(HttpStatus.OK).json({
    status: "success",
    data: { transactions, total, page, pages: Math.ceil(total / limit) },
  });
});

// ── Get vendor reports ────────────────────────────────────────────────────────
export const getReports = catchAsync(async (req: Request, res: Response) => {
  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!vendorProfile) throw new AppError("Vendor profile not found", HttpStatus.NOT_FOUND);

  const allBookings = await prisma.booking.findMany({
    where:   { service: { vendorProfileId: vendorProfile.id } },
    include: { service: true },
    orderBy: { createdAt: "asc" },
  });

  // Revenue + bookings by month (last 6 months)
  const now = new Date();
  const revenueByMonth: { month: string; revenue: number; bookings: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("en-ZA", { month: "short", year: "numeric" });
    const monthBookings = allBookings.filter(b => {
      const bd = new Date(b.createdAt);
      return bd.getFullYear() === d.getFullYear() && bd.getMonth() === d.getMonth();
    });
    revenueByMonth.push({
      month:    label,
      revenue:  monthBookings.filter(b => b.status === "COMPLETED").reduce((s, b) => s + b.totalAmount, 0),
      bookings: monthBookings.length,
    });
  }

  // Status breakdown
  const statusBreakdown: Record<string, number> = {};
  for (const b of allBookings) {
    statusBreakdown[b.status] = (statusBreakdown[b.status] || 0) + 1;
  }

  // Top services by booking count
  const svcMap: Record<string, { name: string; category: string; bookings: number; revenue: number }> = {};
  for (const b of allBookings) {
    const key = b.service.id;
    if (!svcMap[key]) svcMap[key] = { name: b.service.name, category: b.service.category, bookings: 0, revenue: 0 };
    svcMap[key].bookings++;
    if (b.status === "COMPLETED") svcMap[key].revenue += b.totalAmount;
  }
  const topServices = Object.values(svcMap).sort((a, b) => b.bookings - a.bookings).slice(0, 5);

  const completed    = allBookings.filter(b => b.status === "COMPLETED");
  const totalRevenue = completed.reduce((s, b) => s + b.totalAmount, 0);

  return res.status(HttpStatus.OK).json({
    status: "success",
    data: {
      summary: {
        totalRevenue,
        totalBookings:   allBookings.length,
        completedOrders: completed.length,
        avgOrderValue:   completed.length ? totalRevenue / completed.length : 0,
        completionRate:  allBookings.length ? (completed.length / allBookings.length) * 100 : 0,
      },
      revenueByMonth,
      statusBreakdown,
      topServices,
    },
  });
});

// ── Get / Update vendor profile ───────────────────────────────────────────────
export const getProfile = catchAsync(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where:  { id: req.user!.userId },
    select: { id: true, email: true, firstName: true, lastName: true, displayName: true, phone: true, avatarUrl: true, accountStatus: true, createdAt: true },
  });
  if (!user) throw new AppError("User not found", HttpStatus.NOT_FOUND);

  const profile = await prisma.vendorProfile.findUnique({ where: { userId: req.user!.userId } });

  return res.status(HttpStatus.OK).json({ status: "success", data: { user, profile } });
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const { businessName, description, phone, locationText, bankDetails } = req.body;

  const profile = await prisma.vendorProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!profile) throw new AppError("Vendor profile not found", HttpStatus.NOT_FOUND);

  const [updatedProfile, updatedUser] = await Promise.all([
    prisma.vendorProfile.update({
      where: { userId: req.user!.userId },
      data: {
        ...(businessName  !== undefined && { businessName }),
        ...(description   !== undefined && { description }),
        ...(locationText  !== undefined && { locationText }),
        ...(bankDetails   !== undefined && { bankDetails }),
        ...(phone         !== undefined && { phone }),
      },
    }),
    prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        ...(businessName !== undefined && { displayName: businessName }),
        ...(phone        !== undefined && { phone }),
      },
      select: { id: true, email: true, displayName: true, phone: true },
    }),
  ]);

  return res.status(HttpStatus.OK).json({ status: "success", data: { profile: updatedProfile, user: updatedUser } });
});

// ── Get Dashboard ──────────────────────────────────────────────────────────────
export const getDashboard = catchAsync(async (req: Request, res: Response) => {
  const currentUser = await prisma.user.findUnique({
    where:  { id: req.user!.userId },
    select: { accountStatus: true, displayName: true, email: true, phone: true },
  });

  if (!currentUser) {
    throw new AppError("User not found", HttpStatus.NOT_FOUND);
  }

  if (currentUser.accountStatus !== "ACTIVE") {
    return res.status(HttpStatus.OK).json({
      status: "success",
      data:   { pending: true, accountStatus: currentUser.accountStatus },
    });
  }

  let vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId: req.user!.userId },
  });

  if (!vendorProfile) {
    // Auto-heal: create a profile for vendors whose profile was missing due to a prior signup bug
    vendorProfile = await prisma.vendorProfile.create({
      data: {
        userId:       req.user!.userId,
        businessName: currentUser.displayName || currentUser.email,
        phone:        currentUser.phone       || null,
        isActive:     false,
        bankDetails:  null,
        proofDocs:    null,
      },
    });
  }

  const bookings = await prisma.booking.findMany({
    where: { service: { vendorProfileId: vendorProfile.id } },
    include: { client: true, service: true },
    orderBy: { createdAt: "desc" },
  });

  let totalRevenue = 0;
  let fulfilledDeals = 0;
  const recentTransactions = [];

  for (const b of bookings) {
    if (b.status === "COMPLETED") {
      totalRevenue += b.totalAmount;
      fulfilledDeals++;
    }
    recentTransactions.push({
      id: b.id,
      name:
        b.client.displayName ||
        `${b.client.firstName || ""} ${b.client.lastName || ""}`.trim() ||
        "Unknown",
      email: b.client.email,
      phoneNumber: b.client.phone || "N/A",
      deal: b.service.name,
      amount: b.totalAmount,
      date: b.createdAt,
    });
  }

  const payload = {
    totalRevenue,
    numberOfDeals: bookings.length,
    fulfilledDeals,
    transactions: recentTransactions.slice(0, 50),
  };

  return res.status(HttpStatus.OK).json({ status: "success", data: payload });
});
