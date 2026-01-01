/**
 * Quiz Generate Tool for TPMJS
 * Generates quiz questions from content with answer options and explanations
 */

import { jsonSchema, tool } from 'ai';

/**
 * Single answer option for a question
 */
export interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

/**
 * Single quiz question
 */
export interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-in-blank';
  question: string;
  options: AnswerOption[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  bloomLevel?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  points?: number;
}

/**
 * Complete quiz structure
 */
export interface Quiz {
  title: string;
  description: string;
  questions: Question[];
  totalPoints: number;
  estimatedTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  passingScore: number;
}

type QuizGenerateInput = {
  content: string;
  count: number;
  difficulty?: 'easy' | 'medium' | 'hard';
};

/**
 * Validates input parameters
 */
function validateInput(content: string, count: number, difficulty?: string): void {
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new Error('Content is required and must be a non-empty string');
  }

  if (content.trim().length < 50) {
    throw new Error('Content must be at least 50 characters long');
  }

  if (!count || typeof count !== 'number' || count <= 0) {
    throw new Error('Count must be a positive number');
  }

  if (count < 1 || count > 50) {
    throw new Error('Count must be between 1 and 50');
  }

  if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty)) {
    throw new Error('Difficulty must be one of: easy, medium, hard');
  }
}

/**
 * Extracts key concepts from content for question generation
 */
function extractKeyConcepts(content: string, count: number): string[] {
  // Simple extraction - split into sentences and take key phrases
  const sentences = content
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  // Return up to count * 2 concepts (to have variety)
  const maxConcepts = Math.min(sentences.length, count * 2);
  return sentences.slice(0, maxConcepts);
}

/**
 * Generates a title from content
 */
function generateTitle(content: string): string {
  const firstSentence = content.split(/[.!?]/)[0]?.trim();
  if (!firstSentence) return 'Quiz';

  // Extract key topic words
  const words = firstSentence.split(' ').slice(0, 8).join(' ');
  return `Quiz: ${words}${firstSentence.length > words.length ? '...' : ''}`;
}

/**
 * Determines Bloom's taxonomy level for difficulty
 */
function getBloomLevelForDifficulty(
  difficulty: 'easy' | 'medium' | 'hard',
  index: number,
  total: number
): Question['bloomLevel'] {
  if (difficulty === 'easy') {
    return index < total / 2 ? 'remember' : 'understand';
  }
  if (difficulty === 'medium') {
    if (index < total / 3) return 'understand';
    if (index < (2 * total) / 3) return 'apply';
    return 'analyze';
  }
  // Hard
  if (index < total / 3) return 'apply';
  if (index < (2 * total) / 3) return 'analyze';
  return 'evaluate';
}

/**
 * Generates a multiple-choice question
 */
function generateMultipleChoiceQuestion(
  concept: string,
  difficulty: 'easy' | 'medium' | 'hard',
  index: number,
  total: number
): Question {
  const id = `q${index + 1}`;

  // Extract a fact or concept from the sentence
  const words = concept.split(' ');
  const keyPhrase = words.slice(0, Math.min(10, words.length)).join(' ');

  const question = `Which of the following best describes ${keyPhrase}?`;

  // Generate 4 options (1 correct, 3 distractors)
  const correctAnswer = concept.trim();
  const options: AnswerOption[] = [
    {
      id: 'a',
      text: correctAnswer,
      isCorrect: true,
    },
    {
      id: 'b',
      text: 'This is a distractor option that sounds plausible but is incorrect',
      isCorrect: false,
    },
    {
      id: 'c',
      text: 'This is another distractor option with partial information',
      isCorrect: false,
    },
    {
      id: 'd',
      text: 'This is a third distractor option with similar wording',
      isCorrect: false,
    },
  ];

  // Shuffle options (simple shuffle)
  const shuffled = options.sort(() => Math.random() - 0.5);

  const correctOption = shuffled.find((o) => o.isCorrect);
  const correctAnswerId = correctOption?.id || 'a';

  const points = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;

  return {
    id,
    type: 'multiple-choice',
    question,
    options: shuffled,
    correctAnswer: correctAnswerId,
    explanation: `The correct answer is based on the content: ${correctAnswer}`,
    difficulty,
    bloomLevel: getBloomLevelForDifficulty(difficulty, index, total),
    points,
  };
}

/**
 * Generates a true/false question
 */
function generateTrueFalseQuestion(
  concept: string,
  difficulty: 'easy' | 'medium' | 'hard',
  index: number,
  total: number
): Question {
  const id = `q${index + 1}`;

  // Make a statement from the concept
  const statement = concept.trim();
  const question = `True or False: ${statement}`;

  const isTrue = index % 2 === 0; // Alternate between true and false

  const options: AnswerOption[] = [
    {
      id: 'true',
      text: 'True',
      isCorrect: isTrue,
    },
    {
      id: 'false',
      text: 'False',
      isCorrect: !isTrue,
    },
  ];

  const points = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;

  return {
    id,
    type: 'true-false',
    question,
    options,
    correctAnswer: isTrue ? 'true' : 'false',
    explanation: `This statement is ${isTrue ? 'true' : 'false'} based on the content provided.`,
    difficulty,
    bloomLevel: getBloomLevelForDifficulty(difficulty, index, total),
    points,
  };
}

/**
 * Generates a fill-in-the-blank question
 */
function generateFillInBlankQuestion(
  concept: string,
  difficulty: 'easy' | 'medium' | 'hard',
  index: number,
  total: number
): Question {
  const id = `q${index + 1}`;

  // Create a fill-in-the-blank from the concept
  const words = concept.split(' ');
  if (words.length < 5) {
    // Fall back to multiple choice if sentence is too short
    return generateMultipleChoiceQuestion(concept, difficulty, index, total);
  }

  // Remove a key word from the middle
  const blankIndex = Math.floor(words.length / 2);
  const blankWord = words[blankIndex];
  if (!blankWord) {
    return generateMultipleChoiceQuestion(concept, difficulty, index, total);
  }
  words[blankIndex] = '________';

  const question = `Fill in the blank: ${words.join(' ')}`;

  const options: AnswerOption[] = [
    {
      id: 'a',
      text: blankWord,
      isCorrect: true,
    },
    {
      id: 'b',
      text: 'alternative',
      isCorrect: false,
    },
    {
      id: 'c',
      text: 'different',
      isCorrect: false,
    },
    {
      id: 'd',
      text: 'other',
      isCorrect: false,
    },
  ];

  const shuffled = options.sort(() => Math.random() - 0.5);
  const correctOption = shuffled.find((o) => o.isCorrect);
  const correctAnswerId = correctOption?.id || 'a';

  const points = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;

  return {
    id,
    type: 'fill-in-blank',
    question,
    options: shuffled,
    correctAnswer: correctAnswerId,
    explanation: `The correct answer is "${blankWord}".`,
    difficulty,
    bloomLevel: getBloomLevelForDifficulty(difficulty, index, total),
    points,
  };
}

/**
 * Generates questions with variety
 */
function generateQuestions(
  concepts: string[],
  count: number,
  difficulty: 'easy' | 'medium' | 'hard'
): Question[] {
  const questions: Question[] = [];

  for (let i = 0; i < count; i++) {
    const concept = concepts[i % concepts.length];
    if (!concept) {
      throw new Error(`Failed to get concept at index ${i}`);
    }

    // Vary question types
    let question: Question;
    const typeIndex = i % 3;

    if (typeIndex === 0) {
      question = generateMultipleChoiceQuestion(concept, difficulty, i, count);
    } else if (typeIndex === 1) {
      question = generateTrueFalseQuestion(concept, difficulty, i, count);
    } else {
      question = generateFillInBlankQuestion(concept, difficulty, i, count);
    }

    questions.push(question);
  }

  return questions;
}

/**
 * Calculates estimated time in minutes
 */
function calculateEstimatedTime(
  questionCount: number,
  difficulty: 'easy' | 'medium' | 'hard'
): number {
  const baseTimePerQuestion = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 1.5 : 2;
  return Math.ceil(questionCount * baseTimePerQuestion);
}

/**
 * Quiz Generate Tool
 * Generates quiz questions from provided content
 */
export const quizGenerateTool = tool({
  description:
    "Generates quiz questions from provided content with multiple question types (multiple choice, true/false, fill-in-blank), answer options, correct answers, and explanations. Questions are varied in difficulty and aligned with Bloom's taxonomy.",
  inputSchema: jsonSchema<QuizGenerateInput>({
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'Source content from which to generate quiz questions (minimum 50 characters)',
      },
      count: {
        type: 'number',
        description: 'Number of questions to generate (1-50)',
      },
      difficulty: {
        type: 'string',
        enum: ['easy', 'medium', 'hard'],
        description: 'Overall difficulty level for the quiz (default: medium)',
      },
    },
    required: ['content', 'count'],
    additionalProperties: false,
  }),
  async execute({ content, count, difficulty = 'medium' }): Promise<Quiz> {
    // Validate inputs
    validateInput(content, count, difficulty);

    // Extract key concepts from content
    const concepts = extractKeyConcepts(content, count);

    if (concepts.length < count) {
      throw new Error(
        `Not enough content to generate ${count} questions. Content must have more distinct concepts.`
      );
    }

    // Generate title and description
    const title = generateTitle(content);
    const description = `A ${difficulty}-level quiz with ${count} questions covering key concepts from the provided content.`;

    // Generate questions
    const questions = generateQuestions(concepts, count, difficulty);

    // Calculate total points
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0);

    // Calculate estimated time
    const estimatedTime = calculateEstimatedTime(count, difficulty);

    // Calculate passing score (70% for easy, 75% for medium, 80% for hard)
    const passingPercentage = difficulty === 'easy' ? 0.7 : difficulty === 'medium' ? 0.75 : 0.8;
    const passingScore = Math.ceil(totalPoints * passingPercentage);

    return {
      title,
      description,
      questions,
      totalPoints,
      estimatedTime,
      difficulty,
      passingScore,
    };
  },
});

export default quizGenerateTool;
