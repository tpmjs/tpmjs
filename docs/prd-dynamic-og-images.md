# PRD: AI-Generated OG Images for TPMJS

## Overview

Implement a system where every page on tpmjs.com (both static and dynamic) has a unique, AI-generated Open Graph image created by Gemini. The OG images should be contextually relevant, visually distinctive, and reflect the actual content of each page.

## Goals

1. **Unique visual identity** - Every page gets a custom OG image, not generic templates
2. **Content-aware generation** - Images reflect the actual page content (tool descriptions, categories, etc.)
3. **Performance-optimized** - Pre-generate for static pages, on-demand with caching for dynamic
4. **Cost-efficient** - Minimize redundant API calls through intelligent caching

## Technical Architecture

### Page Types & Generation Strategy

| Page Type | Example | Generation Strategy |
|-----------|---------|---------------------|
| Static | `/`, `/about`, `/playground` | Build-time generation, stored in CDN |
| Semi-static | `/tools`, `/categories` | Build-time with ISR revalidation |
| Dynamic | `/tool/[slug]` | On-demand with aggressive caching |
| User-generated | Future: `/user/[id]` | On-demand with TTL cache |

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Request Flow                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Browser/Crawler                                                 │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────┐ │
│  │ Next.js     │───▶│ OG Image     │───▶│ Vercel KV/Redis     │ │
│  │ Metadata    │    │ Route        │    │ Cache Layer         │ │
│  │ Generator   │    │ /api/og/[..] │    │                     │ │
│  └─────────────┘    └──────────────┘    └─────────────────────┘ │
│                            │                      │              │
│                            │ cache miss           │ cache hit    │
│                            ▼                      ▼              │
│                     ┌──────────────┐       Return cached         │
│                     │ Content      │       image URL             │
│                     │ Extractor    │                             │
│                     └──────────────┘                             │
│                            │                                     │
│                            ▼                                     │
│                     ┌──────────────┐                             │
│                     │ Prompt       │                             │
│                     │ Builder      │                             │
│                     └──────────────┘                             │
│                            │                                     │
│                            ▼                                     │
│                     ┌──────────────┐                             │
│                     │ Gemini API   │                             │
│                     │ (Imagen 3)   │                             │
│                     └──────────────┘                             │
│                            │                                     │
│                            ▼                                     │
│                     ┌──────────────┐                             │
│                     │ Vercel Blob  │                             │
│                     │ Storage      │                             │
│                     └──────────────┘                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. Content Extraction Service

Each page type needs a content extractor that produces structured data for the prompt:

```typescript
// packages/og-generator/src/extractors/types.ts
interface PageContent {
  pageType: 'home' | 'tool' | 'category' | 'search' | 'playground' | 'about';
  title: string;
  description: string;
  keywords: string[];
  primaryColor?: string;

  // Page-specific data
  toolData?: {
    name: string;
    category: string;
    tier: 'minimal' | 'rich';
    capabilities: string[];
    npmDownloads: number;
  };

  categoryData?: {
    name: string;
    toolCount: number;
    topTools: string[];
  };
}
```

### 2. Prompt Engineering

The prompt should be carefully crafted to produce consistent, on-brand images:

```typescript
// packages/og-generator/src/prompt-builder.ts

function buildPrompt(content: PageContent): string {
  const baseStyle = `
    Create a 1200x630 pixel Open Graph image with these constraints:
    - Modern, clean tech aesthetic
    - Dark background (#0a0a0a to #1a1a1a gradient)
    - Accent colors: cyan (#00d4ff), purple (#8b5cf6)
    - Abstract geometric shapes or flowing lines
    - NO text in the image (text added via overlay)
    - Professional, minimalist design
    - Subtle depth and dimensionality
  `;

  const pageContext = buildPageContext(content);

  return `${baseStyle}\n\nContext for this specific page:\n${pageContext}`;
}

function buildPageContext(content: PageContent): string {
  switch (content.pageType) {
    case 'tool':
      return `
        This image is for a developer tool called "${content.toolData.name}".
        Category: ${content.toolData.category}
        Capabilities: ${content.toolData.capabilities.join(', ')}
        Visual motif: Represent the concept of "${content.toolData.category}"
        abstractly using shapes, gradients, or symbolic elements.
        Mood: Professional, powerful, trustworthy.
      `;

    case 'category':
      return `
        This image represents a category of developer tools: "${content.categoryData.name}".
        Contains ${content.categoryData.toolCount} tools.
        Visual motif: Abstract representation of "${content.categoryData.name}"
        as a concept - use symbolic shapes and patterns.
        Mood: Organized, comprehensive, discoverable.
      `;

    case 'home':
      return `
        This is the homepage for TPMJS - a registry of AI/LLM tools for developers.
        Visual motif: Interconnected nodes, flowing data streams, AI neural patterns.
        Mood: Cutting-edge, innovative, developer-focused.
      `;

    // ... other page types
  }
}
```

### 3. API Route Implementation

```typescript
// apps/web/src/app/api/og/[...path]/route.ts

import { ImageResponse } from 'next/og';
import { kv } from '@vercel/kv';
import { put } from '@vercel/blob';

export const runtime = 'edge';
export const maxDuration = 60;

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  const pagePath = '/' + params.path.join('/');
  const cacheKey = `og:${pagePath}`;

  // 1. Check cache
  const cached = await kv.get<string>(cacheKey);
  if (cached) {
    return Response.redirect(cached);
  }

  // 2. Extract page content
  const content = await extractPageContent(pagePath);

  // 3. Check if we have a pre-generated image (build-time)
  const preGenerated = await checkPreGeneratedImage(pagePath);
  if (preGenerated) {
    await kv.set(cacheKey, preGenerated, { ex: 86400 }); // 24hr cache
    return Response.redirect(preGenerated);
  }

  // 4. Generate new image via Gemini
  const prompt = buildPrompt(content);
  const imageBuffer = await generateWithGemini(prompt);

  // 5. Upload to Vercel Blob
  const { url } = await put(`og/${pagePath}.png`, imageBuffer, {
    access: 'public',
    contentType: 'image/png',
  });

  // 6. Cache the URL
  await kv.set(cacheKey, url, { ex: 86400 });

  // 7. Return redirect to blob URL
  return Response.redirect(url);
}
```

### 4. Metadata Integration

```typescript
// apps/web/src/app/tool/[slug]/page.tsx

export async function generateMetadata({ params }): Promise<Metadata> {
  const tool = await getTool(params.slug);

  return {
    title: tool.name,
    description: tool.description,
    openGraph: {
      title: tool.name,
      description: tool.description,
      images: [{
        url: `https://tpmjs.com/api/og/tool/${params.slug}`,
        width: 1200,
        height: 630,
        alt: `${tool.name} - TPMJS Tool`,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [`https://tpmjs.com/api/og/tool/${params.slug}`],
    },
  };
}
```

### 5. Build-Time Pre-Generation

```typescript
// scripts/generate-og-images.ts

async function preGenerateOGImages() {
  // Static pages - always regenerate on build
  const staticPages = ['/', '/about', '/playground', '/tools'];

  // Semi-static - regenerate if content changed
  const categories = await prisma.category.findMany();
  const categoryPages = categories.map(c => `/category/${c.slug}`);

  // High-traffic tools - pre-generate top 100
  const topTools = await prisma.tool.findMany({
    orderBy: { qualityScore: 'desc' },
    take: 100,
  });
  const toolPages = topTools.map(t => `/tool/${t.slug}`);

  const allPages = [...staticPages, ...categoryPages, ...toolPages];

  for (const page of allPages) {
    await generateAndStoreOGImage(page);
    await sleep(1000); // Rate limiting
  }
}
```

## Caching Strategy

### Cache Layers

1. **Vercel Edge Cache** - CDN caching of the redirect response
2. **Vercel KV** - URL mapping cache (path → blob URL)
3. **Vercel Blob** - Permanent image storage

### Cache Invalidation

| Trigger | Action |
|---------|--------|
| Tool updated | Invalidate `/tool/[slug]` cache key |
| New tool added | Pre-generate OG image via webhook |
| Build/deploy | Regenerate static page images |
| Manual | Admin endpoint to force regeneration |

```typescript
// apps/web/src/app/api/admin/invalidate-og/route.ts

export async function POST(request: Request) {
  const { path, secret } = await request.json();

  if (secret !== process.env.ADMIN_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await kv.del(`og:${path}`);

  // Optionally trigger regeneration
  await fetch(`https://tpmjs.com/api/og${path}`);

  return Response.json({ success: true });
}
```

## Cost Considerations

### Gemini API Costs

- Imagen 3 pricing: ~$0.02-0.04 per image (estimate)
- Initial generation: ~500 pages × $0.03 = $15
- Monthly regeneration: ~100 new tools × $0.03 = $3

### Storage Costs

- Vercel Blob: $0.15/GB/month
- Estimated: 500 images × 500KB = 250MB = ~$0.04/month

### Optimization Strategies

1. **Aggressive caching** - 24-48 hour TTL minimum
2. **Batch generation** - Build-time for predictable pages
3. **Lazy generation** - On-demand for long-tail pages
4. **Image optimization** - Compress before storage

## Fallback Strategy

If Gemini API fails or rate limits:

1. **Primary**: Return cached image if available (even if stale)
2. **Secondary**: Return pre-designed template image with text overlay
3. **Tertiary**: Return generic TPMJS branded fallback image

```typescript
async function generateOGImage(pagePath: string): Promise<string> {
  try {
    return await generateWithGemini(pagePath);
  } catch (error) {
    console.error('Gemini generation failed:', error);

    // Fallback to template
    return await generateTemplateImage(pagePath);
  }
}
```

## Text Overlay System

Since AI-generated images shouldn't contain text (unreliable), add text via a compositing layer:

```typescript
// Using @vercel/og or sharp for text overlay

async function compositeOGImage(
  baseImageUrl: string,
  content: PageContent
): Promise<Buffer> {
  const baseImage = await fetch(baseImageUrl).then(r => r.arrayBuffer());

  // Use sharp or canvas to overlay:
  // - Page title (top-left or centered)
  // - TPMJS logo (bottom-right)
  // - Optional: category badge, stats, etc.

  return await sharp(baseImage)
    .composite([
      { input: titleBuffer, top: 50, left: 50 },
      { input: logoBuffer, top: 530, left: 1050 },
    ])
    .png()
    .toBuffer();
}
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Set up Vercel Blob storage
- [ ] Set up Vercel KV for caching
- [ ] Create basic `/api/og/[...path]` route
- [ ] Implement content extractors for each page type

### Phase 2: Gemini Integration (Week 2)
- [ ] Integrate Gemini Imagen 3 API
- [ ] Design and test prompts for each page type
- [ ] Implement text overlay compositing
- [ ] Add fallback image generation

### Phase 3: Optimization (Week 3)
- [ ] Build-time pre-generation script
- [ ] Cache invalidation webhooks
- [ ] Monitoring and alerting
- [ ] Cost tracking dashboard

### Phase 4: Polish (Week 4)
- [ ] A/B test different prompt styles
- [ ] Refine prompts based on results
- [ ] Admin UI for manual regeneration
- [ ] Documentation

## Success Metrics

1. **Coverage**: 100% of pages have unique OG images
2. **Performance**: OG image response < 500ms (cache hit)
3. **Quality**: Manual review score > 4/5 on sample of images
4. **Cost**: < $50/month total (API + storage)

## Open Questions

1. **Model choice**: Gemini Imagen 3 vs DALL-E 3 vs Stable Diffusion?
2. **Text rendering**: Overlay vs bake into prompt?
3. **Style consistency**: How to maintain brand while varying per-page?
4. **A/B testing**: How to measure OG image effectiveness?

## Appendix: Example Prompts

### Homepage
```
Create a 1200x630 Open Graph image. Dark gradient background (#0a0a0a to #1a1a1a).
Abstract visualization of an AI neural network with glowing cyan (#00d4ff) and
purple (#8b5cf6) nodes connected by flowing data streams. Minimalist, professional,
futuristic. No text. Subtle grid pattern overlay. Represents a developer tool registry
for AI and LLM integrations.
```

### Tool Page (e.g., file-search tool)
```
Create a 1200x630 Open Graph image. Dark gradient background. Abstract representation
of file searching - interconnected folder icons, magnifying glass motif, flowing
document shapes. Color scheme: cyan and purple accents on dark. Minimalist style,
no text. Professional developer tool aesthetic. Represents a powerful file search
capability for AI assistants.
```

### Category Page (e.g., "Database" category)
```
Create a 1200x630 Open Graph image. Dark gradient background. Abstract database
visualization - cylindrical shapes, connected nodes, data flow patterns. Organized
grid structure suggesting multiple tools. Cyan and purple accent colors. Minimalist,
no text. Professional aesthetic representing a collection of database tools for
AI development.
```

---

*Note: "Gemini 3 nanobanana" interpreted as Google Gemini with Imagen 3 for image generation. Actual model availability and pricing should be verified.*
