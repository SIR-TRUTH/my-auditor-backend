import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runTest() {
  try {
    // 1. Create a fresh test business
    const business = await prisma.business.create({
      data: {
        name: "Truth Supermarket",
        industry: "Retail",
      },
    });

    console.log("Business created successfully:", business);

    // 2. Add Income (Sale)
    const sale = await prisma.transaction.create({
      data: {
        businessId: business.id,
        amount: 150000,
        type: "INCOME",
        status: "COMPLETED",
        source: "POS",
        reference: "SALE-001",
        transactionDate: new Date("2026-10-07T14:00:00Z"),
      },
    });

    console.log("Income Transaction created:", sale);

    // 3. Add Expense
    const expense = await prisma.transaction.create({
      data: {
        businessId: business.id,
        amount: 45000,
        type: "EXPENSE",
        status: "COMPLETED",
        source: "MANUAL",
        reference: "EXP-001",
        transactionDate: new Date("2026-10-07T14:15:00Z"),
      },
    });

    console.log("Expense Transaction created:", expense);

    // 4. Calculate P&L
    const transactions = await prisma.transaction.findMany({
      where: { businessId: business.id },
    });

    let totalRevenue = 0;
    let totalExpenses = 0;

    transactions.forEach((tx) => {
      if (tx.type === "INCOME") totalRevenue += tx.amount;
      if (tx.type === "EXPENSE") totalExpenses += tx.amount;
    });

    const netProfit = totalRevenue - totalExpenses;

    console.log("\n--- PROFIT & LOSS SUMMARY ---");
    console.log({
      businessId: business.id,
      totalRevenue: `NGN ${totalRevenue.toLocaleString()}`,
      totalExpenses: `NGN ${totalExpenses.toLocaleString()}`,
      netProfit: `NGN ${netProfit.toLocaleString()}`,
      status: netProfit >= 0 ? "PROFIT" : "LOSS",
      transactionCount: transactions.length,
    });
  } catch (error) {
    console.error("Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();