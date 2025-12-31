# Access Control Matrix Tool

Generates access control matrices from roles, resources, and permissions for RBAC (Role-Based Access Control) compliance and documentation.

## Installation

```bash
npm install @tpmjs/tools-access-control-matrix
```

## Usage

```typescript
import { accessControlMatrix } from '@tpmjs/tools-access-control-matrix';

const result = await accessControlMatrix.execute({
  roles: ['admin', 'editor', 'viewer'],
  resources: ['documents', 'reports', 'settings'],
  permissions: {
    admin: {
      documents: ['read', 'write', 'delete'],
      reports: ['read', 'write', 'delete'],
      settings: ['read', 'write'],
    },
    editor: {
      documents: ['read', 'write'],
      reports: ['read', 'write'],
    },
    viewer: {
      documents: ['read'],
      reports: ['read'],
    },
  },
});

console.log(result.visualization);
// Output:
//       | documents          | reports            | settings           |
// ------+--------------------+--------------------+--------------------+
// admin | read,write,delete  | read,write,delete  | read,write         |
// editor| read,write         | read,write         | -                  |
// viewer| read               | read               | -                  |

console.log(result.summary);
// {
//   totalCells: 9,
//   cellsWithAccess: 7,
//   cellsWithoutAccess: 2,
//   totalPermissions: 14,
//   rolePermissionCounts: { admin: 8, editor: 4, viewer: 2 },
//   resourceAccessCounts: { documents: 3, reports: 3, settings: 1 },
//   mostPermissiveRole: 'admin',
//   mostRestrictedResource: 'settings'
// }
```

## Input Schema

```typescript
{
  roles: string[];        // Array of role names
  resources: string[];    // Array of resource names
  permissions: {          // Nested mapping
    [role: string]: {
      [resource: string]: string[];  // Array of actions
    }
  }
}
```

## Output Schema

```typescript
interface AccessControlMatrix {
  matrix: MatrixCell[][];  // 2D array of role-resource permissions
  roles: string[];         // List of roles
  resources: string[];     // List of resources
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
  visualization: string;   // ASCII table representation
}

interface MatrixCell {
  role: string;
  resource: string;
  actions: string[];
  hasAccess: boolean;
}
```

## Use Cases

- **RBAC Documentation** - Generate visual documentation of role permissions
- **Security Audits** - Review access control configurations
- **Compliance Reports** - Generate access matrix for SOC2, ISO 27001
- **Onboarding** - Help new team members understand access structure
- **Access Reviews** - Quarterly reviews of role permissions
- **Least Privilege Analysis** - Identify overly permissive roles

## Common Actions

Standard CRUD operations:
- `read` - View or retrieve resources
- `write` - Create or update resources
- `delete` - Remove resources
- `execute` - Run or trigger resources

Extended actions:
- `approve` - Approve changes or requests
- `publish` - Make resources publicly available
- `share` - Share resources with others
- `export` - Download or export data
- `admin` - Administrative access

## Validation

The tool validates:
- Roles and resources are non-empty string arrays
- No duplicate roles or resources (case-insensitive)
- All permission roles exist in the roles list
- All permission resources exist in the resources list
- Actions are arrays of non-empty strings

## Example: Multi-Tier Application

```typescript
const appMatrix = await accessControlMatrix.execute({
  roles: ['superadmin', 'admin', 'developer', 'analyst', 'guest'],
  resources: ['users', 'database', 'api', 'reports', 'logs'],
  permissions: {
    superadmin: {
      users: ['read', 'write', 'delete'],
      database: ['read', 'write', 'delete', 'backup'],
      api: ['read', 'write', 'delete', 'deploy'],
      reports: ['read', 'write', 'export'],
      logs: ['read', 'delete'],
    },
    admin: {
      users: ['read', 'write'],
      database: ['read'],
      api: ['read', 'deploy'],
      reports: ['read', 'write', 'export'],
      logs: ['read'],
    },
    developer: {
      api: ['read', 'write'],
      logs: ['read'],
    },
    analyst: {
      reports: ['read', 'export'],
      logs: ['read'],
    },
    guest: {
      reports: ['read'],
    },
  },
});
```

## Example: Healthcare System

```typescript
const healthcareMatrix = await accessControlMatrix.execute({
  roles: ['physician', 'nurse', 'receptionist', 'billing'],
  resources: ['patient_records', 'prescriptions', 'appointments', 'billing_info'],
  permissions: {
    physician: {
      patient_records: ['read', 'write'],
      prescriptions: ['read', 'write', 'approve'],
      appointments: ['read'],
    },
    nurse: {
      patient_records: ['read', 'write'],
      prescriptions: ['read'],
      appointments: ['read', 'write'],
    },
    receptionist: {
      patient_records: ['read'],
      appointments: ['read', 'write'],
    },
    billing: {
      patient_records: ['read'],
      billing_info: ['read', 'write'],
    },
  },
});
```

## Best Practices

1. **Least Privilege** - Grant minimum necessary permissions
2. **Separation of Duties** - Divide critical permissions across roles
3. **Regular Reviews** - Audit the matrix quarterly
4. **Clear Naming** - Use descriptive role and resource names
5. **Document Actions** - Define what each action means in context
6. **Version Control** - Track matrix changes over time

## Limitations

- Does not enforce permissions (documentation/analysis only)
- Does not support attribute-based access control (ABAC)
- Does not handle permission inheritance or hierarchies
- Case-sensitive role and resource names in display
- No support for conditional permissions or time-based access

## License

MIT
