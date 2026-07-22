import { type ReleaseCandidate, releaseCandidates } from './release-auth-lib';

export interface ReleaseBuildPlan {
  candidates: ReleaseCandidate[];
  turboArguments: string[];
}

export function releaseBuildPlan(audit: unknown): ReleaseBuildPlan {
  const candidates = releaseCandidates(audit);
  return {
    candidates,
    turboArguments: [
      'exec',
      'turbo',
      'run',
      'build',
      '--output-logs=new-only',
      ...candidates.map((candidate) => `--filter=${candidate.name}...`),
    ],
  };
}
