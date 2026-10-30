type Aspect = 'square' | 'landscape' | 'portrait';
type MagicHourImage = { url: string; mimeType: string };
type MagicHourReceipt = { id?: string; credits_charged?: number };
type MagicHourProject = MagicHourReceipt & {
  status?: string;
  downloads?: Array<{ url: string; expires_at: string }>;
};

type MagicHourOptions = {
  token: string;
  prompt: string;
  count: number;
  aspect: Aspect;
  model?: string;
  projectId?: string;
  fetchImpl?: typeof fetch;
  waitMs?: number;
  intervalMs?: number;
};
type Transport = { headers: Record<string, string>; fetchImpl: typeof fetch };

/** Retains the accepted project ID for GET-only recovery after an interrupted wait. */
export class MagicHourProjectError extends Error {
  readonly projectId?: string;
  constructor(message: string, projectId?: string) {
    super(message);
    this.name = 'MagicHourProjectError';
    this.projectId = projectId;
  }
}

function recovery(id: string): string {
  return `Resume provider=magichour with projectId=${id}; do not submit a new image request.`;
}

function validate(options: MagicHourOptions, waitMs: number, intervalMs: number): void {
  if (!options.token || !options.prompt.trim())
    throw new Error('Magic Hour requires an API key and prompt.');
  if (!Number.isInteger(options.count) || options.count < 1 || options.count > 4) {
    throw new Error('Magic Hour image count must be an integer from 1 to 4.');
  }
  if (!['square', 'landscape', 'portrait'].includes(options.aspect)) {
    throw new Error('Unsupported Magic Hour aspect ratio.');
  }
  if (!Number.isFinite(waitMs) || waitMs < 1 || !Number.isFinite(intervalMs) || intervalMs < 0) {
    throw new Error('Invalid Magic Hour wait limits.');
  }
  if (options.projectId && !/^[a-zA-Z0-9_-]+$/.test(options.projectId)) {
    throw new Error('Invalid Magic Hour projectId.');
  }
}

async function createProject(options: MagicHourOptions, transport: Transport): Promise<string> {
  let receipt: MagicHourReceipt;
  const ratios: Record<Aspect, string> = { square: '1:1', landscape: '16:9', portrait: '9:16' };
  try {
    const response = await transport.fetchImpl('https://api.magichour.ai/v1/ai-image-generator', {
      method: 'POST',
      redirect: 'error',
      headers: transport.headers,
      signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        image_count: options.count,
        model: options.model ?? 'z-image-turbo',
        aspect_ratio: ratios[options.aspect],
        resolution: '640px',
        style: { prompt: options.prompt },
      }),
    });
    if (!response.ok) {
      throw new MagicHourProjectError(
        `Magic Hour create returned HTTP ${response.status}. Check account history before another request.`
      );
    }
    receipt = (await response.json()) as MagicHourReceipt;
  } catch (error) {
    if (error instanceof MagicHourProjectError) throw error;
    throw new MagicHourProjectError(
      'Magic Hour submission outcome is unknown. Reconcile account history before resubmitting.'
    );
  }
  if (!receipt || typeof receipt.id !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(receipt.id)) {
    throw new MagicHourProjectError(
      'Magic Hour returned no usable project ID. Reconcile account history before resubmitting.'
    );
  }
  return receipt.id;
}

async function readProject(
  id: string,
  deadline: number,
  transport: Transport
): Promise<MagicHourProject> {
  let project: MagicHourProject;
  try {
    const response = await transport.fetchImpl(
      `https://api.magichour.ai/v1/image-projects/${encodeURIComponent(id)}`,
      {
        method: 'GET',
        redirect: 'error',
        headers: transport.headers,
        signal: AbortSignal.timeout(Math.max(1, Math.min(30_000, deadline - Date.now()))),
      }
    );
    if (!response.ok) throw new Error('Status read failed.');
    project = (await response.json()) as MagicHourProject;
  } catch {
    throw new MagicHourProjectError(`Magic Hour status read failed. ${recovery(id)}`, id);
  }
  if (!project || project.id !== id) {
    throw new MagicHourProjectError(`Invalid Magic Hour project response. ${recovery(id)}`, id);
  }
  return project;
}

function outputMimeType(path: string): string {
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.webp')) return 'image/webp';
  if (/\.jpe?g$/.test(path)) return 'image/jpeg';
  return 'application/octet-stream';
}

function imageOutput(download: { url: string; expires_at: string }, id: string): MagicHourImage {
  let url: URL;
  try {
    url = new URL(download.url);
  } catch {
    throw new MagicHourProjectError(`Invalid Magic Hour output URL. ${recovery(id)}`, id);
  }
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new MagicHourProjectError(`Invalid Magic Hour output URL. ${recovery(id)}`, id);
  }
  const expires = Date.parse(download.expires_at);
  if (!Number.isFinite(expires) || expires <= Date.now()) {
    throw new MagicHourProjectError(
      `Magic Hour output URL is expired or has no valid expiry. ${recovery(id)}`,
      id
    );
  }
  return { url: download.url, mimeType: outputMimeType(url.pathname.toLowerCase()) };
}

/** Generate or resume a Magic Hour image project. Preserve existing IDs; never retry POST. */
export async function generateMagicHourImages(
  options: MagicHourOptions
): Promise<MagicHourImage[]> {
  const { waitMs = 60_000, intervalMs = 1_500 } = options;
  validate(options, waitMs, intervalMs);
  const transport = {
    fetchImpl: options.fetchImpl ?? fetch,
    headers: { Authorization: `Bearer ${options.token}`, 'Content-Type': 'application/json' },
  };
  const id = options.projectId ?? (await createProject(options, transport));
  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline) {
    const project = await readProject(id, deadline, transport);
    if (project.status === 'complete') {
      if (!Array.isArray(project.downloads) || !project.downloads.length) {
        throw new MagicHourProjectError(`Magic Hour completed without output. ${recovery(id)}`, id);
      }
      return project.downloads.map((download) => imageOutput(download, id));
    }
    if (project.status !== 'queued' && project.status !== 'rendering') {
      throw new MagicHourProjectError(
        `Magic Hour project ${id} reached status ${String(project.status)}. No new job was submitted.`,
        id
      );
    }
    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(0, Math.min(intervalMs, deadline - Date.now())))
    );
  }
  throw new MagicHourProjectError(`Magic Hour project is still pending. ${recovery(id)}`, id);
}
