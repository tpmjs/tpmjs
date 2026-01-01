/**
 * Job Description Draft Tool for TPMJS
 * Generates job descriptions from role requirements with responsibilities, qualifications, and benefits
 */

import { jsonSchema, tool } from 'ai';

/**
 * Role requirements input structure
 */
export interface RoleRequirements {
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills?: string[];
  experienceYears?: number;
}

/**
 * Company information structure
 */
export interface CompanyInfo {
  name?: string;
  description?: string;
  culture?: string;
  benefits?: string[];
}

/**
 * Job description output structure
 */
export interface JobDescription {
  title: string;
  summary: string;
  responsibilities: string[];
  requiredQualifications: string[];
  preferredQualifications: string[];
  benefits: string[];
  formatted: string;
}

type JobDescriptionDraftInput = {
  title: string;
  requirements: RoleRequirements;
  companyInfo?: CompanyInfo;
};

/**
 * Validates that a string array has valid content
 */
function validateStringArray(arr: unknown, fieldName: string, minLength = 1): void {
  if (!Array.isArray(arr)) {
    throw new Error(`${fieldName} must be an array`);
  }
  if (arr.length < minLength) {
    throw new Error(`${fieldName} must contain at least ${minLength} item(s)`);
  }
  if (arr.some((item) => typeof item !== 'string' || item.trim().length === 0)) {
    throw new Error(`All items in ${fieldName} must be non-empty strings`);
  }
}

/**
 * Ensures inclusive, bias-free language in text
 */
function ensureInclusiveLanguage(text: string): string {
  // Domain rule: inclusive_language - Replace gendered terms with neutral alternatives per DEI best practices
  // Replace potentially biased terms with inclusive alternatives
  const replacements: Record<string, string> = {
    guys: 'team members',
    manpower: 'workforce',
    'man-hours': 'work hours',
    chairman: 'chairperson',
    'he/she': 'they',
    'his/her': 'their',
  };

  let result = text;
  for (const [biased, inclusive] of Object.entries(replacements)) {
    const regex = new RegExp(`\\b${biased}\\b`, 'gi');
    result = result.replace(regex, inclusive);
  }

  return result;
}

/**
 * Formats the job description into a readable markdown document
 */
function formatJobDescription(
  title: string,
  summary: string,
  responsibilities: string[],
  requiredQualifications: string[],
  preferredQualifications: string[],
  benefits: string[],
  companyInfo?: CompanyInfo
): string {
  const sections: string[] = [];

  // Title and summary
  sections.push(`# ${title}\n`);
  sections.push(`## About the Role\n\n${summary}\n`);

  // Company info if provided
  if (companyInfo?.name || companyInfo?.description) {
    sections.push('## About the Company\n');
    if (companyInfo.name) {
      sections.push(`**${companyInfo.name}**\n`);
    }
    if (companyInfo.description) {
      sections.push(`${companyInfo.description}\n`);
    }
    if (companyInfo.culture) {
      sections.push(`\n**Our Culture:** ${companyInfo.culture}\n`);
    }
    sections.push('');
  }

  // Responsibilities
  sections.push('## Key Responsibilities\n');
  responsibilities.forEach((resp) => {
    sections.push(`- ${resp}`);
  });
  sections.push('');

  // Required qualifications
  sections.push('## Required Qualifications\n');
  requiredQualifications.forEach((qual) => {
    sections.push(`- ${qual}`);
  });
  sections.push('');

  // Preferred qualifications
  if (preferredQualifications.length > 0) {
    sections.push('## Preferred Qualifications\n');
    preferredQualifications.forEach((qual) => {
      sections.push(`- ${qual}`);
    });
    sections.push('');
  }

  // Benefits
  sections.push('## Benefits\n');
  benefits.forEach((benefit) => {
    sections.push(`- ${benefit}`);
  });
  sections.push('');

  // Equal opportunity statement
  sections.push(
    '---\n\n*We are an equal opportunity employer and value diversity. We do not discriminate on the basis of race, religion, color, national origin, gender, sexual orientation, age, marital status, veteran status, or disability status.*'
  );

  return sections.join('\n');
}

/**
 * Generates a professional role summary
 */
function generateRoleSummary(
  title: string,
  requirements: RoleRequirements,
  companyInfo?: CompanyInfo
): string {
  const parts: string[] = [];

  parts.push(`We are seeking a talented ${title} to join our team.`);

  if (companyInfo?.name) {
    parts.push(
      `At ${companyInfo.name}, you'll have the opportunity to work on challenging projects and make a meaningful impact.`
    );
  }

  if (requirements.experienceYears) {
    parts.push(
      `This role requires ${requirements.experienceYears}+ years of relevant experience and a strong track record of success.`
    );
  }

  parts.push(
    'The ideal candidate will bring expertise in key technical areas while demonstrating strong collaboration and communication skills.'
  );

  return ensureInclusiveLanguage(parts.join(' '));
}

/**
 * Generates default benefits if none provided
 */
function generateDefaultBenefits(): string[] {
  return [
    'Competitive salary and equity compensation',
    'Health, dental, and vision insurance',
    'Flexible work arrangements',
    'Professional development opportunities',
    'Collaborative and inclusive work environment',
  ];
}

/**
 * Job Description Draft Tool
 * Generates professional job descriptions with inclusive language
 */
export const jobDescriptionDraftTool = tool({
  description:
    'Generates professional job descriptions from role requirements including responsibilities, qualifications, and benefits. Uses inclusive, bias-free language and follows industry best practices.',
  inputSchema: jsonSchema<JobDescriptionDraftInput>({
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Job title (e.g., "Senior Software Engineer", "Product Manager")',
      },
      requirements: {
        type: 'object',
        description: 'Role requirements and expectations',
        properties: {
          responsibilities: {
            type: 'array',
            description: 'Key responsibilities and duties',
            items: { type: 'string' },
          },
          requiredSkills: {
            type: 'array',
            description: 'Required skills and qualifications',
            items: { type: 'string' },
          },
          preferredSkills: {
            type: 'array',
            description: 'Preferred/nice-to-have skills',
            items: { type: 'string' },
          },
          experienceYears: {
            type: 'number',
            description: 'Required years of experience',
          },
        },
        required: ['responsibilities', 'requiredSkills'],
      },
      companyInfo: {
        type: 'object',
        description: 'Optional company details for context',
        properties: {
          name: { type: 'string', description: 'Company name' },
          description: { type: 'string', description: 'Company description' },
          culture: { type: 'string', description: 'Company culture description' },
          benefits: {
            type: 'array',
            description: 'Company-specific benefits',
            items: { type: 'string' },
          },
        },
      },
    },
    required: ['title', 'requirements'],
    additionalProperties: false,
  }),
  async execute({ title, requirements, companyInfo }): Promise<JobDescription> {
    // Validate title
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new Error('Title is required and must be a non-empty string');
    }

    // Validate requirements object
    if (!requirements || typeof requirements !== 'object') {
      throw new Error('Requirements must be an object');
    }

    // Validate required arrays
    validateStringArray(requirements.responsibilities, 'requirements.responsibilities', 1);
    validateStringArray(requirements.requiredSkills, 'requirements.requiredSkills', 1);

    // Validate optional arrays
    if (requirements.preferredSkills !== undefined) {
      validateStringArray(requirements.preferredSkills, 'requirements.preferredSkills', 0);
    }

    // Validate experience years
    if (
      requirements.experienceYears !== undefined &&
      (typeof requirements.experienceYears !== 'number' || requirements.experienceYears < 0)
    ) {
      throw new Error('requirements.experienceYears must be a non-negative number');
    }

    // Validate company info if provided
    if (companyInfo?.benefits !== undefined) {
      validateStringArray(companyInfo.benefits, 'companyInfo.benefits', 0);
    }

    // Generate role summary
    const summary = generateRoleSummary(title, requirements, companyInfo);

    // Ensure inclusive language in all text fields
    const responsibilities = requirements.responsibilities.map(ensureInclusiveLanguage);
    const requiredQualifications = requirements.requiredSkills.map(ensureInclusiveLanguage);
    const preferredQualifications = (requirements.preferredSkills || []).map(
      ensureInclusiveLanguage
    );

    // Use company benefits or generate defaults
    const benefits =
      companyInfo?.benefits && companyInfo.benefits.length > 0
        ? companyInfo.benefits.map(ensureInclusiveLanguage)
        : generateDefaultBenefits();

    // Format the complete job description
    const formatted = formatJobDescription(
      title,
      summary,
      responsibilities,
      requiredQualifications,
      preferredQualifications,
      benefits,
      companyInfo
    );

    return {
      title: ensureInclusiveLanguage(title),
      summary,
      responsibilities,
      requiredQualifications,
      preferredQualifications,
      benefits,
      formatted,
    };
  },
});

export default jobDescriptionDraftTool;
