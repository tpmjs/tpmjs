/**
 * Manual Tools Registry
 *
 * This file contains tools that should be included in TPMJS but don't follow
 * the standard tpmjs field specification in their package.json.
 *
 * These tools are manually curated and synced to the database via the
 * manual sync script.
 */

export interface ManualTool {
  // Package metadata
  npmPackageName: string;
  npmVersion?: string; // Optional - will fetch latest if not specified
  category:
    | 'text-analysis'
    | 'code-generation'
    | 'data-processing'
    | 'image-generation'
    | 'audio-processing'
    | 'search'
    | 'integration'
    | 'other';
  frameworks: Array<'vercel-ai' | 'langchain' | 'llamaindex' | 'other'>;

  // Tool definition
  name: string;
  description: string;

  // Optional rich metadata
  parameters?: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
    default?: string;
  }>;

  returns?: {
    type: string;
    description: string;
  };

  aiAgent?: {
    useCase: string;
    limitations?: string;
    examples?: string[];
  };

  // Environment variables
  env?: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;

  // Additional metadata not in npm
  tags?: string[];
  docsUrl?: string;
  apiKeyUrl?: string;
  websiteUrl?: string;
}

export const manualTools: ManualTool[] = [
  {
    npmPackageName: 'ai-sdk-tool-code-execution',
    category: 'code-generation',
    frameworks: ['vercel-ai'],
    name: 'executeCode',
    description:
      'Execute Python code in a sandboxed environment using Vercel Sandbox. Run calculations, data processing, and other computational tasks safely in an isolated environment with Python 3.13.',
    tags: ['code-execution', 'sandbox'],
    env: [
      {
        name: 'VERCEL_OIDC_TOKEN',
        description: 'Vercel OIDC token for sandbox authentication',
        required: true,
      },
    ],
    parameters: [
      {
        name: 'code',
        type: 'string',
        description: 'Python code to execute in the sandbox',
        required: true,
      },
    ],
    returns: {
      type: 'object',
      description: 'Execution result with stdout, stderr, and return value',
    },
    aiAgent: {
      useCase:
        'Use when you need to perform calculations, data processing, or execute Python code safely',
      limitations: 'Python 3.13 only. No network access. 30 second execution timeout.',
      examples: [
        'Perform complex mathematical calculations',
        'Process data with pandas/numpy',
        'Generate plots with matplotlib',
      ],
    },
    docsUrl: 'https://vercel.com/docs/vercel-sandbox',
    apiKeyUrl: 'https://vercel.com/docs/vercel-sandbox#authentication',
    websiteUrl: 'https://vercel.com/docs/vercel-sandbox',
  },
  {
    npmPackageName: '@exalabs/ai-sdk',
    category: 'search',
    frameworks: ['vercel-ai'],
    name: 'webSearch',
    description:
      "Search the web for current information using Exa's AI-powered search API. Returns high-quality, relevant results optimized for LLM consumption.",
    tags: ['search', 'web', 'extraction'],
    env: [
      {
        name: 'EXA_API_KEY',
        description: 'API key for Exa search service',
        required: true,
      },
    ],
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'Search query',
        required: true,
      },
      {
        name: 'numResults',
        type: 'number',
        description: 'Number of results to return (1-10)',
        required: false,
        default: '5',
      },
    ],
    returns: {
      type: 'array',
      description: 'Array of search results with title, URL, and content',
    },
    aiAgent: {
      useCase: 'Use when you need current information, news, research papers, or web content',
      limitations: 'Requires API key. Rate limits apply based on plan.',
      examples: [
        'Find latest AI developments',
        'Search for technical documentation',
        'Research current events',
      ],
    },
    docsUrl: 'https://docs.exa.ai/reference/vercel',
    apiKeyUrl: 'https://dashboard.exa.ai/api-keys',
    websiteUrl: 'https://exa.ai',
  },
  {
    npmPackageName: '@parallel-web/ai-sdk-tools',
    category: 'search',
    frameworks: ['vercel-ai'],
    name: 'searchTool',
    description:
      'Search and extract context from the web with token-optimized results. Parallel compresses web results for optimal inference efficiency.',
    tags: ['search', 'web', 'extraction'],
    env: [
      {
        name: 'PARALLEL_API_KEY',
        description: 'API key for Parallel search service',
        required: true,
      },
    ],
    aiAgent: {
      useCase: 'Use when you need web search with minimal token usage',
      examples: ['Search for current information', 'Extract structured data from websites'],
    },
    apiKeyUrl: 'https://platform.parallel.ai',
    websiteUrl: 'https://parallel.ai',
  },
  {
    npmPackageName: '@parallel-web/ai-sdk-tools',
    category: 'search',
    frameworks: ['vercel-ai'],
    name: 'extractTool',
    description: 'Extract structured content from web pages with token-optimized compression.',
    tags: ['extraction', 'web'],
    env: [
      {
        name: 'PARALLEL_API_KEY',
        description: 'API key for Parallel search service',
        required: true,
      },
    ],
    parameters: [
      {
        name: 'url',
        type: 'string',
        description: 'URL of the page to extract content from',
        required: true,
      },
    ],
    returns: {
      type: 'object',
      description: 'Extracted and compressed page content',
    },
    aiAgent: {
      useCase: 'Use to extract clean content from specific URLs',
      examples: ['Extract article content', 'Parse documentation pages'],
    },
    websiteUrl: 'https://parallel.ai',
  },
  {
    npmPackageName: 'ctx-zip',
    category: 'code-generation',
    frameworks: ['vercel-ai'],
    name: 'createVercelSandboxCodeMode',
    description:
      'Transform MCP tools and AI SDK tools into code, write to Vercel sandbox filesystem, and execute in isolated environment.',
    tags: ['code-execution', 'sandbox', 'mcp', 'code-mode'],
    env: [
      {
        name: 'VERCEL_OIDC_TOKEN',
        description: 'Vercel OIDC token for sandbox authentication',
        required: true,
      },
    ],
    aiAgent: {
      useCase: 'Use when you need to combine MCP tools with code execution in a sandbox',
      limitations: 'Requires Vercel Sandbox access',
      examples: ['Execute code using MCP server tools', 'Combine multiple tool sources'],
    },
    docsUrl: 'https://github.com/karthikscale3/ctx-zip/blob/main/README.md',
    apiKeyUrl: 'https://vercel.com/docs/vercel-sandbox#authentication',
    websiteUrl: 'https://github.com/karthikscale3/ctx-zip',
  },
  {
    npmPackageName: '@perplexity-ai/ai-sdk',
    category: 'search',
    frameworks: ['vercel-ai'],
    name: 'perplexitySearch',
    description:
      'Search the web with real-time results and advanced filtering powered by Perplexity Search API. Supports ranked results with domain, language, date range, and recency filters.',
    tags: ['search', 'web'],
    env: [
      {
        name: 'PERPLEXITY_API_KEY',
        description: 'API key for Perplexity search service',
        required: true,
      },
    ],
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'Search query',
        required: true,
      },
      {
        name: 'filters',
        type: 'object',
        description: 'Optional filters for domain, language, date range, etc.',
        required: false,
      },
    ],
    returns: {
      type: 'array',
      description: 'Ranked search results with metadata',
    },
    aiAgent: {
      useCase: 'Use for comprehensive web search with filtering capabilities',
      examples: [
        'Find latest AI developments',
        'Search with date range filters',
        'Domain-specific searches',
      ],
    },
    docsUrl: 'https://docs.perplexity.ai/guides/search-quickstart',
    apiKeyUrl: 'https://www.perplexity.ai/account/api/keys',
    websiteUrl: 'https://www.perplexity.ai',
  },
  {
    npmPackageName: '@tavily/ai-sdk',
    category: 'search',
    frameworks: ['vercel-ai'],
    name: 'tavilySearch',
    description:
      'Real-time web search optimized for AI applications. Provides comprehensive web research including search, content extraction, website crawling, and site mapping.',
    tags: ['search', 'extract', 'crawl'],
    env: [
      {
        name: 'TAVILY_API_KEY',
        description: 'API key for Tavily search service',
        required: true,
      },
    ],
    aiAgent: {
      useCase: 'Use for comprehensive web research and content extraction',
      examples: [
        'Research complex topics',
        'Extract structured information',
        'Crawl entire websites',
      ],
    },
    docsUrl: 'https://docs.tavily.com/documentation/integrations/vercel',
    apiKeyUrl: 'https://app.tavily.com/home',
    websiteUrl: 'https://tavily.com',
  },
  {
    npmPackageName: 'firecrawl-aisdk',
    category: 'search',
    frameworks: ['vercel-ai'],
    name: 'scrapeTool',
    description:
      'Scrape any website into clean markdown format. Convert web pages to LLM-friendly markdown with automatic cleaning and formatting.',
    tags: ['scraping', 'web', 'extraction'],
    env: [
      {
        name: 'FIRECRAWL_API_KEY',
        description: 'API key for Firecrawl service',
        required: true,
      },
    ],
    parameters: [
      {
        name: 'url',
        type: 'string',
        description: 'URL of the website to scrape',
        required: true,
      },
    ],
    returns: {
      type: 'object',
      description: 'Scraped content in clean markdown format',
    },
    aiAgent: {
      useCase: 'Use when you need to convert web pages to clean, structured markdown',
      examples: [
        'Scrape documentation pages',
        'Extract article content',
        'Convert web pages to markdown',
      ],
    },
    docsUrl: 'https://docs.firecrawl.dev/integrations/ai-sdk',
    apiKeyUrl: 'https://firecrawl.dev/app/api-keys',
    websiteUrl: 'https://firecrawl.dev',
  },
  {
    npmPackageName: 'firecrawl-aisdk',
    category: 'search',
    frameworks: ['vercel-ai'],
    name: 'searchTool',
    description:
      'Search the web and get results in clean markdown format optimized for AI consumption.',
    tags: ['search', 'web'],
    env: [
      {
        name: 'FIRECRAWL_API_KEY',
        description: 'API key for Firecrawl service',
        required: true,
      },
    ],
    websiteUrl: 'https://firecrawl.dev',
  },
  {
    npmPackageName: 'firecrawl-aisdk',
    category: 'search',
    frameworks: ['vercel-ai'],
    name: 'crawlTool',
    description:
      'Crawl entire websites and extract structured data. Automatically discover and process multiple pages.',
    tags: ['crawling', 'web', 'extraction'],
    env: [
      {
        name: 'FIRECRAWL_API_KEY',
        description: 'API key for Firecrawl service',
        required: true,
      },
    ],
    parameters: [
      {
        name: 'url',
        type: 'string',
        description: 'Starting URL to begin crawling',
        required: true,
      },
      {
        name: 'maxPages',
        type: 'number',
        description: 'Maximum number of pages to crawl',
        required: false,
        default: '10',
      },
    ],
    aiAgent: {
      useCase: 'Use when you need to crawl and extract data from entire websites',
      examples: [
        'Crawl documentation sites',
        'Extract all articles from a blog',
        'Build knowledge base from website',
      ],
    },
    websiteUrl: 'https://firecrawl.dev',
  },
  {
    npmPackageName: 'bedrock-agentcore',
    category: 'code-generation',
    frameworks: ['vercel-ai'],
    name: 'CodeInterpreterTools',
    description:
      'Isolated sandbox for executing Python, JavaScript, and TypeScript code to solve complex tasks. Fully managed by Amazon Bedrock.',
    tags: ['code-execution', 'sandbox'],
    env: [
      {
        name: 'AWS_ROLE_ARN',
        description: 'AWS IAM role ARN for Bedrock access',
        required: true,
      },
    ],
    aiAgent: {
      useCase: 'Use for secure code execution in AWS-managed sandbox',
      limitations: 'Requires AWS credentials and Bedrock access',
      examples: [
        'Execute Python data analysis',
        'Run JavaScript computations',
        'TypeScript code execution',
      ],
    },
    docsUrl: 'https://github.com/aws/bedrock-agentcore-sdk-typescript',
    apiKeyUrl: 'https://vercel.com/docs/oidc/aws',
    websiteUrl: 'https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/built-in-tools.html',
  },
  {
    npmPackageName: 'bedrock-agentcore',
    category: 'integration',
    frameworks: ['vercel-ai'],
    name: 'BrowserTools',
    description:
      'Fast and secure cloud-based browser runtime for web automation. Fill forms, navigate websites, and extract information in managed environment.',
    tags: ['browser-automation', 'web'],
    env: [
      {
        name: 'AWS_ROLE_ARN',
        description: 'AWS IAM role ARN for Bedrock access',
        required: true,
      },
    ],
    aiAgent: {
      useCase: 'Use for browser automation and web interaction tasks',
      examples: ['Fill web forms', 'Navigate websites', 'Extract dynamic content'],
    },
    websiteUrl: 'https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/built-in-tools.html',
  },
  {
    npmPackageName: '@superagent-ai/ai-sdk',
    category: 'other',
    frameworks: ['vercel-ai'],
    name: 'guard',
    description:
      'Protect AI apps from prompt injection and security threats. Detect and block malicious inputs before they reach your LLM.',
    tags: ['security', 'guardrails', 'prompt-injection'],
    env: [
      {
        name: 'SUPERAGENT_API_KEY',
        description: 'API key for Superagent security service',
        required: true,
      },
    ],
    parameters: [
      {
        name: 'input',
        type: 'string',
        description: 'User input to check for security threats',
        required: true,
      },
    ],
    returns: {
      type: 'object',
      description: 'Security analysis with threat detection results',
    },
    aiAgent: {
      useCase: 'Use to validate user inputs for security threats before processing',
      examples: [
        'Detect prompt injection attempts',
        'Block malicious inputs',
        'Security validation',
      ],
    },
    docsUrl: 'https://docs.superagent.sh',
    apiKeyUrl: 'https://dashboard.superagent.sh',
    websiteUrl: 'https://superagent.sh',
  },
  {
    npmPackageName: '@superagent-ai/ai-sdk',
    category: 'other',
    frameworks: ['vercel-ai'],
    name: 'redact',
    description:
      'Redact PII/PHI from text including SSNs, emails, phone numbers, and other sensitive information.',
    tags: ['security', 'pii', 'redaction'],
    env: [
      {
        name: 'SUPERAGENT_API_KEY',
        description: 'API key for Superagent security service',
        required: true,
      },
    ],
    parameters: [
      {
        name: 'text',
        type: 'string',
        description: 'Text containing potentially sensitive information',
        required: true,
      },
    ],
    returns: {
      type: 'object',
      description: 'Redacted text with PII/PHI removed or masked',
    },
    aiAgent: {
      useCase: 'Use to remove sensitive information from text before processing',
      examples: ['Redact SSNs from documents', 'Remove email addresses', 'Mask phone numbers'],
    },
    websiteUrl: 'https://superagent.sh',
  },
  {
    npmPackageName: '@superagent-ai/ai-sdk',
    category: 'other',
    frameworks: ['vercel-ai'],
    name: 'verify',
    description:
      'Verify AI-generated claims against source materials. Fact-check and validate LLM outputs for accuracy.',
    tags: ['verification', 'fact-checking'],
    env: [
      {
        name: 'SUPERAGENT_API_KEY',
        description: 'API key for Superagent security service',
        required: true,
      },
    ],
    parameters: [
      {
        name: 'claim',
        type: 'string',
        description: 'Claim to verify',
        required: true,
      },
      {
        name: 'sources',
        type: 'array',
        description: 'Source materials to verify against',
        required: true,
      },
    ],
    returns: {
      type: 'object',
      description: 'Verification result with confidence score',
    },
    aiAgent: {
      useCase: 'Use to fact-check LLM outputs against trusted sources',
      examples: ['Verify factual claims', 'Check citations', 'Validate information accuracy'],
    },
    websiteUrl: 'https://superagent.sh',
  },
  {
    npmPackageName: '@valyu/ai-sdk',
    category: 'search',
    frameworks: ['vercel-ai'],
    name: 'webSearch',
    description: 'Real-time web search for current information and news.',
    tags: ['search', 'web'],
    env: [
      {
        name: 'VALYU_API_KEY',
        description: 'API key for Valyu search service',
        required: true,
      },
    ],
    aiAgent: {
      useCase: 'Use for general web search and current information',
      examples: ['Find latest news', 'Search for current events'],
    },
    docsUrl: 'https://docs.valyu.ai/integrations/vercel-ai-sdk',
    apiKeyUrl: 'https://platform.valyu.ai',
    websiteUrl: 'https://valyu.ai',
  },
  {
    npmPackageName: '@valyu/ai-sdk',
    category: 'search',
    frameworks: ['vercel-ai'],
    name: 'financeSearch',
    description:
      'Search financial data including stock prices, earnings, income statements, cash flows, and market data.',
    tags: ['search', 'finance', 'domain-search'],
    env: [
      {
        name: 'VALYU_API_KEY',
        description: 'API key for Valyu search service',
        required: true,
      },
    ],
    aiAgent: {
      useCase: 'Use for financial data and market research',
      examples: ['Get stock prices', 'Find earnings reports', 'Search financial statements'],
    },
    websiteUrl: 'https://valyu.ai',
  },
  {
    npmPackageName: '@valyu/ai-sdk',
    category: 'search',
    frameworks: ['vercel-ai'],
    name: 'paperSearch',
    description: 'Full-text search across PubMed, arXiv, bioRxiv, and medRxiv research papers.',
    tags: ['search', 'research', 'domain-search'],
    env: [
      {
        name: 'VALYU_API_KEY',
        description: 'API key for Valyu search service',
        required: true,
      },
    ],
    aiAgent: {
      useCase: 'Use to search academic and research papers',
      examples: ['Find medical research', 'Search arXiv papers', 'Look up scientific publications'],
    },
    websiteUrl: 'https://valyu.ai',
  },
  {
    npmPackageName: '@valyu/ai-sdk',
    category: 'search',
    frameworks: ['vercel-ai'],
    name: 'bioSearch',
    description:
      'Search biomedical information including clinical trials, FDA drug labels, PubMed, medRxiv, and bioRxiv.',
    tags: ['search', 'biomedical', 'domain-search'],
    env: [
      {
        name: 'VALYU_API_KEY',
        description: 'API key for Valyu search service',
        required: true,
      },
    ],
    aiAgent: {
      useCase: 'Use for biomedical and clinical research',
      examples: ['Search clinical trials', 'Find FDA drug information', 'Research medical studies'],
    },
    websiteUrl: 'https://valyu.ai',
  },
  {
    npmPackageName: '@valyu/ai-sdk',
    category: 'search',
    frameworks: ['vercel-ai'],
    name: 'patentSearch',
    description: 'Search USPTO patent database for patents and patent applications.',
    tags: ['search', 'patents', 'domain-search'],
    env: [
      {
        name: 'VALYU_API_KEY',
        description: 'API key for Valyu search service',
        required: true,
      },
    ],
    aiAgent: {
      useCase: 'Use to search and research patents',
      examples: ['Find existing patents', 'Research patent applications', 'Prior art search'],
    },
    websiteUrl: 'https://valyu.ai',
  },
  {
    npmPackageName: '@valyu/ai-sdk',
    category: 'search',
    frameworks: ['vercel-ai'],
    name: 'secSearch',
    description: 'Search SEC filings including 10-K, 10-Q, and 8-K reports.',
    tags: ['search', 'sec', 'domain-search'],
    env: [
      {
        name: 'VALYU_API_KEY',
        description: 'API key for Valyu search service',
        required: true,
      },
    ],
    aiAgent: {
      useCase: 'Use to search SEC filings and corporate reports',
      examples: [
        'Find 10-K annual reports',
        'Search quarterly filings',
        'Research corporate disclosures',
      ],
    },
    websiteUrl: 'https://valyu.ai',
  },
  {
    npmPackageName: '@valyu/ai-sdk',
    category: 'search',
    frameworks: ['vercel-ai'],
    name: 'economicsSearch',
    description: 'Search economic data from BLS, FRED, and World Bank databases.',
    tags: ['search', 'economics', 'domain-search'],
    env: [
      {
        name: 'VALYU_API_KEY',
        description: 'API key for Valyu search service',
        required: true,
      },
    ],
    aiAgent: {
      useCase: 'Use to search economic indicators and statistics',
      examples: ['Find employment data', 'Search GDP statistics', 'Research economic indicators'],
    },
    websiteUrl: 'https://valyu.ai',
  },
  {
    npmPackageName: '@valyu/ai-sdk',
    category: 'search',
    frameworks: ['vercel-ai'],
    name: 'companyResearch',
    description:
      'Generate comprehensive company research reports with financial data, news, and analysis.',
    tags: ['search', 'research', 'company-analysis'],
    env: [
      {
        name: 'VALYU_API_KEY',
        description: 'API key for Valyu search service',
        required: true,
      },
    ],
    parameters: [
      {
        name: 'company',
        type: 'string',
        description: 'Company name or ticker symbol',
        required: true,
      },
    ],
    returns: {
      type: 'object',
      description: 'Comprehensive research report with financial and market data',
    },
    aiAgent: {
      useCase: 'Use to generate detailed company research and analysis',
      examples: ['Company financial analysis', 'Competitive research', 'Market position analysis'],
    },
    websiteUrl: 'https://valyu.ai',
  },
  {
    npmPackageName: '@tpmjs/search-registry',
    category: 'integration',
    frameworks: ['vercel-ai'],
    name: 'searchTpmjsToolsTool',
    description:
      'Search the TPMJS tool registry to find AI SDK tools by keyword, category, or description. Returns tool metadata for dynamic loading.',
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'Search query (keywords, tool names, descriptions)',
        required: true,
      },
      {
        name: 'category',
        type: 'string',
        description: 'Filter by category (optional)',
        required: false,
      },
      {
        name: 'limit',
        type: 'number',
        description: 'Maximum results (1-20, default 10)',
        required: false,
      },
    ],
    returns: {
      type: 'object',
      description:
        'Search results with tool metadata including packageName, name, version, importUrl',
    },
    aiAgent: {
      useCase:
        "Use when you need a tool that isn't currently available. Search for tools by keyword or domain.",
      examples: [
        'Search for "weather" when asked about weather',
        'Search for "wikipedia" when asked to search Wikipedia',
        'Search for "database" when working with SQL',
      ],
    },
    tags: ['search', 'tool-discovery', 'registry'],
    websiteUrl: 'https://tpmjs.com',
    docsUrl: 'https://tpmjs.com/spec',
  },
  {
    npmPackageName: '@airweave/vercel-ai-sdk',
    category: 'search',
    frameworks: ['vercel-ai'],
    name: 'airweaveSearch',
    description: 'Provides unified search across all connected data sources using semantic search.',
    tags: ['search', 'rag', 'data-sources', 'semantic-search'],
    env: [
      {
        name: 'AIRWEAVE_API_KEY',
        description: 'API key for authenticating with Airweave services.',
        required: true,
      },
    ],
    parameters: [
      {
        name: 'defaultCollection',
        type: 'string',
        description: 'The default collection to search within.',
        required: true,
      },
    ],
    returns: {
      type: 'object',
      description: 'The search results from the specified data sources.',
    },
    aiAgent: {
      useCase: 'Use this tool to perform semantic searches across multiple data sources.',
      examples: ['Search for key decisions from last week in the knowledge base.'],
    },
    docsUrl: 'https://docs.airweave.ai',
    apiKeyUrl: 'https://app.airweave.ai/settings/api-keys',
    websiteUrl: 'https://airweave.ai',
  },
  {
    npmPackageName: '@tpmjs/createblogpost',
    category: 'text-analysis',
    frameworks: ['vercel-ai'],
    name: 'createBlogPostTool',
    description:
      'Creates structured blog posts with customizable frontmatter, content sections, and SEO metadata. Supports multiple output formats including Markdown and MDX.',
    tags: ['blog', 'content', 'writing', 'markdown', 'mdx'],
    parameters: [
      {
        name: 'title',
        type: 'string',
        description: 'The title of the blog post',
        required: true,
      },
      {
        name: 'author',
        type: 'string',
        description: 'The author of the blog post',
        required: true,
      },
      {
        name: 'content',
        type: 'string',
        description: 'The main content of the blog post',
        required: true,
      },
      {
        name: 'tags',
        type: 'string[]',
        description: 'Array of tags for categorization',
        required: false,
      },
      {
        name: 'format',
        type: "'markdown' | 'mdx'",
        description: 'Output format for the blog post',
        required: false,
      },
      {
        name: 'excerpt',
        type: 'string',
        description: 'Short excerpt or summary of the post',
        required: false,
      },
    ],
    returns: {
      type: 'BlogPost',
      description:
        'A structured blog post object with frontmatter, content, and metadata including slug, wordCount, readingTime, and formattedOutput',
    },
    aiAgent: {
      useCase:
        'Use this tool when users need to generate blog posts, articles, or structured content with proper frontmatter and metadata. Ideal for content management systems, static site generators, and documentation sites.',
      limitations:
        'Does not include AI content generation - you must provide the content. Only formats and structures existing content.',
      examples: [
        'Create a blog post about TypeScript best practices',
        'Generate a tutorial post with code examples',
        'Format an article with SEO metadata',
      ],
    },
    websiteUrl: 'https://tpmjs.com',
    docsUrl: 'https://tpmjs.com/tool/@tpmjs/createblogpost/createBlogPostTool',
  },
  {
    npmPackageName: 'bash-tool',
    category: 'code-generation',
    frameworks: ['vercel-ai'],
    name: 'createBashTool',
    description: 'Creates a bash tool environment with specified files for code execution.',
    tags: ['bash', 'file-system', 'sandbox', 'code-execution'],
    parameters: [
      {
        name: 'files',
        type: 'object',
        description: 'An object containing file paths as keys and file contents as values.',
        required: true,
      }
    ],
    returns: {
      type: 'object',
      description: 'An object containing the tools available in the created bash environment.',
    },
    aiAgent: {
      useCase: 'Use this tool to execute bash commands and manipulate files within a sandboxed environment.',
      examples: ['Create a bash environment with specific files and execute commands.'],
    },
    docsUrl: 'https://github.com/vercel/bash-tool',
    websiteUrl: 'https://github.com/vercel/bash-tool',
  },
];
