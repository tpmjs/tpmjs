/**
 * @tpmjs/npm-client
 * NPM Registry API client for TPMJS
 */

// Changes feed
export {
  fetchChanges,
  type Change,
  type ChangesFeedResponse,
  type FetchChangesOptions,
  type FetchChangesResult,
} from './changes';

// Keyword search
export {
  searchByKeyword,
  searchAllByKeyword,
  type SearchPackage,
  type SearchResult,
  type SearchResponse,
  type SearchByKeywordOptions,
} from './search';

// Package metadata
export {
  fetchPackageMetadata,
  fetchLatestPackageVersion,
  fetchPackageTpmjsField,
  type PackageVersion,
  type PackageMetadata,
} from './package';

// Download statistics
export { fetchDownloadStats, fetchBulkDownloadStats, type DownloadsResponse } from './stats';

// Rate limiting
export { delay, RateLimiter, npmRateLimiter, retryWithBackoff } from './rate-limiter';
