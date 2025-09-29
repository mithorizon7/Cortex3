import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import { serveStaticFixed } from "./production-fix";
import { requestContextMiddleware, errorHandlerMiddleware } from "./middleware";
import { corsMiddleware, rateLimitMiddleware, securityMiddleware, sanitizationMiddleware } from "./middleware/security";
import { logger } from "./logger";
import { APP_CONFIG } from "./constants";

const app = express();

// Security middleware first
app.use(corsMiddleware);
app.use(securityMiddleware);
app.use(rateLimitMiddleware);

// Body parsing with size limits
app.use(express.json({ limit: APP_CONFIG.JSON_LIMIT }));
app.use(express.urlencoded({ extended: false, limit: APP_CONFIG.URL_ENCODED_LIMIT }));

// Input sanitization
app.use(sanitizationMiddleware);

// Request context middleware
app.use(requestContextMiddleware);

// Note: Request logging is now handled by requestContextMiddleware

(async () => {
  const server = await registerRoutes(app);

  // Use structured error handling middleware
  app.use(errorHandlerMiddleware);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStaticFixed(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    logger.info(`Server started successfully`, {
      additionalContext: { port, environment: app.get("env") }
    });
  });
})();
