/**
 * Style Rewrite Tool for TPMJS
 * Rewrites text to a specified tone while preserving meaning and structure.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Supported tone types
 */
export type ToneType = 'formal' | 'terse' | 'friendly' | 'technical';

/**
 * Change note describing what was modified
 */
export interface ChangeNote {
  type: string;
  description: string;
}

/**
 * Output interface for style rewrite
 */
export interface StyleRewriteResult {
  rewritten: string;
  originalTone: string;
  targetTone: ToneType;
  changeNotes: ChangeNote[];
  preservedElements: string[];
}

type StyleRewriteInput = {
  text: string;
  targetTone: ToneType;
};

/**
 * Detects the current tone of the text
 *
 * Domain rule: tone_detection - Uses regex keyword matching (furthermore, hey, algorithm) and sentence length analysis to classify tone
 */
function detectTone(text: string): string {
  // Formal indicators
  const formalCount =
    (text.match(/\b(furthermore|moreover|consequently|therefore|thus|hence)\b/gi)?.length || 0) +
    (text.match(/\b(shall|ought|must|kindly)\b/gi)?.length || 0);

  // Friendly indicators
  const friendlyCount =
    (text.match(/\b(hey|hi|thanks|awesome|great|cool|amazing)\b/gi)?.length || 0) +
    (text.match(/[!😊😀👍]/gu)?.length || 0);

  // Technical indicators
  const technicalCount =
    (text.match(
      /\b(algorithm|implementation|function|parameter|variable|execute|compile|deploy)\b/gi
    )?.length || 0) + (text.match(/\b(API|SQL|HTTP|JSON|CSS|HTML)\b/g)?.length || 0);

  // Terse indicators (short sentences, minimal words)
  const avgSentenceLength =
    text.split(/[.!?]+/).reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) /
    Math.max(1, text.split(/[.!?]+/).length);
  const isTerse = avgSentenceLength < 10;

  if (technicalCount > formalCount && technicalCount > friendlyCount) return 'technical';
  if (formalCount > friendlyCount) return 'formal';
  if (friendlyCount > 0) return 'friendly';
  if (isTerse) return 'terse';

  return 'neutral';
}

/**
 * Preserves structured elements like lists, code blocks, and formatting
 *
 * Domain rule: structure_preservation - Uses regex to extract code blocks (```), inline code (`), URLs (http://), replaces with markers
 */
function preserveStructure(text: string): { preserved: string[]; markers: Map<string, string> } {
  const preserved: string[] = [];
  const markers = new Map<string, string>();
  let markerIndex = 0;

  let result = text;

  // Preserve code blocks
  const codeBlockMatches = text.match(/```[\s\S]*?```/g);
  if (codeBlockMatches) {
    for (const match of codeBlockMatches) {
      const marker = `__CODE_BLOCK_${markerIndex++}__`;
      markers.set(marker, match);
      preserved.push('code blocks');
      result = result.replace(match, marker);
    }
  }

  // Preserve inline code
  const inlineCodeMatches = text.match(/`[^`]+`/g);
  if (inlineCodeMatches) {
    for (const match of inlineCodeMatches) {
      const marker = `__INLINE_CODE_${markerIndex++}__`;
      markers.set(marker, match);
      preserved.push('inline code');
      result = result.replace(match, marker);
    }
  }

  // Preserve URLs
  const urlMatches = text.match(/https?:\/\/[^\s]+/g);
  if (urlMatches) {
    for (const match of urlMatches) {
      const marker = `__URL_${markerIndex++}__`;
      markers.set(marker, match);
      preserved.push('URLs');
      result = result.replace(match, marker);
    }
  }

  return { preserved: [...new Set(preserved)], markers };
}

/**
 * Restores preserved elements
 */
function restoreStructure(text: string, markers: Map<string, string>): string {
  let result = text;
  for (const [marker, original] of markers.entries()) {
    result = result.replace(marker, original);
  }
  return result;
}

/**
 * Applies tone transformations to text
 *
 * Domain rule: tone_transformation - Uses regex replacements for each tone: formal (expand contractions), terse (remove filler), friendly (add contractions), technical (use technical verbs)
 */
function applyTone(
  text: string,
  targetTone: ToneType
): { rewritten: string; changes: ChangeNote[] } {
  const changes: ChangeNote[] = [];
  let result = text;

  if (targetTone === 'formal') {
    // Make formal
    result = result
      .replace(/\bcan't\b/gi, 'cannot')
      .replace(/\bdon't\b/gi, 'do not')
      .replace(/\bwon't\b/gi, 'will not')
      .replace(/\bisn't\b/gi, 'is not')
      .replace(/\baren't\b/gi, 'are not')
      .replace(/\bhasn't\b/gi, 'has not')
      .replace(/\bhaven't\b/gi, 'have not')
      .replace(/\bdidn't\b/gi, 'did not')
      .replace(/\bwouldn't\b/gi, 'would not')
      .replace(/\bshouldn't\b/gi, 'should not')
      .replace(/\bcouldn't\b/gi, 'could not')
      .replace(/\bhi\b/gi, 'Hello')
      .replace(/\bhey\b/gi, 'Greetings')
      .replace(/\bthanks\b/gi, 'Thank you')
      .replace(/[!]{2,}/g, '.');

    if (result !== text) {
      changes.push({
        type: 'formalization',
        description: 'Expanded contractions and formal greetings',
      });
    }
  } else if (targetTone === 'terse') {
    // Make terse
    result = result
      .replace(/\b(very|really|quite|extremely|absolutely)\s+/gi, '')
      .replace(/\bin order to\b/gi, 'to')
      .replace(/\bdue to the fact that\b/gi, 'because')
      .replace(/\bat this point in time\b/gi, 'now')
      .replace(/\bfor the purpose of\b/gi, 'for')
      .replace(/\bin the event that\b/gi, 'if')
      .replace(/\bas a matter of fact\b/gi, '')
      .replace(/\bit is important to note that\b/gi, 'Note:')
      .replace(/\bplease be advised that\b/gi, '');

    if (result !== text) {
      changes.push({ type: 'terseness', description: 'Removed filler words and verbose phrases' });
    }
  } else if (targetTone === 'friendly') {
    // Make friendly
    result = result
      .replace(/\bcannot\b/gi, "can't")
      .replace(/\bdo not\b/gi, "don't")
      .replace(/\bwill not\b/gi, "won't")
      .replace(/\bis not\b/gi, "isn't")
      .replace(/\bHello\b/gi, 'Hi')
      .replace(/\bGreetings\b/gi, 'Hey')
      .replace(/\bThank you\b/gi, 'Thanks');

    // Add enthusiasm markers (sparingly)
    result = result.replace(/(\.\s+)(?=[A-Z])/g, (match) => {
      // Only on 20% of sentences
      return Math.random() < 0.2 ? '! ' : match;
    });

    if (result !== text) {
      changes.push({ type: 'friendliness', description: 'Used contractions and casual language' });
    }
  } else if (targetTone === 'technical') {
    // Make technical
    result = result
      .replace(/\bmake\b/gi, 'implement')
      .replace(/\bfix\b/gi, 'resolve')
      .replace(/\bchange\b/gi, 'modify')
      .replace(/\bget\b/gi, 'retrieve')
      .replace(/\bshow\b/gi, 'display')
      .replace(/\buse\b/gi, 'utilize');

    if (result !== text) {
      changes.push({ type: 'technicality', description: 'Used technical terminology' });
    }
  }

  return { rewritten: result, changes };
}

/**
 * Style Rewrite Tool
 * Rewrites text to a specified tone while preserving meaning and structure
 */
export const styleRewriteTool = tool({
  description:
    'Rewrite text to match a specified tone (formal, terse, friendly, or technical) while preserving core meaning, facts, and structure. Automatically preserves code blocks, URLs, and formatting. Returns the rewritten text with notes about what changed and what was preserved.',
  inputSchema: jsonSchema<StyleRewriteInput>({
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text to rewrite',
      },
      targetTone: {
        type: 'string',
        description: 'Target tone: formal, terse, friendly, or technical',
        enum: ['formal', 'terse', 'friendly', 'technical'],
      },
    },
    required: ['text', 'targetTone'],
    additionalProperties: false,
  }),
  async execute({ text, targetTone }): Promise<StyleRewriteResult> {
    // Domain rule: input_validation - Validates text (non-empty string), targetTone (enum: formal, terse, friendly, technical)
    // Validate inputs
    if (!text || typeof text !== 'string') {
      throw new Error('text is required and must be a string');
    }

    if (text.trim().length === 0) {
      throw new Error('text cannot be empty');
    }

    const validTones: ToneType[] = ['formal', 'terse', 'friendly', 'technical'];
    if (!validTones.includes(targetTone as ToneType)) {
      throw new Error(`targetTone must be one of: ${validTones.join(', ')}. Got: ${targetTone}`);
    }

    // Detect original tone
    const originalTone = detectTone(text);

    // Preserve structure elements (code, URLs, etc.)
    const { preserved, markers } = preserveStructure(text);
    const textWithMarkers = Object.keys(markers).reduce(
      (acc, marker) => acc.replace(markers.get(marker)!, marker),
      text
    );

    // Apply tone transformation
    const { rewritten: rewrittenWithMarkers, changes } = applyTone(
      textWithMarkers,
      targetTone as ToneType
    );

    // Restore preserved elements
    const rewritten = restoreStructure(rewrittenWithMarkers, markers);

    // Add note about structure preservation if any
    if (preserved.length > 0) {
      changes.push({
        type: 'preservation',
        description: `Preserved: ${preserved.join(', ')}`,
      });
    }

    return {
      rewritten,
      originalTone,
      targetTone: targetTone as ToneType,
      changeNotes: changes,
      preservedElements: preserved,
    };
  },
});

export default styleRewriteTool;
