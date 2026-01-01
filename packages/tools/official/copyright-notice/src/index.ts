/**
 * Copyright Notice Tool for TPMJS
 * Generates appropriate copyright notices for different content types and jurisdictions
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 * Uses jsonSchema() to avoid Zod 4 JSON Schema conversion issues with OpenAI
 */

import { jsonSchema, tool } from 'ai';

/**
 * Content types that require different copyright notice formats
 */
export type ContentType =
  | 'software'
  | 'text'
  | 'media'
  | 'website'
  | 'documentation'
  | 'artwork'
  | 'music'
  | 'video';

/**
 * Jurisdiction-specific copyright notice requirements
 */
export type Jurisdiction = 'US' | 'EU' | 'UK' | 'international';

/**
 * Copyright notice output
 */
export interface CopyrightNotice {
  notice: string;
  longForm: string;
  symbolUsed: string;
  jurisdiction: Jurisdiction;
  contentType: ContentType;
  components: {
    symbol: string;
    year: string;
    owner: string;
    rightsStatement: string;
  };
  additionalNotices: string[];
  recommendations: string[];
}

/**
 * Input type for Copyright Notice Tool
 */
type CopyrightNoticeInput = {
  owner: string;
  year?: number;
  contentType: ContentType;
  jurisdiction?: Jurisdiction;
  allRightsReserved?: boolean;
};

/**
 * Get appropriate copyright symbol for jurisdiction and content type
 */
// Domain rule: copyright_symbols - Sound recordings use ℗ (phonogram), other content uses © (copyright)
function getCopyrightSymbol(
  contentType: ContentType,
  _jurisdiction: Jurisdiction
): { symbol: string; description: string } {
  // Sound recordings use ℗ (phonogram)
  if (contentType === 'music') {
    return {
      symbol: '℗',
      description: 'Phonogram copyright (sound recording)',
    };
  }

  // Standard copyright symbol © for most content
  return {
    symbol: '©',
    description: 'Copyright symbol',
  };
}

/**
 * Get jurisdiction-specific rights statement
 */
function getRightsStatement(
  allRightsReserved: boolean,
  jurisdiction: Jurisdiction,
  contentType: ContentType
): string {
  if (allRightsReserved) {
    return 'All rights reserved.';
  }

  // For software, often include license reference
  if (contentType === 'software') {
    return 'Licensed under [specify license]. See LICENSE file for details.';
  }

  // For EU/UK, "All rights reserved" is not legally required but commonly used
  if (jurisdiction === 'EU' || jurisdiction === 'UK') {
    return 'Unauthorized use prohibited.';
  }

  return 'All rights reserved.';
}

/**
 * Generate additional notices based on content type
 */
function generateAdditionalNotices(contentType: ContentType, jurisdiction: Jurisdiction): string[] {
  const notices: string[] = [];

  switch (contentType) {
    case 'software':
      notices.push(
        'This software is provided "as is" without warranty of any kind.',
        'See LICENSE file for complete terms and conditions.'
      );
      break;

    case 'website':
      notices.push(
        'Unauthorized reproduction or distribution of this website content is prohibited.',
        'Trademarks and logos are property of their respective owners.'
      );
      break;

    case 'media':
    case 'video':
    case 'artwork':
      notices.push(
        'Unauthorized reproduction, distribution, or display is strictly prohibited.',
        'For licensing inquiries, please contact the copyright owner.'
      );
      break;

    case 'music':
      notices.push(
        'Unauthorized reproduction, public performance, or distribution is prohibited.',
        'All mechanical and synchronization rights reserved.'
      );
      break;

    case 'documentation':
      notices.push(
        'This documentation may not be reproduced without permission.',
        'Technical information is provided for reference only.'
      );
      break;
  }

  // EU-specific notices
  if (jurisdiction === 'EU') {
    notices.push(
      'Protected under EU Copyright Directive and national copyright laws of EU member states.'
    );
  }

  return notices;
}

/**
 * Generate recommendations for proper copyright notice usage
 */
function generateRecommendations(
  contentType: ContentType,
  jurisdiction: Jurisdiction,
  hasYear: boolean
): string[] {
  const recommendations: string[] = [];

  if (!hasYear) {
    recommendations.push('Consider adding the year of first publication for better protection.');
  }

  // Content-specific recommendations
  switch (contentType) {
    case 'software':
      recommendations.push(
        'Include this notice in source code headers and LICENSE file.',
        'Consider adding SPDX license identifier for machine readability.',
        'Update year range if actively maintained (e.g., 2020-2025).'
      );
      break;

    case 'website':
      recommendations.push(
        'Place notice in website footer on all pages.',
        'Include in Terms of Service and Privacy Policy pages.',
        'Update year annually or use year range.'
      );
      break;

    case 'media':
    case 'video':
    case 'artwork':
      recommendations.push(
        'Include notice in metadata (EXIF, XMP, IPTC).',
        'Display notice visibly when content is viewed.',
        'Register with appropriate copyright office for enhanced protection.'
      );
      break;

    case 'documentation':
      recommendations.push(
        'Include notice on title page or header/footer of each page.',
        'Reference version and publication date alongside copyright.'
      );
      break;
  }

  // Jurisdiction recommendations
  if (jurisdiction === 'international') {
    recommendations.push(
      'Consider registering with copyright offices in key jurisdictions.',
      'Include notice in multiple languages for broader protection.',
      'Review Berne Convention requirements for international protection.'
    );
  }

  if (jurisdiction === 'US') {
    recommendations.push(
      'Registration with US Copyright Office provides enhanced legal remedies.',
      'Consider using DMCA takedown procedures for online infringement.'
    );
  }

  recommendations.push(
    'Maintain records of creation date and authorship.',
    'Review and update copyright notice periodically.'
  );

  return recommendations;
}

/**
 * Format year string (can be single year or range)
 */
function formatYear(year?: number): string {
  if (!year) {
    return new Date().getFullYear().toString();
  }

  const currentYear = new Date().getFullYear();
  if (year < currentYear) {
    return `${year}-${currentYear}`;
  }

  return year.toString();
}

/**
 * Copyright Notice Tool
 * Generates appropriate copyright notices for different content types and jurisdictions
 *
 * This is a proper AI SDK v6 tool that can be used with streamText()
 */
export const copyrightNoticeTool = tool({
  description:
    'Generates properly formatted copyright notices for different content types (software, text, media, website, etc.) and jurisdictions (US, EU, UK, international). Includes appropriate copyright symbols, year formatting, rights statements, and jurisdiction-specific requirements.',
  inputSchema: jsonSchema<CopyrightNoticeInput>({
    type: 'object',
    properties: {
      owner: {
        type: 'string',
        description: 'Copyright owner name (individual or organization)',
      },
      year: {
        type: 'number',
        description: 'Year of first publication (optional, defaults to current year)',
      },
      contentType: {
        type: 'string',
        enum: [
          'software',
          'text',
          'media',
          'website',
          'documentation',
          'artwork',
          'music',
          'video',
        ],
        description: 'Type of content being copyrighted',
      },
      jurisdiction: {
        type: 'string',
        enum: ['US', 'EU', 'UK', 'international'],
        description: 'Primary jurisdiction (defaults to international)',
      },
      allRightsReserved: {
        type: 'boolean',
        description: 'Whether to include "All rights reserved" statement (defaults to true)',
      },
    },
    required: ['owner', 'contentType'],
    additionalProperties: false,
  }),
  async execute({
    owner,
    year,
    contentType,
    jurisdiction = 'international',
    allRightsReserved = true,
  }) {
    // Validate input
    if (!owner || owner.trim().length === 0) {
      throw new Error('Copyright owner name is required');
    }

    if (!contentType) {
      throw new Error('Content type is required');
    }

    // Get copyright symbol
    const { symbol, description } = getCopyrightSymbol(contentType, jurisdiction);

    // Format year
    const yearString = formatYear(year);

    // Get rights statement
    const rightsStatement = getRightsStatement(allRightsReserved, jurisdiction, contentType);

    // Generate short-form notice
    const notice = `${symbol} ${yearString} ${owner}. ${rightsStatement}`;

    // Generate long-form notice with additional context
    let longForm = notice;

    if (contentType === 'software') {
      longForm = `${symbol} ${yearString} ${owner}

${rightsStatement}

Permission is hereby granted to use this software subject to the terms of the applicable license agreement. Unauthorized copying, modification, distribution, or use of this software is strictly prohibited.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`;
    } else {
      longForm = `${symbol} ${yearString} ${owner}

${rightsStatement}

No part of this ${contentType} may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the copyright owner, except in the case of brief quotations embodied in critical reviews and certain other noncommercial uses permitted by copyright law.

For permission requests, please contact the copyright owner.`;
    }

    // Generate additional notices
    const additionalNotices = generateAdditionalNotices(contentType, jurisdiction);

    // Generate recommendations
    const recommendations = generateRecommendations(contentType, jurisdiction, !!year);

    return {
      notice,
      longForm,
      symbolUsed: description,
      jurisdiction,
      contentType,
      components: {
        symbol,
        year: yearString,
        owner,
        rightsStatement,
      },
      additionalNotices,
      recommendations,
    };
  },
});

/**
 * Export default for convenience
 */
export default copyrightNoticeTool;
