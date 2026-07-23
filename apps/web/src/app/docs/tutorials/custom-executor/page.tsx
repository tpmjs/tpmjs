import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Connect Your Own Executor - Tutorial - TPMJS',
  description: 'Connect a self-hosted executor to TPMJS for private, controlled tool execution.',
};

export default function CustomExecutorTutorialPage(): never {
  permanentRedirect('/docs/executors/unsandbox');
}
