import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function runAuditEngine(businessId: string) {
  const findings = [];

  // Fetch all transactions for this business
  const transactions = await prisma.transaction.findMany({
    where: { businessId },
    orderBy: { transactionDate: "asc" },
  });

  const expenses = transactions.filter((tx) => tx.type === "EXPENSE");
  const income = transactions.filter((tx) => tx.type === "INCOME");

  // Rule 1: High Expense Spike Check
  if (expenses.length > 0) {
    const totalExpense = expenses.reduce((sum, tx) => sum + tx.amount, 0);
    const avgExpense = totalExpense / expenses.length;

    for (const exp of expenses) {
      if (exp.amount > avgExpense * 1.5 && exp.amount > 20000) {
        const finding = await prisma.auditFinding.create({
          data: {
            businessId,
            ruleType: "EXPENSE_SPIKE",
            title: "Unusually High Expense Detected",
            severity: "HIGH",
            amount: exp.amount,
            description: `An expense of NGN ${exp.amount.toLocaleString()} on reference ${exp.reference || "N/A"} is significantly higher than your average expense of NGN ${Math.round(avgExpense).toLocaleString()}.`,
            actionable: "Review receipt and verify approval for this expense claim.",
          },
        });
        findings.push(finding);
      }
    }
  }

  // Rule 2: Low Profit Margin / Loss Check
  const totalRevenue = income.reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpenses = expenses.reduce((sum, tx) => sum + tx.amount, 0);

  if (totalExpenses > totalRevenue && totalRevenue > 0) {
    const finding = await prisma.auditFinding.create({
      data: {
        businessId,
        ruleType: "NET_LOSS_ALERT",
        title: "Business Operating at a Loss",
        severity: "CRITICAL",
        amount: totalExpenses - totalRevenue,
        description: `Total expenses (NGN ${totalExpenses.toLocaleString()}) exceed total revenue (NGN ${totalRevenue.toLocaleString()}).`,
        actionable: "Audit recent supplier payments and recurring operational expenses immediately.",
      },
    });
    findings.push(finding);
  }

  // Rule 3: Inventory Discrepancy Check (Stock Leakage)
  const stockChecks = await prisma.stockCheck.findMany({
    where: { businessId },
    include: { product: true },
    orderBy: { checkedAt: "desc" },
  });

  for (const check of stockChecks) {
    if (check.discrepancy > 0) {
      const estimatedLossValue = check.discrepancy * check.product.unitPrice;
      const finding = await prisma.auditFinding.create({
        data: {
          businessId,
          ruleType: "STOCK_LEAKAGE",
          title: `Stock Discrepancy Flagged: ${check.product.name}`,
          severity: "CRITICAL",
          amount: estimatedLossValue,
          description: `Physical stock audit revealed a missing quantity of ${check.discrepancy} unit(s) for ${check.product.name}. Expected: ${check.expectedPhysical}, Actual: ${check.actualPhysical}. Potential financial loss: NGN ${estimatedLossValue.toLocaleString()}.`,
          actionable: `Investigate physical store inventory, shift logs, and sales entries for ${check.product.name}.`,
        },
      });
      findings.push(finding);
    }
  }

  return findings;
}
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

export async function generateExecutiveSummary(businessName: string, metrics: any, findings: any[]) {
  try {
    const prompt = `
You are an expert financial auditor analyzing business records for "${businessName}".

Financial Data:
- Total Revenue: NGN ${metrics.totalRevenue}
- Total Expenses: NGN ${metrics.totalExpenses}
- Net Profit: NGN ${metrics.netProfit} (${metrics.profitMargin} margin)

Audit Findings Detected:
${JSON.stringify(findings, null, 2)}

Provide a concise 2-3 sentence executive audit summary explaining the overall financial health, highlighting any flagged anomalies, and giving 1 key actionable next step for store management.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Executive summary unavailable.";
  } catch (error) {
    console.error("AI Executive Summary Error:", error);
    return "Automated AI summary could not be generated at this time.";
  }
}