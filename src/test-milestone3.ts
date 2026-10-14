import { PrismaClient } from "@prisma/client";
import { runAuditEngine } from "./services/auditEngine";

const prisma = new PrismaClient();

async function runMilestone3Test() {
  try {
    // 1. Create Business
    const business = await prisma.business.create({
      data: {
        name: "Truth Supermarket - Inventory Audit",
        industry: "Supermarket",
      },
    });

    console.log("Business Created:", business.name);

    // 2. Add Product: Coaster Biscuits (10 cartons @ 24 packets per carton = 240 packets)
    const cartonsBought = 10;
    const unitsPerCarton = 24;
    const totalUnitsBought = cartonsBought * unitsPerCarton; // 240
    const unitsSold = 185;
    const expectedRemaining = totalUnitsBought - unitsSold; // 55
    const actualPhysicalStock = 49; // Discrepancy of 6 packets missing
    const unitPrice = 200; // NGN 200 per packet

    const product = await prisma.product.create({
      data: {
        businessId: business.id,
        name: "Coaster Biscuits",
        unitsPerCarton,
        totalUnitsBought,
        totalUnitsSold: unitsSold,
        unitPrice,
      },
    });

    console.log(`Product Created: ${product.name} (Bought: ${totalUnitsBought} units, Sold: ${unitsSold} units)`);

    // 3. Perform Stock Check
    const discrepancy = expectedRemaining - actualPhysicalStock;

    const stockCheck = await prisma.stockCheck.create({
      data: {
        businessId: business.id,
        productId: product.id,
        expectedPhysical: expectedRemaining,
        actualPhysical: actualPhysicalStock,
        discrepancy,
      },
    });

    console.log(`Stock Check Recorded: Expected = ${expectedRemaining}, Actual = ${actualPhysicalStock}, Missing = ${discrepancy}`);

    // 4. Run Audit Engine
    console.log("\nRunning Audit Engine for Inventory Check...");
    const findings = await runAuditEngine(business.id);

    console.log("\n--- INVENTORY AUDIT FINDINGS GENERATED ---");
    console.log(JSON.stringify(findings, null, 2));

  } catch (error) {
    console.error("Milestone 3 Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runMilestone3Test();