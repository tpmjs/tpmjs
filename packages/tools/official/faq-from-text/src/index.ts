/**
 * FAQ From Text Tool for TPMJS
 * Extracts Q&A pairs from text that looks like FAQ format.
 * Detects question patterns (?, "Q:", "Question:", etc.)
 */

import { jsonSchema, tool } from 'ai';

/**
 * Individual FAQ item with category
 */
export interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

/**
 * Output interface for FAQ extraction
 */
export interface FaqResult {
  faqs: FaqItem[];
  categories: Array<{
    name: string;
    count: number;
    faqs: FaqItem[];
  }>;
  count: number;
}

type FaqFromTextInput = {
  text: string;
};

/**
 * Detects if a line looks like a question
 */
function isQuestionLine(line: string): boolean {
  const trimmed = line.trim();

  // Empty lines are not questions
  if (!trimmed) return false;

  // Ends with question mark
  if (trimmed.endsWith('?')) return true;

  // Starts with common question prefixes
  const questionPrefixes = [
    /^Q\s*[:.)]\s*/i,
    /^Question\s*[:.)]\s*/i,
    /^A\s*[:.)]\s*/i, // Sometimes answers are marked too
    /^\d+\s*[:.)\]]\s*/, // Numbered questions like "1. " or "1) "
    /^What\s+/i,
    /^Why\s+/i,
    /^How\s+/i,
    /^When\s+/i,
    /^Where\s+/i,
    /^Who\s+/i,
    /^Can\s+/i,
    /^Could\s+/i,
    /^Should\s+/i,
    /^Would\s+/i,
    /^Do\s+/i,
    /^Does\s+/i,
    /^Is\s+/i,
    /^Are\s+/i,
  ];

  return questionPrefixes.some((pattern) => pattern.test(trimmed));
}

/**
 * Removes common question prefixes from text
 */
function cleanQuestionPrefix(text: string): string {
  return text
    .replace(/^Q\s*[:.)]\s*/i, '')
    .replace(/^Question\s*[:.)]\s*/i, '')
    .replace(/^\d+\s*[:.)\]]\s*/, '')
    .trim();
}

/**
 * Removes common answer prefixes from text
 */
function cleanAnswerPrefix(text: string): string {
  return text
    .replace(/^A\s*[:.)]\s*/i, '')
    .replace(/^Answer\s*[:.)]\s*/i, '')
    .trim();
}

/**
 * Common category keywords for FAQ categorization
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Getting Started': ['start', 'begin', 'first', 'setup', 'install', 'create', 'new', 'account'],
  Pricing: ['price', 'cost', 'pay', 'billing', 'subscription', 'plan', 'free', 'trial', 'charge'],
  Account: ['account', 'profile', 'login', 'password', 'email', 'sign', 'register'],
  Technical: [
    'error',
    'bug',
    'issue',
    'problem',
    'work',
    'fix',
    'support',
    'technical',
    'api',
    'integrate',
  ],
  Features: ['feature', 'can', 'able', 'capability', 'function', 'option', 'setting'],
  Security: ['security', 'secure', 'privacy', 'data', 'encrypt', 'safe', 'protect'],
  Shipping: ['ship', 'deliver', 'order', 'track', 'return', 'refund'],
  General: [],
};

/**
 * Determines the category for a FAQ based on question and answer content
 */
function categorize(question: string, answer: string): string {
  const text = (question + ' ' + answer).toLowerCase();

  // Check each category's keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (category === 'General') continue; // Skip general, it's the fallback
    if (keywords.some((keyword) => text.includes(keyword))) {
      return category;
    }
  }

  return 'General';
}

/**
 * Groups FAQs by category
 */
function groupByCategory(faqs: FaqItem[]): Array<{ name: string; count: number; faqs: FaqItem[] }> {
  const categoryMap = new Map<string, FaqItem[]>();

  for (const faq of faqs) {
    const existing = categoryMap.get(faq.category) || [];
    existing.push(faq);
    categoryMap.set(faq.category, existing);
  }

  // Convert to array and sort by count (descending)
  return Array.from(categoryMap.entries())
    .map(([name, items]) => ({
      name,
      count: items.length,
      faqs: items,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Extracts FAQ pairs from text
 */
function extractFaqs(text: string): FaqItem[] {
  const lines = text.split('\n');
  const faqs: Array<{ question: string; answer: string }> = [];

  let currentQuestion = '';
  let currentAnswer = '';
  let isCollectingAnswer = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() ?? '';

    // Skip empty lines when not collecting
    if (!line && !isCollectingAnswer) {
      continue;
    }

    // Check if this is a new question
    if (isQuestionLine(line)) {
      // Save previous Q&A pair if exists
      if (currentQuestion && currentAnswer) {
        faqs.push({
          question: cleanQuestionPrefix(currentQuestion),
          answer: cleanAnswerPrefix(currentAnswer.trim()),
        });
      }

      // Start new question
      currentQuestion = line;
      currentAnswer = '';
      isCollectingAnswer = true;
      continue;
    }

    // If we're collecting an answer, add this line to it
    if (isCollectingAnswer && line) {
      currentAnswer += (currentAnswer ? ' ' : '') + line;
    }

    // Empty line might signal end of answer
    if (!line && isCollectingAnswer) {
      // Look ahead - if next line is a question, we're done with this answer
      const nextNonEmptyIndex = lines.slice(i + 1).findIndex((l) => l.trim());
      if (nextNonEmptyIndex !== -1) {
        const nextLine = lines[i + 1 + nextNonEmptyIndex];
        if (nextLine && isQuestionLine(nextLine)) {
          // This answer is complete
          isCollectingAnswer = true; // Keep collecting until we hit the next question
        }
      }
    }
  }

  // Don't forget the last Q&A pair
  if (currentQuestion && currentAnswer) {
    faqs.push({
      question: cleanQuestionPrefix(currentQuestion),
      answer: cleanAnswerPrefix(currentAnswer.trim()),
    });
  }

  // Filter out invalid pairs (questions without answers or vice versa)
  const validFaqs = faqs.filter(
    (faq) => faq.question.length > 3 && faq.answer.length > 3 && faq.question !== faq.answer
  );

  // Add category to each FAQ
  return validFaqs.map((faq) => ({
    ...faq,
    category: categorize(faq.question, faq.answer),
  }));
}

/**
 * FAQ From Text Tool
 * Extracts Q&A pairs from text that looks like FAQ format
 */
export const faqFromTextTool = tool({
  description:
    'Extract Q&A pairs from text that looks like FAQ format. Detects question patterns (?, "Q:", "Question:", numbered questions, etc.) and pairs them with their answers. Automatically categorizes FAQs by topic (Pricing, Account, Technical, Features, etc.) and groups them. Returns FAQs with category information.',
  inputSchema: jsonSchema<FaqFromTextInput>({
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'Text containing FAQ-style content with questions and answers',
      },
    },
    required: ['text'],
    additionalProperties: false,
  }),
  async execute({ text }): Promise<FaqResult> {
    // Validate input
    if (!text || typeof text !== 'string') {
      throw new Error('Text is required and must be a string');
    }

    if (text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    // Extract FAQs with categorization
    const faqs = extractFaqs(text);

    // Group by category
    const categories = groupByCategory(faqs);

    return {
      faqs,
      categories,
      count: faqs.length,
    };
  },
});

export default faqFromTextTool;
