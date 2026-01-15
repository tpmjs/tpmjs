'use client';

import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Button } from '@tpmjs/ui/Button/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@tpmjs/ui/Card/Card';
import { Checkbox } from '@tpmjs/ui/Checkbox/Checkbox';
import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
import { FormField } from '@tpmjs/ui/FormField/FormField';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { Radio } from '@tpmjs/ui/Radio/Radio';
import { RadioGroup } from '@tpmjs/ui/Radio/RadioGroup';
import { Select } from '@tpmjs/ui/Select/Select';
import { Spinner } from '@tpmjs/ui/Spinner/Spinner';
import { Switch } from '@tpmjs/ui/Switch/Switch';
import { Tabs } from '@tpmjs/ui/Tabs/Tabs';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tpmjs/ui/Table/Table';
import { Textarea } from '@tpmjs/ui/Textarea/Textarea';
import { FieldsetSection, SubSection } from './shared';

interface SectionComponentsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  radioValue: string;
  onRadioChange: (value: string) => void;
}

export function SectionComponents({
  activeTab,
  onTabChange,
  radioValue,
  onRadioChange
}: SectionComponentsProps): React.ReactElement {
  return (
    <FieldsetSection title="12. components" id="components">
      <p className="text-foreground-secondary mb-8 font-sans prose-width">
        Complete component catalog with all variants and states.
      </p>

      {/* Button */}
      <SubSection title="button">
        <div className="space-y-6">
          <div>
            <p className="font-mono text-xs text-foreground-secondary mb-3">variants</p>
            <div className="flex flex-wrap gap-4 items-center">
              <Button variant="default">default</Button>
              <Button variant="secondary">secondary</Button>
              <Button variant="destructive">destructive</Button>
              <Button variant="outline">outline</Button>
              <Button variant="outline-dotted">outline dotted</Button>
              <Button variant="blueprint">blueprint</Button>
              <Button variant="ghost">ghost</Button>
              <Button variant="link">link</Button>
            </div>
          </div>
          <div>
            <p className="font-mono text-xs text-foreground-secondary mb-3">sizes</p>
            <div className="flex flex-wrap gap-4 items-center">
              <Button size="sm">small</Button>
              <Button size="md">medium</Button>
              <Button size="lg">large</Button>
              <Button size="icon"><Icon icon="plus" size="sm" /></Button>
            </div>
          </div>
          <div>
            <p className="font-mono text-xs text-foreground-secondary mb-3">states</p>
            <div className="flex flex-wrap gap-4 items-center">
              <Button>normal</Button>
              <Button disabled>disabled</Button>
              <Button loading>loading</Button>
            </div>
          </div>
        </div>
      </SubSection>

      {/* Badge */}
      <SubSection title="badge">
        <div className="space-y-6">
          <div>
            <p className="font-mono text-xs text-foreground-secondary mb-3">variants</p>
            <div className="flex flex-wrap gap-4 items-center">
              <Badge variant="default">default</Badge>
              <Badge variant="secondary">secondary</Badge>
              <Badge variant="outline">outline</Badge>
              <Badge variant="success">success</Badge>
              <Badge variant="error">error</Badge>
              <Badge variant="warning">warning</Badge>
              <Badge variant="info">info</Badge>
            </div>
          </div>
          <div>
            <p className="font-mono text-xs text-foreground-secondary mb-3">sizes</p>
            <div className="flex flex-wrap gap-4 items-center">
              <Badge size="sm">small</Badge>
              <Badge size="md">medium</Badge>
              <Badge size="lg">large</Badge>
            </div>
          </div>
        </div>
      </SubSection>

      {/* Card */}
      <SubSection title="card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(['default', 'elevated', 'outline', 'blueprint', 'featured', 'brutalist'] as const).map((variant) => (
            <Card key={variant} variant={variant}>
              <CardHeader>
                <CardTitle>{variant} card</CardTitle>
                <CardDescription>card variant example</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-foreground-secondary text-sm">card content goes here.</p>
              </CardContent>
              <CardFooter>
                <Button size="sm">action</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </SubSection>

      {/* Form Elements */}
      <SubSection title="form elements">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <FormField label="input">
              <Input placeholder="enter text..." />
            </FormField>
            <FormField label="textarea">
              <Textarea placeholder="enter text..." rows={3} />
            </FormField>
            <FormField label="select">
              <Select
                placeholder="select option..."
                options={[
                  { value: '1', label: 'Option 1' },
                  { value: '2', label: 'Option 2' },
                  { value: '3', label: 'Option 3' },
                ]}
              />
            </FormField>
          </div>
          <div className="space-y-6">
            <div>
              <p className="font-mono text-xs text-foreground-secondary mb-3">checkbox</p>
              <div className="flex gap-6">
                <Checkbox label="unchecked" />
                <Checkbox label="checked" checked onChange={() => {}} />
                <Checkbox label="disabled" disabled />
              </div>
            </div>
            <div>
              <p className="font-mono text-xs text-foreground-secondary mb-3">switch</p>
              <div className="flex gap-6">
                <Switch label="off" />
                <Switch label="on" checked onChange={() => {}} />
                <Switch label="disabled" disabled />
              </div>
            </div>
            <div>
              <p className="font-mono text-xs text-foreground-secondary mb-3">radio group</p>
              <RadioGroup
                name="demo-radio"
                value={radioValue}
                onChange={onRadioChange}
                orientation="horizontal"
              >
                <Radio value="option1" label="option 1" />
                <Radio value="option2" label="option 2" />
                <Radio value="option3" label="option 3" />
              </RadioGroup>
            </div>
          </div>
        </div>
      </SubSection>

      {/* Tabs */}
      <SubSection title="tabs">
        <div className="space-y-6">
          <Tabs
            tabs={[
              { id: 'all', label: 'all items', count: 128 },
              { id: 'active', label: 'active', count: 42 },
              { id: 'archived', label: 'archived', count: 86 },
            ]}
            activeTab={activeTab}
            onTabChange={onTabChange}
            variant="default"
          />
        </div>
      </SubSection>

      {/* Table */}
      <SubSection title="table">
        <Table>
          <TableCaption>example data table</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>name</TableHead>
              <TableHead>category</TableHead>
              <TableHead className="text-right">downloads</TableHead>
              <TableHead className="text-right">score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-mono">@tpmjs/parser</TableCell>
              <TableCell>utility</TableCell>
              <TableCell className="text-right font-mono">125,432</TableCell>
              <TableCell className="text-right font-mono">0.92</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono">@tpmjs/validator</TableCell>
              <TableCell>validation</TableCell>
              <TableCell className="text-right font-mono">89,231</TableCell>
              <TableCell className="text-right font-mono">0.87</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-mono">@tpmjs/transform</TableCell>
              <TableCell>data</TableCell>
              <TableCell className="text-right font-mono">45,678</TableCell>
              <TableCell className="text-right font-mono">0.81</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </SubSection>

      {/* Spinner */}
      <SubSection title="spinner">
        <div className="flex flex-wrap gap-12 items-center">
          <div className="text-center">
            <Spinner size="xs" />
            <p className="font-mono text-xs text-foreground-secondary mt-4">xs</p>
          </div>
          <div className="text-center">
            <Spinner size="sm" />
            <p className="font-mono text-xs text-foreground-secondary mt-4">sm</p>
          </div>
          <div className="text-center">
            <Spinner size="md" />
            <p className="font-mono text-xs text-foreground-secondary mt-4">md</p>
          </div>
          <div className="text-center">
            <Spinner size="lg" />
            <p className="font-mono text-xs text-foreground-secondary mt-4">lg</p>
          </div>
          <div className="text-center">
            <Spinner size="xl" />
            <p className="font-mono text-xs text-foreground-secondary mt-4">xl</p>
          </div>
        </div>
      </SubSection>

      {/* Code Block */}
      <SubSection title="code block">
        <CodeBlock
          code={`import { Button } from '@tpmjs/ui/Button/Button';

export function MyComponent() {
  return (
    <Button variant="default">
      click me
    </Button>
  );
}`}
          language="typescript"
        />
      </SubSection>
    </FieldsetSection>
  );
}
