/**
 * FAQ From Text Tool for TPMJS
 * Extracts Q&A pairs from text that looks like FAQ format.
 * Detects question patterns (?, "Q:", "Question:", etc.)
 */

import { jsonSchema, tool } from 'ai';

/**
 * Output interface for FAQ extraction
 */
export interface FaqResult {
  faqs: Array<{
    question: string;
    answer: string;
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
 * Extracts FAQ pairs from text
 */
function extractFaqs(text: string): Array<{ question: string; answer: string }> {
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
  return faqs.filter(
    (faq) => faq.question.length > 3 && faq.answer.length > 3 && faq.question !== faq.answer
  );
}

/**
 * FAQ From Text Tool
 * Extracts Q&A pairs from text that looks like FAQ format
 */
export const faqFromTextTool = tool({
  description:
    'Extract Q&A pairs from text that looks like FAQ format. Detects question patterns (?, "Q:", "Question:", numbered questions, etc.) and pairs them with their answers. Returns an array of FAQ objects with question and answer fields.',
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

    // Extract FAQs
    const faqs = extractFaqs(text);

    return {
      faqs,
      count: faqs.length,
    };
  },
});

export default faqFromTextTool;
