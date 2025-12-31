/**
 * Base64 Decode Tool for TPMJS
 * Decodes base64 encoded data to string with support for multiple output encodings
 */

import { jsonSchema, tool } from 'ai';

/**
 * Supported character encodings for base64 decoding output
 */
type Encoding = 'utf8' | 'binary' | 'hex';

/**
 * Input interface for base64 decoding
 */
interface Base64DecodeInput {
  base64: string;
  encoding?: Encoding;
}

/**
 * Output interface for base64 decode result
 */
export interface Base64DecodeResult {
  decoded: string;
  byteLength: number;
}

/**
 * Base64 Decode Tool
 * Decodes base64 encoded data to string format
 */
export const base64DecodeTool = tool({
  description:
    'Decode base64 encoded data to string. Supports utf8 (default), binary, and hex output encodings. Returns the decoded string and the byte length of the decoded data.',
  inputSchema: jsonSchema<Base64DecodeInput>({
    type: 'object',
    properties: {
      base64: {
        type: 'string',
        description: 'The base64 encoded data to decode',
      },
      encoding: {
        type: 'string',
        enum: ['utf8', 'binary', 'hex'],
        description: 'Character encoding for the output data (default: utf8)',
      },
    },
    required: ['base64'],
    additionalProperties: false,
  }),
  execute: async ({ base64, encoding = 'utf8' }): Promise<Base64DecodeResult> => {
    // Validate input
    if (typeof base64 !== 'string') {
      throw new Error('Base64 data must be a string');
    }

    // Validate encoding
    const validEncodings: Encoding[] = ['utf8', 'binary', 'hex'];
    if (!validEncodings.includes(encoding)) {
      throw new Error(
        `Invalid encoding: ${encoding}. Must be one of: ${validEncodings.join(', ')}`
      );
    }

    try {
      // Decode from base64
      const buffer = Buffer.from(base64, 'base64');

      // Convert to specified encoding
      const decoded = buffer.toString(encoding as BufferEncoding);

      return {
        decoded,
        byteLength: buffer.length,
      };
    } catch (error) {
      throw new Error(
        `Failed to decode base64: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});

export default base64DecodeTool;
