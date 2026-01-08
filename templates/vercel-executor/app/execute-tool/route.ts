/**
 * Tool Execution Endpoint (root path)
 *
 * POST /execute-tool
 * TPMJS expects execute-tool at /execute-tool, not /api/execute-tool
 * This re-exports from the api version for backwards compatibility
 */

export { POST, OPTIONS } from '../api/execute-tool/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;
