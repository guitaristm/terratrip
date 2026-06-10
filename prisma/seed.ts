import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@terratrip.app" },
    update: {},
    create: {
      email: "demo@terratrip.app",
      name: "Demo User",
      currency: "THB",
      theme: "light",
      notifications: true,
    },
  });

  // Create demo trip
  const trip = await prisma.trip.create({
    data: {
      name: "Japan Oct 2026",
      country: "Japan",
      startDate: new Date("2026-10-16"),
      endDate: new Date("2026-10-24"),
      budget: 150000,
      currency: "THB",
      members: {
        create: { userId: user.id, role: "owner", accepted: true, invitedEmail: user.email },
      },
    },
  });

  // Create days
  const day1 = await prisma.itineraryDay.create({
    data: {
      tripId: trip.id,
      date: new Date("2026-10-16"),
      title: "Day 1 — Arrival in Nagoya",
      order: 0,
    },
  });

  await prisma.itineraryItem.createMany({
    data: [
      { dayId: day1.id, time: "08:00", title: "Airport → Hotel", category: "transport", amount: 1140, currency: "JPY", order: 0 },
      { dayId: day1.id, time: "14:00", title: "Nagoya Castle", category: "tickets", amount: 500, currency: "JPY", order: 1 },
    ],
  });

  console.log("Seed complete. User:", user.email, "Trip:", trip.name);
}

main().catch(console.error).finally(() => prisma.$disconnect());
