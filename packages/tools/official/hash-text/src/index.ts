/**
 * Hash Text Tool for TPMJS
 * Hash text using various cryptographic algorithms
 */

import { createHash } from 'node:crypto';
import { jsonSchema, tool } from 'ai';

/**
 * Supported hash algorithms
 */
type HashAlgorithm = 'md5' | 'sha1' | 'sha256' | 'sha512';

/**
 * Input interface for text hashing
 */
interface HashTextInput {
  text: string;
  algorithm: HashAlgorithm;
}

/**
 * Output interface for hash text result
 */
export interface HashTextResult {
  hash: string;
  algorithm: string;
  inputLength: number;
}

/**
 * Hash Text Tool
 * Creates cryptographic hashes from text input
 */
export const hashTextTool = tool({
  description:
    'Hash text using cryptographic algorithms (MD5, SHA-1, SHA-256, SHA-512). Returns the hexadecimal hash digest, the algorithm used, and the input text length. Useful for generating checksums, content fingerprints, or data integrity verification.',
  inputSchema: jsonSchema<HashTextInput>({
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to hash',
      },
      algorithm: {
        type: 'string',
        enum: ['md5', 'sha1', 'sha256', 'sha512'],
        description: 'Hash algorithm to use',
      },
    },
    required: ['text', 'algorithm'],
    additionalProperties: false,
  }),
  execute: async ({ text, algorithm }): Promise<HashTextResult> => {
    // Validate input
    if (typeof text !== 'string') {
      throw new Error('Text must be a string');
    }

    // Validate algorithm
    const validAlgorithms: HashAlgorithm[] = ['md5', 'sha1', 'sha256', 'sha512'];
    if (!validAlgorithms.includes(algorithm)) {
      throw new Error(
        `Invalid algorithm: ${algorithm}. Must be one of: ${validAlgorithms.join(', ')}`
      );
    }

    try {
      // Create hash
      const hash = createHash(algorithm);
      hash.update(text, 'utf8');
      const digest = hash.digest('hex');

      return {
        hash: digest,
        algorithm,
        inputLength: text.length,
      };
    } catch (error) {
      throw new Error(
        `Failed to hash text: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});

export default hashTextTool;
