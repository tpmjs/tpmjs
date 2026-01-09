/**
 * Proposal Outline Tool for TPMJS
 * Generates structured sales proposal outlines from opportunity details and customer requirements.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Opportunity details
 */
export interface OpportunityData {
  customerName: string;
  customerIndustry?: string;
  requirements: string[];
  budget?: number;
  timeline?: string;
  decisionMakers?: string[];
  painPoints?: string[];
  currentSolution?: string;
}

/**
 * Proposal section
 */
export interface ProposalSection {
  title: string;
  content: string[];
  subsections?: ProposalSection[];
}

/**
 * Proposal outline output
 */
export interface ProposalOutline {
  title: string;
  sections: ProposalSection[];
  metadata: {
    customerName: string;
    createdAt: string;
    template: string;
    estimatedPages: number;
  };
  nextSteps: string[];
}

type ProposalOutlineInput = {
  opportunity: OpportunityData;
  template?: string;
};

/**
 * Generate executive summary section
 */
function generateExecutiveSummary(opp: OpportunityData): ProposalSection {
  const content: string[] = [];

  content.push(`Overview of ${opp.customerName}'s current challenges and business objectives`);
  content.push('Summary of proposed solution and key benefits');
  content.push('High-level investment required and expected ROI');

  if (opp.painPoints && opp.painPoints.length > 0) {
    content.push(`Critical pain points addressed: ${opp.painPoints.slice(0, 3).join(', ')}`);
  }

  content.push('Timeline for implementation and key milestones');
  content.push('Why we are the right partner for this engagement');

  return {
    title: 'Executive Summary',
    content,
  };
}

/**
 * Generate customer needs section
 */
function generateCustomerNeeds(opp: OpportunityData): ProposalSection {
  const content: string[] = [];

  content.push(`Background on ${opp.customerName} and current situation`);

  if (opp.customerIndustry) {
    content.push(`Industry context and challenges in ${opp.customerIndustry}`);
  }

  if (opp.currentSolution) {
    content.push(`Analysis of current solution: ${opp.currentSolution}`);
    content.push('Gaps and limitations of current approach');
  }

  content.push('Business requirements and success criteria:');
  for (const req of opp.requirements.slice(0, 5)) {
    content.push(`  • ${req}`);
  }

  if (opp.painPoints && opp.painPoints.length > 0) {
    content.push('Key pain points to address:');
    for (const pain of opp.painPoints) {
      content.push(`  • ${pain}`);
    }
  }

  return {
    title: 'Understanding Your Needs',
    content,
  };
}

/**
 * Generate proposed solution section
 */
function generateProposedSolution(opp: OpportunityData): ProposalSection {
  const subsections: ProposalSection[] = [];

  // Solution overview
  subsections.push({
    title: 'Solution Overview',
    content: [
      'High-level description of proposed solution',
      'How our approach addresses each key requirement',
      'Unique differentiators and competitive advantages',
    ],
  });

  // Technical approach
  subsections.push({
    title: 'Technical Approach',
    content: [
      'Architecture and technology stack',
      'Integration with existing systems',
      'Scalability and performance considerations',
      'Security and compliance measures',
    ],
  });

  // Deliverables
  subsections.push({
    title: 'Deliverables',
    content: [
      'Detailed list of all deliverables',
      'Documentation and training materials',
      'Support and maintenance plan',
    ],
  });

  return {
    title: 'Proposed Solution',
    content: [
      'Comprehensive solution designed specifically for ' + opp.customerName,
      'Addresses all stated requirements and pain points',
    ],
    subsections,
  };
}

/**
 * Generate implementation plan section
 */
function generateImplementationPlan(opp: OpportunityData): ProposalSection {
  const content: string[] = [];

  content.push('Phase-by-phase implementation roadmap');

  if (opp.timeline) {
    content.push(`Target timeline: ${opp.timeline}`);
  } else {
    content.push('Estimated timeline: 3-6 months (to be refined)');
  }

  content.push('Key milestones and deliverables by phase:');
  content.push('  Phase 1: Discovery and planning (Weeks 1-2)');
  content.push('  Phase 2: Design and architecture (Weeks 3-6)');
  content.push('  Phase 3: Development and integration (Weeks 7-14)');
  content.push('  Phase 4: Testing and validation (Weeks 15-18)');
  content.push('  Phase 5: Deployment and training (Weeks 19-20)');
  content.push('Resource allocation and team structure');
  content.push('Risk mitigation strategies');
  content.push('Quality assurance and testing approach');

  return {
    title: 'Implementation Plan',
    content,
  };
}

/**
 * Generate pricing section
 */
function generatePricing(opp: OpportunityData): ProposalSection {
  const content: string[] = [];

  content.push('Investment breakdown by phase/component');
  content.push('One-time costs vs. recurring costs');

  if (opp.budget) {
    const budgetFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(opp.budget);
    content.push(`Proposal aligned with indicated budget of ${budgetFormatted}`);
  }

  content.push('Payment terms and schedule');
  content.push('Optional add-ons and future enhancements');
  content.push('Total cost of ownership analysis');
  content.push('ROI projections and business value');

  return {
    title: 'Investment & Pricing',
    content,
  };
}

/**
 * Generate team and qualifications section
 */
function generateTeamQualifications(): ProposalSection {
  return {
    title: 'Our Team & Qualifications',
    content: [
      'Company background and relevant experience',
      'Team members assigned to this project',
      'Relevant case studies and success stories',
      'Client testimonials and references',
      'Certifications and partnerships',
      'Why we are uniquely qualified for this engagement',
    ],
  };
}

/**
 * Generate terms and conditions section
 */
function generateTermsConditions(): ProposalSection {
  return {
    title: 'Terms & Conditions',
    content: [
      'Proposal validity period',
      'Assumptions and dependencies',
      'Change request process',
      'Intellectual property rights',
      'Confidentiality and data protection',
      'Warranties and support terms',
      'Acceptance and signature page',
    ],
  };
}

/**
 * Generate next steps
 */
function generateNextSteps(opp: OpportunityData): string[] {
  const steps: string[] = [];

  steps.push('Review proposal with stakeholders');

  if (opp.decisionMakers && opp.decisionMakers.length > 0) {
    steps.push(`Schedule alignment meeting with decision makers: ${opp.decisionMakers.join(', ')}`);
  } else {
    steps.push('Schedule follow-up meeting to discuss questions and concerns');
  }

  steps.push('Address any questions or requested modifications');
  steps.push('Finalize scope and pricing');
  steps.push('Execute contract and initiate project');

  return steps;
}

/**
 * Estimate page count based on sections
 */
function estimatePageCount(sections: ProposalSection[]): number {
  let pages = 2; // Cover page + executive summary

  for (const section of sections) {
    pages += 1; // Main section
    if (section.subsections && section.subsections.length > 0) {
      pages += section.subsections.length * 0.5; // Subsections
    }
  }

  return Math.ceil(pages);
}

/**
 * Proposal Outline Tool
 * Generates structured proposal outlines from opportunity data
 */
export const proposalOutlineTool = tool({
  description:
    'Generate a structured sales proposal outline from opportunity details. Provide customer information, requirements, budget, and timeline to create a comprehensive proposal outline with executive summary, solution description, implementation plan, pricing, and next steps. Supports multiple template types (standard, technical, executive).',
  inputSchema: jsonSchema<ProposalOutlineInput>({
    type: 'object',
    properties: {
      opportunity: {
        type: 'object',
        description: 'Opportunity details and customer requirements',
        properties: {
          customerName: {
            type: 'string',
            description: 'Name of the customer/prospect',
          },
          customerIndustry: {
            type: 'string',
            description: 'Customer industry or sector (optional)',
          },
          requirements: {
            type: 'array',
            description: 'List of customer requirements',
            items: {
              type: 'string',
            },
          },
          budget: {
            type: 'number',
            description: 'Budget amount in dollars (optional)',
          },
          timeline: {
            type: 'string',
            description: 'Desired timeline or deadline (optional)',
          },
          decisionMakers: {
            type: 'array',
            description: 'Names/titles of decision makers (optional)',
            items: {
              type: 'string',
            },
          },
          painPoints: {
            type: 'array',
            description: 'Customer pain points to address (optional)',
            items: {
              type: 'string',
            },
          },
          currentSolution: {
            type: 'string',
            description: 'Current solution or approach (optional)',
          },
        },
        required: ['customerName', 'requirements'],
      },
      template: {
        type: 'string',
        enum: ['standard', 'technical', 'executive'],
        description:
          'Proposal template type: standard (balanced), technical (detailed technical), executive (high-level)',
      },
    },
    required: ['opportunity'],
    additionalProperties: false,
  }),
  async execute({ opportunity, template = 'standard' }): Promise<ProposalOutline> {
    // Validate inputs
    if (!opportunity || typeof opportunity !== 'object') {
      throw new Error('Opportunity data is required');
    }

    if (
      !opportunity.customerName ||
      typeof opportunity.customerName !== 'string' ||
      opportunity.customerName.trim().length === 0
    ) {
      throw new Error('Customer name is required and must be a non-empty string');
    }

    if (!Array.isArray(opportunity.requirements) || opportunity.requirements.length === 0) {
      throw new Error('Requirements array is required and must contain at least one requirement');
    }

    // Validate template
    const validTemplates = ['standard', 'technical', 'executive'];
    if (!validTemplates.includes(template)) {
      throw new Error(`Template must be one of: ${validTemplates.join(', ')}`);
    }

    // Build sections based on template
    const sections: ProposalSection[] = [];

    // All templates start with executive summary
    sections.push(generateExecutiveSummary(opportunity));

    // Customer needs section
    sections.push(generateCustomerNeeds(opportunity));

    // Proposed solution (more detailed for technical template)
    sections.push(generateProposedSolution(opportunity));

    // Implementation plan (skip for executive template)
    if (template !== 'executive') {
      sections.push(generateImplementationPlan(opportunity));
    }

    // Pricing
    sections.push(generatePricing(opportunity));

    // Team and qualifications (more prominent for standard/technical)
    if (template !== 'executive') {
      sections.push(generateTeamQualifications());
    }

    // Terms and conditions (detailed for technical, brief for executive)
    if (template === 'technical') {
      sections.push(generateTermsConditions());
    } else if (template === 'executive') {
      sections.push({
        title: 'Terms & Next Steps',
        content: [
          'Proposal valid for 30 days',
          'Standard terms and conditions apply',
          'Detailed terms available upon request',
        ],
      });
    } else {
      sections.push(generateTermsConditions());
    }

    // Generate next steps
    const nextSteps = generateNextSteps(opportunity);

    // Estimate page count
    const estimatedPages = estimatePageCount(sections);

    // Build proposal title
    const title = `Proposal for ${opportunity.customerName}`;

    return {
      title,
      sections,
      metadata: {
        customerName: opportunity.customerName.trim(),
        createdAt: new Date().toISOString(),
        template,
        estimatedPages,
      },
      nextSteps,
    };
  },
});

export default proposalOutlineTool;
