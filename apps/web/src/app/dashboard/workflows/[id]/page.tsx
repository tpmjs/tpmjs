'use client';

import { use } from 'react';
import { DashboardLayout } from '~/components/dashboard/DashboardLayout';
import { WorkflowCanvas } from '~/components/workflows/WorkflowCanvas';

export default function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.ReactElement {
  const { id } = use(params);

  return (
    <DashboardLayout
      title="Workflow Builder"
      showBackButton
      backUrl="/dashboard/workflows"
      fullHeight
    >
      <WorkflowCanvas workflowId={id} />
    </DashboardLayout>
  );
}
