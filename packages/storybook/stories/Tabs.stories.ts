import type { Meta, StoryObj } from '@storybook/react';
import { type Tab, Tabs } from '@tpmjs/ui/Tabs/Tabs';
import { createElement } from 'react';

const meta = {
  title: 'Components/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockTabs: Tab[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'usage', label: 'Usage' },
  { id: 'api', label: 'API' },
];

export const Default: Story = {
  render: () =>
    createElement(Tabs, {
      tabs: mockTabs,
      activeTab: 'overview',
      onTabChange: (id: string) => console.log('Tab changed:', id),
    }),
};

export const AllSizes: Story = {
  render: () =>
    createElement(
      'div',
      { className: 'flex flex-col gap-8 w-full' },
      createElement(Tabs, {
        tabs: mockTabs,
        activeTab: 'overview',
        size: 'sm',
        onTabChange: () => {},
      }),
      createElement(Tabs, {
        tabs: mockTabs,
        activeTab: 'overview',
        size: 'md',
        onTabChange: () => {},
      }),
      createElement(Tabs, {
        tabs: mockTabs,
        activeTab: 'overview',
        size: 'lg',
        onTabChange: () => {},
      })
    ),
};

export const WithCounts: Story = {
  render: () =>
    createElement(Tabs, {
      tabs: [
        { id: 'all', label: 'All Tools', count: 1234 },
        { id: 'featured', label: 'Featured', count: 42 },
        { id: 'recent', label: 'Recent', count: 18 },
      ],
      activeTab: 'all',
      onTabChange: () => {},
    }),
};

export const ManyTabs: Story = {
  render: () =>
    createElement(
      'div',
      { className: 'w-96' },
      createElement(Tabs, {
        tabs: [
          { id: 'tab1', label: 'Overview' },
          { id: 'tab2', label: 'Documentation' },
          { id: 'tab3', label: 'Examples' },
          { id: 'tab4', label: 'API Reference' },
          { id: 'tab5', label: 'Configuration' },
          { id: 'tab6', label: 'Changelog' },
          { id: 'tab7', label: 'Contributing' },
        ],
        activeTab: 'tab1',
        onTabChange: () => {},
      })
    ),
};
