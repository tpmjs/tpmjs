/**
 * Build prompts for OpenAI image generation
 */

import type { PageContent } from './types';

/**
 * Category-specific visual hints for tool pages
 */
const CATEGORY_VISUALS: Record<string, string> = {
  'text-analysis':
    'flowing text streams, linguistic wave patterns, word-like abstract shapes floating in space',
  'code-generation':
    'code bracket symbols, terminal-like geometric shapes, syntax highlighting color bands',
  'data-processing':
    'data pipeline flows, transformation arrows, structured grid patterns with glowing nodes',
  'image-generation':
    'abstract brush strokes, creative color gradients, artistic shape compositions',
  'web-scraping': 'interconnected web-like node patterns, spider web motifs, document flow shapes',
  search:
    'magnifying glass energy radiating outward, discovery beam patterns, concentric search rings',
  integration: 'puzzle pieces connecting, API endpoint symbols, synchronization arrows',
  database: 'cylindrical storage shapes, connected data nodes, structured table patterns',
  ai: 'neural network node patterns, brain-like abstract shapes, intelligence flowing streams',
  automation: 'gear mechanisms, workflow arrows, robotic precision patterns',
  communication: 'message bubble abstractions, signal wave patterns, connection lines',
  file: 'folder shapes, document stacks, organized file grid patterns',
  weather: 'cloud formations, sun ray patterns, atmospheric gradients',
  location: 'map pin abstractions, geographic grid patterns, compass-like radial designs',
  time: 'clock face abstractions, timeline flow patterns, temporal wave forms',
  math: 'geometric shapes, equation-like line patterns, mathematical precision grids',
  other: 'abstract tech patterns, geometric shapes, neural connection lines',
};

/**
 * Base style prompt for all OG images
 */
const BASE_STYLE = `Create a 1200x630 pixel Open Graph image.

STRICT STYLE REQUIREMENTS:
- Dark gradient background from #0a0a0a to #1a1a1a
- Primary accent color: cyan (#00d4ff)
- Secondary accent color: purple (#8b5cf6)
- Modern, minimalist, professional tech aesthetic
- Abstract geometric shapes or flowing patterns
- Subtle depth and dimensionality with glow effects
- Clean composition with balanced visual weight

CRITICAL: Generate ONLY abstract visuals. Do NOT include any text, letters, numbers, words, or readable characters in the image.`;

/**
 * Build page-specific context for the prompt
 */
function buildPageContext(content: PageContent): string {
  switch (content.pageType) {
    case 'tool': {
      const category = content.tool?.category || 'other';
      const visualHint = CATEGORY_VISUALS[category] || CATEGORY_VISUALS.other;

      return `
CONTEXT: Developer tool named "${content.tool?.name}"
CATEGORY: ${category}
PURPOSE: ${content.tool?.description?.slice(0, 150) || 'AI-powered developer tool'}

VISUAL ELEMENTS TO INCLUDE:
${visualHint}

MOOD: Powerful, trustworthy, professional, cutting-edge developer tool`;
    }

    case 'home':
      return `
CONTEXT: Homepage for TPMJS - a registry of AI/LLM tools for developers

VISUAL ELEMENTS TO INCLUDE:
- Interconnected glowing nodes forming a network pattern
- Flowing data streams with particle effects
- Neural network-inspired radiating patterns
- Central focal point with emanating connections

MOOD: Cutting-edge, innovative, comprehensive, developer-focused`;

    case 'docs':
      return `
CONTEXT: Documentation hub for a developer tool registry

VISUAL ELEMENTS TO INCLUDE:
- Layered page-like shapes stacked in 3D space
- Knowledge structure visualization with connected nodes
- Organized grid patterns suggesting structured information
- Glowing connection lines between concept nodes

MOOD: Organized, comprehensive, accessible, helpful`;

    case 'stats':
      return `
CONTEXT: Statistics dashboard showing real-time registry metrics

VISUAL ELEMENTS TO INCLUDE:
- Abstract bar chart shapes rising upward
- Trend lines with glowing data points
- Circular gauge patterns
- Growth-oriented upward visual flow

MOOD: Data-driven, analytical, transparent, growth-focused`;

    case 'search':
      return `
CONTEXT: Search interface for discovering AI tools

VISUAL ELEMENTS TO INCLUDE:
- Magnifying glass shape radiating search beams
- Grid of abstract tool icons
- Discovery-oriented radiating patterns
- Exploratory path visualizations

MOOD: Discovery, exploration, finding solutions`;

    case 'publish':
      return `
CONTEXT: Guide for publishing tools to the registry

VISUAL ELEMENTS TO INCLUDE:
- Package box shapes with upload arrows
- Publication flow visualization
- Building block patterns coming together
- Contribution-oriented upward movement

MOOD: Creative, contributive, community-building`;

    case 'faq':
      return `
CONTEXT: FAQ page answering common questions

VISUAL ELEMENTS TO INCLUDE:
- Question mark abstract shapes with answer connections
- Branching knowledge tree patterns
- Illumination-like glowing effects
- Organized information clusters

MOOD: Helpful, clarifying, supportive`;

    case 'playground':
      return `
CONTEXT: Interactive playground for testing AI tools

VISUAL ELEMENTS TO INCLUDE:
- Interactive particle systems
- Experimental visualization patterns
- Dynamic energy flows
- Testing-oriented active elements

MOOD: Experimental, interactive, playful yet professional`;

    case 'spec':
      return `
CONTEXT: Technical specification for TPMJS tools

VISUAL ELEMENTS TO INCLUDE:
- Schema-like structured patterns
- Technical blueprint aesthetic
- Precise geometric arrangements
- Specification document abstractions

MOOD: Technical, precise, authoritative`;

    case 'sdk':
      return `
CONTEXT: SDK for integrating TPMJS tools

VISUAL ELEMENTS TO INCLUDE:
- Integration connection patterns
- API endpoint visualizations
- Library-like stacked components
- Developer toolkit arrangements

MOOD: Technical, integrated, powerful`;

    case 'changelog':
      return `
CONTEXT: Release history and updates

VISUAL ELEMENTS TO INCLUDE:
- Timeline flow patterns
- Version milestone markers
- Evolution and progression visualization
- Update wave patterns

MOOD: Progress, evolution, continuous improvement`;

    case 'how-it-works':
      return `
CONTEXT: Explanation of TPMJS architecture

VISUAL ELEMENTS TO INCLUDE:
- Process flow visualization
- Architecture diagram abstractions
- Step-by-step progression patterns
- System component connections

MOOD: Educational, clear, systematic`;

    case 'terms':
    case 'privacy':
      return `
CONTEXT: Legal document page

VISUAL ELEMENTS TO INCLUDE:
- Shield and protection symbols abstracted
- Secure lock patterns
- Trust-oriented design elements
- Professional document aesthetic

MOOD: Trustworthy, secure, professional`;

    default:
      return `
CONTEXT: TPMJS - AI Tool Registry for developers

VISUAL ELEMENTS TO INCLUDE:
- Abstract tech patterns
- Neural network connections
- Modern developer aesthetic
- Professional geometric shapes

MOOD: Professional, innovative, reliable`;
  }
}

/**
 * Build the complete prompt for OpenAI image generation
 */
export function buildOGPrompt(content: PageContent): string {
  const pageContext = buildPageContext(content);
  return `${BASE_STYLE}\n${pageContext}`;
}
