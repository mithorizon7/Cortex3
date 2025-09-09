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

  // G1 - Human-in-the-Loop Required
  if (contextProfile.regulatory_intensity >= 3 || contextProfile.safety_criticality >= 3) {
    gates.push({
      id: 'require_hitl',
      pillar: 'O',
      title: 'Human-in-the-Loop Required',
      triggered: true,
      reason: 'High regulatory intensity or safety criticality requires human oversight',
      explain: {
        regulatory_intensity: contextProfile.regulatory_intensity,
        safety_criticality: contextProfile.safety_criticality
      },
      description: 'Implement human-in-the-loop controls for high-impact AI decisions to ensure appropriate oversight and accountability.',
      actions: [
        'Define clear escalation paths for AI decision review',
        'Implement approval workflows for high-stakes use cases',
        'Train reviewers on AI system capabilities and limitations',
        'Document review criteria and decision rationale'
      ]
    });
  }

  // G2 - Enhanced Assurance Cadence
  if (contextProfile.regulatory_intensity >= 3) {
    gates.push({
      id: 'assurance_cadence',
      pillar: 'R', 
      title: 'Enhanced Assurance Cadence Required',
      triggered: true,
      reason: 'High regulatory intensity requires frequent monitoring and annual governance reviews',
      explain: {
        regulatory_intensity: contextProfile.regulatory_intensity
      },
      description: 'Establish monthly fairness/privacy/drift monitoring and annual governance reviews to meet regulatory expectations.',
      actions: [
        'Schedule monthly bias and drift monitoring',
        'Implement automated fairness testing pipelines',
        'Plan annual governance review with external auditors',
        'Create compliance reporting dashboards'
      ]
    });
  }

  // G3 - Data Residency & Retention Requirements
  if (contextProfile.data_sensitivity >= 3) {
    gates.push({
      id: 'data_residency',
      pillar: 'R',
      title: 'Data Residency & Retention Controls',
      triggered: true,
      reason: 'High data sensitivity requires strict residency and retention controls',
      explain: {
        data_sensitivity: contextProfile.data_sensitivity
      },
      description: 'Implement data residency controls and retention limits to protect sensitive information and meet compliance requirements.',
      actions: [
        'Map data flows and storage locations',
        'Implement regional processing requirements',
        'Set automated retention and deletion policies',
        'Document cross-border data transfer controls'
      ]
    });
  }

  // G4 - Latency & Failover Requirements
  if (contextProfile.latency_edge >= 3) {
    gates.push({
      id: 'latency_fallback',
      pillar: 'E',
      title: 'Latency SLO & Failover Required',
      triggered: true,
      reason: 'High latency requirements need SLOs and tested failover mechanisms',
      explain: {
        latency_edge: contextProfile.latency_edge
      },
      description: 'Establish p95 latency SLOs (≤200ms) and implement tested failover mechanisms for edge operations.',
      actions: [
        'Define p95 latency SLOs for critical paths',
        'Implement edge caching and backup models',
        'Test failover scenarios regularly',
        'Monitor latency metrics and alerts'
      ]
    });
  }

  // G5 - Scale Hardening Requirements
  if (contextProfile.scale_throughput >= 3) {
    gates.push({
      id: 'scale_hardening',
      pillar: 'E',
      title: 'Scale Hardening Required',
      triggered: true,
      reason: 'High scale requirements need load testing and redundancy planning',
      explain: {
        scale_throughput: contextProfile.scale_throughput
      },
      description: 'Implement load testing, rate limiting, and dual-region/vendor strategies to handle high-scale operations.',
      actions: [
        'Conduct regular load testing at expected scale',
        'Implement intelligent rate limiting',
        'Plan dual-region deployment strategy',
        'Establish vendor redundancy options'
      ]
    });
  }

  // G6 - Build Readiness Assessment
  if (contextProfile.build_readiness <= 1) {
    gates.push({
      id: 'build_readiness_gate',
      pillar: 'C',
      title: 'Consider Buy-First Strategy',
      triggered: true,
      reason: 'Low build readiness suggests focusing on vendor solutions before heavy development',
      explain: {
        build_readiness: contextProfile.build_readiness
      },
      description: 'Given current build capabilities, prioritize vendor solutions and RAG approaches before investing in heavy ML development.',
      actions: [
        'Evaluate leading vendor AI platforms',
        'Implement RAG solutions using existing data',
        'Build foundational MLOps and governance capabilities',
        'Start with low-risk proof-of-concept projects'
      ]
    });
  }

  // G7 - Procurement Compliance
  if (contextProfile.procurement_constraints === true) {
    gates.push({
      id: 'procurement_compliance',
      pillar: 'E',
      title: 'Procurement Compliance Required',
      triggered: true,
      reason: 'Public sector or mandatory vendor rules require structured procurement processes',
      explain: {
        procurement_constraints: contextProfile.procurement_constraints
      },
      description: 'Follow structured procurement processes and use approved vendor frameworks for AI initiatives.',
      actions: [
        'Use approved vendor frameworks and contracts',
        'Follow public RFP processes for major AI investments',
        'Extend project timelines for procurement cycles',
        'Engage procurement team early in planning'
      ]
    });
  }

  // G8 - Edge Operations Security
  if (contextProfile.edge_operations === true) {
    gates.push({
      id: 'edge_operations_security',
      pillar: 'R',
      title: 'Edge Operations Security Required',
      triggered: true,
      reason: 'OT/SCADA and field operations require specialized security patterns',
      explain: {
        edge_operations: contextProfile.edge_operations
      },
      description: 'Implement OT security patterns, offline capabilities, and careful change management for edge AI systems.',
      actions: [
        'Implement OT-specific security protocols',
        'Design offline operation capabilities',
        'Plan careful change management for field systems',
        'Establish secure remote monitoring and updates'
      ]
    });
  }

  return gates;
}
