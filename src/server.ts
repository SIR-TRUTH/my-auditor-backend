import express from "express";
import cors from "cors";
import businessRoutes from "./routes/businessRoutes";
import auditRoutes from "./routes/auditRoutes";
import ingestRoutes from "./routes/ingestRoutes";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Mount API routes
app.use("/api/businesses", businessRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/ingest", ingestRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "OK", message: "MY-AUDITOR Backend Running" });
});

app.listen(PORT, () => {
  console.log(`MY-AUDITOR server running on port ${PORT}`);
});