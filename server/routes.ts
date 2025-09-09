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

      // Evaluate context gates and priority moves
      const triggeredGates = evaluateContextGates(
        assessment.contextProfile,
        assessment.pillarScores
      );
      const priorityMoves = generatePriorityMoves(
        assessment.contextProfile,
        assessment.pillarScores
      );

      const completed = await storage.updateAssessment(req.params.id, {
        triggeredGates,
        priorityMoves,
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

// Priority Engine - Context-weighted "Next 2 Moves" recommendations
function generatePriorityMoves(contextProfile: any, pillarScores: any) {
  // Define available moves library with base scores and tags
  const moveLibrary = [
    // Clarity & Command moves
    {
      id: 'publish_ai_vision',
      pillar: 'C',
      title: 'Publish AI Vision & Success Metrics',
      base_score: 0.75,
      tags: ['leadership', 'governance', 'low_readiness'],
      description: 'Create and communicate a clear AI vision with measurable business outcomes to align organizational efforts.',
      actions: ['Define 3-5 key AI success metrics', 'Get C-suite approval on AI vision document', 'Communicate vision across all levels']
    },
    {
      id: 'assign_ai_leader',
      pillar: 'C', 
      title: 'Assign Dedicated AI Leader (CAIO)',
      base_score: 0.70,
      tags: ['leadership', 'governance', 'low_readiness'],
      description: 'Designate a senior leader to own AI strategy execution and resource allocation decisions.',
      actions: ['Define CAIO role and responsibilities', 'Allocate budget and team resources', 'Establish monthly executive review cadence']
    },
    {
      id: 'establish_coe_bu_model',
      pillar: 'C',
      title: 'Establish CoE ↔ BU Operating Model',
      base_score: 0.65,
      tags: ['operations', 'governance', 'scale'],
      description: 'Define clear roles between Center of Excellence (standards/enablement) and Business Units (delivery/adoption).',
      actions: ['Document CoE vs BU responsibilities', 'Create intake and approval processes', 'Define success metrics for both sides']
    },

    // Operations & Data moves
    {
      id: 'implement_mlops_pipeline',
      pillar: 'O',
      title: 'Implement MLOps Pipeline & Monitoring',
      base_score: 0.80,
      tags: ['technical', 'scale', 'build_readiness_high', 'data_advantage'],
      description: 'Build automated model deployment, monitoring, and management capabilities for production AI.',
      actions: ['Set up model registry and versioning', 'Implement automated testing pipeline', 'Create drift detection and alerting']
    },
    {
      id: 'create_data_catalog',
      pillar: 'O',
      title: 'Create Data Catalog & Governance',
      base_score: 0.70,
      tags: ['data', 'governance', 'regulatory', 'high_sensitivity'],
      description: 'Establish discoverable data inventory with ownership, quality metrics, and usage policies.',
      actions: ['Implement data cataloging tools', 'Assign data stewards by domain', 'Define data quality standards and SLAs']
    },
    {
      id: 'design_intake_process',
      pillar: 'O',
      title: 'Design Use Case Intake & Gate Process', 
      base_score: 0.65,
      tags: ['process', 'governance', 'portfolio'],
      description: 'Create systematic evaluation process for AI initiatives focusing on business value and feasibility.',
      actions: ['Create intake form and criteria', 'Define stage-gate approval process', 'Train teams on submission requirements']
    },

    // Risk, Trust, Security moves
    {
      id: 'create_ai_inventory',
      pillar: 'R',
      title: 'Create AI System Inventory & Risk Register',
      base_score: 0.85,
      tags: ['regulatory', 'governance', 'high_safety', 'brand'],
      description: 'Maintain comprehensive list of all AI systems with risk levels, owners, and mitigation status.',
      actions: ['Catalog all existing AI systems', 'Assess and document risk levels', 'Assign risk owners and review schedule']
    },
    {
      id: 'implement_bias_testing',
      pillar: 'R',
      title: 'Implement Bias & Fairness Testing',
      base_score: 0.75,
      tags: ['regulatory', 'high_safety', 'brand', 'automated'],
      description: 'Establish regular testing for bias, fairness, and discriminatory outcomes in AI systems.',
      actions: ['Define fairness metrics by use case', 'Implement automated bias testing', 'Create remediation workflows']
    },
    {
      id: 'develop_incident_response',
      pillar: 'R',
      title: 'Develop AI Incident Response Plan',
      base_score: 0.70,
      tags: ['regulatory', 'brand', 'high_safety', 'operations'],
      description: 'Create tested procedures for responding to AI system failures, bias incidents, or security breaches.',
      actions: ['Define incident categories and escalation', 'Create response runbooks', 'Conduct tabletop exercises']
    },

    // Talent & Culture moves
    {
      id: 'design_upskilling_program',
      pillar: 'T',
      title: 'Design Role-Based AI Upskilling Program',
      base_score: 0.75,
      tags: ['culture', 'low_readiness', 'adoption', 'change_management'],
      description: 'Create targeted training programs to build AI fluency across different job functions and roles.',
      actions: ['Map AI skills needed by role', 'Partner with training providers', 'Create internal certification paths']
    },
    {
      id: 'redesign_workflows_ai',
      pillar: 'T',
      title: 'Redesign Key Workflows for AI Integration',
      base_score: 0.70,
      tags: ['operations', 'adoption', 'process', 'value_creation'],
      description: 'Update standard operating procedures to incorporate AI tools with appropriate human checkpoints.',
      actions: ['Identify high-impact workflows', 'Map human-AI handoffs', 'Update job descriptions and SOPs']
    },
    {
      id: 'create_ai_champions',
      pillar: 'T',
      title: 'Create AI Champions Network',
      base_score: 0.60,
      tags: ['culture', 'adoption', 'change_management'],
      description: 'Establish network of AI advocates across business units to drive adoption and share best practices.',
      actions: ['Select champions from each BU', 'Create regular sharing forums', 'Recognize and reward success stories']
    },

    // Ecosystem & Infrastructure moves  
    {
      id: 'implement_finops_ai',
      pillar: 'E',
      title: 'Implement AI FinOps & Cost Management',
      base_score: 0.65,
      tags: ['finops_strict', 'scale', 'operations'],
      description: 'Establish cost monitoring, budgeting, and optimization practices for AI infrastructure and services.',
      actions: ['Implement cost tracking by project', 'Set budget alerts and limits', 'Create unit economics dashboards']
    },
    {
      id: 'evaluate_vendor_strategy', 
      pillar: 'E',
      title: 'Evaluate Multi-Vendor AI Strategy',
      base_score: 0.70,
      tags: ['vendor', 'risk_management', 'flexibility'],
      description: 'Assess and plan for using multiple AI vendors to avoid lock-in and ensure continuity.',
      actions: ['Map vendor dependencies', 'Create exit/portability plans', 'Negotiate favorable contract terms']
    },
    {
      id: 'setup_secure_data_sharing',
      pillar: 'E',
      title: 'Setup Secure External Data Sharing',
      base_score: 0.60,
      tags: ['regulatory', 'high_sensitivity', 'partnerships'],
      description: 'Implement governed mechanisms for sharing data with external AI vendors and partners.',
      actions: ['Implement clean room technologies', 'Create data sharing agreements', 'Set up API-based secure sharing']
    },

    // Experimentation & Evolution moves
    {
      id: 'create_ai_sandbox',
      pillar: 'X',
      title: 'Create Safe AI Experimentation Sandbox',
      base_score: 0.75,
      tags: ['innovation', 'safety', 'experimentation'],
      description: 'Establish controlled environment for rapid AI prototyping with representative but protected data.',
      actions: ['Set up isolated compute environment', 'Create synthetic/anonymized datasets', 'Define sandbox usage policies']
    },
    {
      id: 'establish_horizon_scanning',
      pillar: 'X',
      title: 'Establish AI Horizon Scanning Process',
      base_score: 0.55,
      tags: ['innovation', 'strategic', 'clock_speed_high'],
      description: 'Create systematic process for tracking AI technology trends, regulatory changes, and competitive moves.',
      actions: ['Assign trend monitoring roles', 'Create quarterly trend reports', 'Connect with industry networks']
    },
    {
      id: 'implement_success_sunset',
      pillar: 'X',
      title: 'Implement Success & Sunset Criteria for Pilots',
      base_score: 0.65,
      tags: ['process', 'portfolio', 'decision_making'],
      description: 'Define clear success metrics and exit criteria to avoid "pilot purgatory" and scale what works.',
      actions: ['Set go/no-go criteria for each pilot', 'Create decision review checkpoints', 'Document scaling vs. sunset decisions']
    }
  ];

  // Calculate priority scores using context-based weighting
  const weightedMoves = moveLibrary.map(move => {
    let priority = move.base_score;
    
    // Stage gap boost - bigger boost if pillar is weaker
    const pillarScore = pillarScores[move.pillar] || 0;
    const stageGapBoost = 0.02 * (3 - pillarScore);
    priority += stageGapBoost;
    
    // Context-based priority boosts
    let contextBoosts: any = {};
    
    // Regulatory and safety context
    if (move.tags.includes('regulatory') && contextProfile.regulatory_intensity >= 3) {
      contextBoosts.regulatory = 0.08;
      priority += 0.08;
    }
    if (move.tags.includes('high_safety') && contextProfile.safety_criticality >= 3) {
      contextBoosts.high_safety = 0.08;
      priority += 0.08;
    }
    
    // Data sensitivity context
    if (move.tags.includes('high_sensitivity') && contextProfile.data_sensitivity >= 3) {
      contextBoosts.high_sensitivity = 0.06;
      priority += 0.06;
    }
    
    // Brand exposure context
    if (move.tags.includes('brand') && contextProfile.brand_exposure >= 3) {
      contextBoosts.brand = 0.05;
      priority += 0.05;
    }
    
    // Clock speed context
    if (move.tags.includes('clock_speed_high') && contextProfile.clock_speed >= 3) {
      contextBoosts.clock_speed = 0.07;
      priority += 0.07;
    }
    
    // Scale and latency context
    if (move.tags.includes('scale') && contextProfile.scale_throughput >= 3) {
      contextBoosts.scale = 0.06;
      priority += 0.06;
    }
    
    // Data advantage context
    if (move.tags.includes('data_advantage') && contextProfile.data_advantage >= 3) {
      contextBoosts.data_advantage = 0.07;
      priority += 0.07;
    }
    
    // Build readiness context
    if (move.tags.includes('low_readiness') && contextProfile.build_readiness <= 1) {
      contextBoosts.low_readiness = 0.07;
      priority += 0.07;
    }
    if (move.tags.includes('build_readiness_high') && contextProfile.build_readiness >= 3) {
      contextBoosts.build_readiness_high = 0.05;
      priority += 0.05;
    }
    
    // FinOps context
    if (move.tags.includes('finops_strict') && contextProfile.finops_priority >= 3) {
      contextBoosts.finops = 0.05;
      priority += 0.05;
    }
    
    return {
      ...move,
      priority,
      stage_gap_boost: stageGapBoost,
      context_boosts: contextBoosts,
      explain: {
        base_score: move.base_score,
        stage_gap_boost: stageGapBoost,
        context_boosts: contextBoosts,
        final_priority: priority
      }
    };
  });
  
  // Sort by priority and return top moves per pillar
  const sortedMoves = weightedMoves.sort((a, b) => b.priority - a.priority);
  
  // Get top 2 moves per weak pillar (score <= 2)
  const priorityMovesByPillar: any = {};
  Object.entries(pillarScores).forEach(([pillar, score]) => {
    if (score <= 2) {
      const pillarMoves = sortedMoves
        .filter(m => m.pillar === pillar)
        .slice(0, 2); // Top 2 moves per pillar
      priorityMovesByPillar[pillar] = pillarMoves;
    }
  });
  
  return priorityMovesByPillar;
}
