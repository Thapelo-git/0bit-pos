import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";
import { AppError } from "../../utils/appError.js";

function avgRating(reviews: { rating: number }[]) {
  if (!reviews.length) return null;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

// ── Search Services ────────────────────────────────────────────────────────────
export const searchServices = catchAsync(async (req: Request, res: Response) => {
  const { category, lat, lng, deals } = req.query;

  const baseWhere: Record<string, unknown> = { isActive: true };
  if (category) baseWhere.category = String(category);
  if (deals === "true") baseWhere.isDeal = true;

  if (!lat || !lng) {
    const services = await prisma.service.findMany({
      where:   baseWhere,
      include: {
        vendorProfile: { select: { businessName: true, locationText: true, isVerified: true } },
        reviews:       { select: { rating: true } },
      },
      take: 50,
    });

    const data = services.map(s => ({
      ...s,
      avgRating:   avgRating(s.reviews),
      reviewCount: s.reviews.length,
      reviews:     undefined,
    }));

    return res.status(HttpStatus.OK).json({ status: "success", data });
  }

  const latitude  = parseFloat(String(lat));
  const longitude = parseFloat(String(lng));

  try {
    const nearest = await prisma.$queryRawUnsafe(`
      SELECT
        s.id, s.name, s.description, s.price, s.category, s."isActive", s."imageUrl",
        v."latitude", v."longitude", v."businessName", v."isVerified", v."locationText",
        (6371 * acos(
          cos(radians(${latitude})) *
          cos(radians(v."latitude")) *
          cos(radians(v."longitude") - radians(${longitude})) +
          sin(radians(${latitude})) *
          sin(radians(v."latitude"))
        )) AS distance
      FROM "Service" s
      INNER JOIN "VendorProfile" v ON s."vendorProfileId" = v."id"
      WHERE s."isActive" = true AND v."isActive" = true
      ${category ? `AND s."category" = '${String(category).replace(/'/g, "''")}'` : ''}
      ORDER BY distance ASC
      LIMIT 50
    `);

    return res.status(HttpStatus.OK).json({ status: "success", data: nearest });
  } catch {
    return res.status(HttpStatus.BAD_REQUEST).json({ status: "fail", message: "Error calculating distance" });
  }
});

// ── Get Single Service ─────────────────────────────────────────────────────────
export const getService = catchAsync(async (req: Request, res: Response) => {
  const service = await prisma.service.findUnique({
    where:   { id: req.params.id },
    include: {
      vendorProfile: { select: { businessName: true, locationText: true, isVerified: true, description: true, phone: true } },
      reviews: {
        include: { client: { select: { displayName: true, firstName: true, lastName: true, createdAt: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!service) throw new AppError("Service not found", HttpStatus.NOT_FOUND);

  return res.status(HttpStatus.OK).json({
    status: "success",
    data: {
      ...service,
      avgRating:   avgRating(service.reviews),
      reviewCount: service.reviews.length,
    },
  });
});

// ── Submit a Review ────────────────────────────────────────────────────────────
export const submitReview = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError("Sign in to leave a review", HttpStatus.UNAUTHORIZED);

  const { rating, comment } = req.body;
  const serviceId = req.params.id;

  if (!rating || rating < 1 || rating > 5)
    throw new AppError("Rating must be between 1 and 5", HttpStatus.BAD_REQUEST);

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) throw new AppError("Service not found", HttpStatus.NOT_FOUND);

  const review = await prisma.review.upsert({
    where:  { clientId_serviceId: { clientId: req.user.userId, serviceId } },
    update: { rating: Number(rating), comment: comment?.trim() || null },
    create: { clientId: req.user.userId, serviceId, rating: Number(rating), comment: comment?.trim() || null },
    include: { client: { select: { displayName: true, firstName: true, lastName: true } } },
  });

  return res.status(HttpStatus.CREATED).json({ status: "success", data: review });
});
