import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { contextProfileSchema, pulseResponsesSchema, pillarScoresSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Create new assessment
  app.post("/api/assessments", async (req, res) => {
    try {
      const { contextProfile } = req.body;
      const validatedProfile = contextProfileSchema.parse(contextProfile);
      
      const assessment = await storage.createAssessment({
        contextProfile: validatedProfile,
        pulseResponses: null,
        pillarScores: null,
        triggeredGates: null,
        completedAt: null,
      });
      
      res.json(assessment);
    } catch (error) {
      res.status(400).json({ error: "Invalid context profile data" });
    }
  });

  // Get assessment
  app.get("/api/assessments/:id", async (req, res) => {
    try {
      const assessment = await storage.getAssessment(req.params.id);
      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assessment" });
    }
  });

  // Update assessment with pulse responses
  app.patch("/api/assessments/:id/pulse", async (req, res) => {
    try {
      const { pulseResponses } = req.body;
      const validatedResponses = pulseResponsesSchema.parse(pulseResponses);
      
      // Calculate pillar scores from pulse responses
      const pillarScores = calculatePillarScores(validatedResponses);
      
      const assessment = await storage.updateAssessment(req.params.id, {
        pulseResponses: validatedResponses,
        pillarScores,
      });
      
      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }
      
      res.json(assessment);
    } catch (error) {
      res.status(400).json({ error: "Invalid pulse response data" });
    }
  });

  // Complete assessment and trigger gates
  app.patch("/api/assessments/:id/complete", async (req, res) => {
    try {
      const assessment = await storage.getAssessment(req.params.id);
      if (!assessment) {
        return res.status(404).json({ error: "Assessment not found" });
      }

      // Evaluate context gates
      const triggeredGates = evaluateContextGates(
        assessment.contextProfile,
        assessment.pillarScores
      );

      const completed = await storage.updateAssessment(req.params.id, {
        triggeredGates,
        completedAt: new Date().toISOString(),
      });

      res.json(completed);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete assessment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function calculatePillarScores(responses: Record<string, boolean>) {
  const pillarQuestions = {
    C: ['C1', 'C2', 'C3'],
    O: ['O1', 'O2', 'O3'],
    R: ['R1', 'R2', 'R3'],
    T: ['T1', 'T2', 'T3'],
    E: ['E1', 'E2', 'E3'],
    X: ['X1', 'X2', 'X3'],
  };

  const scores: Record<string, number> = {};
  
  for (const [pillar, questions] of Object.entries(pillarQuestions)) {
    const yesCount = questions.filter(q => responses[q] === true).length;
    scores[pillar] = yesCount;
  }

  return scores;
}

function evaluateContextGates(contextProfile: any, pillarScores: any) {
  const gates = [];

  // Human-in-the-Loop Required
  if (contextProfile.regulatory_intensity >= 3 && contextProfile.safety_criticality >= 3) {
    gates.push({
      id: 'require_hitl',
      title: 'Human-in-the-Loop Required',
      triggered: true,
      reason: `High regulatory intensity (${contextProfile.regulatory_intensity}/4) and safety criticality (${contextProfile.safety_criticality}/4)`
    });
  }

  // Enhanced Assurance Cadence  
  if (contextProfile.regulatory_intensity >= 4) {
    gates.push({
      id: 'assurance_cadence',
      title: 'Enhanced Assurance Cadence',
      triggered: true,
      reason: `High regulatory intensity (${contextProfile.regulatory_intensity}/4)`
    });
  }

  // Data Residency Requirements
  if (contextProfile.data_sensitivity >= 4) {
    gates.push({
      id: 'data_residency',
      title: 'Data Residency Requirements',
      triggered: true,
      reason: `Maximum data sensitivity (${contextProfile.data_sensitivity}/4)`
    });
  }

  // Build Readiness Gate
  if (contextProfile.build_readiness <= 1 && pillarScores?.O <= 1) {
    gates.push({
      id: 'build_readiness',
      title: 'Consider Buy-First Strategy',
      triggered: true,
      reason: `Low build readiness (${contextProfile.build_readiness}/4) and emerging operations maturity`
    });
  }

  return gates;
}
