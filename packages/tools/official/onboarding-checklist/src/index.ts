/**
 * Onboarding Checklist Tool for TPMJS
 * Generates role-specific onboarding checklists with tasks, owners, and timelines
 */

import { jsonSchema, tool } from 'ai';

/**
 * Task owner type
 */
export type TaskOwner = 'hr' | 'it' | 'manager' | 'team' | 'new-hire';

/**
 * Single onboarding task
 */
export interface OnboardingTask {
  task: string;
  owner: TaskOwner;
  timeline: string;
  category: 'setup' | 'training' | 'introduction' | 'administrative' | 'role-specific';
  completed: boolean;
}

/**
 * Onboarding checklist grouped by timeline
 */
export interface OnboardingChecklist {
  role: string;
  department: string;
  startDate: string;
  tasks: OnboardingTask[];
  tasksByTimeline: {
    'Day 1': OnboardingTask[];
    'Week 1': OnboardingTask[];
    'Week 2-4': OnboardingTask[];
    'Month 2-3': OnboardingTask[];
  };
  totalTasks: number;
  formatted: string;
}

type OnboardingChecklistInput = {
  role: string;
  department: string;
  startDate: string;
};

/**
 * Validates date string format
 */
function validateDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Generates core IT setup tasks
 */
function generateITTasks(): OnboardingTask[] {
  // Domain rule: onboarding_timeline - IT setup tasks prioritized for Day 1 to enable productivity
  return [
    {
      task: 'Set up company email account and credentials',
      owner: 'it',
      timeline: 'Day 1',
      category: 'setup',
      completed: false,
    },
    {
      task: 'Provision laptop/workstation with required software',
      owner: 'it',
      timeline: 'Day 1',
      category: 'setup',
      completed: false,
    },
    {
      task: 'Configure access to company networks (VPN, WiFi)',
      owner: 'it',
      timeline: 'Day 1',
      category: 'setup',
      completed: false,
    },
    {
      task: 'Set up access to collaboration tools (Slack, Teams, etc.)',
      owner: 'it',
      timeline: 'Day 1',
      category: 'setup',
      completed: false,
    },
    {
      task: 'Configure multi-factor authentication and security settings',
      owner: 'it',
      timeline: 'Week 1',
      category: 'setup',
      completed: false,
    },
  ];
}

/**
 * Generates core HR administrative tasks
 */
function generateHRTasks(): OnboardingTask[] {
  return [
    {
      task: 'Complete new hire paperwork (I-9, W-4, direct deposit)',
      owner: 'hr',
      timeline: 'Day 1',
      category: 'administrative',
      completed: false,
    },
    {
      task: 'Review and sign employee handbook acknowledgment',
      owner: 'new-hire',
      timeline: 'Day 1',
      category: 'administrative',
      completed: false,
    },
    {
      task: 'Enroll in benefits (health, dental, 401k)',
      owner: 'new-hire',
      timeline: 'Week 1',
      category: 'administrative',
      completed: false,
    },
    {
      task: 'Complete company compliance training (harassment, security, etc.)',
      owner: 'new-hire',
      timeline: 'Week 1',
      category: 'training',
      completed: false,
    },
    {
      task: 'Schedule 30-day check-in with HR',
      owner: 'hr',
      timeline: 'Week 2-4',
      category: 'administrative',
      completed: false,
    },
  ];
}

/**
 * Generates manager and team introduction tasks
 */
function generateTeamTasks(department: string): OnboardingTask[] {
  return [
    {
      task: 'Welcome meeting with direct manager to review role expectations',
      owner: 'manager',
      timeline: 'Day 1',
      category: 'introduction',
      completed: false,
    },
    {
      task: 'Team introduction meeting and overview of team structure',
      owner: 'manager',
      timeline: 'Day 1',
      category: 'introduction',
      completed: false,
    },
    {
      task: `Schedule 1:1s with key stakeholders in ${department}`,
      owner: 'manager',
      timeline: 'Week 1',
      category: 'introduction',
      completed: false,
    },
    {
      task: 'Assign onboarding buddy/mentor for questions and guidance',
      owner: 'manager',
      timeline: 'Week 1',
      category: 'introduction',
      completed: false,
    },
    {
      task: 'Review team processes, rituals, and communication norms',
      owner: 'team',
      timeline: 'Week 1',
      category: 'training',
      completed: false,
    },
    {
      task: 'Schedule regular 1:1s with manager (weekly or bi-weekly)',
      owner: 'manager',
      timeline: 'Week 2-4',
      category: 'administrative',
      completed: false,
    },
  ];
}

/**
 * Generates role-specific tasks based on role type
 */
function generateRoleSpecificTasks(role: string, department: string): OnboardingTask[] {
  const roleLower = role.toLowerCase();
  const tasks: OnboardingTask[] = [];

  // Engineering roles
  if (
    roleLower.includes('engineer') ||
    roleLower.includes('developer') ||
    roleLower.includes('software')
  ) {
    tasks.push(
      {
        task: 'Set up development environment and clone repositories',
        owner: 'new-hire',
        timeline: 'Week 1',
        category: 'role-specific',
        completed: false,
      },
      {
        task: 'Review codebase architecture and documentation',
        owner: 'new-hire',
        timeline: 'Week 1',
        category: 'role-specific',
        completed: false,
      },
      {
        task: 'Complete first code review or pair programming session',
        owner: 'team',
        timeline: 'Week 2-4',
        category: 'role-specific',
        completed: false,
      },
      {
        task: 'Deploy first small feature or bug fix to production',
        owner: 'new-hire',
        timeline: 'Month 2-3',
        category: 'role-specific',
        completed: false,
      }
    );
  }

  // Product/Design roles
  if (roleLower.includes('product') || roleLower.includes('design') || roleLower.includes('ux')) {
    tasks.push(
      {
        task: 'Review product roadmap and current priorities',
        owner: 'manager',
        timeline: 'Week 1',
        category: 'role-specific',
        completed: false,
      },
      {
        task: 'Meet with key users or customers to understand needs',
        owner: 'team',
        timeline: 'Week 2-4',
        category: 'role-specific',
        completed: false,
      },
      {
        task: 'Shadow customer calls or user research sessions',
        owner: 'team',
        timeline: 'Week 2-4',
        category: 'role-specific',
        completed: false,
      },
      {
        task: 'Contribute to first product or design review',
        owner: 'new-hire',
        timeline: 'Month 2-3',
        category: 'role-specific',
        completed: false,
      }
    );
  }

  // Sales/Marketing roles
  if (
    roleLower.includes('sales') ||
    roleLower.includes('marketing') ||
    roleLower.includes('account')
  ) {
    tasks.push(
      {
        task: 'Complete product training and demo certification',
        owner: 'new-hire',
        timeline: 'Week 1',
        category: 'role-specific',
        completed: false,
      },
      {
        task: 'Review sales methodology and customer success processes',
        owner: 'team',
        timeline: 'Week 2-4',
        category: 'role-specific',
        completed: false,
      },
      {
        task: 'Shadow experienced team member on customer calls',
        owner: 'team',
        timeline: 'Week 2-4',
        category: 'role-specific',
        completed: false,
      },
      {
        task: 'Complete first independent customer interaction or campaign',
        owner: 'new-hire',
        timeline: 'Month 2-3',
        category: 'role-specific',
        completed: false,
      }
    );
  }

  // Generic role tasks if no specific match
  if (tasks.length === 0) {
    tasks.push(
      {
        task: `Review ${department} documentation and processes`,
        owner: 'new-hire',
        timeline: 'Week 1',
        category: 'role-specific',
        completed: false,
      },
      {
        task: 'Shadow team members to learn workflows',
        owner: 'team',
        timeline: 'Week 2-4',
        category: 'role-specific',
        completed: false,
      },
      {
        task: 'Complete first independent project or deliverable',
        owner: 'new-hire',
        timeline: 'Month 2-3',
        category: 'role-specific',
        completed: false,
      }
    );
  }

  // Add common role tasks
  tasks.push({
    task: 'Set initial 30-60-90 day goals with manager',
    owner: 'manager',
    timeline: 'Week 1',
    category: 'role-specific',
    completed: false,
  });

  return tasks;
}

/**
 * Groups tasks by timeline
 */
function groupTasksByTimeline(tasks: OnboardingTask[]): OnboardingChecklist['tasksByTimeline'] {
  const grouped: OnboardingChecklist['tasksByTimeline'] = {
    'Day 1': [],
    'Week 1': [],
    'Week 2-4': [],
    'Month 2-3': [],
  };

  for (const task of tasks) {
    if (grouped[task.timeline as keyof typeof grouped]) {
      grouped[task.timeline as keyof typeof grouped].push(task);
    }
  }

  return grouped;
}

/**
 * Formats the checklist as markdown
 */
function formatChecklist(
  role: string,
  department: string,
  startDate: string,
  tasksByTimeline: OnboardingChecklist['tasksByTimeline']
): string {
  const sections: string[] = [];

  sections.push(`# Onboarding Checklist\n`);
  sections.push(`**Role:** ${role}`);
  sections.push(`**Department:** ${department}`);
  sections.push(`**Start Date:** ${startDate}\n`);

  sections.push('---\n');

  // Organize by timeline
  const timelines: Array<keyof typeof tasksByTimeline> = [
    'Day 1',
    'Week 1',
    'Week 2-4',
    'Month 2-3',
  ];

  for (const timeline of timelines) {
    const timelineTasks = tasksByTimeline[timeline];
    if (timelineTasks.length === 0) continue;

    sections.push(`## ${timeline}\n`);

    // Group by owner within each timeline
    const byOwner = new Map<TaskOwner, OnboardingTask[]>();
    for (const task of timelineTasks) {
      if (!byOwner.has(task.owner)) {
        byOwner.set(task.owner, []);
      }
      byOwner.get(task.owner)!.push(task);
    }

    // Display tasks grouped by owner
    const ownerOrder: TaskOwner[] = ['hr', 'it', 'manager', 'team', 'new-hire'];
    for (const owner of ownerOrder) {
      const ownerTasks = byOwner.get(owner);
      if (!ownerTasks || ownerTasks.length === 0) continue;

      const ownerLabel = owner
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      sections.push(`### ${ownerLabel}\n`);
      for (const task of ownerTasks) {
        sections.push(`- [ ] ${task.task}`);
      }
      sections.push('');
    }
  }

  sections.push('---\n');
  sections.push(
    '*This checklist should be reviewed regularly and updated based on progress and feedback.*'
  );

  return sections.join('\n');
}

/**
 * Onboarding Checklist Tool
 * Generates comprehensive onboarding checklists
 */
export const onboardingChecklistTool = tool({
  description:
    'Generates role-specific onboarding checklists with tasks organized by day/week, clear ownership (HR, IT, manager, team, new hire), and comprehensive coverage of setup, training, and integration activities.',
  inputSchema: jsonSchema<OnboardingChecklistInput>({
    type: 'object',
    properties: {
      role: {
        type: 'string',
        description: "New hire's role (e.g., 'Software Engineer', 'Product Manager')",
      },
      department: {
        type: 'string',
        description: "Department (e.g., 'Engineering', 'Sales', 'Marketing')",
      },
      startDate: {
        type: 'string',
        description: 'Start date in YYYY-MM-DD format',
      },
    },
    required: ['role', 'department', 'startDate'],
    additionalProperties: false,
  }),
  async execute({ role, department, startDate }): Promise<OnboardingChecklist> {
    // Validate role
    if (!role || typeof role !== 'string' || role.trim().length === 0) {
      throw new Error('Role is required and must be a non-empty string');
    }

    // Validate department
    if (!department || typeof department !== 'string' || department.trim().length === 0) {
      throw new Error('Department is required and must be a non-empty string');
    }

    // Validate start date
    if (!startDate || typeof startDate !== 'string' || !validateDate(startDate)) {
      throw new Error('Start date is required and must be a valid date string (YYYY-MM-DD)');
    }

    // Generate all task categories
    const itTasks = generateITTasks();
    const hrTasks = generateHRTasks();
    const teamTasks = generateTeamTasks(department);
    const roleSpecificTasks = generateRoleSpecificTasks(role, department);

    // Combine all tasks
    const allTasks = [...itTasks, ...hrTasks, ...teamTasks, ...roleSpecificTasks];

    // Group tasks by timeline
    const tasksByTimeline = groupTasksByTimeline(allTasks);

    // Format the checklist
    const formatted = formatChecklist(role, department, startDate, tasksByTimeline);

    return {
      role,
      department,
      startDate,
      tasks: allTasks,
      tasksByTimeline,
      totalTasks: allTasks.length,
      formatted,
    };
  },
});

export default onboardingChecklistTool;
