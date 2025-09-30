import type { Express } from "express";
import { createServer, type Server } from "http";
import assessmentRoutes from "./routes/assessments";
import insightRoutes from "./routes/insights";
import optionsStudioRoutes from "./routes/options-studio";
import cohortRoutes from "./routes/cohorts";
import userRoutes from "./routes/users";
import bootstrapInviteRoutes from "./routes/bootstrap-invites";
import diagnosticRoutes from "./routes/diagnostic";
import setupRoutes from "./routes/setup";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register API routes with proper modular structure
  app.use("/api/assessments", assessmentRoutes);
  app.use("/api/insight", insightRoutes);
  app.use("/api/options-studio", optionsStudioRoutes);
  app.use("/api/cohorts", cohortRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/bootstrap-invites", bootstrapInviteRoutes);
  app.use("/api/diagnostic", diagnosticRoutes);
  app.use("/api/setup", setupRoutes);
  
  // Create HTTP server
  return createServer(app);
}