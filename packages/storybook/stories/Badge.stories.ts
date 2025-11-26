import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '@tpmjs/ui/Badge/Badge';
import { createElement } from 'react';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => createElement(Badge, {}, 'Default'),
};

export const AllVariants: Story = {
  render: () =>
    createElement(
      'div',
      {
        className: 'flex flex-wrap items-center gap-3',
      },
      createElement(Badge, { variant: 'default' }, 'Default'),
      createElement(Badge, { variant: 'secondary' }, 'Secondary'),
      createElement(Badge, { variant: 'outline' }, 'Outline'),
      createElement(Badge, { variant: 'success' }, 'Success'),
      createElement(Badge, { variant: 'error' }, 'Error'),
      createElement(Badge, { variant: 'warning' }, 'Warning'),
      createElement(Badge, { variant: 'info' }, 'Info')
    ),
};

export const AllSizes: Story = {
  render: () =>
    createElement(
      'div',
      {
        className: 'flex items-center gap-3',
      },
      createElement(Badge, { size: 'sm' }, 'Small'),
      createElement(Badge, { size: 'md' }, 'Medium'),
      createElement(Badge, { size: 'lg' }, 'Large')
    ),
};

export const WithLongText: Story = {
  render: () => createElement(Badge, {}, 'This is a very long badge with lots of text'),
};
