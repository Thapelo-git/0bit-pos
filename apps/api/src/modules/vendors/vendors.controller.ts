import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { AuthService } from "../auth/auth.service.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";
import { notify, notifyAdmins } from "../../utils/notify.js";

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

  const { isDeal, originalPrice, dealExpiresAt } = req.body;
  const dealFlag = isDeal === true || isDeal === "true";

  const service = await prisma.service.create({
    data: {
      name:           name.trim(),
      description:    description.trim(),
      price:          parseFloat(String(price)),
      category,
      imageUrl:       imageUrl?.trim() || null,
      vendorProfileId: vendorProfile.id,
      isActive:       false,
      isDeal:         dealFlag,
      originalPrice:  dealFlag && originalPrice ? parseFloat(String(originalPrice)) : null,
      dealExpiresAt:  dealFlag && dealExpiresAt ? new Date(dealExpiresAt) : null,
    }
  });

  const vendorUser = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { displayName: true, email: true } });
  const vendorName = vendorUser?.displayName || vendorUser?.email || "A vendor";
  await notifyAdmins("New Service Pending Approval", `${vendorName} submitted a new service: "${service.name}". Review it in the admin panel.`, "/admin/vendors");

  return res.status(HttpStatus.CREATED).json({ status: "success", data: service });
});

// ── Update a service (name, description, price, category, image, deal) ───────
export const updateService = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, price, category, imageUrl, isDeal, originalPrice, dealExpiresAt } = req.body;

  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!vendorProfile) throw new AppError("Vendor profile not found", HttpStatus.NOT_FOUND);

  const service = await prisma.service.findUnique({ where: { id } });
  if (!service || service.vendorProfileId !== vendorProfile.id)
    throw new AppError("Service not found", HttpStatus.NOT_FOUND);

  const dealFlag = isDeal !== undefined ? (isDeal === true || isDeal === "true") : service.isDeal;

  const updated = await prisma.service.update({
    where: { id },
    data: {
      ...(name          !== undefined && { name:          name.trim() }),
      ...(description   !== undefined && { description:   description.trim() }),
      ...(price         !== undefined && { price:         parseFloat(String(price)) }),
      ...(category      !== undefined && { category }),
      ...(imageUrl      !== undefined && { imageUrl:      imageUrl || null }),
      ...(isDeal        !== undefined && { isDeal:        dealFlag }),
      ...(originalPrice !== undefined && {
        originalPrice: dealFlag && originalPrice ? parseFloat(String(originalPrice)) : null,
      }),
      ...(dealExpiresAt !== undefined && {
        dealExpiresAt: dealFlag && dealExpiresAt ? new Date(dealExpiresAt) : null,
      }),
    },
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: updated });
});

// ── Toggle deal on a service ──────────────────────────────────────────────────
export const toggleDeal = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isDeal, originalPrice } = req.body;

  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!vendorProfile) throw new AppError("Vendor profile not found", HttpStatus.NOT_FOUND);

  const service = await prisma.service.findUnique({ where: { id } });
  if (!service || service.vendorProfileId !== vendorProfile.id)
    throw new AppError("Service not found", HttpStatus.NOT_FOUND);

  const updated = await prisma.service.update({
    where: { id },
    data: {
      isDeal:       !!isDeal,
      originalPrice: isDeal && originalPrice ? parseFloat(String(originalPrice)) : null,
    },
  });
  return res.status(HttpStatus.OK).json({ status: "success", data: updated });
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
    id:            b.id,
    clientName:    b.client.displayName || `${b.client.firstName || ""} ${b.client.lastName || ""}`.trim() || "Unknown",
    clientEmail:   b.client.email,
    clientPhone:   b.client.phone || "N/A",
    service:       b.service.name,
    category:      b.service.category,
    amount:        b.totalAmount,
    status:        b.status,
    paymentMethod: (b.paymentMethod || "N/A").toUpperCase(),
    notes:         b.notes,
    date:          b.createdAt,
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

  let totalRevenue    = 0;
  let acceptedRevenue = 0;
  let fulfilledDeals  = 0;
  let acceptedCount   = 0;
  let pendingCount    = 0;
  const recentTransactions = [];

  for (const b of bookings) {
    if (b.status === "COMPLETED") {
      totalRevenue += b.totalAmount;
      fulfilledDeals++;
    } else if (b.status === "ACCEPTED") {
      acceptedRevenue += b.totalAmount;
      acceptedCount++;
    } else if (b.status === "PENDING") {
      pendingCount++;
    }
    recentTransactions.push({
      id:            b.id,
      name:          b.client.displayName || `${b.client.firstName || ""} ${b.client.lastName || ""}`.trim() || "Unknown",
      email:         b.client.email,
      phoneNumber:   b.client.phone || "N/A",
      deal:          b.service.name,
      amount:        b.totalAmount,
      status:        b.status,
      paymentMethod: (b.paymentMethod || "N/A").toUpperCase(),
      address:       b.address  || null,
      notes:         b.notes    || null,
      date:          b.createdAt,
    });
  }

  const payload = {
    totalRevenue,
    acceptedRevenue,
    numberOfDeals: bookings.length,
    fulfilledDeals,
    acceptedCount,
    pendingCount,
    transactions: recentTransactions.slice(0, 50),
  };

  return res.status(HttpStatus.OK).json({ status: "success", data: payload });
});

// ── Delete a service ──────────────────────────────────────────────────────────
export const deleteService = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!vendorProfile) throw new AppError("Vendor profile not found", HttpStatus.NOT_FOUND);

  const service = await prisma.service.findUnique({ where: { id } });
  if (!service || service.vendorProfileId !== vendorProfile.id)
    throw new AppError("Service not found", HttpStatus.NOT_FOUND);

  const activeBookings = await prisma.booking.count({
    where: { serviceId: id, status: { in: ["PENDING", "ACCEPTED"] } },
  });
  if (activeBookings > 0)
    throw new AppError("Cannot delete a service with active or pending bookings", HttpStatus.BAD_REQUEST);

  await prisma.service.delete({ where: { id } });
  return res.status(HttpStatus.OK).json({ status: "success", message: "Service deleted" });
});

// ── Accept / Reject / Complete a booking ─────────────────────────────────────
async function updateBookingStatus(
  req:            Request,
  res:            Response,
  newStatus:      "ACCEPTED" | "REJECTED" | "COMPLETED",
  allowedCurrent: string[],
) {
  const { id } = req.params;
  const vendorProfile = await prisma.vendorProfile.findUnique({ where: { userId: req.user!.userId } });
  if (!vendorProfile) throw new AppError("Vendor profile not found", HttpStatus.NOT_FOUND);

  const booking = await prisma.booking.findUnique({ where: { id }, include: { service: true } });
  if (!booking || booking.service.vendorProfileId !== vendorProfile.id)
    throw new AppError("Booking not found", HttpStatus.NOT_FOUND);

  const currentStatus = booking.status as unknown as string;
  if (!allowedCurrent.includes(currentStatus))
    throw new AppError(`Booking must be ${allowedCurrent.join(" or ")} to be ${newStatus.toLowerCase()}`, HttpStatus.BAD_REQUEST);

  const updated = await prisma.booking.update({ where: { id }, data: { status: newStatus } });

  const notifMap: Record<string, { title: string; body: string }> = {
    ACCEPTED:  { title: "Booking Accepted!", body: `Your booking for "${booking.service.name}" has been accepted by the vendor.` },
    REJECTED:  { title: "Booking Declined",  body: `Your booking for "${booking.service.name}" was declined by the vendor.` },
    COMPLETED: { title: "Service Completed", body: `Your booking for "${booking.service.name}" has been marked as completed.` },
  };
  const n = notifMap[newStatus];
  if (n) await notify(booking.clientId, n.title, n.body, "/orders");

  return res.status(HttpStatus.OK).json({ status: "success", data: updated });
}

export const acceptBooking   = catchAsync((req, res) => updateBookingStatus(req, res, "ACCEPTED",  ["PENDING"]));
export const rejectBooking   = catchAsync((req, res) => updateBookingStatus(req, res, "REJECTED",  ["PENDING"]));
export const completeBooking = catchAsync((req, res) => updateBookingStatus(req, res, "COMPLETED", ["ACCEPTED"]));
