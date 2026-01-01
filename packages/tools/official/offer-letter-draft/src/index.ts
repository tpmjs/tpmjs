/**
 * Offer Letter Draft Tool for TPMJS
 * Generates offer letter content from compensation and role details
 */

import { jsonSchema, tool } from 'ai';

/**
 * Candidate information
 */
interface Candidate {
  name: string;
  address?: string;
  email?: string;
}

/**
 * Offer details
 */
interface Offer {
  salary: number;
  currency?: string;
  salaryPeriod?: 'annual' | 'hourly';
  equity?: {
    shares?: number;
    percentage?: number;
    vestingYears?: number;
  };
  bonus?: {
    target: number;
    type?: 'annual' | 'signing';
  };
  benefits?: string[];
  startDate: string;
}

/**
 * Role information
 */
interface Role {
  title: string;
  department: string;
  location: string;
  manager?: string;
  type?: 'full-time' | 'part-time' | 'contract';
  isRemote?: boolean;
}

/**
 * Input interface for offer letter draft
 */
interface OfferLetterDraftInput {
  candidate: Candidate;
  offer: Offer;
  role: Role;
}

/**
 * Offer letter sections
 */
export interface OfferLetter {
  header: string;
  greeting: string;
  introduction: string;
  positionDetails: string;
  compensationDetails: string;
  benefitsDetails: string;
  startDateDetails: string;
  contingencies: string;
  atWillStatement: string;
  closing: string;
  fullLetter: string;
  metadata: {
    generatedDate: string;
    candidateName: string;
    roleTitle: string;
  };
}

/**
 * Offer Letter Draft Tool
 * Generates offer letter content from compensation and role details
 */
export const offerLetterDraftTool = tool({
  description:
    'Generates professional offer letter content from compensation and role details. Includes position, compensation, benefits, start date, at-will employment statement, and standard contingencies (background check, right to work verification).',
  inputSchema: jsonSchema<OfferLetterDraftInput>({
    type: 'object',
    properties: {
      candidate: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Candidate full name' },
          address: { type: 'string', description: 'Candidate mailing address' },
          email: { type: 'string', description: 'Candidate email address' },
        },
        required: ['name'],
        description: 'Candidate information',
      },
      offer: {
        type: 'object',
        properties: {
          salary: { type: 'number', description: 'Base salary amount' },
          currency: { type: 'string', description: 'Currency (default: USD)' },
          salaryPeriod: {
            type: 'string',
            enum: ['annual', 'hourly'],
            description: 'Salary period (default: annual)',
          },
          equity: {
            type: 'object',
            properties: {
              shares: { type: 'number', description: 'Number of stock options' },
              percentage: { type: 'number', description: 'Equity percentage' },
              vestingYears: { type: 'number', description: 'Vesting period in years' },
            },
            description: 'Equity compensation details',
          },
          bonus: {
            type: 'object',
            properties: {
              target: { type: 'number', description: 'Bonus amount or percentage' },
              type: {
                type: 'string',
                enum: ['annual', 'signing'],
                description: 'Bonus type',
              },
            },
            required: ['target'],
            description: 'Bonus details',
          },
          benefits: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of benefits',
          },
          startDate: { type: 'string', description: 'Employment start date' },
        },
        required: ['salary', 'startDate'],
        description: 'Offer details',
      },
      role: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Job title' },
          department: { type: 'string', description: 'Department name' },
          location: { type: 'string', description: 'Work location' },
          manager: { type: 'string', description: 'Manager name' },
          type: {
            type: 'string',
            enum: ['full-time', 'part-time', 'contract'],
            description: 'Employment type (default: full-time)',
          },
          isRemote: { type: 'boolean', description: 'Whether position is remote' },
        },
        required: ['title', 'department', 'location'],
        description: 'Role details',
      },
    },
    required: ['candidate', 'offer', 'role'],
    additionalProperties: false,
  }),
  execute: async ({ candidate, offer, role }): Promise<OfferLetter> => {
    // Validate inputs
    if (!candidate.name || typeof candidate.name !== 'string') {
      throw new Error('Candidate name is required');
    }

    if (typeof offer.salary !== 'number' || offer.salary <= 0) {
      throw new Error('Offer salary must be a positive number');
    }

    if (!offer.startDate || typeof offer.startDate !== 'string') {
      throw new Error('Offer start date is required');
    }

    if (!role.title || !role.department || !role.location) {
      throw new Error('Role title, department, and location are required');
    }

    try {
      const currency = offer.currency || 'USD';
      const salaryPeriod = offer.salaryPeriod || 'annual';
      const employmentType = role.type || 'full-time';
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Format salary
      const formattedSalary = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
      }).format(offer.salary);

      // Build letter sections
      const header = `OFFER LETTER\n${currentDate}`;

      const greeting = `Dear ${candidate.name},`;

      const introduction = `We are pleased to offer you the position of ${role.title} at our company. We believe your skills and experience will be a valuable addition to our ${role.department} team.`;

      const positionDetails = `Position: ${role.title}\nDepartment: ${role.department}\nReports to: ${role.manager || 'TBD'}\nLocation: ${role.location}${role.isRemote ? ' (Remote)' : ''}\nEmployment Type: ${employmentType.charAt(0).toUpperCase() + employmentType.slice(1)}`;

      let compensationDetails = `Base Salary: ${formattedSalary} ${salaryPeriod}`;

      if (offer.equity) {
        if (offer.equity.shares) {
          compensationDetails += `\nStock Options: ${offer.equity.shares.toLocaleString()} shares`;
        }
        if (offer.equity.percentage) {
          compensationDetails += `\nEquity: ${offer.equity.percentage}% of company`;
        }
        if (offer.equity.vestingYears) {
          compensationDetails += ` (${offer.equity.vestingYears}-year vesting)`;
        }
      }

      if (offer.bonus) {
        const bonusAmount =
          offer.bonus.target < 1
            ? `${(offer.bonus.target * 100).toFixed(0)}% of base salary`
            : new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 0,
              }).format(offer.bonus.target);

        compensationDetails += `\n${offer.bonus.type === 'signing' ? 'Signing' : 'Annual'} Bonus: ${bonusAmount}`;
      }

      const benefitsDetails =
        offer.benefits && offer.benefits.length > 0
          ? `Benefits:\n${offer.benefits.map((b) => `- ${b}`).join('\n')}`
          : 'Benefits: Standard company benefits package (details to be provided separately)';

      const startDateDetails = `Start Date: ${offer.startDate}`;

      const contingencies = `This offer is contingent upon:\n- Satisfactory completion of a background check\n- Verification of your right to work in the applicable jurisdiction\n- Signing of the company's standard employment agreement and any applicable confidentiality/IP agreements`;

      // Domain rule: employment_terms - At-will employment standard in US employment law
      const atWillStatement = `This position is at-will, meaning that either you or the company may terminate the employment relationship at any time, with or without cause or notice. This offer letter does not constitute a contract of employment for any specific duration.`;

      const closing = `Please confirm your acceptance of this offer by signing and returning this letter by [date]. We look forward to welcoming you to our team!\n\nSincerely,\n\n[Name]\n[Title]`;

      // Build full letter
      const fullLetter = [
        header,
        '',
        greeting,
        '',
        introduction,
        '',
        positionDetails,
        '',
        'COMPENSATION',
        compensationDetails,
        '',
        benefitsDetails,
        '',
        startDateDetails,
        '',
        'CONTINGENCIES',
        contingencies,
        '',
        'EMPLOYMENT AT-WILL',
        atWillStatement,
        '',
        closing,
      ].join('\n');

      return {
        header,
        greeting,
        introduction,
        positionDetails,
        compensationDetails,
        benefitsDetails,
        startDateDetails,
        contingencies,
        atWillStatement,
        closing,
        fullLetter,
        metadata: {
          generatedDate: currentDate,
          candidateName: candidate.name,
          roleTitle: role.title,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to generate offer letter: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});

export default offerLetterDraftTool;
