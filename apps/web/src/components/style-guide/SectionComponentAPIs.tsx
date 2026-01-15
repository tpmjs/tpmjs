'use client';

import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tpmjs/ui/Table/Table';
import { FieldsetSection, SubSection } from './shared';

export function SectionComponentAPIs(): React.ReactElement {
  return (
    <FieldsetSection title="13. component apis" id="api">
      <p className="text-foreground-secondary mb-8 font-sans prose-width">
        Complete API documentation for each component with props, types,
        and usage examples.
      </p>

      <SubSection title="button api">
        <div className="space-y-6">
          <Table variant="bordered">
            <TableHeader>
              <TableRow>
                <TableHead>prop</TableHead>
                <TableHead>type</TableHead>
                <TableHead>default</TableHead>
                <TableHead>description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono">variant</TableCell>
                <TableCell className="font-mono text-xs">&apos;default&apos; | &apos;secondary&apos; | &apos;destructive&apos; | &apos;outline&apos; | &apos;ghost&apos; | &apos;link&apos;</TableCell>
                <TableCell className="font-mono">&apos;default&apos;</TableCell>
                <TableCell>visual style</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">size</TableCell>
                <TableCell className="font-mono text-xs">&apos;sm&apos; | &apos;md&apos; | &apos;lg&apos; | &apos;icon&apos;</TableCell>
                <TableCell className="font-mono">&apos;md&apos;</TableCell>
                <TableCell>button size</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">loading</TableCell>
                <TableCell className="font-mono text-xs">boolean</TableCell>
                <TableCell className="font-mono">false</TableCell>
                <TableCell>show spinner</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">disabled</TableCell>
                <TableCell className="font-mono text-xs">boolean</TableCell>
                <TableCell className="font-mono">false</TableCell>
                <TableCell>disable interaction</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <CodeBlock
            code={`// Basic usage
<Button>click me</Button>

// With variant and size
<Button variant="destructive" size="lg">
  delete tool
</Button>

// Loading state
<Button loading>publishing...</Button>

// With icon
<Button>
  <Icon icon="plus" size="sm" className="mr-2" />
  add tool
</Button>`}
            language="tsx"
          />
        </div>
      </SubSection>

      <SubSection title="input api">
        <div className="space-y-6">
          <Table variant="bordered">
            <TableHeader>
              <TableRow>
                <TableHead>prop</TableHead>
                <TableHead>type</TableHead>
                <TableHead>default</TableHead>
                <TableHead>description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono">state</TableCell>
                <TableCell className="font-mono text-xs">&apos;default&apos; | &apos;error&apos; | &apos;success&apos;</TableCell>
                <TableCell className="font-mono">&apos;default&apos;</TableCell>
                <TableCell>visual state</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-mono">size</TableCell>
                <TableCell className="font-mono text-xs">&apos;sm&apos; | &apos;md&apos; | &apos;lg&apos;</TableCell>
                <TableCell className="font-mono">&apos;md&apos;</TableCell>
                <TableCell>input size</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <CodeBlock
            code={`// Basic usage
<Input placeholder="enter text..." />

// With error state
<Input
  state="error"
  placeholder="invalid input"
/>

// With FormField wrapper
<FormField
  label="Email"
  error="Invalid email address"
>
  <Input state="error" />
</FormField>`}
            language="tsx"
          />
        </div>
      </SubSection>

      <SubSection title="anti-patterns">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-error-light p-6 border border-error">
            <h4 className="font-mono text-sm font-medium mb-4 text-error">don&apos;t do this</h4>
            <CodeBlock
              code={`// ❌ Using inline styles
<Button style={{ backgroundColor: 'red' }}>
  delete
</Button>

// ❌ Nesting buttons
<Button>
  <Button>nested</Button>
</Button>

// ❌ Missing accessible name
<Button size="icon">
  <Icon icon="plus" />
</Button>`}
              language="tsx"
              size="sm"
            />
          </div>
          <div className="bg-success-light p-6 border border-success">
            <h4 className="font-mono text-sm font-medium mb-4 text-success">do this instead</h4>
            <CodeBlock
              code={`// ✅ Using variants
<Button variant="destructive">
  delete
</Button>

// ✅ Single button
<Button>action</Button>

// ✅ With aria-label
<Button size="icon" aria-label="Add item">
  <Icon icon="plus" />
</Button>`}
              language="tsx"
              size="sm"
            />
          </div>
        </div>
      </SubSection>
    </FieldsetSection>
  );
}
