"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function handler(req, res) {
    const businessId = req.headers['x-business-id'] || 'default-business-id';
    if (req.method === 'POST') {
        try {
            const { branchId, customerId, items, paymentMethod } = req.body;
            if (!branchId || !items || items.length === 0) {
                return res.status(400).json({ success: false, error: 'Branch and sale items are required' });
            }
            const reference = `SALE-${Math.floor(100000 + Math.random() * 900000)}`;
            let totalAmount = 0;
            let totalCost = 0;
            const result = await prisma.$transaction(async (tx) => {
                const saleItemsData = [];
                for (const item of items) {
                    const product = await tx.product.findUnique({ where: { id: item.productId } });
                    if (!product)
                        throw new Error(`Product not found: ${item.productId}`);
                    if (product.quantity < item.quantity) {
                        throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`);
                    }
                    const itemTotal = item.quantity * item.unitPrice;
                    const itemCogs = item.quantity * product.wac;
                    totalAmount += itemTotal;
                    totalCost += itemCogs;
                    saleItemsData.push({
                        productId: item.productId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        unitCost: product.wac,
                        totalPrice: itemTotal,
                    });
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { quantity: product.quantity - item.quantity },
                    });
                    await tx.inventoryMovement.create({
                        data: {
                            businessId,
                            branchId,
                            productId: item.productId,
                            type: 'SALE',
                            quantity: -item.quantity,
                            unitCost: product.wac,
                            referenceId: reference,
                            notes: `Sale invoice ${reference}`,
                        },
                    });
                }
                const sale = await tx.sale.create({
                    data: {
                        businessId,
                        branchId,
                        customerId: customerId || null,
                        reference,
                        totalAmount,
                        totalCost,
                        paymentMethod,
                        items: { create: saleItemsData },
                    },
                });
                await tx.journalEntry.create({
                    data: {
                        businessId,
                        reference,
                        description: `Sales Revenue & COGS for invoice ${reference}`,
                        debitAccount: paymentMethod === 'CREDIT' ? 'Accounts Receivable' : 'Cash / Bank',
                        creditAccount: 'Sales Revenue',
                        amount: totalAmount,
                    },
                });
                return sale;
            });
            return res.status(201).json({ success: true, data: result });
        }
        catch (error) {
            return res.status(400).json({ success: false, error: error.message });
        }
    }
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}
