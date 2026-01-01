/**
 * Audience Persona Tool for TPMJS
 * Creates detailed audience persona profiles from demographic and behavioral data
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 * Uses jsonSchema() to avoid Zod 4 JSON Schema conversion issues with OpenAI
 */

import { jsonSchema, tool } from 'ai';

export interface AudiencePersona {
  name: string;
  demographics: {
    ageRange: string;
    gender?: string;
    location?: string;
    education?: string;
    occupation?: string;
    income?: string;
  };
  psychographics: {
    interests: string[];
    values: string[];
    lifestyle?: string;
    personality?: string;
  };
  goals: string[];
  painPoints: string[];
  behaviors: {
    preferredChannels: string[];
    buyingPatterns?: string;
    contentPreferences: string[];
    deviceUsage?: string[];
  };
  marketingImplications: {
    messagingStrategy: string;
    contentRecommendations: string[];
    channelStrategy: string;
    keyTriggers: string[];
  };
  quote?: string;
}

/**
 * Input type for Audience Persona Tool
 */
type AudiencePersonaInput = {
  data: Record<string, unknown>;
  productContext: string;
};

/**
 * Extract demographics from raw data
 */
function extractDemographics(data: Record<string, unknown>): AudiencePersona['demographics'] {
  const demographics: AudiencePersona['demographics'] = {
    ageRange: 'Not specified',
  };

  // Domain rule: demographic_segmentation - Age ranges grouped into standard marketing cohorts
  // Extract age range
  if (data.age) {
    const age = Number(data.age);
    if (!isNaN(age)) {
      if (age < 18) demographics.ageRange = 'Under 18';
      else if (age < 25) demographics.ageRange = '18-24';
      else if (age < 35) demographics.ageRange = '25-34';
      else if (age < 45) demographics.ageRange = '35-44';
      else if (age < 55) demographics.ageRange = '45-54';
      else if (age < 65) demographics.ageRange = '55-64';
      else demographics.ageRange = '65+';
    }
  } else if (data.ageRange) {
    demographics.ageRange = String(data.ageRange);
  }

  // Extract other demographic fields
  if (data.gender) demographics.gender = String(data.gender);
  if (data.location) demographics.location = String(data.location);
  if (data.education) demographics.education = String(data.education);
  if (data.occupation) demographics.occupation = String(data.occupation);
  if (data.income) demographics.income = String(data.income);

  return demographics;
}

/**
 * Extract psychographics from raw data
 */
function extractPsychographics(data: Record<string, unknown>): AudiencePersona['psychographics'] {
  const psychographics: AudiencePersona['psychographics'] = {
    interests: [],
    values: [],
  };

  // Extract interests
  if (Array.isArray(data.interests)) {
    psychographics.interests = data.interests.map(String);
  } else if (typeof data.interests === 'string') {
    psychographics.interests = data.interests.split(',').map((s) => s.trim());
  }

  // Extract values
  if (Array.isArray(data.values)) {
    psychographics.values = data.values.map(String);
  } else if (typeof data.values === 'string') {
    psychographics.values = data.values.split(',').map((s) => s.trim());
  }

  // Extract lifestyle and personality
  if (data.lifestyle) psychographics.lifestyle = String(data.lifestyle);
  if (data.personality) psychographics.personality = String(data.personality);

  return psychographics;
}

/**
 * Extract goals from raw data
 */
function extractGoals(data: Record<string, unknown>): string[] {
  if (Array.isArray(data.goals)) {
    return data.goals.map(String);
  } else if (typeof data.goals === 'string') {
    return data.goals
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Extract pain points from raw data
 */
function extractPainPoints(data: Record<string, unknown>): string[] {
  if (Array.isArray(data.painPoints)) {
    return data.painPoints.map(String);
  } else if (typeof data.painPoints === 'string') {
    return data.painPoints
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Extract behaviors from raw data
 */
function extractBehaviors(data: Record<string, unknown>): AudiencePersona['behaviors'] {
  const behaviors: AudiencePersona['behaviors'] = {
    preferredChannels: [],
    contentPreferences: [],
  };

  // Extract preferred channels
  if (Array.isArray(data.preferredChannels)) {
    behaviors.preferredChannels = data.preferredChannels.map(String);
  } else if (typeof data.preferredChannels === 'string') {
    behaviors.preferredChannels = data.preferredChannels.split(',').map((s) => s.trim());
  }

  // Extract content preferences
  if (Array.isArray(data.contentPreferences)) {
    behaviors.contentPreferences = data.contentPreferences.map(String);
  } else if (typeof data.contentPreferences === 'string') {
    behaviors.contentPreferences = data.contentPreferences.split(',').map((s) => s.trim());
  }

  // Extract buying patterns
  if (data.buyingPatterns) {
    behaviors.buyingPatterns = String(data.buyingPatterns);
  }

  // Extract device usage
  if (Array.isArray(data.deviceUsage)) {
    behaviors.deviceUsage = data.deviceUsage.map(String);
  } else if (typeof data.deviceUsage === 'string') {
    behaviors.deviceUsage = data.deviceUsage.split(',').map((s) => s.trim());
  }

  return behaviors;
}

/**
 * Generate persona name based on demographics and context
 */
function generatePersonaName(
  demographics: AudiencePersona['demographics'],
  _productContext: string
): string {
  const occupation = demographics.occupation || 'Professional';

  // Generate alliterative name for memorability
  const firstNames = ['Alex', 'Beth', 'Chris', 'Dana', 'Emma', 'Frank', 'Grace', 'Henry'];
  const lastNames = ['Anderson', 'Baker', 'Chen', 'Davis', 'Evans', 'Foster', 'Garcia', 'Harris'];

  const firstInitial = occupation.charAt(0).toUpperCase();
  const firstName = firstNames.find((n) => n.startsWith(firstInitial)) || firstNames[0];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return `${firstName} ${lastName}`;
}

/**
 * Generate marketing implications from persona data
 */
function generateMarketingImplications(
  demographics: AudiencePersona['demographics'],
  psychographics: AudiencePersona['psychographics'],
  goals: string[],
  painPoints: string[],
  behaviors: AudiencePersona['behaviors'],
  _productContext: string
): AudiencePersona['marketingImplications'] {
  // Messaging strategy
  let messagingStrategy = 'Focus on ';
  if (painPoints.length > 0) {
    messagingStrategy += `addressing ${painPoints[0]?.toLowerCase() ?? 'key challenges'}`;
  } else if (goals.length > 0) {
    messagingStrategy += `helping achieve ${goals[0]?.toLowerCase() ?? 'objectives'}`;
  } else {
    messagingStrategy += 'product benefits and value proposition';
  }

  // Content recommendations
  const contentRecommendations: string[] = [];

  if (behaviors.contentPreferences.length > 0) {
    behaviors.contentPreferences.forEach((pref) => {
      contentRecommendations.push(`Create ${pref.toLowerCase()} content`);
    });
  } else {
    contentRecommendations.push('Create educational content about product benefits');
    contentRecommendations.push('Share customer success stories');
    contentRecommendations.push('Provide how-to guides and tutorials');
  }

  // Add age-specific recommendations
  const ageNum = Number.parseInt(demographics.ageRange.split('-')[0] || '0');
  if (ageNum < 35) {
    contentRecommendations.push('Use short-form video content (TikTok, Reels)');
  } else if (ageNum >= 35 && ageNum < 55) {
    contentRecommendations.push('Mix video and written content');
  } else {
    contentRecommendations.push('Provide detailed written guides');
  }

  // Channel strategy
  let channelStrategy = 'Prioritize ';
  if (behaviors.preferredChannels.length > 0) {
    channelStrategy += behaviors.preferredChannels.slice(0, 2).join(' and ');
  } else {
    channelStrategy += 'email and social media';
  }

  // Key triggers
  const keyTriggers: string[] = [];

  if (psychographics.values.length > 0) {
    keyTriggers.push(`Values: ${psychographics.values.slice(0, 2).join(', ')}`);
  }

  if (painPoints.length > 0 && painPoints[0]) {
    keyTriggers.push(`Pain point: ${painPoints[0]}`);
  }

  if (goals.length > 0 && goals[0]) {
    keyTriggers.push(`Goal: ${goals[0]}`);
  }

  if (keyTriggers.length === 0) {
    keyTriggers.push('Product benefits and features');
    keyTriggers.push('Social proof and testimonials');
  }

  return {
    messagingStrategy,
    contentRecommendations,
    channelStrategy,
    keyTriggers,
  };
}

/**
 * Generate a representative quote for the persona
 */
function generateQuote(goals: string[], painPoints: string[], _productContext: string): string {
  if (painPoints.length > 0 && goals.length > 0 && painPoints[0] && goals[0]) {
    return `"I struggle with ${painPoints[0].toLowerCase()}, and I need a solution that helps me ${goals[0].toLowerCase()}."`;
  } else if (painPoints.length > 0 && painPoints[0]) {
    return `"My biggest challenge is ${painPoints[0].toLowerCase()}."`;
  } else if (goals.length > 0 && goals[0]) {
    return `"I want to ${goals[0].toLowerCase()}."`;
  } else {
    return `"I'm looking for a solution that makes my life easier."`;
  }
}

/**
 * Audience Persona Tool
 * Creates detailed audience persona profiles from demographic and behavioral data
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 */
export const audiencePersonaTool = tool({
  description:
    'Creates detailed audience persona profiles from demographic and behavioral data. Generates personas with demographics, psychographics, goals, pain points, behaviors, and actionable marketing implications.',
  inputSchema: jsonSchema<AudiencePersonaInput>({
    type: 'object',
    properties: {
      data: {
        type: 'object',
        description:
          'Audience data points (age/ageRange, gender, location, education, occupation, income, interests, values, lifestyle, personality, goals, painPoints, preferredChannels, contentPreferences, buyingPatterns, deviceUsage)',
        additionalProperties: true,
      },
      productContext: {
        type: 'string',
        description: 'Product or service context for persona development',
      },
    },
    required: ['data', 'productContext'],
    additionalProperties: false,
  }),
  async execute({ data, productContext }) {
    // Validate required fields
    if (!data || typeof data !== 'object') {
      throw new Error('Data must be a non-empty object');
    }

    if (!productContext || productContext.trim().length === 0) {
      throw new Error('Product context is required');
    }

    // Extract persona components
    const demographics = extractDemographics(data);
    const psychographics = extractPsychographics(data);
    const goals = extractGoals(data);
    const painPoints = extractPainPoints(data);
    const behaviors = extractBehaviors(data);

    // Generate persona name
    const name = generatePersonaName(demographics, productContext);

    // Generate marketing implications
    const marketingImplications = generateMarketingImplications(
      demographics,
      psychographics,
      goals,
      painPoints,
      behaviors,
      productContext
    );

    // Generate representative quote
    const quote = generateQuote(goals, painPoints, productContext);

    return {
      name,
      demographics,
      psychographics,
      goals,
      painPoints,
      behaviors,
      marketingImplications,
      quote,
    };
  },
});

/**
 * Export default for convenience
 */
export default audiencePersonaTool;
