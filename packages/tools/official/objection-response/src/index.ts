/**
 * Objection Response Tool for TPMJS
 * Suggests responses to common sales objections based on objection category and context.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Deal context for objection handling
 */
export interface DealContext {
  dealValue?: number;
  dealStage?: string;
  customerName?: string;
  industry?: string;
  competitorMentioned?: string;
  productInterest?: string;
}

/**
 * Objection categories
 */
export type ObjectionCategory =
  | 'price'
  | 'timing'
  | 'competition'
  | 'authority'
  | 'need'
  | 'trust'
  | 'feature'
  | 'other';

/**
 * Response strategy
 */
export interface ResponseStrategy {
  approach: string;
  response: string;
  rationale: string;
  whenToUse: string;
}

/**
 * Objection analysis and responses
 */
export interface ObjectionResponses {
  objection: string;
  category: ObjectionCategory;
  categoryConfidence: 'high' | 'medium' | 'low';
  strategies: ResponseStrategy[];
  followUpQuestions: string[];
  avoidPhrases: string[];
  metadata: {
    analyzedAt: string;
    contextProvided: boolean;
  };
}

type ObjectionResponseInput = {
  objection: string;
  context?: DealContext;
};

/**
 * Classify the objection into a category
 */
function classifyObjection(objection: string): {
  category: ObjectionCategory;
  confidence: 'high' | 'medium' | 'low';
} {
  const lower = objection.toLowerCase();

  // Domain rule: objection_classification - Price objections identified by cost-related keywords
  // Price objections
  if (
    lower.includes('expensive') ||
    lower.includes('price') ||
    lower.includes('cost') ||
    lower.includes('budget') ||
    lower.includes('afford') ||
    lower.includes('cheaper')
  ) {
    return { category: 'price', confidence: 'high' };
  }

  // Timing objections
  if (
    lower.includes('later') ||
    lower.includes('next quarter') ||
    lower.includes('not now') ||
    lower.includes('wait') ||
    lower.includes('timing') ||
    lower.includes('busy')
  ) {
    return { category: 'timing', confidence: 'high' };
  }

  // Competition objections
  if (
    lower.includes('competitor') ||
    lower.includes('already using') ||
    lower.includes('current vendor') ||
    lower.includes('other solution')
  ) {
    return { category: 'competition', confidence: 'high' };
  }

  // Authority objections
  if (
    lower.includes('need to check') ||
    lower.includes('boss') ||
    lower.includes('manager') ||
    lower.includes('decision maker') ||
    lower.includes('not authorized') ||
    lower.includes('need approval')
  ) {
    return { category: 'authority', confidence: 'high' };
  }

  // Need objections
  if (
    lower.includes("don't need") ||
    lower.includes('not necessary') ||
    lower.includes('works fine') ||
    lower.includes('satisfied') ||
    lower.includes('no problem')
  ) {
    return { category: 'need', confidence: 'high' };
  }

  // Trust objections
  if (
    lower.includes("don't know") ||
    lower.includes('heard of') ||
    lower.includes('trust') ||
    lower.includes('proven') ||
    lower.includes('references') ||
    lower.includes('track record')
  ) {
    return { category: 'trust', confidence: 'medium' };
  }

  // Feature objections
  if (
    lower.includes('feature') ||
    lower.includes('functionality') ||
    lower.includes("doesn't have") ||
    lower.includes('missing') ||
    lower.includes('capability')
  ) {
    return { category: 'feature', confidence: 'high' };
  }

  // Default to other
  return { category: 'other', confidence: 'low' };
}

/**
 * Generate response strategies for price objections
 */
function getPriceStrategies(context?: DealContext): ResponseStrategy[] {
  const strategies: ResponseStrategy[] = [];

  // Value justification
  strategies.push({
    approach: 'Value Justification',
    response:
      "I understand budget is important. Let's look at the ROI - based on similar customers, most see [specific benefit] within [timeframe], which typically results in [quantified value]. How does that align with your objectives?",
    rationale: 'Shifts focus from cost to value and return on investment',
    whenToUse: 'When customer is focused solely on upfront cost',
  });

  // Cost comparison
  strategies.push({
    approach: 'Cost of Inaction',
    response:
      "I appreciate your concern about the investment. Can we explore what it's costing you to not solve this problem? What's the impact of [pain point] on your business each month?",
    rationale: 'Highlights the hidden costs of maintaining status quo',
    whenToUse: 'When customer has clear pain points being addressed',
  });

  // Breakdown the value
  strategies.push({
    approach: 'Value Breakdown',
    response:
      "Let me break down what you're getting for that investment: [list key components]. Which of these provides the most value to you?",
    rationale: 'Makes the value tangible and specific',
    whenToUse: 'When customer needs to justify purchase internally',
  });

  // Flexible options
  if (context?.dealValue) {
    strategies.push({
      approach: 'Flexible Options',
      response:
        "I hear you. Let's explore some options - we could phase the implementation, adjust the scope, or look at different payment terms. What's most important to you?",
      rationale: 'Shows flexibility while maintaining engagement',
      whenToUse: 'When customer is interested but budget-constrained',
    });
  }

  return strategies;
}

/**
 * Generate response strategies for timing objections
 */
function getTimingStrategies(_context?: DealContext): ResponseStrategy[] {
  const strategies: ResponseStrategy[] = [];

  strategies.push({
    approach: 'Urgency Discovery',
    response:
      "I understand timing is important. Help me understand - what's driving the timing? Is it budget cycles, resource availability, or something else?",
    rationale: 'Uncovers the real reason behind the delay',
    whenToUse: 'When timing objection seems like a deflection',
  });

  strategies.push({
    approach: 'Cost of Delay',
    response:
      'That makes sense. While we wait, can we quantify what delaying costs you? If we could start solving [problem] sooner, what would that be worth?',
    rationale: 'Highlights opportunity cost of waiting',
    whenToUse: 'When there are clear ongoing costs or lost opportunities',
  });

  strategies.push({
    approach: 'Smaller First Step',
    response:
      "I hear you on the timing. What if we started with a smaller pilot or phase one now, and scaled up when you're ready? That way you're making progress without the full commitment.",
    rationale: 'Offers a low-commitment way to get started',
    whenToUse: 'When customer is interested but hesitant',
  });

  strategies.push({
    approach: 'Timeline Alignment',
    response:
      'Fair enough. If we were to aim for [their timeline], what would need to happen between now and then to make this a priority?',
    rationale: 'Keeps engagement while respecting their timeline',
    whenToUse: 'When the timeline is genuinely constrained',
  });

  return strategies;
}

/**
 * Generate response strategies for competition objections
 */
function getCompetitionStrategies(context?: DealContext): ResponseStrategy[] {
  const strategies: ResponseStrategy[] = [];

  strategies.push({
    approach: 'Respectful Differentiation',
    response:
      "[Competitor] is a solid choice. What I'm curious about is what's working well for you, and where you might see room for improvement?",
    rationale: 'Shows respect while uncovering dissatisfaction',
    whenToUse: 'When customer mentions current vendor',
  });

  strategies.push({
    approach: 'Unique Value',
    response:
      "I respect that you're looking at alternatives. What sets us apart is [unique differentiator]. Based on what you've shared, this could mean [specific benefit] for you. How important is that?",
    rationale: 'Highlights unique strengths without bashing competition',
    whenToUse: 'When you have clear differentiation',
  });

  if (context?.competitorMentioned) {
    strategies.push({
      approach: 'Specific Comparison',
      response: `Many of our customers evaluated ${context.competitorMentioned} as well. What they found is that we excel at [specific area]. Is that capability important for your use case?`,
      rationale: 'Provides specific comparison without being negative',
      whenToUse: 'When you know the specific competitor',
    });
  }

  strategies.push({
    approach: 'Not Either/Or',
    response:
      "Good to know you're evaluating options. Some customers actually use us alongside [competitor] because we're stronger at [capability]. Is that something you'd consider?",
    rationale: 'Opens possibility of coexistence rather than replacement',
    whenToUse: 'When your solution can complement theirs',
  });

  return strategies;
}

/**
 * Generate response strategies for authority objections
 */
function getAuthorityStrategies(): ResponseStrategy[] {
  return [
    {
      approach: 'Decision Process Alignment',
      response:
        'That makes sense - this is an important decision. Help me understand your decision-making process. Who else should be involved, and what information do they need?',
      rationale: 'Gets you aligned with their buying process',
      whenToUse: 'When dealing with team decisions',
    },
    {
      approach: 'Champion Development',
      response:
        "I appreciate you bringing this to your team. What would make you confident in recommending this? What concerns do you think they'll have?",
      rationale: 'Turns contact into an internal champion',
      whenToUse: 'When contact is supportive but needs approval',
    },
    {
      approach: 'Multi-Threaded Engagement',
      response:
        'Totally understand. Would it be helpful if I joined that conversation to answer questions directly? Or I can prepare materials to help you make the case.',
      rationale: 'Offers to engage with decision makers directly',
      whenToUse: 'When you want to influence the decision process',
    },
  ];
}

/**
 * Generate response strategies for need objections
 */
function getNeedStrategies(): ResponseStrategy[] {
  return [
    {
      approach: 'Problem Awareness',
      response:
        'I hear that things are working. Just out of curiosity, if you could improve one thing about [current situation], what would it be?',
      rationale: 'Gently surfaces latent needs',
      whenToUse: 'When customer is unaware of problems',
    },
    {
      approach: 'Future State',
      response:
        "That's good to hear. As you think about the next 6-12 months, what's on the roadmap that might benefit from [your solution]?",
      rationale: 'Shifts to future needs and opportunities',
      whenToUse: 'When current state is genuinely fine',
    },
    {
      approach: 'Industry Trends',
      response:
        "Makes sense that you're satisfied now. What we're seeing in [industry] is [trend]. How are you preparing for that?",
      rationale: 'Introduces external factors creating future need',
      whenToUse: 'When you can highlight relevant trends',
    },
  ];
}

/**
 * Generate response strategies for trust objections
 */
function getTrustStrategies(): ResponseStrategy[] {
  return [
    {
      approach: 'Social Proof',
      response:
        'I understand wanting to see proof. We work with [similar companies/industries], including [specific name if possible]. Would speaking with one of them be helpful?',
      rationale: 'Provides evidence through customer references',
      whenToUse: 'When you have relevant customer success stories',
    },
    {
      approach: 'Low-Risk Trial',
      response:
        'Fair concern. What if we started with a pilot or trial period? That way you can see the results firsthand before making a full commitment.',
      rationale: 'Reduces perceived risk through trial period',
      whenToUse: 'When you can offer trials or pilots',
    },
    {
      approach: 'Transparency',
      response:
        "I appreciate you being direct. Let me share exactly how we've helped companies like yours: [specific results]. What would you need to see to feel confident?",
      rationale: 'Builds trust through transparency and specificity',
      whenToUse: 'When you have strong, specific results to share',
    },
  ];
}

/**
 * Generate response strategies for feature objections
 */
function getFeatureStrategies(): ResponseStrategy[] {
  return [
    {
      approach: 'Feature Importance',
      response:
        'Good to know that [feature] is important to you. Help me understand - how would you use that capability? What problem does it solve?',
      rationale: 'Discovers whether feature is truly critical or nice-to-have',
      whenToUse: 'When customer mentions missing feature',
    },
    {
      approach: 'Alternative Approach',
      response:
        "We don't have [feature] in exactly that form, but we achieve the same outcome through [alternative]. Would that work for your use case?",
      rationale: 'Shows you can meet their need differently',
      whenToUse: 'When you have alternative ways to solve their problem',
    },
    {
      approach: 'Roadmap Alignment',
      response:
        "That's actually on our roadmap for [timeframe]. In the meantime, we have [current capability]. Given your timeline, could that work?",
      rationale: 'Shows feature is coming and offers interim solution',
      whenToUse: 'When feature is genuinely planned',
    },
  ];
}

/**
 * Generate follow-up questions based on category
 */
function getFollowUpQuestions(category: ObjectionCategory, _context?: DealContext): string[] {
  const questions: string[] = [];

  switch (category) {
    case 'price':
      questions.push('What budget range were you expecting?');
      questions.push('What would need to be true to justify this investment?');
      questions.push('How do you typically measure ROI on this type of solution?');
      break;
    case 'timing':
      questions.push('What else is competing for priority right now?');
      questions.push('What would make this more urgent?');
      questions.push('If timing were perfect, would this be the right solution?');
      break;
    case 'competition':
      questions.push('What do you like most about your current solution?');
      questions.push('Where does it fall short?');
      questions.push('What would make you consider switching?');
      break;
    case 'authority':
      questions.push('Who else needs to be involved in this decision?');
      questions.push('What criteria will they use to evaluate options?');
      questions.push('What concerns do you anticipate from them?');
      break;
    case 'need':
      questions.push('What would have to change for this to become a priority?');
      questions.push('How do you handle [specific problem] today?');
      questions.push('What are your goals for the next quarter/year?');
      break;
    case 'trust':
      questions.push('What would give you confidence in our solution?');
      questions.push('Have you had bad experiences with similar vendors?');
      questions.push('What success metrics matter most to you?');
      break;
    case 'feature':
      questions.push('How critical is that specific feature to your success?');
      questions.push('What would you do with that capability?');
      questions.push('Are there other capabilities that might achieve the same goal?');
      break;
    default:
      questions.push('Can you tell me more about your concern?');
      questions.push('What would an ideal solution look like?');
  }

  return questions;
}

/**
 * Get phrases to avoid based on category
 */
function getAvoidPhrases(category: ObjectionCategory): string[] {
  const avoid: string[] = [];

  switch (category) {
    case 'price':
      avoid.push("It's not that expensive");
      avoid.push('You get what you pay for');
      avoid.push('Our competitors are more expensive');
      break;
    case 'timing':
      avoid.push('You should act now');
      avoid.push('This offer expires soon');
      avoid.push("You're making a mistake waiting");
      break;
    case 'competition':
      avoid.push('They are terrible');
      avoid.push("You'll regret using them");
      avoid.push('We are better in every way');
      break;
    case 'trust':
      avoid.push('Just trust me');
      avoid.push("I'm not lying to you");
      avoid.push('Everyone loves us');
      break;
    default:
      avoid.push("That's not a real concern");
      avoid.push("You're wrong about that");
      avoid.push("That doesn't matter");
  }

  return avoid;
}

/**
 * Objection Response Tool
 * Analyzes sales objections and suggests response strategies
 */
export const objectionResponseTool = tool({
  description:
    'Analyze sales objections and suggest effective response strategies. Provide the customer objection text and optional deal context (customer name, deal value, competitor mentioned) to get classified objection category, multiple response strategies with rationales, follow-up questions, and phrases to avoid.',
  parameters: jsonSchema<ObjectionResponseInput>({
    type: 'object',
    properties: {
      objection: {
        type: 'string',
        description:
          'The customer objection or concern (e.g., "It\'s too expensive", "We need to wait")',
      },
      context: {
        type: 'object',
        description: 'Optional deal context for more tailored responses',
        properties: {
          dealValue: {
            type: 'number',
            description: 'Deal value in dollars',
          },
          dealStage: {
            type: 'string',
            description: 'Current stage of the deal (e.g., "discovery", "proposal", "negotiation")',
          },
          customerName: {
            type: 'string',
            description: 'Name of the customer/prospect',
          },
          industry: {
            type: 'string',
            description: 'Customer industry',
          },
          competitorMentioned: {
            type: 'string',
            description: 'Name of competitor mentioned (if any)',
          },
          productInterest: {
            type: 'string',
            description: 'Product or service they are interested in',
          },
        },
      },
    },
    required: ['objection'],
    additionalProperties: false,
  }),
  async execute({ objection, context }): Promise<ObjectionResponses> {
    // Validate inputs
    if (!objection || typeof objection !== 'string' || objection.trim().length === 0) {
      throw new Error('Objection text is required and must be a non-empty string');
    }

    // Classify the objection
    const classification = classifyObjection(objection);

    // Get strategies based on category
    let strategies: ResponseStrategy[] = [];
    switch (classification.category) {
      case 'price':
        strategies = getPriceStrategies(context);
        break;
      case 'timing':
        strategies = getTimingStrategies(context);
        break;
      case 'competition':
        strategies = getCompetitionStrategies(context);
        break;
      case 'authority':
        strategies = getAuthorityStrategies();
        break;
      case 'need':
        strategies = getNeedStrategies();
        break;
      case 'trust':
        strategies = getTrustStrategies();
        break;
      case 'feature':
        strategies = getFeatureStrategies();
        break;
      default:
        // Generic strategies for unclassified objections
        strategies = [
          {
            approach: 'Clarification',
            response:
              "I want to make sure I understand your concern. Can you tell me more about what's driving this?",
            rationale: 'Seeks to understand the root cause before responding',
            whenToUse: 'When objection is unclear or complex',
          },
          {
            approach: 'Empathy First',
            response:
              "I appreciate you sharing that. It sounds like [restate concern]. Is that accurate? Let's explore how we might address it.",
            rationale: 'Shows understanding before attempting to overcome',
            whenToUse: 'When building rapport is important',
          },
        ];
    }

    // Get follow-up questions
    const followUpQuestions = getFollowUpQuestions(classification.category, context);

    // Get phrases to avoid
    const avoidPhrases = getAvoidPhrases(classification.category);

    return {
      objection: objection.trim(),
      category: classification.category,
      categoryConfidence: classification.confidence,
      strategies,
      followUpQuestions,
      avoidPhrases,
      metadata: {
        analyzedAt: new Date().toISOString(),
        contextProvided: !!context,
      },
    };
  },
});

export default objectionResponseTool;
