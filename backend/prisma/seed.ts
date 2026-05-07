import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.setting.upsert({
    where: { key: "installed_at" },
    update: {},
    create: { key: "installed_at", value: new Date().toISOString() },
  });
  console.log("✅ seeded");
}

main().finally(() => prisma.$disconnect());
