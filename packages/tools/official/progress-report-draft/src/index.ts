/**
 * Progress Report Draft Tool for TPMJS
 * Drafts student progress reports from grades and observation notes
 */

import { jsonSchema, tool } from 'ai';

/**
 * Student grade for a subject
 */
export interface SubjectGrade {
  subject: string;
  grade: string | number;
  comments?: string;
}

/**
 * Student information with grades
 */
export interface StudentInfo {
  name: string;
  gradeLevel?: string;
  reportingPeriod?: string;
  grades: SubjectGrade[];
}

/**
 * Progress report section
 */
export interface ReportSection {
  title: string;
  content: string;
}

/**
 * Complete progress report
 */
export interface ProgressReport {
  student: StudentInfo;
  observations: string[];
  academicProgress: ReportSection;
  behaviorAndEngagement: ReportSection;
  recommendations: ReportSection;
  formatted: string;
}

type ProgressReportDraftInput = {
  student: StudentInfo;
  observations: string[];
};

/**
 * Validates student info object
 */
function validateStudentInfo(student: unknown): student is StudentInfo {
  if (!student || typeof student !== 'object') {
    throw new Error('Student info must be an object');
  }

  const s = student as Record<string, unknown>;

  if (!s.name || typeof s.name !== 'string' || s.name.trim().length === 0) {
    throw new Error('Student name is required');
  }

  if (!Array.isArray(s.grades)) {
    throw new Error('Student grades must be an array');
  }

  if (s.grades.length === 0) {
    throw new Error('At least one grade is required');
  }

  for (let i = 0; i < s.grades.length; i++) {
    const grade = s.grades[i];
    if (!grade || typeof grade !== 'object') {
      throw new Error(`Grade at index ${i} must be an object`);
    }

    const g = grade as Record<string, unknown>;

    if (!g.subject || typeof g.subject !== 'string' || g.subject.trim().length === 0) {
      throw new Error(`Subject name is required for grade at index ${i}`);
    }

    if (g.grade === undefined || g.grade === null) {
      throw new Error(`Grade value is required for ${g.subject}`);
    }

    if (typeof g.grade !== 'string' && typeof g.grade !== 'number') {
      throw new Error(`Grade for ${g.subject} must be a string or number`);
    }
  }

  return true;
}

/**
 * Validates observations array
 */
function validateObservations(observations: unknown): observations is string[] {
  if (!Array.isArray(observations)) {
    throw new Error('Observations must be an array');
  }

  if (observations.length === 0) {
    throw new Error('At least one observation is required');
  }

  if (observations.length > 20) {
    throw new Error('Observations array cannot exceed 20 items');
  }

  for (let i = 0; i < observations.length; i++) {
    if (typeof observations[i] !== 'string' || observations[i].trim().length === 0) {
      throw new Error(`Observation at index ${i} must be a non-empty string`);
    }
  }

  return true;
}

/**
 * Determines if a grade indicates strong performance
 */
function isStrongGrade(grade: string | number): boolean {
  if (typeof grade === 'number') {
    return grade >= 85;
  }

  const gradeStr = grade.toUpperCase();
  return ['A', 'A+', 'A-', 'B+'].includes(gradeStr);
}

/**
 * Determines if a grade indicates needs improvement
 */
function needsImprovement(grade: string | number): boolean {
  if (typeof grade === 'number') {
    return grade < 70;
  }

  const gradeStr = grade.toUpperCase();
  return ['D', 'F', 'C-', 'D+', 'D-'].includes(gradeStr);
}

/**
 * Generates academic progress section
 */
function generateAcademicProgress(grades: SubjectGrade[]): ReportSection {
  const strong: string[] = [];
  const improving: string[] = [];
  const concerns: string[] = [];

  for (const g of grades) {
    if (isStrongGrade(g.grade)) {
      strong.push(g.subject);
    } else if (needsImprovement(g.grade)) {
      concerns.push(g.subject);
    } else {
      improving.push(g.subject);
    }
  }

  let content = 'The student has shown ';

  if (strong.length > 0) {
    content += `strong performance in ${strong.join(', ')}, demonstrating solid understanding of the material. `;
  }

  if (improving.length > 0) {
    content += `Steady progress continues in ${improving.join(', ')}. `;
  }

  if (concerns.length > 0) {
    content += `Additional support may be beneficial in ${concerns.join(', ')} to strengthen foundational skills. `;
  }

  // Add grade-specific comments
  const withComments = grades.filter((g) => g.comments);
  if (withComments.length > 0) {
    content += '\n\n**Subject-Specific Notes:**\n\n';
    for (const g of withComments) {
      content += `- **${g.subject}** (${g.grade}): ${g.comments}\n`;
    }
  }

  return {
    title: 'Academic Progress',
    content: content.trim(),
  };
}

/**
 * Categorizes observations into positive and growth areas
 */
function categorizeObservations(observations: string[]): {
  positive: string[];
  growth: string[];
} {
  const positive: string[] = [];
  const growth: string[] = [];

  const negativeKeywords = [
    'struggle',
    'difficult',
    'challenge',
    'improve',
    'concern',
    'issue',
    'problem',
    'needs',
    'lacking',
    'distract',
  ];

  for (const obs of observations) {
    const obsLower = obs.toLowerCase();
    const hasNegative = negativeKeywords.some((kw) => obsLower.includes(kw));

    if (hasNegative) {
      growth.push(obs);
    } else {
      positive.push(obs);
    }
  }

  return { positive, growth };
}

/**
 * Generates behavior and engagement section
 */
function generateBehaviorAndEngagement(observations: string[]): ReportSection {
  const { positive, growth } = categorizeObservations(observations);

  let content = '';

  if (positive.length > 0) {
    content += 'Positive behaviors observed:\n\n';
    for (const obs of positive) {
      content += `- ${obs}\n`;
    }
    content += '\n';
  }

  if (growth.length > 0) {
    content += 'Areas for continued growth:\n\n';
    for (const obs of growth) {
      content += `- ${obs}\n`;
    }
  }

  if (content.length === 0) {
    content =
      'The student demonstrates appropriate classroom behavior and engagement with learning activities.';
  }

  return {
    title: 'Behavior & Engagement',
    content: content.trim(),
  };
}

/**
 * Generates recommendations section
 */
function generateRecommendations(grades: SubjectGrade[], observations: string[]): ReportSection {
  const recommendations: string[] = [];
  const { growth } = categorizeObservations(observations);

  // Academic recommendations
  const concernSubjects = grades.filter((g) => needsImprovement(g.grade));
  if (concernSubjects.length > 0) {
    recommendations.push(
      `Consider additional practice or tutoring support in ${concernSubjects.map((g) => g.subject).join(', ')} to build confidence and skills.`
    );
  }

  // Behavioral recommendations
  if (growth.length > 0) {
    recommendations.push(
      'Continue working on the growth areas identified above through consistent practice and positive reinforcement.'
    );
  }

  // General recommendations
  recommendations.push(
    'Maintain open communication between home and school to support continued progress.'
  );
  recommendations.push('Encourage regular study habits and completion of homework assignments.');

  const content = recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n\n');

  return {
    title: 'Recommendations',
    content,
  };
}

/**
 * Formats complete progress report
 */
function formatProgressReport(report: Omit<ProgressReport, 'formatted'>): string {
  const studentName = report.student.name;
  const gradeLevel = report.student.gradeLevel || 'N/A';
  const period = report.student.reportingPeriod || 'Current Period';

  const formatted = `# Student Progress Report

**Student:** ${studentName}
**Grade Level:** ${gradeLevel}
**Reporting Period:** ${period}

---

## ${report.academicProgress.title}

${report.academicProgress.content}

---

## ${report.behaviorAndEngagement.title}

${report.behaviorAndEngagement.content}

---

## ${report.recommendations.title}

${report.recommendations.content}

---

## Grade Summary

| Subject | Grade |
|---------|-------|
${report.student.grades.map((g) => `| ${g.subject} | ${g.grade} |`).join('\n')}

---

*This report is intended to provide a constructive overview of the student's progress. Please contact the teacher with any questions or concerns.*
`;

  return formatted;
}

/**
 * Progress Report Draft Tool
 * Drafts student progress reports from grades and observation notes
 */
export const progressReportDraftTool = tool({
  description:
    'Draft a comprehensive student progress report from grades and teacher observations. Generates constructive, growth-oriented reports with academic progress, behavior assessment, and recommendations.',
  inputSchema: jsonSchema<ProgressReportDraftInput>({
    type: 'object',
    properties: {
      student: {
        type: 'object',
        description: 'Student information and grades',
        properties: {
          name: {
            type: 'string',
            description: 'Student name',
          },
          gradeLevel: {
            type: 'string',
            description: 'Grade level or year (optional)',
          },
          reportingPeriod: {
            type: 'string',
            description: 'Reporting period (e.g., Q1 2024, optional)',
          },
          grades: {
            type: 'array',
            description: 'Subject grades',
            items: {
              type: 'object',
              properties: {
                subject: {
                  type: 'string',
                  description: 'Subject name',
                },
                grade: {
                  type: ['string', 'number'],
                  description: 'Grade (letter or number)',
                },
                comments: {
                  type: 'string',
                  description: 'Subject-specific comments (optional)',
                },
              },
              required: ['subject', 'grade'],
            },
          },
        },
        required: ['name', 'grades'],
      },
      observations: {
        type: 'array',
        description: 'Teacher observation notes about student behavior and engagement',
        items: {
          type: 'string',
        },
      },
    },
    required: ['student', 'observations'],
    additionalProperties: false,
  }),
  async execute({ student, observations }): Promise<ProgressReport> {
    // Validate inputs
    validateStudentInfo(student);
    validateObservations(observations);

    // Generate report sections
    const academicProgress = generateAcademicProgress(student.grades);
    const behaviorAndEngagement = generateBehaviorAndEngagement(observations);
    const recommendations = generateRecommendations(student.grades, observations);

    // Build report object
    const report: Omit<ProgressReport, 'formatted'> = {
      student,
      observations,
      academicProgress,
      behaviorAndEngagement,
      recommendations,
    };

    // Format as markdown
    const formatted = formatProgressReport(report);

    return {
      ...report,
      formatted,
    };
  },
});

export default progressReportDraftTool;
