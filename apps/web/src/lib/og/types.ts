/**
 * Types for OG image generation
 */

export type PageType =
  | 'home'
  | 'tool'
  | 'docs'
  | 'stats'
  | 'search'
  | 'publish'
  | 'faq'
  | 'playground'
  | 'spec'
  | 'sdk'
  | 'changelog'
  | 'how-it-works'
  | 'terms'
  | 'privacy'
  | 'static';

export interface ToolData {
  name: string;
  packageName: string;
  category: string;
  description: string;
  downloads?: number;
  qualityScore?: number;
}

export interface PageContent {
  pageType: PageType;
  title: string;
  description: string;
  keywords: string[];
  tool?: ToolData;
}
