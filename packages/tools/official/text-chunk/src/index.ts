/**
 * Text Chunk Tool for TPMJS
 * Splits text into chunks by size or sentence boundaries with optional overlap.
 * Uses the sbd library for intelligent sentence detection.
 *
 * Domain rule: sentence_boundary_detection - Uses sbd library for intelligent sentence detection
 * Domain rule: chunking_with_overlap - Supports overlapping chunks to maintain context
 */

import { jsonSchema, tool } from 'ai';
// Domain rule: sentence_boundary_detection - sbd library for sentence detection
import sbd from 'sbd';

/**
 * Output interface for text chunking
 */
export interface TextChunkResult {
  chunks: Array<{
    text: string;
    startIndex: number;
    endIndex: number;
    chunkIndex: number;
  }>;
  chunkCount: number;
  totalLength: number;
  metadata: {
    averageChunkSize: number;
    maxChunkSize: number;
    overlap: number;
  };
}

type TextChunkInput = {
  text: string;
  maxChunkSize: number;
  overlap?: number;
};

/**
 * Domain rule: sentence_boundary_detection - Splits text into chunks by sentence boundaries, respecting maxChunkSize
 */
function chunkBySentences(
  text: string,
  maxChunkSize: number,
  overlap: number
): Array<{ text: string; startIndex: number; endIndex: number }> {
  // Domain rule: sentence_boundary_detection - Parse text into sentences using sbd
  const sentences: string[] = sbd.sentences(text, {
    newline_boundaries: true,
    preserve_whitespace: false,
  });

  if (sentences.length === 0) {
    return [];
  }

  const chunks: Array<{ text: string; startIndex: number; endIndex: number }> = [];
  let currentChunk = '';
  let currentStartIndex = 0;
  let sentenceStartIndex = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    if (!sentence) continue;

    // If adding this sentence would exceed maxChunkSize and we have content
    if (currentChunk.length > 0 && currentChunk.length + sentence.length > maxChunkSize) {
      // Save current chunk
      chunks.push({
        text: currentChunk.trim(),
        startIndex: currentStartIndex,
        endIndex: currentStartIndex + currentChunk.length,
      });

      // Domain rule: chunking_with_overlap - Start new chunk with overlap to maintain context
      if (overlap > 0) {
        // Calculate how many sentences to include for overlap
        let overlapText = '';
        let overlapSentences = 0;

        for (let j = i - 1; j >= 0 && overlapText.length < overlap; j--) {
          const overlapSentence = sentences[j];
          if (!overlapSentence) continue;
          if (overlapText.length + overlapSentence.length <= overlap) {
            overlapText = `${overlapSentence} ${overlapText}`;
            overlapSentences++;
          } else {
            break;
          }
        }

        currentChunk = `${overlapText + sentence} `;
        currentStartIndex = sentenceStartIndex - overlapText.length;
      } else {
        currentChunk = `${sentence} `;
        currentStartIndex = sentenceStartIndex;
      }
    } else {
      // Add sentence to current chunk
      if (currentChunk.length === 0) {
        currentStartIndex = sentenceStartIndex;
      }
      currentChunk += `${sentence} `;
    }

    sentenceStartIndex += sentence.length + 1; // +1 for space
  }

  // Add final chunk if it has content
  if (currentChunk.trim().length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      startIndex: currentStartIndex,
      endIndex: currentStartIndex + currentChunk.length,
    });
  }

  return chunks;
}

/**
 * Domain rule: chunking_with_overlap - Splits text into fixed-size chunks with overlap
 */
function chunkBySize(
  text: string,
  maxChunkSize: number,
  overlap: number
): Array<{ text: string; startIndex: number; endIndex: number }> {
  const chunks: Array<{ text: string; startIndex: number; endIndex: number }> = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + maxChunkSize, text.length);
    const chunkText = text.substring(startIndex, endIndex);

    chunks.push({
      text: chunkText,
      startIndex,
      endIndex,
    });

    // Move forward by (maxChunkSize - overlap)
    startIndex += maxChunkSize - overlap;

    // Prevent infinite loop if overlap >= maxChunkSize
    if (overlap >= maxChunkSize) {
      break;
    }
  }

  return chunks;
}

/**
 * Text Chunk Tool
 * Splits text into manageable chunks with sentence boundary awareness
 */
export const textChunkTool = tool({
  description:
    'Split text into chunks by size with sentence boundary awareness. Useful for processing large documents, preparing text for embeddings, or breaking content into manageable pieces. Uses intelligent sentence detection to avoid breaking mid-sentence when possible.',
  inputSchema: jsonSchema<TextChunkInput>({
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to split into chunks',
      },
      maxChunkSize: {
        type: 'number',
        description: 'Maximum size of each chunk in characters (must be > 0)',
        minimum: 1,
      },
      overlap: {
        type: 'number',
        description:
          'Number of characters to overlap between chunks (default: 0, must be < maxChunkSize)',
        minimum: 0,
      },
    },
    required: ['text', 'maxChunkSize'],
    additionalProperties: false,
  }),
  async execute({ text, maxChunkSize, overlap = 0 }): Promise<TextChunkResult> {
    // Validate inputs
    if (!text || typeof text !== 'string') {
      throw new Error('Text is required and must be a string');
    }

    if (typeof maxChunkSize !== 'number' || maxChunkSize <= 0) {
      throw new Error('maxChunkSize must be a positive number');
    }

    if (typeof overlap !== 'number' || overlap < 0) {
      throw new Error('overlap must be a non-negative number');
    }

    if (overlap >= maxChunkSize) {
      throw new Error('overlap must be less than maxChunkSize');
    }

    // Handle empty text
    if (text.trim().length === 0) {
      return {
        chunks: [],
        chunkCount: 0,
        totalLength: 0,
        metadata: {
          averageChunkSize: 0,
          maxChunkSize,
          overlap,
        },
      };
    }

    // Try sentence-based chunking first (more intelligent)
    let chunks: Array<{ text: string; startIndex: number; endIndex: number }>;
    try {
      chunks = chunkBySentences(text, maxChunkSize, overlap);

      // If sentence chunking produces empty result, fall back to size-based
      if (chunks.length === 0) {
        chunks = chunkBySize(text, maxChunkSize, overlap);
      }
    } catch (error) {
      // Fall back to simple size-based chunking if sentence detection fails
      chunks = chunkBySize(text, maxChunkSize, overlap);
    }

    // Add chunk indices
    const chunksWithIndex = chunks.map((chunk, index) => ({
      ...chunk,
      chunkIndex: index,
    }));

    // Calculate average chunk size
    const totalChunkSize = chunksWithIndex.reduce((sum, chunk) => sum + chunk.text.length, 0);
    const averageChunkSize =
      chunksWithIndex.length > 0 ? Math.round(totalChunkSize / chunksWithIndex.length) : 0;

    return {
      chunks: chunksWithIndex,
      chunkCount: chunksWithIndex.length,
      totalLength: text.length,
      metadata: {
        averageChunkSize,
        maxChunkSize,
        overlap,
      },
    };
  },
});

export default textChunkTool;
