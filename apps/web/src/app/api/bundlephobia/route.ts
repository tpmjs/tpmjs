import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface BundlephobiaResponse {
  name: string;
  version: string;
  size: number;
  gzip: number;
  dependencyCount: number;
}

/**
 * GET /api/bundlephobia?package=@scope/name&version=1.0.0
 * Proxies bundlephobia API to avoid CORS issues
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const packageName = searchParams.get('package');
  const version = searchParams.get('version');

  if (!packageName) {
    return NextResponse.json({ error: 'Package name required' }, { status: 400 });
  }

  const packageWithVersion = version ? `${packageName}@${version}` : packageName;

  try {
    const response = await fetch(
      `https://bundlephobia.com/api/size?package=${encodeURIComponent(packageWithVersion)}`,
      {
        headers: {
          'User-Agent': 'TPMJS/1.0',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: 'Package not found on bundlephobia' }, { status: 404 });
      }
      return NextResponse.json(
        { error: 'Failed to fetch bundle size' },
        { status: response.status }
      );
    }

    const data: BundlephobiaResponse = await response.json();

    return NextResponse.json({
      name: data.name,
      version: data.version,
      size: data.size,
      gzip: data.gzip,
      dependencyCount: data.dependencyCount,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch bundle size' }, { status: 500 });
  }
}
