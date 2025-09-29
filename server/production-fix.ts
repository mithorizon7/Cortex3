import { type Express } from "express";
import path from "path";
import express from "express";
import fs from "fs";

/**
 * Fixed static file serving for production that doesn't interfere with API routes.
 * This replaces the broken serveStatic function that captures all routes including API.
 */
export function serveStaticFixed(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static files from the dist/public directory
  app.use(express.static(distPath));

  // IMPORTANT: Only catch non-API routes for the SPA fallback
  // This prevents the HTML page from being served for API requests
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}