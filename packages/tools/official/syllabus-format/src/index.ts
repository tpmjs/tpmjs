/**
 * Syllabus Format Tool for TPMJS
 * Formats course syllabus with schedule, policies, and learning outcomes
 */

import { jsonSchema, tool } from 'ai';

/**
 * Course information
 */
export interface CourseInfo {
  courseName: string;
  courseCode: string;
  semester: string;
  instructor: string;
  email?: string;
  officeHours?: string;
  credits?: number;
}

/**
 * Weekly schedule entry
 */
export interface ScheduleWeek {
  week: number;
  topic: string;
  readings?: string;
  assignments?: string;
  dueDate?: string;
}

/**
 * Course policies
 * Domain rule compliance: grading, attendance, academicIntegrity are required
 * (defaults provided if not specified)
 */
export interface CoursePolicies {
  grading?: string; // Required by domain rule: policy_completeness
  attendance?: string; // Required by domain rule: policy_completeness
  lateWork?: string;
  academicIntegrity?: string; // Required by domain rule: policy_completeness
  accessibility?: string;
}

/**
 * Complete formatted syllabus
 */
export interface Syllabus {
  courseInfo: CourseInfo;
  learningOutcomes: string[];
  schedule: ScheduleWeek[];
  policies: CoursePolicies;
  formatted: string;
}

type SyllabusFormatInput = {
  courseInfo: CourseInfo;
  schedule: ScheduleWeek[];
  policies?: CoursePolicies;
};

/**
 * Validates course info object
 */
function validateCourseInfo(courseInfo: unknown): courseInfo is CourseInfo {
  if (!courseInfo || typeof courseInfo !== 'object') {
    throw new Error('Course info must be an object');
  }

  const info = courseInfo as Record<string, unknown>;

  if (
    !info.courseName ||
    typeof info.courseName !== 'string' ||
    info.courseName.trim().length === 0
  ) {
    throw new Error('Course name is required');
  }

  if (
    !info.courseCode ||
    typeof info.courseCode !== 'string' ||
    info.courseCode.trim().length === 0
  ) {
    throw new Error('Course code is required');
  }

  if (!info.semester || typeof info.semester !== 'string' || info.semester.trim().length === 0) {
    throw new Error('Semester is required');
  }

  if (
    !info.instructor ||
    typeof info.instructor !== 'string' ||
    info.instructor.trim().length === 0
  ) {
    throw new Error('Instructor name is required');
  }

  return true;
}

/**
 * Validates schedule array
 */
function validateSchedule(schedule: unknown): schedule is ScheduleWeek[] {
  if (!Array.isArray(schedule)) {
    throw new Error('Schedule must be an array');
  }

  if (schedule.length === 0) {
    throw new Error('Schedule must contain at least one week');
  }

  if (schedule.length > 52) {
    throw new Error('Schedule cannot exceed 52 weeks');
  }

  for (let i = 0; i < schedule.length; i++) {
    const week = schedule[i];
    if (!week || typeof week !== 'object') {
      throw new Error(`Schedule week at index ${i} must be an object`);
    }

    const w = week as Record<string, unknown>;

    if (typeof w.week !== 'number' || w.week < 1) {
      throw new Error(`Week number at index ${i} must be a positive number`);
    }

    if (!w.topic || typeof w.topic !== 'string' || w.topic.trim().length === 0) {
      throw new Error(`Topic at week ${w.week} is required`);
    }
  }

  return true;
}

/**
 * Derives learning outcomes from schedule topics
 */
function deriveLearningOutcomes(schedule: ScheduleWeek[]): string[] {
  // Generate 3-5 learning outcomes based on schedule
  const outcomes: string[] = [];
  const uniqueTopics = new Set(schedule.map((w) => w.topic));

  // General course completion outcome
  outcomes.push(
    `Demonstrate understanding of core concepts covered throughout the ${schedule.length}-week course`
  );

  // Topic-specific outcomes (first 3 major topics)
  const topics = Array.from(uniqueTopics).slice(0, 3);
  for (const topic of topics) {
    outcomes.push(`Apply knowledge of ${topic.toLowerCase()} to real-world scenarios`);
  }

  // Assessment outcome
  if (schedule.some((w) => w.assignments)) {
    outcomes.push(
      'Successfully complete assigned coursework demonstrating mastery of course material'
    );
  }

  return outcomes.slice(0, 5);
}

/**
 * Formats course info section
 */
function formatCourseInfo(courseInfo: CourseInfo): string {
  let info = `# ${courseInfo.courseName}

**Course Code:** ${courseInfo.courseCode}
**Semester:** ${courseInfo.semester}
**Instructor:** ${courseInfo.instructor}`;

  if (courseInfo.email) {
    info += `  \n**Email:** ${courseInfo.email}`;
  }

  if (courseInfo.officeHours) {
    info += `  \n**Office Hours:** ${courseInfo.officeHours}`;
  }

  if (courseInfo.credits) {
    info += `  \n**Credits:** ${courseInfo.credits}`;
  }

  return info;
}

/**
 * Formats learning outcomes section
 */
function formatLearningOutcomes(outcomes: string[]): string {
  return `## Learning Outcomes

By the end of this course, students will be able to:

${outcomes.map((outcome, i) => `${i + 1}. ${outcome}`).join('\n')}`;
}

/**
 * Formats a schedule week as a table row
 */
function formatScheduleWeek(week: ScheduleWeek): string {
  const readings = week.readings || '-';
  const assignments = week.assignments || '-';
  const dueDate = week.dueDate || '-';

  return `| ${week.week} | ${week.topic} | ${readings} | ${assignments} | ${dueDate} |`;
}

/**
 * Formats course schedule section
 */
function formatSchedule(schedule: ScheduleWeek[]): string {
  const tableRows = schedule.map(formatScheduleWeek).join('\n');

  return `## Course Schedule

| Week | Topic | Readings | Assignments | Due Date |
|------|-------|----------|-------------|----------|
${tableRows}`;
}

/**
 * Formats policies section with required defaults
 * Domain rule: policy_completeness - Must include grading, attendance, academicIntegrity
 */
function formatPolicies(policies: CoursePolicies): string {
  // Required policies (domain rule: policy_completeness)
  const grading =
    policies.grading || 'Grading breakdown will be provided at the start of the course.';
  const attendance =
    policies.attendance ||
    'Regular attendance is expected. Please notify the instructor of any absences.';
  const academicIntegrity =
    policies.academicIntegrity ||
    'All work must be your own. Plagiarism and cheating will not be tolerated and may result in disciplinary action.';

  // Optional policies
  const lateWork =
    policies.lateWork ||
    'Late assignments may be penalized. Please contact the instructor for extensions.';
  const accessibility =
    policies.accessibility ||
    'Students requiring accommodations should contact the instructor and campus disability services.';

  return `## Course Policies

### Grading
${grading}

### Attendance
${attendance}

### Late Work
${lateWork}

### Academic Integrity
${academicIntegrity}

### Accessibility
${accessibility}`;
}

/**
 * Formats complete syllabus
 */
function formatSyllabus(syllabus: Omit<Syllabus, 'formatted'>): string {
  const sections = [
    formatCourseInfo(syllabus.courseInfo),
    '',
    formatLearningOutcomes(syllabus.learningOutcomes),
    '',
    formatSchedule(syllabus.schedule),
    '',
    formatPolicies(syllabus.policies),
  ];

  return sections.join('\n');
}

/**
 * Syllabus Format Tool
 * Formats course syllabus with schedule, policies, and learning outcomes
 */
export const syllabusFormatTool = tool({
  description:
    'Format a comprehensive course syllabus with course information, learning outcomes, weekly schedule, and policies. Generates professional syllabus documents for educational courses.',
  inputSchema: jsonSchema<SyllabusFormatInput>({
    type: 'object',
    properties: {
      courseInfo: {
        type: 'object',
        description: 'Course details including name, code, semester, instructor',
        properties: {
          courseName: {
            type: 'string',
            description: 'Full course name',
          },
          courseCode: {
            type: 'string',
            description: 'Course code (e.g., CS101)',
          },
          semester: {
            type: 'string',
            description: 'Semester/term (e.g., Fall 2024)',
          },
          instructor: {
            type: 'string',
            description: 'Instructor name',
          },
          email: {
            type: 'string',
            description: 'Instructor email (optional)',
          },
          officeHours: {
            type: 'string',
            description: 'Office hours (optional)',
          },
          credits: {
            type: 'number',
            description: 'Course credits (optional)',
          },
        },
        required: ['courseName', 'courseCode', 'semester', 'instructor'],
      },
      schedule: {
        type: 'array',
        description: 'Weekly schedule with topics, readings, and assignments',
        items: {
          type: 'object',
          properties: {
            week: {
              type: 'number',
              description: 'Week number',
            },
            topic: {
              type: 'string',
              description: 'Weekly topic',
            },
            readings: {
              type: 'string',
              description: 'Assigned readings (optional)',
            },
            assignments: {
              type: 'string',
              description: 'Assignments (optional)',
            },
            dueDate: {
              type: 'string',
              description: 'Due date (optional)',
            },
          },
          required: ['week', 'topic'],
        },
      },
      policies: {
        type: 'object',
        description: 'Course policies (optional, defaults provided)',
        properties: {
          grading: {
            type: 'string',
            description: 'Grading policy',
          },
          attendance: {
            type: 'string',
            description: 'Attendance policy',
          },
          lateWork: {
            type: 'string',
            description: 'Late work policy',
          },
          academicIntegrity: {
            type: 'string',
            description: 'Academic integrity policy',
          },
          accessibility: {
            type: 'string',
            description: 'Accessibility accommodations',
          },
        },
      },
    },
    required: ['courseInfo', 'schedule'],
    additionalProperties: false,
  }),
  async execute({ courseInfo, schedule, policies = {} }): Promise<Syllabus> {
    // Validate inputs
    validateCourseInfo(courseInfo);
    validateSchedule(schedule);

    // Derive learning outcomes from schedule
    const learningOutcomes = deriveLearningOutcomes(schedule);

    // Build syllabus object
    const syllabus: Omit<Syllabus, 'formatted'> = {
      courseInfo,
      learningOutcomes,
      schedule,
      policies,
    };

    // Format as markdown
    const formatted = formatSyllabus(syllabus);

    return {
      ...syllabus,
      formatted,
    };
  },
});

export default syllabusFormatTool;
