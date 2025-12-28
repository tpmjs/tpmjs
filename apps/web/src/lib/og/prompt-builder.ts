/**
 * Build prompts for OpenAI image generation
 * Creates comprehensive prompts for stunning OG images
 */

import type { PageContent } from './types';

/**
 * Build the complete prompt for OpenAI image generation
 */
export function buildOGPrompt(content: PageContent): string {
  const baseStyle = `You are creating a premium Open Graph social media preview image (1536x1024 pixels).

CRITICAL DESIGN REQUIREMENTS:
- Ultra-modern, sleek tech startup aesthetic
- Deep black/charcoal background (#0a0a0a to #12121a gradient)
- Vibrant neon accents: electric cyan (#00F0FF), vivid purple (#A855F7), hot pink (#EC4899)
- Glassmorphism elements with subtle blur and transparency
- Floating 3D geometric shapes with soft glow effects
- Subtle grid or dot pattern in the background for depth
- Professional typography: clean sans-serif fonts (like Inter or SF Pro)
- High contrast for social media visibility
- NO stock photo look - this should feel like premium SaaS branding`;

  switch (content.pageType) {
    case 'home':
      return `${baseStyle}

CREATE AN IMAGE FOR: TPMJS Homepage - Tool Package Manager for AI Agents

VISUAL CONCEPT:
Create a stunning hero image showing an interconnected network of glowing nodes representing AI tools.
- Central glowing orb/hub emanating connection lines to smaller tool nodes
- Floating 3D hexagons, cubes, and spheres with glassmorphism effect
- Particle effects and light trails connecting elements
- Subtle code/terminal aesthetics in the background
- Neural network patterns with pulsing energy

TEXT TO RENDER (use elegant typography):
- Large bold title: "TPMJS" in white with subtle cyan glow
- Tagline below: "Tool Package Manager for AI Agents" in cyan (#00F0FF)
- Small descriptor: "Discover • Share • Integrate" in muted gray

COMPOSITION:
- Title positioned in the right 60% of the image
- Visual elements concentrated on the left 40%
- Plenty of breathing room, not cluttered
- Text must be crisp and highly readable`;

    case 'docs':
      return `${baseStyle}

CREATE AN IMAGE FOR: TPMJS Documentation Hub

VISUAL CONCEPT:
Create an elegant documentation/knowledge visualization.
- Floating translucent document pages with code snippets visible
- Layered cards showing different doc sections stacked in 3D perspective
- Glowing bookmark/chapter markers
- Flowing lines connecting knowledge nodes
- Subtle syntax highlighting colors (cyan, purple, green) on code elements
- Open book or guide icon with emanating light

TEXT TO RENDER:
- Large title: "Documentation" in bold white
- Subtitle: "Complete Guide to TPMJS" in cyan
- Small text: "Tutorials • API Reference • Examples" in gray

COMPOSITION:
- Clean, organized feel reflecting documentation structure
- Visual hierarchy showing organized information`;

    case 'stats':
      return `${baseStyle}

CREATE AN IMAGE FOR: TPMJS Registry Statistics Dashboard

VISUAL CONCEPT:
Create a data visualization masterpiece.
- Glowing 3D bar charts rising from the bottom
- Floating holographic pie charts and line graphs
- Real-time data streams represented as flowing particles
- Dashboard-like grid layout with stat cards
- Upward trending arrows with motion blur
- Numbers and metrics floating with glow effects
- Analytics iconography (charts, graphs, metrics)

TEXT TO RENDER:
- Large title: "Registry Statistics" in bold white
- Subtitle: "Real-time Analytics Dashboard" in cyan
- Small text: "Tools • Downloads • Growth Metrics" in gray

COMPOSITION:
- Dynamic upward energy suggesting growth
- Data visualizations should feel alive and real-time`;

    case 'search':
      return `${baseStyle}

CREATE AN IMAGE FOR: TPMJS Tool Search & Discovery

VISUAL CONCEPT:
Create a discovery/exploration themed image.
- Large glowing magnifying glass or search lens as focal point
- Grid of floating tool cards being illuminated by search beam
- Filter chips and category tags floating around
- Spotlight effect highlighting discovered tools
- Particle effects suggesting exploration
- Search bar UI element with glowing cursor

TEXT TO RENDER:
- Large title: "Tool Search" in bold white
- Subtitle: "Discover AI Tools" in cyan
- Small text: "Search • Filter • Find the Perfect Tool" in gray

COMPOSITION:
- Search/discovery energy radiating outward
- Sense of infinite possibilities being explored`;

    case 'publish':
      return `${baseStyle}

CREATE AN IMAGE FOR: Publish Your Tool to TPMJS

VISUAL CONCEPT:
Create an empowering, creative publishing visualization.
- Package/box icon transforming into light particles uploading upward
- Rocket launch trajectory with motion trails
- npm logo subtly integrated
- Code editor snippets showing package.json
- Success checkmarks and completion badges floating
- Community icons showing reach and distribution
- Upload arrow with energy trail

TEXT TO RENDER:
- Large title: "Publish Your Tool" in bold white
- Subtitle: "Share with the Community" in cyan
- Small text: "npm publish • Instant Distribution • Global Reach" in gray

COMPOSITION:
- Upward, aspirational energy
- Feeling of launching something into the world`;

    case 'playground':
      return `${baseStyle}

CREATE AN IMAGE FOR: TPMJS Interactive Playground

VISUAL CONCEPT:
Create an experimental, hands-on testing environment.
- Terminal/console window with glowing cursor and code
- Interactive sliders, buttons, and UI controls floating
- Real-time output visualization with streaming text
- Play button with pulsing energy rings
- Beaker/flask icon suggesting experimentation
- Live code execution sparkle effects
- Split-pane editor aesthetic

TEXT TO RENDER:
- Large title: "Playground" in bold white
- Subtitle: "Test AI Tools Live" in cyan
- Small text: "Interactive • Real-time • Experiment Freely" in gray

COMPOSITION:
- Playful but professional energy
- Feeling of hands-on experimentation`;

    case 'faq':
      return `${baseStyle}

CREATE AN IMAGE FOR: TPMJS FAQ - Frequently Asked Questions

VISUAL CONCEPT:
Create a helpful, illuminating Q&A visualization.
- Large question marks transforming into lightbulbs (answers)
- Speech bubbles with Q and A floating
- Knowledge tree with branching answers
- Glowing "?" becoming "✓" transformation effect
- Helpful assistant/guide iconography
- Organized FAQ cards floating in space

TEXT TO RENDER:
- Large title: "FAQ" in bold white
- Subtitle: "Frequently Asked Questions" in cyan
- Small text: "Quick Answers • Common Questions • Help Center" in gray

COMPOSITION:
- Helpful, supportive energy
- Transformation from confusion to clarity`;

    case 'spec':
      return `${baseStyle}

CREATE AN IMAGE FOR: TPMJS Technical Specification

VISUAL CONCEPT:
Create a precise, technical documentation aesthetic.
- JSON/code structure visualization with syntax highlighting
- Blueprint grid patterns with technical precision
- Schema diagrams with connected nodes
- Validation checkmarks and type indicators
- Technical document with glowing sections
- Bracket symbols { } floating with glow

TEXT TO RENDER:
- Large title: "Specification" in bold white
- Subtitle: "TPMJS Tool Format" in cyan
- Small text: "Schema • Types • Validation Rules" in gray

COMPOSITION:
- Precise, authoritative, technical feel
- Clean structure reflecting specification clarity`;

    case 'sdk':
      return `${baseStyle}

CREATE AN IMAGE FOR: TPMJS SDK - Developer Integration Kit

VISUAL CONCEPT:
Create a powerful developer toolkit visualization.
- Code snippets floating showing SDK usage
- API endpoint connections with glowing lines
- Package/library stack with version badges
- Integration puzzle pieces clicking together
- Terminal windows showing npm install commands
- SDK logo/badge with power emanation

TEXT TO RENDER:
- Large title: "SDK" in bold white
- Subtitle: "Developer Integration Kit" in cyan
- Small text: "TypeScript • Easy Integration • Full API Access" in gray

COMPOSITION:
- Powerful, developer-focused energy
- Feeling of unlocking capabilities`;

    case 'changelog':
      return `${baseStyle}

CREATE AN IMAGE FOR: TPMJS Changelog - Release History

VISUAL CONCEPT:
Create a timeline/evolution visualization.
- Vertical timeline with glowing milestone nodes
- Version badges (v1.0, v2.0) floating along timeline
- Git branch visualization with merge points
- Release notes cards stacked chronologically
- Progress/evolution arrows moving upward
- "NEW" badges and update sparkles

TEXT TO RENDER:
- Large title: "Changelog" in bold white
- Subtitle: "What's New" in cyan
- Small text: "Updates • Releases • Version History" in gray

COMPOSITION:
- Sense of progress and continuous improvement
- Timeline flowing upward showing growth`;

    case 'how-it-works':
      return `${baseStyle}

CREATE AN IMAGE FOR: How TPMJS Works - Architecture Overview

VISUAL CONCEPT:
Create an educational process flow visualization.
- 3-4 step process flow with connected nodes
- Gear/cog mechanisms showing system workings
- Data flow arrows between components
- AI agent icon connecting to tool registry
- Pipeline visualization showing tool execution
- "Under the hood" mechanical aesthetic with glow

TEXT TO RENDER:
- Large title: "How It Works" in bold white
- Subtitle: "Under the Hood" in cyan
- Small text: "Architecture • Process Flow • System Design" in gray

COMPOSITION:
- Clear process flow from left to right or top to bottom
- Educational, explanatory energy`;

    case 'terms':
      return `${baseStyle}

CREATE AN IMAGE FOR: TPMJS Terms of Service

VISUAL CONCEPT:
Create a professional legal/trust visualization.
- Elegant document with official seal/stamp
- Handshake icon representing agreement
- Shield with checkmark for trust
- Balanced scales of fairness
- Professional contract aesthetic
- Subtle gavel or legal iconography

TEXT TO RENDER:
- Large title: "Terms of Service" in bold white
- Subtitle: "Legal Agreement" in cyan
- Small text: "Usage Terms • Guidelines • Agreement" in gray

COMPOSITION:
- Professional, trustworthy, serious but approachable
- Clean and authoritative`;

    case 'privacy':
      return `${baseStyle}

CREATE AN IMAGE FOR: TPMJS Privacy Policy

VISUAL CONCEPT:
Create a security/protection visualization.
- Large shield icon with lock symbol, glowing
- Privacy eye icon with protective barrier
- Encrypted data streams (binary/hex patterns)
- Secure vault/safe aesthetic
- User silhouette protected by shield bubble
- GDPR/security badge elements

TEXT TO RENDER:
- Large title: "Privacy Policy" in bold white
- Subtitle: "Your Data, Protected" in cyan
- Small text: "Data Security • Privacy First • Transparency" in gray

COMPOSITION:
- Protective, secure, trustworthy energy
- Feeling of safety and care`;

    case 'tool': {
      const toolName = content.tool?.name || content.title;
      const packageName = content.tool?.packageName || '';
      const description = content.tool?.description || content.description;
      const category = content.tool?.category || 'ai';

      return `${baseStyle}

CREATE AN IMAGE FOR: ${toolName} - AI Tool on TPMJS

TOOL DETAILS:
- Name: ${toolName}
- Package: ${packageName}
- Category: ${category}
- Description: ${description.slice(0, 200)}

VISUAL CONCEPT:
Create a tool showcase/product card visualization.
- Central glowing tool icon representing the "${category}" category
- Package badge showing npm origin
- Quality/rating indicators (stars, score badges)
- Code snippet preview showing tool usage
- Category-specific iconography (${category})
- "Verified" or "Official" badge if applicable
- Download/install indicators

TEXT TO RENDER:
- Large title: "${toolName}" in bold white
- Subtitle: "${packageName}" in cyan (smaller, package name style)
- Category badge: "${category}" as a pill/tag
- Brief description excerpt in gray

COMPOSITION:
- Product showcase energy, like an app store feature
- Professional tool presentation
- TPMJS branding subtle in corner`;
    }

    default:
      return `${baseStyle}

CREATE AN IMAGE FOR: ${content.title} - TPMJS

VISUAL CONCEPT:
Create a professional tech/SaaS visualization.
- Abstract geometric shapes with glassmorphism
- Neural network connection patterns
- Floating UI elements with glow effects
- Modern developer aesthetic
- Subtle code/terminal elements

TEXT TO RENDER:
- Large title: "${content.title}" in bold white
- Subtitle: "TPMJS" in cyan
- Description: "${content.description.slice(0, 80)}" in gray

COMPOSITION:
- Clean, professional, modern tech aesthetic
- Balanced layout with clear hierarchy`;
  }
}
