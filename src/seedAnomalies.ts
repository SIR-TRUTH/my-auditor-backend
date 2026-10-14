import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedAnomalies() {
  const businessId = "cmuy7ie100000v0qwfav42lsa";

  console.log("Seeding test anomalies into audit findings...");

  // 1. Inject Expense Spike Audit Finding
  await prisma.auditFinding.create({
    data: {
      businessId,
      title: "Critical Expense Spike: Maintenance",
      severity: "CRITICAL",
      description: "Emergency Generator Overhaul & Fuel cost of NGN 180,000 exceeds normal baseline average by 500%.",
      actionable: "Verify vendor invoice and maintenance work order logs.",
      amount: 180000,
      ruleType: "EXPENSE_SPIKE",
    },
  });

  // 2. Inject Stock Leakage Audit Finding
  await prisma.auditFinding.create({
    data: {
      businessId,
      title: "Stock Leakage: Peak Full Cream Milk 400g",
      severity: "CRITICAL",
      description: "Physical unit count shows 85 units present against 120 expected units (35 missing units).",
      actionable: "Investigate store shelf count and stock room receiving records.",
      amount: 87500,
      ruleType: "STOCK_LEAKAGE",
    },
  });

  console.log("Anomalies seeded successfully!");
}

seedAnomalies()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());