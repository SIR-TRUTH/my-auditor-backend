import { PrismaClient } from "@prisma/client";
import { runAuditEngine } from "./services/auditEngine";

const prisma = new PrismaClient();

async function runMilestone4Test() {
  try {
    // 1. Create Business
    const business = await prisma.business.create({
      data: {
        name: "Truth Supermarket - Full Suite",
        industry: "Retail & Supermarket",
      },
    });

    // 2. Add Transactions
    await prisma.transaction.createMany({
      data: [
        { businessId: business.id, amount: 500000, type: "INCOME", status: "COMPLETED", source: "POS", reference: "DAILY-SALES", transactionDate: new Date() },
        { businessId: business.id, amount: 20000, type: "EXPENSE", status: "COMPLETED", source: "MANUAL", reference: "CLEANING", transactionDate: new Date() },
        { businessId: business.id, amount: 120000, type: "EXPENSE", status: "COMPLETED", source: "MANUAL", reference: "SPIKE-RENT", transactionDate: new Date() },
      ],
    });

    // 3. Add Product and Discrepancy
    const product = await prisma.product.create({
      data: {
        businessId: business.id,
        name: "Milo 500g",
        unitsPerCarton: 12,
        totalUnitsBought: 120,
        totalUnitsSold: 90,
        unitPrice: 2500,
      },
    });

    await prisma.stockCheck.create({
      data: {
        businessId: business.id,
        productId: product.id,
        expectedPhysical: 30,
        actualPhysical: 26,
        discrepancy: 4,
      },
    });

    // 4. Run Audit
    await runAuditEngine(business.id);

    console.log("Full Suite Audit Execution Complete.");
    console.log("Business ID created:", business.id);

  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runMilestone4Test();