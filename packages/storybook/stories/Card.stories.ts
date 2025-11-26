import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent, CardHeader, CardTitle } from '@tpmjs/ui/Card/Card';
import { createElement } from 'react';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () =>
    createElement(
      Card,
      { className: 'w-[350px]' },
      createElement(CardHeader, {}, createElement(CardTitle, {}, 'Card Title')),
      createElement(CardContent, {}, 'This is the card content.')
    ),
};

export const WithLongContent: Story = {
  render: () =>
    createElement(
      Card,
      { className: 'w-[400px]' },
      createElement(CardHeader, {}, createElement(CardTitle, {}, 'TPMJS')),
      createElement(
        CardContent,
        {},
        'Tool Package Manager for AI Agents. The registry for AI tools. Discover, share, and integrate tools that give your agents superpowers.'
      )
    ),
};
