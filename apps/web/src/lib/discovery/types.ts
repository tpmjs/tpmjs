export type HealthStatus = 'HEALTHY' | 'BROKEN' | 'UNKNOWN';

export interface DiscoveryTool {
  id: string;
  name: string;
  description: string;
  qualityScore: string | null;
  likeCount?: number;
  importHealth?: HealthStatus | null;
  executionHealth?: HealthStatus | null;
  consecutiveImportFailures?: number;
  lastHealthCheck?: string | null;
  createdAt: string;
  package: {
    npmPackageName: string;
    npmVersion: string;
    npmPublishedAt: string;
    category: string;
    npmRepository: { url: string; type: string } | null;
    isOfficial: boolean;
    npmDownloadsLastMonth: number | null;
  };
}

export interface PublicCollection {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  likeCount: number;
  forkCount: number;
  toolCount: number;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    image: string | null;
    username: string | null;
  };
}
