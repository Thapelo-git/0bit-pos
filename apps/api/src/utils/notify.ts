import { prisma } from "@repo/database";

export async function notify(userId: string, title: string, body: string, link?: string) {
  await prisma.notification.create({ data: { userId, title, body, link: link ?? null } });
}

export async function notifyAdmins(title: string, body: string, link?: string) {
  const admins = await prisma.user.findMany({
    where:  { role: { in: ["ADMIN", "SUPER_ADMIN"] }, accountStatus: "ACTIVE" },
    select: { id: true },
  });
  if (!admins.length) return;
  await prisma.notification.createMany({
    data: admins.map(a => ({ userId: a.id, title, body, link: link ?? null })),
  });
}
