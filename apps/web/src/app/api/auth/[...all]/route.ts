import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const { GET, POST } = toNextJsHandler(auth);
