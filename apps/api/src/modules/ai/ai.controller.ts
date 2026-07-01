import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { HttpStatus } from "@repo/types";
import { catchAsync } from "../../utils/catchAsync.js";

// ── Local keyword classifier (no external API needed) ─────────────────────────
const KEYWORD_MAP: Record<string, string[]> = {
  "Home Cleaning": [
    "clean", "cleaning", "maid", "housekeep", "sweep", "mop", "dust",
    "tidy", "vacuum", "scrub", "sanitize", "laundry", "wash", "dishes",
    "deep clean", "move in", "move out", "spring clean",
  ],
  "Fitness & Wellness": [
    "fit", "fitness", "gym", "trainer", "personal trainer", "workout",
    "exercise", "yoga", "pilates", "health", "weight", "muscle",
    "cardio", "run", "boxing", "crossfit", "stretch", "tone", "lose weight",
    "get fit", "athletic",
  ],
  "Beauty & Grooming": [
    "hair", "barber", "nails", "beauty", "massage", "spa", "salon",
    "wax", "facial", "makeup", "grooming", "eyebrow", "lash", "skincare",
    "pedicure", "manicure",
  ],
  "Home Maintenance & Trades": [
    "plumb", "electrician", "electric", "handyman", "repair", "roof",
    "paint", "fix", "leak", "pipe", "wire", "carpent", "tile", "brick",
    "build", "install", "gutter", "ceiling", "door", "window", "fence",
    "garden", "lawn", "pool",
  ],
  "Professional Training & Coaching": [
    "tutor", "tutoring", "coach", "coaching", "lesson", "course",
    "train", "teach", "learn", "skill", "mentor", "study", "math",
    "science", "english", "coding", "language",
  ],
};

function detectCategory(query: string): string {
  const q = query.toLowerCase();
  let best = "";
  let bestScore = 0;
  for (const [cat, keywords] of Object.entries(KEYWORD_MAP)) {
    const score = keywords.filter(kw => q.includes(kw)).length;
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return best;
}

function extractKeywords(query: string): string[] {
  const stopwords = new Set(["i", "a", "the", "to", "for", "and", "or", "my", "me", "want", "need", "help", "get", "with", "in", "is", "am", "an", "of", "at", "on", "it"]);
  return query
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .split(" ")
    .filter(w => w.length > 2 && !stopwords.has(w))
    .slice(0, 3);
}

function generateInterpretation(query: string, category: string): string {
  if (category === "Fitness & Wellness") return "Looking for fitness or wellness services";
  if (category === "Home Cleaning")      return "Looking for home cleaning services";
  if (category === "Beauty & Grooming")  return "Looking for personal care services";
  if (category === "Home Maintenance & Trades") return "Looking for home repair or maintenance";
  if (category === "Professional Training & Coaching") return "Looking for training or coaching";
  return `Searching for: ${query.slice(0, 40)}`;
}

function avgRating(reviews: { rating: number }[]) {
  if (!reviews.length) return null;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

// ── Smart Search (keyword-based, no API cost) ──────────────────────────────────
// POST /api/v1/ai/search  { query: string }
export const aiSmartSearch = catchAsync(async (req: Request, res: Response) => {
  const { query } = req.body as { query?: string };
  if (!query || query.trim().length < 3) {
    return res.status(HttpStatus.BAD_REQUEST).json({ status: "fail", message: "Query must be at least 3 characters" });
  }

  const category  = detectCategory(query.trim());
  const keywords  = extractKeywords(query.trim());
  const interpretation = generateInterpretation(query.trim(), category);

  const where: Record<string, unknown> = { isActive: true };
  if (category) where.category = category;

  const services = await prisma.service.findMany({
    where,
    include: {
      vendorProfile: { select: { businessName: true, locationText: true, isVerified: true } },
      reviews:       { select: { rating: true } },
    },
    take: 24,
  });

  const data = services.map(s => ({
    ...s,
    avgRating:   avgRating(s.reviews),
    reviewCount: s.reviews.length,
    reviews:     undefined,
  }));

  return res.status(HttpStatus.OK).json({
    status: "success",
    data,
    meta: { category, interpretation, keywords },
  });
});

// ── AI Description Writer (still uses OpenAI if available, graceful fallback) ──
// POST /api/v1/ai/describe  { name, category, price? }
export const aiDescribeService = catchAsync(async (req: Request, res: Response) => {
  const { name, category, price } = req.body as { name?: string; category?: string; price?: number };

  if (!name?.trim() || !category?.trim()) {
    return res.status(HttpStatus.BAD_REQUEST).json({ status: "fail", message: "name and category are required" });
  }

  // Try OpenAI if key is available
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const { default: OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a professional copywriter for kasiFix, a South African local service marketplace.
Write a compelling, trustworthy service listing description (2-3 sentences, 50-80 words).
Be specific and appealing to South African clients. Highlight reliability and professionalism.
Do NOT start with the service name. Do not use markdown or quotes. Return only the description text.`,
          },
          {
            role: "user",
            content: `Service name: ${name.trim()}\nCategory: ${category.trim()}${price ? `\nStarting price: R${price}` : ""}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 160,
      });
      const description = completion.choices[0]?.message?.content?.trim() ?? "";
      if (description) {
        return res.status(HttpStatus.OK).json({ status: "success", data: { description } });
      }
    } catch { /* fall through to local fallback */ }
  }

  // Local fallback template
  const templates: Record<string, string> = {
    "Home Cleaning":   `Our professional cleaning team delivers thorough, reliable service tailored to your home. Using quality products and proven methods, we leave every room spotless and fresh. Book with confidence — satisfaction guaranteed.`,
    "Fitness & Wellness": `Transform your health with personalised sessions designed around your goals and fitness level. Our certified professional brings expertise, motivation, and a structured plan to every session. Start your journey to a healthier, stronger you.`,
    "Beauty & Grooming": `Experience premium personal care in a professional, welcoming environment. Our skilled specialist uses quality products and proven techniques to deliver results you'll love. Treat yourself to the care you deserve.`,
    "Home Maintenance & Trades": `Get reliable, skilled workmanship for all your home repair and maintenance needs. Our experienced tradesperson arrives on time, works neatly, and ensures every job is completed to a high standard. No job too big or too small.`,
    "Professional Training & Coaching": `Unlock your potential with expert-led, personalised coaching sessions. Our experienced professional tailors every lesson to your pace and goals, making learning effective and enjoyable. Invest in your growth today.`,
  };
  const description = templates[category.trim()] || `Professional ${name.trim()} services delivered with care and expertise. Our verified provider brings experience and reliability to every appointment. Book today and experience the kasiFix quality difference.`;

  return res.status(HttpStatus.OK).json({ status: "success", data: { description } });
});
