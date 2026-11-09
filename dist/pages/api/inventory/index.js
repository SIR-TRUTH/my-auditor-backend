"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function handler(req, res) {
    const businessId = req.headers['x-business-id'] || 'default-business-id';
    const branchId = req.query.branchId;
    if (req.method === 'GET') {
        try {
            const products = await prisma.product.findMany({
                where: {
                    businessId,
                    ...(branchId && branchId !== 'All Branches' ? { branchId } : {}),
                },
                include: { branch: true, movements: true },
                orderBy: { createdAt: 'desc' },
            });
            return res.status(200).json({ success: true, data: products });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
    if (req.method === 'POST') {
        try {
            const { name, sku, category, quantity, costPrice, sellingPrice, branchId } = req.body;
            if (!name || !sku) {
                return res.status(400).json({ success: false, error: 'Product name and SKU are required' });
            }
            const result = await prisma.$transaction(async (tx) => {
                const product = await tx.product.create({
                    data: {
                        businessId,
                        branchId: branchId || null,
                        name,
                        sku,
                        category: category || 'Finished Goods',
                        quantity: Number(quantity) || 0,
                        costPrice: Number(costPrice) || 0,
                        sellingPrice: Number(sellingPrice) || 0,
                        wac: Number(costPrice) || 0,
                    },
                });
                if (Number(quantity) > 0 && branchId) {
                    await tx.inventoryMovement.create({
                        data: {
                            businessId,
                            branchId,
                            productId: product.id,
                            type: 'OPENING_BALANCE',
                            quantity: Number(quantity),
                            unitCost: Number(costPrice),
                            notes: 'Initial opening stock creation',
                        },
                    });
                }
                return product;
            });
            return res.status(201).json({ success: true, data: result });
        }
        catch (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
    }
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}
