/**
 * Lesson Plan Outline Tool for TPMJS
 * Generates lesson plan outlines with objectives, activities, and assessments
 */

import { jsonSchema, tool } from 'ai';

/**
 * Learning objective following Bloom's taxonomy
 */
export interface LearningObjective {
  objective: string;
  bloomLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
}

/**
 * Material or resource needed for the lesson
 */
export interface Material {
  item: string;
  quantity?: string;
  optional?: boolean;
}

/**
 * Activity section with timing
 */
export interface Activity {
  name: string;
  duration: number;
  description: string;
  instructionalStrategy: string;
  studentGrouping: 'individual' | 'pairs' | 'small-group' | 'whole-class';
}

/**
 * Assessment method
 */
export interface Assessment {
  type: 'formative' | 'summative';
  method: string;
  description: string;
  successCriteria: string[];
}

/**
 * Complete lesson plan structure
 * Domain rule compliance: Includes objectives, materials, activities, assessment as required
 */
export interface LessonPlan {
  topic: string;
  gradeLevel: string;
  duration: number;
  objectives: LearningObjective[];
  materials: Material[]; // Explicit materials section (domain rule: plan_structure)
  activities: Activity[];
  assessment: Assessment[];
  differentiation: string[];
  extensions: string[];
  homework?: string;
  standards?: string[];
}

type LessonPlanOutlineInput = {
  topic: string;
  duration: number;
  gradeLevel: string;
};

/**
 * Validates input parameters
 */
function validateInput(topic: string, duration: number, gradeLevel: string): void {
  if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
    throw new Error('Topic is required and must be a non-empty string');
  }

  if (!duration || typeof duration !== 'number' || duration <= 0) {
    throw new Error('Duration must be a positive number');
  }

  if (duration < 15 || duration > 240) {
    throw new Error('Duration must be between 15 and 240 minutes');
  }

  if (!gradeLevel || typeof gradeLevel !== 'string' || gradeLevel.trim().length === 0) {
    throw new Error('Grade level is required and must be a non-empty string');
  }
}

/**
 * Determines appropriate Bloom's taxonomy levels for grade
 */
function getBloomLevelsForGrade(gradeLevel: string): LearningObjective['bloomLevel'][] {
  const lower = gradeLevel.toLowerCase();

  if (lower.includes('k') || lower.includes('1') || lower.includes('2')) {
    return ['remember', 'understand', 'apply'];
  }
  if (lower.includes('3') || lower.includes('4') || lower.includes('5')) {
    return ['understand', 'apply', 'analyze'];
  }
  if (lower.includes('6') || lower.includes('7') || lower.includes('8')) {
    return ['apply', 'analyze', 'evaluate'];
  }
  // High school (9-12) or college
  return ['analyze', 'evaluate', 'create'];
}

/**
 * Generates learning objectives
 */
function generateObjectives(topic: string, gradeLevel: string): LearningObjective[] {
  const bloomLevels = getBloomLevelsForGrade(gradeLevel);
  const objectives: LearningObjective[] = [];

  // Generate 3-4 objectives at appropriate Bloom levels
  const level0 = bloomLevels[0];
  const level1 = bloomLevels[1];
  const level2 = bloomLevels[2];

  if (!level0 || !level1 || !level2) {
    throw new Error('Failed to determine Bloom taxonomy levels for grade level');
  }

  objectives.push({
    objective: `Students will be able to identify key concepts related to ${topic}`,
    bloomLevel: level0,
  });

  objectives.push({
    objective: `Students will be able to explain the significance of ${topic}`,
    bloomLevel: level1,
  });

  objectives.push({
    objective: `Students will be able to apply their understanding of ${topic} to real-world scenarios`,
    bloomLevel: level2,
  });

  return objectives;
}

/**
 * Generates materials list
 */
function generateMaterials(topic: string, _gradeLevel: string): Material[] {
  const materials: Material[] = [
    { item: 'Whiteboard and markers', quantity: '1 set' },
    { item: 'Student notebooks or paper', quantity: '1 per student' },
    { item: 'Pencils/pens', quantity: '1 per student' },
  ];

  // Add topic-specific materials
  if (topic.toLowerCase().includes('science') || topic.toLowerCase().includes('experiment')) {
    materials.push({ item: 'Lab equipment (as needed)', optional: true });
  }

  if (topic.toLowerCase().includes('read') || topic.toLowerCase().includes('literature')) {
    materials.push({ item: 'Reading materials or textbooks', quantity: '1 per student' });
  }

  if (topic.toLowerCase().includes('math')) {
    materials.push({ item: 'Calculator', quantity: '1 per student', optional: true });
    materials.push({ item: 'Graph paper', quantity: 'As needed', optional: true });
  }

  materials.push({ item: 'Visual aids or presentation slides', optional: true });
  materials.push({ item: 'Handouts or worksheets', quantity: '1 per student', optional: true });

  return materials;
}

/**
 * Generates activity sequence with timing
 */
function generateActivities(topic: string, duration: number, gradeLevel: string): Activity[] {
  const activities: Activity[] = [];

  // Calculate time allocations (rough percentages)
  const introTime = Math.floor(duration * 0.1); // 10%
  const directTime = Math.floor(duration * 0.25); // 25%
  const guidedTime = Math.floor(duration * 0.3); // 30%
  const independentTime = Math.floor(duration * 0.25); // 25%
  const closureTime = duration - (introTime + directTime + guidedTime + independentTime); // Remaining

  // 1. Introduction/Hook
  activities.push({
    name: 'Introduction and Hook',
    duration: introTime,
    description: `Begin with an engaging question or activity related to ${topic} to activate prior knowledge and spark curiosity`,
    instructionalStrategy: 'Direct instruction with questioning',
    studentGrouping: 'whole-class',
  });

  // 2. Direct Instruction
  activities.push({
    name: 'Direct Instruction',
    duration: directTime,
    description: `Present key concepts and information about ${topic} using visual aids, examples, and demonstrations`,
    instructionalStrategy: 'Explicit teaching with modeling',
    studentGrouping: 'whole-class',
  });

  // 3. Guided Practice
  activities.push({
    name: 'Guided Practice',
    duration: guidedTime,
    description: `Work through examples together as a class, with students participating and receiving immediate feedback on ${topic}`,
    instructionalStrategy: 'Guided practice with scaffolding',
    studentGrouping: 'small-group',
  });

  // 4. Independent Practice
  activities.push({
    name: 'Independent Practice',
    duration: independentTime,
    description: `Students complete individual or paired activities to apply their understanding of ${topic}`,
    instructionalStrategy: 'Student-centered practice',
    studentGrouping:
      gradeLevel.toLowerCase().includes('k') || gradeLevel.includes('1') ? 'pairs' : 'individual',
  });

  // 5. Closure
  activities.push({
    name: 'Closure and Review',
    duration: closureTime,
    description: `Summarize key learnings about ${topic} and preview upcoming lessons`,
    instructionalStrategy: 'Review and formative assessment',
    studentGrouping: 'whole-class',
  });

  return activities;
}

/**
 * Generates assessment methods
 */
function generateAssessment(topic: string, _gradeLevel: string): Assessment[] {
  const assessments: Assessment[] = [];

  // Formative assessment
  assessments.push({
    type: 'formative',
    method: 'Exit Ticket',
    description: `Students answer 2-3 questions about ${topic} before leaving class`,
    successCriteria: [
      'Student can recall key concepts',
      'Student demonstrates understanding through examples',
      'Student identifies areas of confusion',
    ],
  });

  assessments.push({
    type: 'formative',
    method: 'Class Discussion and Questioning',
    description: 'Ongoing questioning throughout lesson to check for understanding',
    successCriteria: [
      'Students participate in discussion',
      'Students answer questions correctly',
      'Students ask clarifying questions',
    ],
  });

  // Summative assessment
  assessments.push({
    type: 'summative',
    method: 'Independent Practice Review',
    description: `Review of student work during independent practice to assess mastery of ${topic}`,
    successCriteria: [
      'Student completes practice problems correctly',
      'Student applies concepts accurately',
      'Student work demonstrates understanding of objectives',
    ],
  });

  return assessments;
}

/**
 * Generates differentiation strategies
 */
function generateDifferentiation(_gradeLevel: string): string[] {
  return [
    'For advanced learners: Provide extension activities with more complex applications',
    'For struggling learners: Offer additional scaffolding, visual aids, or one-on-one support',
    'For English Language Learners: Use visual supports, simplified language, and vocabulary lists',
    'For students with special needs: Modify activities as needed per IEP/504 accommodations',
    'Provide multiple means of representation (visual, auditory, kinesthetic)',
  ];
}

/**
 * Generates extension ideas
 */
function generateExtensions(topic: string, _gradeLevel: string): string[] {
  return [
    `Connect ${topic} to current events or real-world applications`,
    'Invite students to research related topics and share findings with class',
    `Create a project-based learning activity extending the concepts of ${topic}`,
    'Integrate technology tools for deeper exploration',
    'Plan a field trip or virtual tour related to the topic',
  ];
}

/**
 * Generates homework assignment
 */
function generateHomework(topic: string, _gradeLevel: string, duration: number): string {
  if (duration < 45) {
    return `Review notes on ${topic} and write 3 key takeaways`;
  }

  return `Complete practice problems on ${topic} and write a brief reflection on how this topic connects to everyday life (1 paragraph)`;
}

/**
 * Lesson Plan Outline Tool
 * Generates comprehensive lesson plans with proper structure and timing
 */
export const lessonPlanOutlineTool = tool({
  description:
    'Generates a comprehensive lesson plan outline with learning objectives, materials, sequenced activities with time allocations, assessments, and differentiation strategies. Follows educational best practices and includes appropriate scaffolding for the target grade level.',
  inputSchema: jsonSchema<LessonPlanOutlineInput>({
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description:
          'The lesson topic or subject matter (e.g., "Photosynthesis", "The American Revolution", "Fractions")',
      },
      duration: {
        type: 'number',
        description: 'Lesson duration in minutes (15-240)',
      },
      gradeLevel: {
        type: 'string',
        description: 'Target grade level (e.g., "K-2", "3-5", "6-8", "9-12", "College")',
      },
    },
    required: ['topic', 'duration', 'gradeLevel'],
    additionalProperties: false,
  }),
  async execute({ topic, duration, gradeLevel }): Promise<LessonPlan> {
    // Validate inputs
    validateInput(topic, duration, gradeLevel);

    // Generate lesson plan components
    const objectives = generateObjectives(topic, gradeLevel);
    const materials = generateMaterials(topic, gradeLevel);
    const activities = generateActivities(topic, duration, gradeLevel);
    const assessment = generateAssessment(topic, gradeLevel);
    const differentiation = generateDifferentiation(gradeLevel);
    const extensions = generateExtensions(topic, gradeLevel);
    const homework = generateHomework(topic, gradeLevel, duration);

    // Verify total activity time matches duration
    const totalActivityTime = activities.reduce((sum, activity) => sum + activity.duration, 0);
    if (Math.abs(totalActivityTime - duration) > 2) {
      // Allow 2-minute variance
      throw new Error(
        `Activity timing error: activities total ${totalActivityTime} minutes but lesson is ${duration} minutes`
      );
    }

    return {
      topic,
      gradeLevel,
      duration,
      objectives,
      materials,
      activities,
      assessment,
      differentiation,
      extensions,
      homework,
      standards: [`Aligned with grade ${gradeLevel} standards for ${topic}`],
    };
  },
});

export default lessonPlanOutlineTool;
