/**
 * Support Ticket Categorization Tool for TPMJS
 * Categorizes support tickets by type, priority, and product area
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 * Uses jsonSchema() to avoid Zod 4 JSON Schema conversion issues with OpenAI
 */

import { jsonSchema, tool } from 'ai';

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  customerEmail?: string;
  createdAt?: string;
}

export interface TicketCategorization {
  ticketId: string;
  category:
    | 'bug'
    | 'feature-request'
    | 'how-to'
    | 'billing'
    | 'technical-issue'
    | 'account'
    | 'other';
  priority: 'critical' | 'high' | 'medium' | 'low';
  productArea: string;
  routingSuggestion: string;
  reasoning: string;
  tags: string[];
  estimatedResolutionTime?: string;
}

/**
 * Input type for Ticket Categorize Tool
 */
type TicketCategorizeInput = {
  ticket: SupportTicket;
};

/**
 * Determines ticket category based on content
 */
function determineCategory(
  subject: string,
  description: string
): 'bug' | 'feature-request' | 'how-to' | 'billing' | 'technical-issue' | 'account' | 'other' {
  const text = `${subject} ${description}`.toLowerCase();

  // Bug indicators
  if (
    /\b(bug|error|crash|broken|not working|issue|problem|fail|glitch)\b/.test(text) &&
    !/\b(how to|how do i|can i|is it possible)\b/.test(text)
  ) {
    return 'bug';
  }

  // Feature request indicators
  if (
    /\b(feature request|suggestion|enhancement|would like|wish|want|need|could you add|please add)\b/.test(
      text
    )
  ) {
    return 'feature-request';
  }

  // Billing indicators
  if (/\b(billing|invoice|payment|charge|subscription|refund|pricing|plan|upgrade)\b/.test(text)) {
    return 'billing';
  }

  // Account indicators
  if (/\b(account|login|password|access|permission|user|reset|locked|sign in)\b/.test(text)) {
    return 'account';
  }

  // How-to indicators
  if (
    /\b(how to|how do i|how can i|help me|guide|tutorial|instruction|can i|is it possible)\b/.test(
      text
    )
  ) {
    return 'how-to';
  }

  // Technical issue indicators
  if (/\b(integration|api|setup|configuration|install|deploy|performance|slow)\b/.test(text)) {
    return 'technical-issue';
  }

  return 'other';
}

/**
 * Determines priority based on content and category
 */
function determinePriority(
  subject: string,
  description: string,
  category: string
): 'critical' | 'high' | 'medium' | 'low' {
  const text = `${subject} ${description}`.toLowerCase();

  // Critical indicators
  if (
    /\b(urgent|critical|emergency|down|outage|production|can't access|data loss|security)\b/.test(
      text
    )
  ) {
    return 'critical';
  }

  // High priority indicators
  if (
    /\b(asap|important|blocking|blocker|can't work|multiple users|affecting business)\b/.test(text)
  ) {
    return 'high';
  }

  // Category-based priority
  if (category === 'bug' && /\b(crash|error|broken|not working)\b/.test(text)) {
    return 'high';
  }

  if (category === 'billing') {
    return 'high'; // Billing issues are typically high priority
  }

  if (category === 'feature-request' || category === 'how-to') {
    return 'low'; // Feature requests and how-to questions are typically lower priority
  }

  return 'medium';
}

/**
 * Identifies product area from ticket content
 */
function identifyProductArea(subject: string, description: string): string {
  const text = `${subject} ${description}`.toLowerCase();

  const areas = [
    { name: 'API', keywords: ['api', 'endpoint', 'rest', 'graphql', 'webhook'] },
    { name: 'Dashboard', keywords: ['dashboard', 'ui', 'interface', 'screen', 'page'] },
    { name: 'Mobile App', keywords: ['mobile', 'app', 'ios', 'android', 'phone'] },
    { name: 'Integrations', keywords: ['integration', 'connect', 'sync', 'import', 'export'] },
    { name: 'Billing', keywords: ['billing', 'invoice', 'payment', 'subscription'] },
    { name: 'Authentication', keywords: ['login', 'auth', 'password', 'sso', 'oauth'] },
    { name: 'Reporting', keywords: ['report', 'analytics', 'chart', 'export', 'data'] },
    { name: 'Notifications', keywords: ['notification', 'email', 'alert', 'reminder'] },
  ];

  for (const area of areas) {
    if (area.keywords.some((keyword) => text.includes(keyword))) {
      return area.name;
    }
  }

  return 'General';
}

/**
 * Suggests routing based on category and product area
 */
function suggestRouting(category: string, priority: string, productArea: string): string {
  if (priority === 'critical') {
    return 'Escalate to Senior Support Engineer immediately';
  }

  if (category === 'bug' && priority === 'high') {
    return 'Route to Engineering Team for investigation';
  }

  if (category === 'billing') {
    return 'Route to Billing Team';
  }

  if (category === 'feature-request') {
    return 'Route to Product Team for review';
  }

  if (category === 'technical-issue') {
    return `Route to ${productArea} Technical Support`;
  }

  if (category === 'how-to') {
    return 'Route to Level 1 Support or provide documentation link';
  }

  return 'Route to General Support Queue';
}

/**
 * Generates relevant tags
 */
function generateTags(
  category: string,
  priority: string,
  productArea: string,
  subject: string,
  description: string
): string[] {
  const tags: string[] = [category, priority, productArea];
  const text = `${subject} ${description}`.toLowerCase();

  if (text.includes('urgent') || text.includes('asap')) {
    tags.push('urgent');
  }
  if (text.includes('multiple users') || text.includes('all users')) {
    tags.push('widespread');
  }
  if (text.includes('first time') || text.includes('new user')) {
    tags.push('new-user');
  }
  if (text.includes('security') || text.includes('vulnerability')) {
    tags.push('security');
  }

  return Array.from(new Set(tags));
}

/**
 * Estimates resolution time based on category and priority
 */
function estimateResolutionTime(category: string, priority: string): string {
  if (priority === 'critical') {
    return 'Within 2 hours';
  }

  if (priority === 'high') {
    if (category === 'billing') {
      return 'Within 4 hours';
    }
    return 'Within 1 business day';
  }

  if (category === 'how-to') {
    return 'Within 4 hours';
  }

  if (category === 'feature-request') {
    return 'Evaluated in next product review cycle';
  }

  if (priority === 'medium') {
    return 'Within 2 business days';
  }

  return 'Within 3-5 business days';
}

/**
 * Support Ticket Categorization Tool
 * Categorizes tickets by type, priority, and product area
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 */
export const ticketCategorizeTool = tool({
  description:
    'Categorizes support tickets by type, priority, and product area. Suggests routing based on category and identifies urgent issues requiring immediate attention.',
  inputSchema: jsonSchema<TicketCategorizeInput>({
    type: 'object',
    properties: {
      ticket: {
        type: 'object',
        description: 'Support ticket to categorize',
        properties: {
          id: { type: 'string', description: 'Ticket ID' },
          subject: { type: 'string', description: 'Ticket subject line' },
          description: { type: 'string', description: 'Ticket description/body' },
          customerEmail: { type: 'string', description: 'Customer email (optional)' },
          createdAt: { type: 'string', description: 'Ticket creation date (ISO format)' },
        },
        required: ['id', 'subject', 'description'],
      },
    },
    required: ['ticket'],
    additionalProperties: false,
  }),
  async execute({ ticket }) {
    // Validate required fields
    if (!ticket.id || !ticket.subject || !ticket.description) {
      throw new Error('Ticket must have id, subject, and description');
    }

    if (ticket.subject.trim().length === 0 || ticket.description.trim().length === 0) {
      throw new Error('Subject and description cannot be empty');
    }

    // Categorize the ticket
    const category = determineCategory(ticket.subject, ticket.description);
    const priority = determinePriority(ticket.subject, ticket.description, category);
    const productArea = identifyProductArea(ticket.subject, ticket.description);
    const routingSuggestion = suggestRouting(category, priority, productArea);
    const tags = generateTags(category, priority, productArea, ticket.subject, ticket.description);
    const estimatedResolutionTime = estimateResolutionTime(category, priority);

    // Generate reasoning
    let reasoning = `Categorized as ${category} based on ticket content. `;
    reasoning += `Priority set to ${priority} due to `;

    if (priority === 'critical') {
      reasoning += 'critical keywords indicating urgent business impact. ';
    } else if (priority === 'high') {
      reasoning += 'high-impact indicators or blocking issues. ';
    } else {
      reasoning += 'standard request characteristics. ';
    }

    reasoning += `Identified ${productArea} as the affected product area.`;

    return {
      ticketId: ticket.id,
      category,
      priority,
      productArea,
      routingSuggestion,
      reasoning,
      tags,
      estimatedResolutionTime,
    };
  },
});

/**
 * Export default for convenience
 */
export default ticketCategorizeTool;
