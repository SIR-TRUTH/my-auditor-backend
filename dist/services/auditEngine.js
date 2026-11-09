"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAutomatedAudit = runAutomatedAudit;
const client_1 = require("@prisma/client");
const generative_ai_1 = require("@google/generative-ai");
const prisma = new client_1.PrismaClient();
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
async function runAutomatedAudit(businessId) {
    const findings = [];
    try {
        // 1. Check for Expense Anomalies
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
                            description: `An expense of NGN ${exp.amount.toLocaleString()} on reference ${exp.reference || "N/A"} is significantly higher than your average expense of NGN ${Math.round(avgExpense).toLocaleString()}.`,
                            ruleType: "EXPENSE_ANOMALY",
                            amount: exp.amount,
                            actionable: "Review receipt and verify approval for this expense claim.",
                        },
                    });
                    findings.push(finding);
                }
            }
        }
        // 2. Check for Negative Cashflow or Revenue Discrepancies
        const totalRevenueResult = await prisma.transaction.aggregate({
            where: { businessId, type: "INCOME" },
            _sum: { amount: true },
        });
        const totalRevenue = totalRevenueResult._sum.amount || 0;
        const totalExpensesResult = await prisma.transaction.aggregate({
            where: { businessId, type: "EXPENSE" },
            _sum: { amount: true },
        });
        const totalExpenses = totalExpensesResult._sum.amount || 0;
        if (totalExpenses > totalRevenue) {
            const finding = await prisma.auditFinding.create({
                data: {
                    businessId,
                    title: "Negative Operating Cashflow",
                    severity: "HIGH",
                    description: `Total operational expenses (NGN ${totalExpenses.toLocaleString()}) exceed total revenue (NGN ${totalRevenue.toLocaleString()}).`,
                    ruleType: "CASHFLOW_DEFICIT",
                    amount: totalExpenses - totalRevenue,
                    actionable: "Audit recent supplier payments and recurring operational expenses immediately.",
                },
            });
            findings.push(finding);
        }
        // 3. Check for Stock Discrepancies
        const stockChecks = await prisma.stockCheck.findMany({
            where: { businessId },
            orderBy: { checkedAt: "desc" },
            take: 20,
        });
        for (const check of stockChecks) {
            if (check.discrepancy > 0) {
                const product = await prisma.product.findUnique({
                    where: { id: check.productId },
                });
                const unitPrice = product ? product.sellingPrice : 0;
                const estimatedLossValue = check.discrepancy * unitPrice;
                const finding = await prisma.auditFinding.create({
                    data: {
                        businessId,
                        title: `Stock Discrepancy Flagged: ${product?.name || "Unknown Product"}`,
                        severity: check.discrepancy > 5 ? "HIGH" : "MEDIUM",
                        description: `Physical stock audit revealed a missing quantity of ${check.discrepancy} unit(s). Expected: ${check.expectedPhysical}, Actual: ${check.actualPhysical}. Potential financial loss: NGN ${estimatedLossValue.toLocaleString()}.`,
                        ruleType: "STOCK_DISCREPANCY",
                        amount: estimatedLossValue,
                        actionable: `Investigate physical store inventory, shift logs, and sales entries.`,
                    },
                });
                findings.push(finding);
            }
        }
        return { success: true, findingsCount: findings.length, findings };
    }
    catch (error) {
        console.error("Audit Engine Error:", error);
        throw new Error(`Audit engine failed: ${error.message}`);
    }
}
