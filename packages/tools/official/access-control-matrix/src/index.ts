/**
 * Access Control Matrix Tool for TPMJS
 * Generates access control matrices from roles, resources, and permissions.
 * Useful for RBAC (Role-Based Access Control) compliance and documentation.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Permission mapping type: role -> resource -> actions
 */
export type PermissionMap = Record<string, Record<string, string[]>>;

/**
 * Matrix cell representing permissions for a role-resource pair
 */
export interface MatrixCell {
  role: string;
  resource: string;
  actions: string[];
  hasAccess: boolean;
}

/**
 * Output interface for access control matrix
 */
export interface AccessControlMatrix {
  matrix: MatrixCell[][];
  roles: string[];
  resources: string[];
  summary: {
    totalCells: number;
    cellsWithAccess: number;
    cellsWithoutAccess: number;
    totalPermissions: number;
    rolePermissionCounts: Record<string, number>;
    resourceAccessCounts: Record<string, number>;
    mostPermissiveRole: string;
    mostRestrictedResource: string;
  };
  visualization: string;
}

type AccessControlMatrixInput = {
  roles: string[];
  resources: string[];
  permissions: PermissionMap;
};

/**
 * Validates that roles array is valid
 */
function validateRoles(roles: unknown[]): void {
  if (!Array.isArray(roles) || roles.length === 0) {
    throw new Error('Roles must be a non-empty array');
  }

  for (const role of roles) {
    if (typeof role !== 'string' || role.trim().length === 0) {
      throw new Error('All roles must be non-empty strings');
    }
  }

  // Check for duplicates
  const uniqueRoles = new Set(roles.map((r) => (r as string).toLowerCase()));
  if (uniqueRoles.size !== roles.length) {
    throw new Error('Duplicate roles detected (case-insensitive)');
  }
}

/**
 * Validates that resources array is valid
 */
function validateResources(resources: unknown[]): void {
  if (!Array.isArray(resources) || resources.length === 0) {
    throw new Error('Resources must be a non-empty array');
  }

  for (const resource of resources) {
    if (typeof resource !== 'string' || resource.trim().length === 0) {
      throw new Error('All resources must be non-empty strings');
    }
  }

  // Check for duplicates
  const uniqueResources = new Set(resources.map((r) => (r as string).toLowerCase()));
  if (uniqueResources.size !== resources.length) {
    throw new Error('Duplicate resources detected (case-insensitive)');
  }
}

/**
 * Validates permissions structure
 */
function validatePermissions(
  permissions: unknown,
  roles: string[],
  resources: string[]
): asserts permissions is PermissionMap {
  if (typeof permissions !== 'object' || permissions === null) {
    throw new Error('Permissions must be an object');
  }

  const perms = permissions as Record<string, unknown>;
  const rolesLower = roles.map((r) => r.toLowerCase());
  const resourcesLower = resources.map((r) => r.toLowerCase());

  for (const [role, resourcePerms] of Object.entries(perms)) {
    // Validate role exists
    if (!rolesLower.includes(role.toLowerCase())) {
      throw new Error(`Permission role "${role}" not found in roles list`);
    }

    // Validate resource permissions
    if (typeof resourcePerms !== 'object' || resourcePerms === null) {
      throw new Error(`Permissions for role "${role}" must be an object`);
    }

    for (const [resource, actions] of Object.entries(resourcePerms)) {
      // Validate resource exists
      if (!resourcesLower.includes(resource.toLowerCase())) {
        throw new Error(
          `Permission resource "${resource}" for role "${role}" not found in resources list`
        );
      }

      // Validate actions
      if (!Array.isArray(actions)) {
        throw new Error(`Actions for role "${role}" and resource "${resource}" must be an array`);
      }

      for (const action of actions) {
        if (typeof action !== 'string' || action.trim().length === 0) {
          throw new Error(
            `All actions for role "${role}" and resource "${resource}" must be non-empty strings`
          );
        }
      }
    }
  }
}

/**
 * Builds the access control matrix
 */
function buildMatrix(
  roles: string[],
  resources: string[],
  permissions: PermissionMap
): MatrixCell[][] {
  const matrix: MatrixCell[][] = [];

  for (const role of roles) {
    const row: MatrixCell[] = [];

    for (const resource of resources) {
      const rolePerms = permissions[role] || {};
      const actions = rolePerms[resource] || [];

      row.push({
        role,
        resource,
        actions: [...actions],
        hasAccess: actions.length > 0,
      });
    }

    matrix.push(row);
  }

  return matrix;
}

/**
 * Generates summary statistics from the matrix
 */
function generateSummary(
  matrix: MatrixCell[][],
  roles: string[],
  resources: string[]
): AccessControlMatrix['summary'] {
  const totalCells = roles.length * resources.length;
  let cellsWithAccess = 0;
  let totalPermissions = 0;

  const rolePermissionCounts: Record<string, number> = {};
  const resourceAccessCounts: Record<string, number> = {};

  // Initialize counts
  for (const role of roles) {
    rolePermissionCounts[role] = 0;
  }
  for (const resource of resources) {
    resourceAccessCounts[resource] = 0;
  }

  // Count permissions
  for (const row of matrix) {
    for (const cell of row) {
      if (cell.hasAccess) {
        cellsWithAccess++;
        totalPermissions += cell.actions.length;
        rolePermissionCounts[cell.role] =
          (rolePermissionCounts[cell.role] || 0) + cell.actions.length;
        resourceAccessCounts[cell.resource] = (resourceAccessCounts[cell.resource] || 0) + 1;
      }
    }
  }

  const cellsWithoutAccess = totalCells - cellsWithAccess;

  // Find most permissive role
  let mostPermissiveRole = roles[0] || '';
  let maxPermissions = rolePermissionCounts[roles[0] || ''] || 0;
  for (const role of roles) {
    const count = rolePermissionCounts[role] || 0;
    if (count > maxPermissions) {
      maxPermissions = count;
      mostPermissiveRole = role;
    }
  }

  // Find most restricted resource
  let mostRestrictedResource = resources[0] || '';
  let minAccess = resourceAccessCounts[resources[0] || ''] || 0;
  for (const resource of resources) {
    const count = resourceAccessCounts[resource] || 0;
    if (count < minAccess) {
      minAccess = count;
      mostRestrictedResource = resource;
    }
  }

  return {
    totalCells,
    cellsWithAccess,
    cellsWithoutAccess,
    totalPermissions,
    rolePermissionCounts,
    resourceAccessCounts,
    mostPermissiveRole,
    mostRestrictedResource,
  };
}

/**
 * Generates ASCII table visualization of the matrix
 */
function generateVisualization(matrix: MatrixCell[][], resources: string[]): string {
  const maxRoleLength = Math.max(...matrix.map((row) => row[0]?.role.length || 0), 4);
  const maxResourceLength = Math.max(...resources.map((r) => r.length), 8);
  const cellWidth = Math.max(maxResourceLength + 2, 10);

  // Header
  let viz = `${' '.repeat(maxRoleLength + 2)}|`;
  for (const resource of resources) {
    viz += ` ${resource.padEnd(cellWidth - 1)}|`;
  }
  viz += '\n';

  // Separator
  viz += `${'-'.repeat(maxRoleLength + 2)}+`;
  for (const _ of resources) {
    viz += `${'-'.repeat(cellWidth + 1)}+`;
  }
  viz += '\n';

  // Rows
  for (const row of matrix) {
    const role = (row[0]?.role || '').padEnd(maxRoleLength);
    viz += `${role} |`;

    for (const cell of row) {
      const display = cell.hasAccess ? cell.actions.join(',').substring(0, cellWidth - 1) : '-';
      viz += ` ${display.padEnd(cellWidth - 1)}|`;
    }
    viz += '\n';
  }

  return viz;
}

/**
 * Access Control Matrix Tool
 * Generates a comprehensive access control matrix from roles, resources, and permissions
 */
export const accessControlMatrix = tool({
  description:
    'Generates an access control matrix from roles, resources, and permissions. Takes role names, resource names, and a permission mapping (role -> resource -> actions), then returns a 2D matrix showing what each role can do with each resource. Useful for RBAC documentation, compliance audits, and security reviews.',
  inputSchema: jsonSchema<AccessControlMatrixInput>({
    type: 'object',
    properties: {
      roles: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of role names (e.g., ["admin", "editor", "viewer"])',
        minItems: 1,
      },
      resources: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of resource names (e.g., ["documents", "reports", "settings"])',
        minItems: 1,
      },
      permissions: {
        type: 'object',
        description:
          'Nested object mapping role -> resource -> actions array. Example: { "admin": { "documents": ["read", "write", "delete"] } }',
        additionalProperties: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    },
    required: ['roles', 'resources', 'permissions'],
    additionalProperties: false,
  }),
  async execute({ roles, resources, permissions }): Promise<AccessControlMatrix> {
    // Validate inputs
    validateRoles(roles);
    validateResources(resources);
    validatePermissions(permissions, roles, resources);

    // Build matrix
    const matrix = buildMatrix(roles, resources, permissions);

    // Generate summary
    const summary = generateSummary(matrix, roles, resources);

    // Generate visualization
    const visualization = generateVisualization(matrix, resources);

    return {
      matrix,
      roles,
      resources,
      summary,
      visualization,
    };
  },
});

export default accessControlMatrix;
