import type { Meta, StoryObj } from '@storybook/react';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { createElement } from 'react';

const meta = {
  title: 'Components/CodeBlock',
  component: CodeBlock,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () =>
    createElement(CodeBlock, {
      code: `console.log('Hello, World!');`,
    }),
};

export const BashCommand: Story = {
  render: () =>
    createElement(CodeBlock, {
      code: 'npm install @tpmjs/ui',
      language: 'bash',
    }),
};

export const TypeScriptCode: Story = {
  render: () =>
    createElement(CodeBlock, {
      code: `import { Button } from '@tpmjs/ui/Button/Button';
import { createElement } from 'react';

export function MyComponent() {
  return createElement(Button, {
    variant: 'outline',
    onClick: () => console.log('clicked'),
  }, 'Click me');
}`,
      language: 'typescript',
    }),
};

export const JSONData: Story = {
  render: () =>
    createElement(CodeBlock, {
      code: `{
  "name": "@tpmjs/ui",
  "version": "0.0.1",
  "description": "UI components for TPMJS"
}`,
      language: 'json',
    }),
};

export const LongCode: Story = {
  render: () =>
    createElement(
      'div',
      { className: 'w-96' },
      createElement(CodeBlock, {
        code: `export const buttonVariants = createVariants({
  base: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2',
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-error text-error-foreground hover:bg-error/90',
      outline: 'border border-border bg-background hover:bg-accent hover:text-accent-foreground',
    },
  },
});`,
        language: 'typescript',
      })
    ),
};
