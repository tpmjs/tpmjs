/**
 * Interview Questions Tool for TPMJS
 * Generates behavioral and technical interview questions for specific roles
 */

import { jsonSchema, tool } from 'ai';

/**
 * Single interview question with guidance
 */
export interface InterviewQuestion {
  question: string;
  category: 'behavioral' | 'technical' | 'situational' | 'cultural-fit';
  followUp?: string[];
  evaluationCriteria?: string[];
}

/**
 * Categorized interview questions output
 */
export interface InterviewQuestions {
  role: string;
  level: string;
  behavioral: InterviewQuestion[];
  technical: InterviewQuestion[];
  situational: InterviewQuestion[];
  culturalFit: InterviewQuestion[];
  totalQuestions: number;
}

type InterviewQuestionsInput = {
  role: string;
  skills: string[];
  level?: string;
};

/**
 * Validates that skills array is valid
 */
function validateSkills(skills: unknown): void {
  if (!Array.isArray(skills)) {
    throw new Error('Skills must be an array');
  }
  if (skills.length === 0) {
    throw new Error('Skills array must contain at least one skill');
  }
  if (skills.length > 20) {
    throw new Error('Skills array cannot contain more than 20 skills');
  }
  if (skills.some((skill) => typeof skill !== 'string' || skill.trim().length === 0)) {
    throw new Error('All skills must be non-empty strings');
  }
}

/**
 * Normalizes level to standard values
 */
function normalizeLevel(level?: string): string {
  if (!level) return 'mid-level';

  const normalized = level.toLowerCase().trim();

  if (normalized.includes('junior') || normalized.includes('entry')) return 'junior';
  if (normalized.includes('senior') || normalized.includes('lead')) return 'senior';
  if (normalized.includes('staff') || normalized.includes('principal')) return 'staff';
  if (normalized.includes('exec') || normalized.includes('director')) return 'executive';

  return 'mid-level';
}

/**
 * Generates behavioral questions using STAR format
 */
function generateBehavioralQuestions(_role: string, level: string): InterviewQuestion[] {
  const questions: InterviewQuestion[] = [];

  // Leadership/teamwork questions
  if (level === 'senior' || level === 'staff' || level === 'executive') {
    questions.push({
      question:
        'Tell me about a time when you had to lead a team through a challenging project. How did you approach it?',
      category: 'behavioral',
      followUp: [
        'What was your specific role?',
        'How did you handle conflicts?',
        'What was the outcome?',
      ],
      evaluationCriteria: ['Leadership skills', 'Conflict resolution', 'Results orientation'],
    });
  }

  // Problem-solving
  questions.push({
    question:
      'Describe a situation where you faced a significant obstacle in your work. How did you overcome it?',
    category: 'behavioral',
    followUp: [
      'What was your thought process?',
      'What resources did you leverage?',
      'What would you do differently?',
    ],
    evaluationCriteria: ['Problem-solving approach', 'Resourcefulness', 'Learning mindset'],
  });

  // Collaboration
  questions.push({
    question:
      'Share an example of when you had to work with a difficult stakeholder or team member. How did you handle it?',
    category: 'behavioral',
    followUp: [
      'How did you build rapport?',
      'What communication strategies did you use?',
      'What was the final outcome?',
    ],
    evaluationCriteria: ['Interpersonal skills', 'Emotional intelligence', 'Conflict management'],
  });

  // Initiative and ownership
  questions.push({
    question:
      'Tell me about a time when you took initiative on a project without being asked. What motivated you?',
    category: 'behavioral',
    followUp: ['What impact did it have?', 'How did others respond?', 'What did you learn?'],
    evaluationCriteria: ['Proactiveness', 'Ownership mentality', 'Impact awareness'],
  });

  return questions;
}

/**
 * Generates technical questions based on skills
 */
function generateTechnicalQuestions(
  skills: string[],
  role: string,
  level: string
): InterviewQuestion[] {
  const questions: InterviewQuestion[] = [];

  // Generate skill-specific questions
  for (let i = 0; i < Math.min(skills.length, 3); i++) {
    const skill = skills[i];

    questions.push({
      question: `Explain your experience with ${skill}. How have you applied it in real-world projects?`,
      category: 'technical',
      followUp: [
        `What challenges did you face with ${skill}?`,
        `How do you stay current with ${skill} best practices?`,
        `Can you compare ${skill} with alternative approaches?`,
      ],
      evaluationCriteria: [
        `Depth of ${skill} knowledge`,
        'Practical application experience',
        'Understanding of tradeoffs',
      ],
    });
  }

  // System design (for senior+ roles)
  if (level === 'senior' || level === 'staff' || level === 'executive') {
    questions.push({
      question:
        'Walk me through how you would design a system to handle [relevant use case for role]. Consider scalability and reliability.',
      category: 'technical',
      followUp: [
        'How would you handle failure scenarios?',
        'What are the key bottlenecks?',
        'How would you monitor this system?',
      ],
      evaluationCriteria: [
        'System design skills',
        'Scalability understanding',
        'Production awareness',
      ],
    });
  }

  // Problem-solving technical question
  questions.push({
    question: `Describe a technical problem you solved that was particularly challenging in the context of ${role}. What was your approach?`,
    category: 'technical',
    followUp: [
      'What alternatives did you consider?',
      'How did you validate your solution?',
      'What would you improve with hindsight?',
    ],
    evaluationCriteria: [
      'Technical problem-solving',
      'Decision-making process',
      'Self-reflection ability',
    ],
  });

  return questions;
}

/**
 * Generates situational questions
 */
function generateSituationalQuestions(_role: string, _level: string): InterviewQuestion[] {
  const questions: InterviewQuestion[] = [];

  // Deadline pressure
  questions.push({
    question:
      'How would you handle a situation where you have multiple high-priority tasks with competing deadlines?',
    category: 'situational',
    followUp: [
      'How do you prioritize?',
      'How do you communicate with stakeholders?',
      'What would you delegate?',
    ],
    evaluationCriteria: ['Prioritization skills', 'Stakeholder management', 'Time management'],
  });

  // Technical disagreement
  questions.push({
    question:
      'Imagine you disagree with a technical decision made by your team. How would you approach this?',
    category: 'situational',
    followUp: [
      'How do you build your case?',
      'What if the team still disagrees?',
      'How do you ensure team cohesion?',
    ],
    evaluationCriteria: ['Communication skills', 'Collaboration ability', 'Professional maturity'],
  });

  return questions;
}

/**
 * Generates cultural fit questions
 */
function generateCulturalFitQuestions(): InterviewQuestion[] {
  return [
    {
      question: 'What type of work environment do you thrive in?',
      category: 'cultural-fit',
      followUp: [
        'What factors are most important to you?',
        'How do you prefer to collaborate?',
        'What kind of management style works best for you?',
      ],
      evaluationCriteria: ['Self-awareness', 'Cultural alignment', 'Communication style'],
    },
    {
      question: 'How do you approach learning and professional development?',
      category: 'cultural-fit',
      followUp: [
        'What have you learned recently?',
        'How do you stay current in your field?',
        'What are your growth goals?',
      ],
      evaluationCriteria: ['Growth mindset', 'Curiosity', 'Self-motivation'],
    },
  ];
}

/**
 * Checks if question contains legally problematic content
 */
function isLegallyCompliant(question: string): boolean {
  // Domain rule: interview_compliance - Questions must avoid protected characteristics per employment law
  const problematicPatterns = [
    /\b(age|how old|birth year)\b/i,
    /\b(marital status|married|spouse|children|pregnant|family planning)\b/i,
    /\b(religion|religious|church|faith)\b/i,
    /\b(race|ethnicity|nationality|origin|accent)\b/i,
    /\b(disability|health condition|medical)\b/i,
    /\b(sexual orientation|gender identity)\b/i,
  ];

  return !problematicPatterns.some((pattern) => pattern.test(question));
}

/**
 * Interview Questions Tool
 * Generates categorized interview questions for hiring
 */
export const interviewQuestionsTool = tool({
  description:
    'Generates behavioral (STAR format) and technical interview questions for specific roles. Ensures legal compliance by avoiding protected characteristic questions.',
  inputSchema: jsonSchema<InterviewQuestionsInput>({
    type: 'object',
    properties: {
      role: {
        type: 'string',
        description: 'Role being interviewed for (e.g., "Software Engineer", "Product Manager")',
      },
      skills: {
        type: 'array',
        description: 'Key skills to assess in the interview',
        items: { type: 'string' },
      },
      level: {
        type: 'string',
        description: 'Seniority level (junior, mid-level, senior, staff, executive)',
      },
    },
    required: ['role', 'skills'],
    additionalProperties: false,
  }),
  async execute({ role, skills, level }): Promise<InterviewQuestions> {
    // Validate role
    if (!role || typeof role !== 'string' || role.trim().length === 0) {
      throw new Error('Role is required and must be a non-empty string');
    }

    // Validate skills
    validateSkills(skills);

    // Normalize level
    const normalizedLevel = normalizeLevel(level);

    // Generate questions by category
    const behavioral = generateBehavioralQuestions(role, normalizedLevel);
    const technical = generateTechnicalQuestions(skills, role, normalizedLevel);
    const situational = generateSituationalQuestions(role, normalizedLevel);
    const culturalFit = generateCulturalFitQuestions();

    // Combine all questions and verify legal compliance
    const allQuestions = [...behavioral, ...technical, ...situational, ...culturalFit];

    for (const q of allQuestions) {
      if (!isLegallyCompliant(q.question)) {
        throw new Error(
          `Generated question contains potentially problematic content: ${q.question}`
        );
      }
    }

    return {
      role,
      level: normalizedLevel,
      behavioral,
      technical,
      situational,
      culturalFit,
      totalQuestions: allQuestions.length,
    };
  },
});

export default interviewQuestionsTool;
