import type { Meta, StoryObj } from '@storybook/react';
import { Icon } from '@tpmjs/ui/Icon/Icon';

const meta = {
  title: 'Components/Icon',
  component: Icon,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllIcons: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-8 p-8">
      {(
        ['copy', 'externalLink', 'github', 'check', 'x', 'chevronDown', 'sun', 'moon'] as const
      ).map((iconName) => (
        <div key={iconName} className="flex flex-col items-center gap-2">
          <Icon icon={iconName} size="lg" />
          <span className="text-sm text-foreground-secondary">{iconName}</span>
        </div>
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <Icon icon="github" size={size} />
          <span className="text-sm text-foreground-secondary">{size}</span>
        </div>
      ))}
    </div>
  ),
};

export const WithColors: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Icon icon="check" size="lg" className="text-success" />
      <Icon icon="x" size="lg" className="text-error" />
      <Icon icon="github" size="lg" className="text-info" />
      <Icon icon="sun" size="lg" className="text-warning" />
    </div>
  ),
};
