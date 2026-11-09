"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const businessRoutes_1 = __importDefault(require("./routes/businessRoutes"));
const auditRoutes_1 = __importDefault(require("./routes/auditRoutes"));
const ingestRoutes_1 = __importDefault(require("./routes/ingestRoutes"));
const app = (0, express_1.default)();
const PORT = 3000;
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use(express_1.default.json());
// API Routes
app.use("/api/businesses", businessRoutes_1.default);
app.use("/api/audit", auditRoutes_1.default);
app.use("/api/ingest", ingestRoutes_1.default);
app.get("/api/health", (_req, res) => {
    res.json({ status: "OK", message: "MY-AUDITOR Backend Running" });
});
// Explicitly listen on 0.0.0.0 to accept IPv4, IPv6, and local tunnels
app.listen(PORT, "0.0.0.0", () => {
    console.log(`⚡ MY-AUDITOR backend listening on http://0.0.0.0:${PORT}`);
});
