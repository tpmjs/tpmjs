import type { IconName } from '@tpmjs/ui/Icon/Icon';

export interface ToolCard {
  id: string;
  name: string;
  icon: IconName;
  description: string;
  category: string;
  categoryVariant: 'default' | 'secondary' | 'outline' | 'success' | 'error' | 'warning' | 'info';
  weeklyUsage: string;
  href: string;
}

export interface Category {
  id: string;
  name: string;
  icon: IconName;
  colorClass: string;
  toolCount: number;
  href: string;
}

export interface Statistic {
  icon: IconName;
  value: string;
  label: string;
  subtext?: string;
}

export const featuredTools: ToolCard[] = [
  {
    id: 'tool-search',
    name: 'tool-search',
    icon: 'check',
    description:
      'Meta-tool that lets AI agents discover and load tools on-demand using semantic search.',
    category: 'Meta-Tools',
    categoryVariant: 'warning',
    weeklyUsage: '847K/week',
    href: '/tool/tool-search',
  },
  {
    id: 'web-scraper',
    name: 'web-scraper',
    icon: 'externalLink',
    description:
      'Extract structured data from any website with automatic schema detection and pagination support.',
    category: 'Web & APIs',
    categoryVariant: 'info',
    weeklyUsage: '524K/week',
    href: '/tool/web-scraper',
  },
  {
    id: 'github-manager',
    name: 'github-manager',
    icon: 'github',
    description:
      'Manage GitHub repositories, issues, pull requests, and workflows programmatically.',
    category: 'Code & Git',
    categoryVariant: 'default',
    weeklyUsage: '392K/week',
    href: '/tool/github-manager',
  },
  {
    id: 'sql-query',
    name: 'sql-query',
    icon: 'copy',
    description:
      'Execute SQL queries across PostgreSQL, MySQL, and SQLite databases with connection pooling.',
    category: 'Databases',
    categoryVariant: 'success',
    weeklyUsage: '287K/week',
    href: '/tool/sql-query',
  },
  {
    id: 'pdf-parser',
    name: 'pdf-parser',
    icon: 'copy',
    description:
      'Extract text, tables, and metadata from PDF documents with OCR support for scanned pages.',
    category: 'Documents',
    categoryVariant: 'outline',
    weeklyUsage: '156K/week',
    href: '/tool/pdf-parser',
  },
  {
    id: 'email-sender',
    name: 'email-sender',
    icon: 'check',
    description: 'Send transactional emails with templates, attachments, and delivery tracking.',
    category: 'Email',
    categoryVariant: 'secondary',
    weeklyUsage: '203K/week',
    href: '/tool/email-sender',
  },
];

export const categories: Category[] = [
  {
    id: 'web-apis',
    name: 'Web & APIs',
    icon: 'externalLink',
    colorClass: 'bg-blue-500 text-white',
    toolCount: 423,
    href: '/category/web-apis',
  },
  {
    id: 'databases',
    name: 'Databases',
    icon: 'copy',
    colorClass: 'bg-emerald-500 text-white',
    toolCount: 198,
    href: '/category/databases',
  },
  {
    id: 'documents',
    name: 'Documents',
    icon: 'copy',
    colorClass: 'bg-amber-500 text-white',
    toolCount: 156,
    href: '/category/documents',
  },
  {
    id: 'images',
    name: 'Images',
    icon: 'check',
    colorClass: 'bg-pink-500 text-white',
    toolCount: 134,
    href: '/category/images',
  },
  {
    id: 'email',
    name: 'Email',
    icon: 'check',
    colorClass: 'bg-indigo-500 text-white',
    toolCount: 89,
    href: '/category/email',
  },
  {
    id: 'calendar',
    name: 'Calendar',
    icon: 'check',
    colorClass: 'bg-orange-500 text-white',
    toolCount: 67,
    href: '/category/calendar',
  },
  {
    id: 'search',
    name: 'Search',
    icon: 'check',
    colorClass: 'bg-red-500 text-white',
    toolCount: 112,
    href: '/category/search',
  },
  {
    id: 'code-execution',
    name: 'Code Execution',
    icon: 'github',
    colorClass: 'bg-zinc-700 text-white',
    toolCount: 245,
    href: '/category/code-execution',
  },
  {
    id: 'communication',
    name: 'Communication',
    icon: 'check',
    colorClass: 'bg-cyan-500 text-white',
    toolCount: 178,
    href: '/category/communication',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: 'check',
    colorClass: 'bg-violet-500 text-white',
    toolCount: 203,
    href: '/category/analytics',
  },
  {
    id: 'security',
    name: 'Security',
    icon: 'check',
    colorClass: 'bg-slate-600 text-white',
    toolCount: 91,
    href: '/category/security',
  },
  {
    id: 'workflows',
    name: 'Workflows',
    icon: 'check',
    colorClass: 'bg-teal-500 text-white',
    toolCount: 167,
    href: '/category/workflows',
  },
];

export const statistics: Statistic[] = [
  {
    icon: 'copy',
    value: '2,847',
    label: 'Published Tools',
    subtext: 'Across 24 categories',
  },
  {
    icon: 'github',
    value: '48K+',
    label: 'Active Developers',
    subtext: 'Building with TPMJS',
  },
  {
    icon: 'check',
    value: '12M+',
    label: 'Weekly Invocations',
    subtext: 'Across all tools',
  },
  {
    icon: 'chevronDown',
    value: '47ms',
    label: 'Average Response',
    subtext: '95th percentile latency',
  },
];
