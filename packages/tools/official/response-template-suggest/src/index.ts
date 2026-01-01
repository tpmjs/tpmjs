/**
 * Response Template Suggest Tool for TPMJS
 * Suggests response templates based on ticket category and customer context
 */

import { jsonSchema, tool } from 'ai';

/**
 * Support ticket information
 */
export interface Ticket {
  subject: string;
  description: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * Customer context and history
 */
export interface CustomerContext {
  tier?: 'free' | 'basic' | 'premium' | 'enterprise';
  sentiment?: 'positive' | 'neutral' | 'negative';
  totalTickets?: number;
  accountAge?: number;
  lastInteraction?: string;
  preferredLanguage?: string;
}

/**
 * Personalization point suggestion
 */
export interface PersonalizationPoint {
  field: string;
  suggestion: string;
  reason: string;
}

/**
 * Single response template suggestion
 */
export interface TemplateOption {
  template: string;
  relevanceScore: number;
  matchingFactors: string[];
  personalizationPoints: PersonalizationPoint[];
  tone: 'formal' | 'friendly' | 'empathetic' | 'professional';
}

/**
 * Output interface for response templates
 */
export interface ResponseTemplates {
  templates: TemplateOption[];
  recommendedTemplate: string;
  context: {
    ticketCategory: string;
    customerTier: string;
    suggestedTone: string;
  };
}

type ResponseTemplateSuggestInput = {
  ticket: Ticket;
  customerContext?: CustomerContext;
};

/**
 * Validates ticket object
 */
function validateTicket(ticket: unknown): ticket is Ticket {
  if (!ticket || typeof ticket !== 'object') {
    throw new Error('Ticket must be an object');
  }

  const t = ticket as Record<string, unknown>;

  if (!t.subject || typeof t.subject !== 'string' || t.subject.trim().length === 0) {
    throw new Error('Ticket must have a non-empty subject');
  }

  if (!t.description || typeof t.description !== 'string' || t.description.trim().length === 0) {
    throw new Error('Ticket must have a non-empty description');
  }

  if (t.priority && !['low', 'medium', 'high', 'urgent'].includes(t.priority as string)) {
    throw new Error('Ticket priority must be one of: low, medium, high, urgent');
  }

  return true;
}

/**
 * Determines ticket category from subject and description
 */
function categorizeTicket(ticket: Ticket): string {
  const text = `${ticket.subject} ${ticket.description}`.toLowerCase();

  if (ticket.category) return ticket.category;

  // Simple keyword-based categorization
  if (text.includes('bug') || text.includes('error') || text.includes('not working')) {
    return 'bug-report';
  }
  if (text.includes('feature') || text.includes('request') || text.includes('would like')) {
    return 'feature-request';
  }
  if (text.includes('billing') || text.includes('payment') || text.includes('invoice')) {
    return 'billing';
  }
  if (text.includes('how to') || text.includes('help') || text.includes('question')) {
    return 'support-question';
  }

  return 'general';
}

/**
 * Determines suggested tone based on context
 */
function determineTone(
  category: string,
  priority: string,
  sentiment?: string
): 'formal' | 'friendly' | 'empathetic' | 'professional' {
  if (sentiment === 'negative' || priority === 'urgent') {
    return 'empathetic';
  }
  if (category === 'billing') {
    return 'professional';
  }
  if (sentiment === 'positive') {
    return 'friendly';
  }
  return 'professional';
}

/**
 * Generates template options based on category and context
 */
function generateTemplates(
  ticket: Ticket,
  category: string,
  customerContext?: CustomerContext
): TemplateOption[] {
  const templates: TemplateOption[] = [];
  const tone = determineTone(category, ticket.priority || 'medium', customerContext?.sentiment);
  const tier = customerContext?.tier || 'basic';

  // Template 1: Acknowledgment + Investigation
  templates.push({
    template: `<article role="article" aria-labelledby="response-heading">
  <header>
    <h1 id="response-heading">Support Response: ${ticket.subject}</h1>
  </header>

  <section aria-label="Acknowledgment">
    <p>Thank you for reaching out regarding ${ticket.subject}.</p>
    <p>I understand you're experiencing <strong aria-label="Issue description">[describe issue]</strong>. This is certainly something we want to resolve for you as quickly as possible.</p>
  </section>

  <section aria-label="Action plan">
    <h2>Next Steps</h2>
    <p>I've reviewed your account and I'm looking into this right away. I'll need <time>[1-2 business days]</time> to investigate this thoroughly and get back to you with a solution.</p>
    <p>In the meantime, if you have any additional information that might help, please don't hesitate to share it.</p>
  </section>

  <footer>
    <p>Best regards</p>
  </footer>
</article>`,
    relevanceScore: 0.9,
    matchingFactors: ['Shows empathy', 'Sets expectations', 'Requests additional info'],
    personalizationPoints: [
      {
        field: '[describe issue]',
        suggestion: 'Paraphrase the customer issue in your own words',
        reason: 'Shows active listening and understanding',
      },
      {
        field: '[1-2 business days]',
        suggestion: tier === 'enterprise' ? '24 hours' : '1-2 business days',
        reason: 'Enterprise customers get priority SLA',
      },
    ],
    tone,
  });

  // Template 2: Quick Solution
  if (category === 'support-question') {
    templates.push({
      template: `<article role="article" aria-labelledby="solution-heading">
  <header>
    <h1 id="solution-heading">Solution: ${ticket.subject}</h1>
  </header>

  <section aria-label="Greeting">
    <p>Thank you for contacting us!</p>
    <p>I'd be happy to help you with ${ticket.subject}.</p>
  </section>

  <section aria-label="Solution steps">
    <h2>How to <span aria-label="Solution description">[solve the issue]</span></h2>
    <ol role="list" aria-label="Step-by-step instructions">
      <li><strong>Step 1:</strong> [Step 1]</li>
      <li><strong>Step 2:</strong> [Step 2]</li>
      <li><strong>Step 3:</strong> [Step 3]</li>
    </ol>
  </section>

  <section aria-label="Follow-up">
    <p>Please let me know if this resolves your question, or if you need any clarification on these steps.</p>
  </section>

  <footer>
    <p>Best regards</p>
  </footer>
</article>`,
      relevanceScore: 0.85,
      matchingFactors: ['Direct solution', 'Clear steps', 'Follow-up offer'],
      personalizationPoints: [
        {
          field: '[solve the issue]',
          suggestion: 'Insert specific solution steps',
          reason: 'Provides immediate value',
        },
      ],
      tone: 'friendly',
    });
  }

  // Template 3: Escalation
  if (ticket.priority === 'urgent' || customerContext?.sentiment === 'negative') {
    templates.push({
      template: `<article role="article" aria-labelledby="escalation-heading">
  <header>
    <h1 id="escalation-heading">Urgent Response: ${ticket.subject}</h1>
  </header>

  <section aria-label="Acknowledgment and apology">
    <p>Thank you for bringing this to our attention.</p>
    <p><strong>I sincerely apologize</strong> for the inconvenience you've experienced with ${ticket.subject}. This is not the level of service we aim to provide.</p>
  </section>

  <section aria-label="Escalation and timeline">
    <h2>Immediate Action</h2>
    <p>I'm escalating this to our senior team immediately to ensure we resolve this as quickly as possible.</p>
    <p role="status" aria-live="polite">You can expect an update from us within <time aria-label="Response timeframe">[timeframe]</time>.</p>
  </section>

  <section aria-label="Commitment">
    <p><em>Your satisfaction is our priority, and we're committed to making this right.</em></p>
  </section>

  <footer>
    <p>Best regards</p>
  </footer>
</article>`,
      relevanceScore: customerContext?.sentiment === 'negative' ? 0.95 : 0.7,
      matchingFactors: ['Acknowledges frustration', 'Shows urgency', 'Commits to resolution'],
      personalizationPoints: [
        {
          field: '[timeframe]',
          suggestion: tier === 'enterprise' ? '4 hours' : '24 hours',
          reason: 'Urgent issues require fast response',
        },
      ],
      tone: 'empathetic',
    });
  }

  // Sort by relevance score
  templates.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return templates;
}

/**
 * Response Template Suggest Tool
 * Suggests response templates based on ticket category and customer context
 */
export const responseTemplateSuggestTool = tool({
  description:
    'Suggests response templates for support tickets based on ticket category and customer context. Includes personalization points and tone recommendations to improve customer satisfaction.',
  inputSchema: jsonSchema<ResponseTemplateSuggestInput>({
    type: 'object',
    properties: {
      ticket: {
        type: 'object',
        description: 'Support ticket information',
        properties: {
          subject: {
            type: 'string',
            description: 'Ticket subject line',
          },
          description: {
            type: 'string',
            description: 'Detailed ticket description',
          },
          category: {
            type: 'string',
            description: 'Ticket category (optional, will be inferred if not provided)',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent'],
            description: 'Ticket priority level',
          },
        },
        required: ['subject', 'description'],
      },
      customerContext: {
        type: 'object',
        description: 'Customer history and context (optional)',
        properties: {
          tier: {
            type: 'string',
            enum: ['free', 'basic', 'premium', 'enterprise'],
            description: 'Customer subscription tier',
          },
          sentiment: {
            type: 'string',
            enum: ['positive', 'neutral', 'negative'],
            description: 'Customer sentiment from previous interactions',
          },
          totalTickets: {
            type: 'number',
            description: 'Total number of tickets submitted',
          },
          accountAge: {
            type: 'number',
            description: 'Account age in days',
          },
          lastInteraction: {
            type: 'string',
            description: 'Date of last interaction',
          },
          preferredLanguage: {
            type: 'string',
            description: 'Customer preferred language',
          },
        },
      },
    },
    required: ['ticket'],
    additionalProperties: false,
  }),
  async execute({ ticket, customerContext }): Promise<ResponseTemplates> {
    // Validate ticket
    validateTicket(ticket);

    // Categorize ticket
    const category = categorizeTicket(ticket);
    const tier = customerContext?.tier || 'basic';
    const tone = determineTone(category, ticket.priority || 'medium', customerContext?.sentiment);

    // Generate template options
    const templates = generateTemplates(ticket, category, customerContext);

    if (templates.length === 0) {
      throw new Error('Failed to generate templates');
    }

    const firstTemplate = templates[0];
    if (!firstTemplate) {
      throw new Error('Failed to generate templates');
    }

    return {
      templates,
      recommendedTemplate: firstTemplate.template,
      context: {
        ticketCategory: category,
        customerTier: tier,
        suggestedTone: tone,
      },
    };
  },
});

export default responseTemplateSuggestTool;
