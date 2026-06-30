import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TOKEN = "demo-review-token";

async function main() {
  const passwordHash = await bcrypt.hash("ScreenshotDemo123", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@pact.local" },
    create: {
      email: "demo@pact.local",
      name: "Alex Rivera",
      passwordHash,
      emailVerified: new Date(),
      businessCategory: "FREELANCER",
      stripeConnectOnboarded: true,
    },
    update: {
      emailVerified: new Date(),
      businessCategory: "FREELANCER",
    },
  });

  await prisma.proposal.deleteMany({ where: { token: TOKEN } });

  await prisma.proposal.create({
    data: {
      userId: user.id,
      title: "Brand Identity Project",
      clientName: "Acme Corp",
      clientEmail: "jane@acme.com",
      status: "SENT",
      token: TOKEN,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      depositAmount: 150000,
      currency: "usd",
      contractBody:
        "SERVICE AGREEMENT\n\nProvider will deliver the brand identity package as described in the proposal.\n\nA 33% deposit ($1,500) is due upon signing.",
      sections: {
        create: [
          { type: "HEADING", order: 0, content: { text: "Project Overview" } },
          {
            type: "TEXT",
            order: 1,
            content: {
              text: "Logo design, color palette, typography system, and brand guidelines delivered within 4 weeks.",
            },
          },
          {
            type: "PRICING",
            order: 2,
            content: { label: "Brand identity package", price: "$4,500" },
          },
        ],
      },
    },
  });

  console.log(`http://localhost:3000/p/${TOKEN}`);
}

main().finally(() => prisma.$disconnect());
