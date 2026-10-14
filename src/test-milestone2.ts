import { PrismaClient } from "@prisma/client";
import { runAuditEngine } from "./services/auditEngine";

const prisma = new PrismaClient();

async function runMilestone2Test() {
  try {
    // 1. Create Business
    const business = await prisma.business.create({
      data: {
        name: "Truth Supermarket - Audit Test",
        industry: "Retail",
      },
    });

    console.log("Business Created:", business.name);

    // 2. Add Normal Expenses
    await prisma.transaction.createMany({
      data: [
        { businessId: business.id, amount: 10000, type: "EXPENSE", status: "COMPLETED", source: "MANUAL", reference: "EXP-101", transactionDate: new Date() },
        { businessId: business.id, amount: 12000, type: "EXPENSE", status: "COMPLETED", source: "MANUAL", reference: "EXP-102", transactionDate: new Date() },
        { businessId: business.id, amount: 11000, type: "EXPENSE", status: "COMPLETED", source: "MANUAL", reference: "EXP-103", transactionDate: new Date() },
        // 3. Add Unusually High Expense Spike
        { businessId: business.id, amount: 85000, type: "EXPENSE", status: "COMPLETED", source: "MANUAL", reference: "EXP-SPIKE", transactionDate: new Date() },
      ],
    });

    console.log("Transactions added. Running Audit Engine...");

    // 4. Run Audit Rules
    const findings = await runAuditEngine(business.id);

    console.log("\n--- AUDIT FINDINGS GENERATED ---");
    console.log(JSON.stringify(findings, null, 2));

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runMilestone2Test();