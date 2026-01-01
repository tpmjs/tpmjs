/**
 * NDA Template Draft Tool for TPMJS
 * Generates NDA templates with customizable terms for mutual or unilateral agreements
 */

import { jsonSchema, tool } from 'ai';

/**
 * Type of NDA agreement
 */
type NDAType = 'mutual' | 'unilateral';

/**
 * Input interface for NDA template generation
 */
interface NDATemplateDraftInput {
  type: NDAType;
  disclosingParty: string;
  receivingParty: string;
  term?: number;
}

/**
 * Represents a section of the NDA
 */
export interface NDASection {
  title: string;
  content: string;
}

/**
 * Output interface for NDA template
 */
export interface NDATemplate {
  title: string;
  type: NDAType;
  parties: {
    disclosing: string;
    receiving: string;
  };
  effectiveDate: string;
  term: number;
  sections: NDASection[];
  fullText: string;
}

/**
 * Generates an NDA template based on the specified parameters
 */
function generateNDATemplate(input: Required<NDATemplateDraftInput>): NDATemplate {
  const { type, disclosingParty, receivingParty, term } = input;

  // Domain rule: nda_mutuality - Mutual NDAs protect both parties, unilateral NDAs protect only the disclosing party
  const isMutual = type === 'mutual';
  const today = new Date().toISOString().split('T')[0] || '';

  // Domain rule: party_designation - Party references change based on NDA type (mutual vs unilateral)
  // Define party references based on NDA type
  const disclosingRef = isMutual ? 'each Party' : disclosingParty;
  const receivingRef = isMutual ? 'the other Party' : receivingParty;

  const sections: NDASection[] = [
    {
      title: '1. Definitions',
      content: `"Confidential Information" means any information disclosed by ${disclosingRef} to ${receivingRef}, whether orally, in writing, or in any other form, that is designated as confidential or that reasonably should be understood to be confidential given the nature of the information and the circumstances of disclosure. Confidential Information includes, but is not limited to, business plans, technical data, customer lists, financial information, trade secrets, and proprietary information.

"Disclosing Party" means ${isMutual ? 'the Party disclosing Confidential Information' : disclosingParty}.

"Receiving Party" means ${isMutual ? 'the Party receiving Confidential Information' : receivingParty}.`,
    },
    {
      title: '2. Confidentiality Obligations',
      content: `The Receiving Party agrees to:

a) Hold all Confidential Information in strict confidence;
b) Not disclose Confidential Information to any third parties without the prior written consent of the Disclosing Party;
c) Use the Confidential Information solely for the purpose of ${isMutual ? 'the business relationship between the Parties' : 'evaluating a potential business relationship'};
d) Limit access to Confidential Information to employees, contractors, and advisors who have a legitimate need to know and who have been informed of the confidential nature of such information;
e) Protect the Confidential Information using the same degree of care it uses to protect its own confidential information, but in no event less than reasonable care.`,
    },
    {
      title: '3. Exclusions from Confidential Information',
      content: `The obligations set forth in Section 2 shall not apply to any Confidential Information that:

a) Was known to the Receiving Party prior to disclosure by the Disclosing Party;
b) Is or becomes publicly available through no breach of this Agreement by the Receiving Party;
c) Is rightfully received by the Receiving Party from a third party without breach of any confidentiality obligation;
d) Is independently developed by the Receiving Party without use of or reference to the Confidential Information;
e) Is required to be disclosed by law, regulation, or court order, provided that the Receiving Party provides prompt written notice to the Disclosing Party and cooperates in any effort to seek a protective order.`,
    },
    {
      title: '4. Term and Termination',
      // Domain rule: confidentiality_survival - Confidentiality obligations survive agreement termination for the specified term
      content: `This Agreement shall commence on the Effective Date and shall continue for a period of ${term} year${term !== 1 ? 's' : ''} (the "Term"). The obligations of confidentiality shall survive termination of this Agreement and shall continue for a period of ${term} year${term !== 1 ? 's' : ''} from the date of termination.

Either Party may terminate this Agreement at any time upon written notice to the other Party. Upon termination, the Receiving Party shall promptly return or destroy all Confidential Information and certify such destruction in writing to the Disclosing Party.`,
    },
    {
      title: '5. Return of Materials',
      content: `Upon request by the Disclosing Party, or upon termination of this Agreement, the Receiving Party shall promptly:

a) Return all documents, materials, and other tangible items containing or representing Confidential Information;
b) Destroy all copies, notes, and derivatives of Confidential Information in its possession or control;
c) Provide written certification of such return or destruction.

The Receiving Party may retain one copy of Confidential Information solely for archival purposes and regulatory compliance, subject to the continuing confidentiality obligations of this Agreement.`,
    },
    {
      title: '6. No License or Rights',
      content: `Nothing in this Agreement grants the Receiving Party any license, ownership interest, or rights in the Confidential Information except as expressly stated herein. All Confidential Information remains the sole property of the Disclosing Party.

This Agreement does not obligate either Party to enter into any further business relationship or agreement.`,
    },
    {
      title: '7. Remedies',
      content: `The Receiving Party acknowledges that unauthorized disclosure or use of Confidential Information may cause irreparable harm to the Disclosing Party for which monetary damages may be inadequate. Accordingly, the Disclosing Party shall be entitled to seek equitable relief, including injunction and specific performance, in addition to all other remedies available at law or in equity.`,
    },
    {
      title: '8. Governing Law and Jurisdiction',
      content: `This Agreement shall be governed by and construed in accordance with the laws of [Jurisdiction], without regard to its conflict of law provisions. Any disputes arising under this Agreement shall be resolved in the courts of [Jurisdiction].`,
    },
    {
      title: '9. Entire Agreement',
      content: `This Agreement constitutes the entire agreement between the Parties concerning the subject matter hereof and supersedes all prior agreements and understandings, whether written or oral, relating to such subject matter.

This Agreement may only be modified by a written amendment signed by both Parties.`,
    },
    {
      title: '10. Severability',
      content: `If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect. The invalid or unenforceable provision shall be replaced with a valid provision that most closely approximates the intent and economic effect of the invalid provision.`,
    },
  ];

  // Generate full text
  const fullText = `
NON-DISCLOSURE AGREEMENT
(${isMutual ? 'Mutual' : 'Unilateral'})

This Non-Disclosure Agreement (the "Agreement") is entered into as of ${today} (the "Effective Date") by and between:

${disclosingParty} ("${isMutual ? 'Party A' : 'Disclosing Party'}")

and

${receivingParty} ("${isMutual ? 'Party B' : 'Receiving Party'}")

${isMutual ? '(Party A and Party B are collectively referred to as the "Parties")' : ''}

WHEREAS, ${isMutual ? 'the Parties wish to explore a business relationship and may disclose Confidential Information to each other' : `${disclosingParty} possesses certain confidential information that may be disclosed to ${receivingParty}`};

WHEREAS, the ${isMutual ? 'Parties desire' : 'Receiving Party desires'} to protect the confidentiality of such information;

NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, the Parties agree as follows:

${sections.map((section) => `${section.title}\n\n${section.content}`).join('\n\n')}

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.

${disclosingParty}

By: _______________________
Name:
Title:
Date:

${receivingParty}

By: _______________________
Name:
Title:
Date:
`.trim();

  return {
    title: `Non-Disclosure Agreement (${isMutual ? 'Mutual' : 'Unilateral'})`,
    type,
    parties: {
      disclosing: disclosingParty,
      receiving: receivingParty,
    },
    effectiveDate: today,
    term,
    sections,
    fullText,
  };
}

/**
 * NDA Template Draft Tool
 * Generates NDA templates for mutual or unilateral agreements
 */
export const ndaTemplateDraftTool = tool({
  description:
    'Generates a comprehensive Non-Disclosure Agreement (NDA) template with customizable terms. Supports both mutual (bidirectional) and unilateral (one-way) confidentiality agreements. Includes standard sections: definitions, confidentiality obligations, exclusions, term, return of materials, remedies, and governing law. Returns a structured template with individual sections and full formatted text ready for customization.',
  inputSchema: jsonSchema<NDATemplateDraftInput>({
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['mutual', 'unilateral'],
        description:
          'Type of NDA: "mutual" for bidirectional confidentiality or "unilateral" for one-way disclosure',
      },
      disclosingParty: {
        type: 'string',
        description: 'Full legal name of the disclosing party',
      },
      receivingParty: {
        type: 'string',
        description: 'Full legal name of the receiving party',
      },
      term: {
        type: 'number',
        description: 'Confidentiality term in years (default: 2)',
      },
    },
    required: ['type', 'disclosingParty', 'receivingParty'],
    additionalProperties: false,
  }),
  execute: async ({ type, disclosingParty, receivingParty, term = 2 }): Promise<NDATemplate> => {
    // Validate type
    if (type !== 'mutual' && type !== 'unilateral') {
      throw new Error('Type must be either "mutual" or "unilateral"');
    }

    // Validate party names
    if (!disclosingParty || disclosingParty.trim().length === 0) {
      throw new Error('Disclosing party name cannot be empty');
    }

    if (!receivingParty || receivingParty.trim().length === 0) {
      throw new Error('Receiving party name cannot be empty');
    }

    // Validate term
    if (term <= 0 || term > 20) {
      throw new Error('Term must be between 1 and 20 years');
    }

    if (!Number.isInteger(term)) {
      throw new Error('Term must be a whole number');
    }

    try {
      return generateNDATemplate({
        type,
        disclosingParty: disclosingParty.trim(),
        receivingParty: receivingParty.trim(),
        term,
      });
    } catch (error) {
      throw new Error(
        `Failed to generate NDA template: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});

export default ndaTemplateDraftTool;
