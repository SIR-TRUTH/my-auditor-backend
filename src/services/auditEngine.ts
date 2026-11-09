import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function runAutomatedAudit(businessId: string) {
  const findings: any[] = [];

  try {
    const expenses = await prisma.transaction.findMany({
      where: { businessId, type: "EXPENSE" },
      orderBy: { transactionDate: "desc" },
      take: 50,
    });

    if (expenses.length > 0) {
      const totalExpenseAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
      const avgExpense = totalExpenseAmount / expenses.length;

      for (const exp of expenses) {
        if (exp.amount > avgExpense * 3 && exp.amount > 50000) {
          const finding = await prisma.auditFinding.create({
            data: {
              businessId,
              title: "Unusually High Expense Detected",
              severity: "HIGH",
              description: `An expense of NGN ${exp.amount.toLocaleString()} is significantly higher than average.`,
              ruleType: "EXPENSE_ANOMALY",
              amount: exp.amount,
              actionable: "Review receipt and verify approval.",
            },
          });
          findings.push(finding);
        }
      }
    }

    return { success: true, findingsCount: findings.length, findings };
  } catch (error: any) {
    console.error("Audit Engine Error:", error);
    throw new Error(`Audit engine failed: ${error.message}`);
  }
}

// Export alias expected by milestone test files
export const runAuditEngine = runAutomatedAudit;