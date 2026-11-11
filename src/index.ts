import express from "express";
import cors from "cors";

import businessRoutes from "./routes/businessRoutes";
import auditRoutes from "./routes/auditRoutes";
import ingestRoutes from "./routes/ingestRoutes";
import inventoryRoutes from "./routes/inventoryRoutes";

const app = express();

const PORT = Number(process.env.PORT) || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use("/api/businesses", businessRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/ingest", ingestRoutes);
app.use("/api/inventory", inventoryRoutes);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "OK",
    message: "MY-AUDITOR Backend Running",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `MY-AUDITOR backend listening on port ${PORT}`
  );
});
