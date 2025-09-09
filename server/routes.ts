import type { Express } from "express";
import { createServer, type Server } from "http";
import assessmentRoutes from "./routes/assessments";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register API routes with proper modular structure
  app.use("/api/assessments", assessmentRoutes);
  
  // Create HTTP server
  return createServer(app);
}