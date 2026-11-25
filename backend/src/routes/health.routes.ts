import { Router } from "express";
import mongoose from "mongoose";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "dokvanta-api",
    uptimeSeconds: Math.round(process.uptime()),
  });
});

healthRouter.get("/ready", (_req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? "ready" : "not_ready",
    database: connected ? "up" : "down",
  });
});
