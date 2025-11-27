/**
 * Blog Post Creation Tool for TPMJS
 * Creates structured blog posts with frontmatter and metadata
 */

export interface BlogPostOptions {
  title: string;
  author: string;
  content: string;
  tags?: string[];
  format?: 'markdown' | 'mdx';
  excerpt?: string;
  publishDate?: Date;
}

export interface BlogPost {
  frontmatter: {
    title: string;
    author: string;
    date: string;
    tags: string[];
    excerpt?: string;
    slug: string;
    wordCount: number;
    readingTime: number;
  };
  content: string;
  formattedOutput: string;
}

/**
 * Creates a slug from a title
 */
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Calculates reading time based on word count
 * Assumes average reading speed of 200 words per minute
 */
function calculateReadingTime(wordCount: number): number {
  return Math.ceil(wordCount / 200);
}

/**
 * Counts words in content
 */
function countWords(content: string): number {
  return content.trim().split(/\s+/).length;
}

/**
 * Formats frontmatter as YAML
 */
function formatFrontmatter(
  frontmatter: BlogPost['frontmatter'],
  format: 'markdown' | 'mdx'
): string {
  const delimiter = format === 'mdx' ? '---' : '---';
  const lines = [
    delimiter,
    `title: "${frontmatter.title}"`,
    `author: ${frontmatter.author}`,
    `date: ${frontmatter.date}`,
    `slug: ${frontmatter.slug}`,
    `tags: [${frontmatter.tags.map((tag) => `"${tag}"`).join(', ')}]`,
  ];

  if (frontmatter.excerpt) {
    lines.push(`excerpt: "${frontmatter.excerpt}"`);
  }

  lines.push(`wordCount: ${frontmatter.wordCount}`);
  lines.push(`readingTime: ${frontmatter.readingTime}`);
  lines.push(delimiter);

  return lines.join('\n');
}

/**
 * Creates a structured blog post with frontmatter and metadata
 */
export async function createBlogPost(options: BlogPostOptions): Promise<BlogPost> {
  const {
    title,
    author,
    content,
    tags = [],
    format = 'markdown',
    excerpt,
    publishDate = new Date(),
  } = options;

  // Validate required fields
  if (!title || title.trim().length === 0) {
    throw new Error('Title is required');
  }

  if (!author || author.trim().length === 0) {
    throw new Error('Author is required');
  }

  if (!content || content.trim().length === 0) {
    throw new Error('Content is required');
  }

  // Calculate metadata
  const slug = createSlug(title);
  const wordCount = countWords(content);
  const readingTime = calculateReadingTime(wordCount);

  // Build frontmatter
  const frontmatter: BlogPost['frontmatter'] = {
    title,
    author,
    date: publishDate.toISOString().split('T')[0] || '',
    tags,
    slug,
    wordCount,
    readingTime,
  };

  if (excerpt) {
    frontmatter.excerpt = excerpt;
  }

  // Format the complete blog post
  const formattedFrontmatter = formatFrontmatter(frontmatter, format);
  const formattedOutput = `${formattedFrontmatter}\n\n${content}`;

  return {
    frontmatter,
    content,
    formattedOutput,
  };
}

/**
 * Export default for convenience
 */
export default createBlogPost;
