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
const BASE_STYLE = `Create a 1536x1024 pixel Open Graph social media preview image.

DESIGN STYLE:
- Dark gradient background from #0a0a0a (left) to #1a1a2e (right)
- Primary accent: vibrant cyan (#00d4ff) for highlights and glows
- Secondary accent: electric purple (#8b5cf6) for depth
- Modern tech aesthetic with subtle grid patterns in background
- Soft glow effects and light rays emanating from focal points
- Clean, professional composition suitable for social media sharing

LAYOUT:
- Left side (40%): Abstract visual elements and iconography
- Right side (60%): Title and description text area
- Visual balance with text clearly readable against dark background`;

/**
 * Build page-specific context for the prompt
 */
function buildPageContext(content: PageContent): string {
  switch (content.pageType) {
    case 'tool': {
      const category = content.tool?.category || 'other';
      const visualHint = CATEGORY_VISUALS[category] || CATEGORY_VISUALS.other;
      const toolName = content.tool?.name || content.title;
      const description = content.tool?.description || content.description;

      return `
TEXT TO DISPLAY:
- Title (large, bold, white): "${toolName}"
- Subtitle (smaller, cyan): "${content.tool?.packageName || 'npm package'}"
- Description (medium, gray): "${description.slice(0, 100)}${description.length > 100 ? '...' : ''}"

LEFT SIDE VISUALS:
${visualHint}
- Category icon representing "${category}"

BRANDING: Small "TPMJS" logo in bottom-right corner`;
    }

    case 'home':
      return `
TEXT TO DISPLAY:
- Title (large, bold, white): "TPMJS"
- Tagline (medium, cyan glow): "Tool Package Manager for AI Agents"
- Subtitle (smaller, gray): "Discover, share, and integrate AI tools"

LEFT SIDE VISUALS:
- Interconnected glowing nodes forming a network
- Neural network-inspired radiating patterns from center
- Flowing data streams with particle effects
- Multiple small tool icons orbiting a central hub`;

    case 'docs':
      return `
TEXT TO DISPLAY:
- Title (large, bold, white): "Documentation"
- Tagline (medium, cyan): "Complete Guide to TPMJS"
- Subtitle (smaller, gray): "Learn how to discover, use, and publish AI tools"

LEFT SIDE VISUALS:
- Layered document pages in 3D perspective
- Code snippet abstractions with syntax highlighting colors
- Knowledge graph with connected nodes
- Book/guide icon with glowing pages`;

    case 'stats':
      return `
TEXT TO DISPLAY:
- Title (large, bold, white): "Registry Statistics"
- Tagline (medium, cyan): "Real-time Metrics Dashboard"
- Subtitle (smaller, gray): "Track tools, downloads, and community growth"

LEFT SIDE VISUALS:
- Rising bar charts with glowing tops
- Upward trending line graphs
- Circular progress gauges
- Numbers floating with glow effects`;

    case 'search':
      return `
TEXT TO DISPLAY:
- Title (large, bold, white): "Tool Search"
- Tagline (medium, cyan): "Discover AI Tools"
- Subtitle (smaller, gray): "Find the perfect tool for your AI agent"

LEFT SIDE VISUALS:
- Large magnifying glass with radiating search beams
- Grid of small tool icons being highlighted
- Filter/category chips floating
- Discovery sparkle effects`;

    case 'publish':
      return `
TEXT TO DISPLAY:
- Title (large, bold, white): "Publish Your Tool"
- Tagline (medium, cyan): "Share with the Community"
- Subtitle (smaller, gray): "Add your AI tool to the TPMJS registry"

LEFT SIDE VISUALS:
- Package box with upload arrow
- npm logo abstraction
- Publishing workflow with connected steps
- Rocket launch effect`;

    case 'faq':
      return `
TEXT TO DISPLAY:
- Title (large, bold, white): "FAQ"
- Tagline (medium, cyan): "Frequently Asked Questions"
- Subtitle (smaller, gray): "Get answers to common questions about TPMJS"

LEFT SIDE VISUALS:
- Question marks transforming into lightbulbs
- Branching Q&A tree structure
- Speech bubbles with answer symbols
- Help/support iconography`;

    case 'playground':
      return `
TEXT TO DISPLAY:
- Title (large, bold, white): "Playground"
- Tagline (medium, cyan): "Test AI Tools Live"
- Subtitle (smaller, gray): "Experiment with tools in your browser"

LEFT SIDE VISUALS:
- Interactive terminal window with cursor
- Flying code snippets
- Play button with energy rings
- Experimental beaker/flask with bubbles`;

    case 'spec':
      return `
TEXT TO DISPLAY:
- Title (large, bold, white): "Specification"
- Tagline (medium, cyan): "TPMJS Tool Format"
- Subtitle (smaller, gray): "Technical specification for tool packages"

LEFT SIDE VISUALS:
- JSON/schema structure visualization
- Blueprint grid patterns
- Technical document with code blocks
- Checkmark validation symbols`;

    case 'sdk':
      return `
TEXT TO DISPLAY:
- Title (large, bold, white): "SDK"
- Tagline (medium, cyan): "Developer Integration Kit"
- Subtitle (smaller, gray): "Integrate TPMJS tools into your applications"

LEFT SIDE VISUALS:
- API connection endpoints
- Code library stack
- Integration puzzle pieces connecting
- Developer tools (wrench, code brackets)`;

    case 'changelog':
      return `
TEXT TO DISPLAY:
- Title (large, bold, white): "Changelog"
- Tagline (medium, cyan): "What's New"
- Subtitle (smaller, gray): "Latest updates and release history"

LEFT SIDE VISUALS:
- Vertical timeline with glowing milestones
- Version number badges
- Git branch visualization
- Update/refresh arrows`;

    case 'how-it-works':
      return `
TEXT TO DISPLAY:
- Title (large, bold, white): "How It Works"
- Tagline (medium, cyan): "Under the Hood"
- Subtitle (smaller, gray): "Learn how TPMJS connects AI agents with tools"

LEFT SIDE VISUALS:
- Process flowchart with 3-4 connected steps
- Gear/cog mechanisms
- Data flow arrows between components
- Architecture diagram abstraction`;

    case 'terms':
      return `
TEXT TO DISPLAY:
- Title (large, bold, white): "Terms of Service"
- Tagline (medium, cyan): "Legal Agreement"
- Subtitle (smaller, gray): "Terms and conditions for using TPMJS"

LEFT SIDE VISUALS:
- Legal document with seal
- Handshake symbol
- Checkmark/agreement icons
- Professional shield`;

    case 'privacy':
      return `
TEXT TO DISPLAY:
- Title (large, bold, white): "Privacy Policy"
- Tagline (medium, cyan): "Your Data, Protected"
- Subtitle (smaller, gray): "How we handle and protect your information"

LEFT SIDE VISUALS:
- Shield with lock symbol
- Privacy/eye icon with protection
- Secure data flow visualization
- Trust badges`;

    default:
      return `
TEXT TO DISPLAY:
- Title (large, bold, white): "${content.title}"
- Tagline (medium, cyan): "TPMJS"
- Subtitle (smaller, gray): "${content.description.slice(0, 80)}"

LEFT SIDE VISUALS:
- Abstract tech patterns
- Neural network connections
- Modern geometric shapes`;
  }
}

/**
 * Typography instructions for text rendering
 */
const TYPOGRAPHY = `
TYPOGRAPHY REQUIREMENTS:
- Use clean, modern sans-serif font (like Inter, Helvetica, or system UI)
- Title: Bold weight, large size, pure white (#ffffff)
- Tagline: Regular weight, medium size, cyan (#00d4ff) with subtle glow
- Subtitle: Light weight, smaller size, muted gray (#888888)
- Ensure high contrast and readability against dark background
- Text should be crisp and professional`;

/**
 * Build the complete prompt for OpenAI image generation
 */
export function buildOGPrompt(content: PageContent): string {
  const pageContext = buildPageContext(content);
  return `${BASE_STYLE}\n${pageContext}\n${TYPOGRAPHY}`;
}
