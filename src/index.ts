import express from "express";
import cors from "cors";
import businessRoutes from "./routes/businessRoutes";
import auditRoutes from "./routes/auditRoutes";
import ingestRoutes from "./routes/ingestRoutes";

const app = express();
const PORT = 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// API Routes
app.use("/api/businesses", businessRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/ingest", ingestRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "OK", message: "MY-AUDITOR Backend Running" });
});

// Explicitly listen on 0.0.0.0 to accept IPv4, IPv6, and local tunnels
app.listen(PORT, "0.0.0.0", () => {
  console.log(`⚡ MY-AUDITOR backend listening on http://0.0.0.0:${PORT}`);
});