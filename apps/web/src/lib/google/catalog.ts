import { prisma } from '@tpmjs/db';
import { GOOGLE_TOOLS } from './connection';
import { GOOGLE_TOOL_SCHEMAS } from './tools';

export function googleCollectionId(id: string) {
  return `google:${id}`;
}
export function googlePackageName(id: string) {
  return `@tpmjs/google-workspace/${id}`;
}

export async function googleCollections(userId: string) {
  const connections = await prisma.googleConnection.findMany({
    where: { userId },
    select: { id: true, email: true, scopes: true },
  });
  return connections.map((connection) => ({
    id: googleCollectionId(connection.id),
    name: `Google Workspace · ${connection.email}`,
    description:
      'Drive and Gmail tools linked to this Google account. Access depends on Google scopes and this app grant.',
    tools: GOOGLE_TOOLS.filter((tool) => connection.scopes.includes(tool.scope)).map((tool) => ({
      id: `${googlePackageName(connection.id)}::${tool.name}`,
      name: tool.name,
      description: tool.description,
      inputSchema: GOOGLE_TOOL_SCHEMAS[tool.name],
      packageName: googlePackageName(connection.id),
      connectionId: connection.id,
    })),
  }));
}
