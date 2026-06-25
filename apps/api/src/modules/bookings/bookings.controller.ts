import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";

// ── Create single Booking ────────────────────────────────────────────────────
export const createBooking = catchAsync(async (req: Request, res: Response) => {
  const { serviceId } = req.body;
  if (!serviceId) throw new AppError("Service ID is required", HttpStatus.BAD_REQUEST);

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) throw new AppError("Service not found", HttpStatus.NOT_FOUND);

  const booking = await prisma.booking.create({
    data: {
      serviceId,
      clientId:    req.user!.userId,
      totalAmount: service.price,
      status:      "PENDING",
    },
  });

  return res.status(HttpStatus.CREATED).json({ status: "success", data: booking });
});

// ── Checkout (cart → multiple bookings) ──────────────────────────────────────
export const checkout = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Sign in to place an order", HttpStatus.UNAUTHORIZED);

  const { items, address, paymentMethod, notes } = req.body as {
    items:         { serviceId: string }[];
    address:       string;
    paymentMethod: string;
    notes?:        string;
  };

  if (!items?.length)    throw new AppError("Cart is empty",             HttpStatus.BAD_REQUEST);
  if (!address?.trim())  throw new AppError("Delivery address required", HttpStatus.BAD_REQUEST);
  if (!paymentMethod)    throw new AppError("Payment method required",   HttpStatus.BAD_REQUEST);

  // Fetch all services to validate and get prices
  const serviceIds = [...new Set(items.map(i => i.serviceId))];
  const services   = await prisma.service.findMany({
    where: { id: { in: serviceIds }, isActive: true },
    include: { vendorProfile: { select: { businessName: true } } },
  });

  if (services.length !== serviceIds.length)
    throw new AppError("One or more services are unavailable", HttpStatus.BAD_REQUEST);

  const priceMap = Object.fromEntries(services.map(s => [s.id, s.price]));

  const bookings = await prisma.$transaction(
    items.map(item =>
      prisma.booking.create({
        data: {
          serviceId:     item.serviceId,
          clientId:      req.user!.userId,
          totalAmount:   priceMap[item.serviceId],
          status:        "PENDING",
          address:       address.trim(),
          paymentMethod: paymentMethod.toUpperCase(),
          notes:         notes?.trim() || null,
        },
        include: {
          service: { select: { name: true, category: true, price: true } },
        },
      })
    )
  );

  const total = bookings.reduce((s, b) => s + b.totalAmount, 0);

  return res.status(HttpStatus.CREATED).json({
    status:  "success",
    message: "Order placed successfully",
    data:    { bookings, total, orderCount: bookings.length },
  });
});

// ── My Orders (client order history) ─────────────────────────────────────────
export const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Unauthorised", HttpStatus.UNAUTHORIZED);

  const bookings = await prisma.booking.findMany({
    where:   { clientId: req.user.userId },
    include: {
      service: {
        select: { name: true, category: true, price: true, imageUrl: true,
                  vendorProfile: { select: { businessName: true, phone: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.status(HttpStatus.OK).json({ status: "success", data: { bookings } });
});
