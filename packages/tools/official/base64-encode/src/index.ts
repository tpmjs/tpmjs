/**
 * Base64 Encode Tool for TPMJS
 * Encodes string data to base64 format with support for multiple character encodings
 */

import { jsonSchema, tool } from 'ai';

/**
 * Supported character encodings for base64 encoding
 */
type Encoding = 'utf8' | 'binary' | 'hex';

/**
 * Input interface for base64 encoding
 */
interface Base64EncodeInput {
  data: string;
  encoding?: Encoding;
}

/**
 * Output interface for base64 encode result
 */
export interface Base64EncodeResult {
  base64: string;
  byteLength: number;
}

/**
 * Base64 Encode Tool
 * Encodes string or buffer data to base64 format
 */
export const base64EncodeTool = tool({
  description:
    'Encode string or buffer to base64 format. Supports utf8 (default), binary, and hex character encodings. Returns the base64 encoded string and the byte length of the original data.',
  inputSchema: jsonSchema<Base64EncodeInput>({
    type: 'object',
    properties: {
      data: {
        type: 'string',
        description: 'The data to encode to base64',
      },
      encoding: {
        type: 'string',
        enum: ['utf8', 'binary', 'hex'],
        description: 'Character encoding of the input data (default: utf8)',
      },
    },
    required: ['data'],
    additionalProperties: false,
  }),
  execute: async ({ data, encoding = 'utf8' }): Promise<Base64EncodeResult> => {
    // Validate input
    if (typeof data !== 'string') {
      throw new Error('Data must be a string');
    }

    // Validate encoding
    const validEncodings: Encoding[] = ['utf8', 'binary', 'hex'];
    if (!validEncodings.includes(encoding)) {
      throw new Error(
        `Invalid encoding: ${encoding}. Must be one of: ${validEncodings.join(', ')}`
      );
    }

    try {
      // Create buffer from input data with specified encoding
      const buffer = Buffer.from(data, encoding as BufferEncoding);

      // Encode to base64
      const base64 = buffer.toString('base64');

      return {
        base64,
        byteLength: buffer.length,
      };
    } catch (error) {
      throw new Error(
        `Failed to encode data: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});

export default base64EncodeTool;
