/**
 * Org Chart Format Tool for TPMJS
 * Formats organizational hierarchy data into structured org chart representation
 */

import { jsonSchema, tool } from 'ai';

/**
 * Employee input data
 */
interface EmployeeInput {
  id: string;
  name: string;
  title: string;
  department: string;
  managerId?: string | null;
  email?: string;
  level?: number;
}

/**
 * Structured employee node in org chart
 */
export interface OrgChartNode {
  id: string;
  name: string;
  title: string;
  department: string;
  email?: string;
  level: number;
  managerId?: string | null;
  directReports: OrgChartNode[];
  reportCount: number; // Total reports (direct + indirect)
}

/**
 * Input interface for org chart formatting
 */
interface OrgChartFormatInput {
  employees: EmployeeInput[];
}

/**
 * Org chart output with metadata
 */
export interface OrgChart {
  root: OrgChartNode[];
  totalEmployees: number;
  departments: string[];
  maxDepth: number;
  orphanedEmployees: string[]; // Employees with invalid manager references
}

/**
 * Org Chart Format Tool
 * Formats organizational hierarchy data into structured org chart representation
 */
export const orgChartFormatTool = tool({
  description:
    'Formats organizational hierarchy data into a structured org chart representation. Processes employee data with manager relationships to create a hierarchical tree structure with reporting relationships, departments, and role titles.',
  inputSchema: jsonSchema<OrgChartFormatInput>({
    type: 'object',
    properties: {
      employees: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique employee identifier',
            },
            name: {
              type: 'string',
              description: 'Employee full name',
            },
            title: {
              type: 'string',
              description: 'Job title',
            },
            department: {
              type: 'string',
              description: 'Department name',
            },
            managerId: {
              type: ['string', 'null'],
              description: 'Manager employee ID (null for top-level)',
            },
            email: {
              type: 'string',
              description: 'Employee email address',
            },
            level: {
              type: 'number',
              description: 'Organizational level (optional, will be calculated if not provided)',
            },
          },
          required: ['id', 'name', 'title', 'department'],
        },
        minItems: 1,
        description: 'Array of employee objects with manager relationships',
      },
    },
    required: ['employees'],
    additionalProperties: false,
  }),
  execute: async ({ employees }): Promise<OrgChart> => {
    // Validate inputs
    if (!Array.isArray(employees) || employees.length === 0) {
      throw new Error('Employees must be a non-empty array');
    }

    // Validate each employee has required fields
    for (const emp of employees) {
      if (!emp.id || typeof emp.id !== 'string') {
        throw new Error('Each employee must have a valid id');
      }
      if (!emp.name || typeof emp.name !== 'string') {
        throw new Error(`Employee ${emp.id} must have a valid name`);
      }
      if (!emp.title || typeof emp.title !== 'string') {
        throw new Error(`Employee ${emp.id} must have a valid title`);
      }
      if (!emp.department || typeof emp.department !== 'string') {
        throw new Error(`Employee ${emp.id} must have a valid department`);
      }
    }

    // Check for duplicate IDs
    const ids = new Set<string>();
    for (const emp of employees) {
      if (ids.has(emp.id)) {
        throw new Error(`Duplicate employee ID found: ${emp.id}`);
      }
      ids.add(emp.id);
    }

    try {
      // Build employee map for quick lookup
      const employeeMap = new Map<string, EmployeeInput>();
      for (const emp of employees) {
        employeeMap.set(emp.id, emp);
      }

      // Find root employees (no manager or invalid manager)
      const rootEmployees: EmployeeInput[] = [];
      const orphanedEmployees: string[] = [];

      for (const emp of employees) {
        if (!emp.managerId || emp.managerId === null) {
          rootEmployees.push(emp);
        } else if (!employeeMap.has(emp.managerId)) {
          // Manager ID doesn't exist - treat as orphaned
          orphanedEmployees.push(emp.id);
          rootEmployees.push(emp); // Add to root to avoid losing them
        }
      }

      if (rootEmployees.length === 0) {
        throw new Error('No root employees found (circular management structure detected)');
      }

      // Build the org chart tree
      const buildNode = (emp: EmployeeInput, currentLevel: number): OrgChartNode => {
        // Find direct reports
        const directReportData = employees.filter((e) => e.managerId === emp.id);
        const directReports = directReportData.map((report) => buildNode(report, currentLevel + 1));

        // Calculate total report count (direct + all indirect)
        const reportCount = directReports.reduce((sum, dr) => sum + 1 + dr.reportCount, 0);

        return {
          id: emp.id,
          name: emp.name,
          title: emp.title,
          department: emp.department,
          email: emp.email,
          level: emp.level ?? currentLevel,
          managerId: emp.managerId,
          directReports,
          reportCount,
        };
      };

      const root = rootEmployees.map((emp) => buildNode(emp, 0));

      // Calculate max depth
      const calculateMaxDepth = (node: OrgChartNode): number => {
        if (node.directReports.length === 0) return node.level;
        return Math.max(...node.directReports.map(calculateMaxDepth));
      };

      const maxDepth = Math.max(...root.map(calculateMaxDepth));

      // Get unique departments
      const departments = Array.from(new Set(employees.map((e) => e.department))).sort();

      return {
        root,
        totalEmployees: employees.length,
        departments,
        maxDepth,
        orphanedEmployees,
      };
    } catch (error) {
      throw new Error(
        `Failed to format org chart: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  },
});

export default orgChartFormatTool;
