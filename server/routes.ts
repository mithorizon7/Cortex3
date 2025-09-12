import type { Express } from "express";
import { createServer, type Server } from "http";
import assessmentRoutes from "./routes/assessments";
import insightRoutes from "./routes/insights";
import optionsStudioRoutes from "./routes/options-studio";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register API routes with proper modular structure
  app.use("/api/assessments", assessmentRoutes);
  app.use("/api/insight", insightRoutes);
  app.use("/api/options-studio", optionsStudioRoutes);
  
  // Create HTTP server
  return createServer(app);
}