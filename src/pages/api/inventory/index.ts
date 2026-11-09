import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: Request, res: Response) {
  if (req.method === "GET") {
    try {
      const { businessId } = req.query;
      const products = await prisma.product.findMany({
        where: { businessId: String(businessId) },
        include: { branch: true },
      });
      return res.status(200).json(products);
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch inventory" });
    }
  }

  if (req.method === "POST") {
    try {
      const { businessId, branchId, name, sku, category, quantity, costPrice, sellingPrice, minStockLevel } = req.body;
      const product = await prisma.product.create({
        data: {
          businessId,
          branchId,
          name,
          sku,
          category,
          quantity: Number(quantity),
          costPrice: Number(costPrice),
          sellingPrice: Number(sellingPrice),
          minStockLevel: Number(minStockLevel),
        },
      });
      return res.status(201).json(product);
    } catch (error) {
      return res.status(500).json({ error: "Failed to create product" });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}