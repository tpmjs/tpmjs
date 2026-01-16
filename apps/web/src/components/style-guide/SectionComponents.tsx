'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@tpmjs/ui/Accordion/Accordion';
import { Badge } from '@tpmjs/ui/Badge/Badge';
import { Breadcrumbs, BreadcrumbItem } from '@tpmjs/ui/Breadcrumbs/Breadcrumbs';
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
import { Drawer } from '@tpmjs/ui/Drawer/Drawer';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@tpmjs/ui/DropdownMenu/DropdownMenu';
import { EmptyState } from '@tpmjs/ui/EmptyState/EmptyState';
import { ErrorState } from '@tpmjs/ui/ErrorState/ErrorState';
import { FormField } from '@tpmjs/ui/FormField/FormField';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { InstallSnippet } from '@tpmjs/ui/InstallSnippet/InstallSnippet';
import { LoadingState } from '@tpmjs/ui/LoadingState/LoadingState';
import { Modal } from '@tpmjs/ui/Modal/Modal';
import { PageHeader } from '@tpmjs/ui/PageHeader/PageHeader';
import { Pagination } from '@tpmjs/ui/Pagination/Pagination';
import { Popover } from '@tpmjs/ui/Popover/Popover';
import { ProgressBar } from '@tpmjs/ui/ProgressBar/ProgressBar';
import { QualityScore } from '@tpmjs/ui/QualityScore/QualityScore';
import { Radio } from '@tpmjs/ui/Radio/Radio';
import { RadioGroup } from '@tpmjs/ui/Radio/RadioGroup';
import { Select } from '@tpmjs/ui/Select/Select';
import { Skeleton } from '@tpmjs/ui/Skeleton/Skeleton';
import { Slider } from '@tpmjs/ui/Slider/Slider';
import { Spinner } from '@tpmjs/ui/Spinner/Spinner';
import { StatCard } from '@tpmjs/ui/StatCard/StatCard';
import { Switch } from '@tpmjs/ui/Switch/Switch';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@tpmjs/ui/Table/Table';
import { Tabs } from '@tpmjs/ui/Tabs/Tabs';
import { Textarea } from '@tpmjs/ui/Textarea/Textarea';
import { Toast, ToastProvider } from '@tpmjs/ui/Toast/Toast';
import { Tooltip } from '@tpmjs/ui/Tooltip/Tooltip';
import { useState } from 'react';
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
  onRadioChange,
}: SectionComponentsProps): React.ReactElement {
  const [sliderValue, setSliderValue] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

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
              <Button size="icon">
                <Icon icon="plus" size="sm" />
              </Button>
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
          {(['default', 'elevated', 'outline', 'blueprint', 'featured', 'brutalist'] as const).map(
            (variant) => (
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
            )
          )}
        </div>
      </SubSection>

      {/* Accordion */}
      <SubSection title="accordion">
        <Accordion type="single" collapsible className="w-full max-w-lg">
          <AccordionItem value="item-1">
            <AccordionTrigger>What is TPMJS?</AccordionTrigger>
            <AccordionContent>
              TPMJS is a tool package manager for JavaScript that helps you discover, publish, and
              use AI tools.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>How do I publish a tool?</AccordionTrigger>
            <AccordionContent>
              Add the tpmjs keyword to your package.json and publish to npm. Your tool will be
              automatically discovered.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Is it free to use?</AccordionTrigger>
            <AccordionContent>
              Yes, TPMJS is free for open source tools. Enterprise features are available for
              private registries.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </SubSection>

      {/* Breadcrumbs */}
      <SubSection title="breadcrumbs">
        <div className="space-y-4">
          <Breadcrumbs>
            <BreadcrumbItem href="/">Home</BreadcrumbItem>
            <BreadcrumbItem href="/tools">Tools</BreadcrumbItem>
            <BreadcrumbItem href="/tools/category">Category</BreadcrumbItem>
            <BreadcrumbItem current>Current Page</BreadcrumbItem>
          </Breadcrumbs>
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

      {/* Slider */}
      <SubSection title="slider">
        <div className="max-w-md space-y-4">
          <Slider value={sliderValue} onChange={(e) => setSliderValue(Number(e.target.value))} min={0} max={100} step={1} />
          <p className="font-mono text-xs text-foreground-secondary">Value: {sliderValue}</p>
        </div>
      </SubSection>

      {/* Progress Bar */}
      <SubSection title="progress bar">
        <div className="space-y-6 max-w-md">
          <div>
            <p className="font-mono text-xs text-foreground-secondary mb-2">25%</p>
            <ProgressBar value={25} />
          </div>
          <div>
            <p className="font-mono text-xs text-foreground-secondary mb-2">50%</p>
            <ProgressBar value={50} />
          </div>
          <div>
            <p className="font-mono text-xs text-foreground-secondary mb-2">75%</p>
            <ProgressBar value={75} />
          </div>
          <div>
            <p className="font-mono text-xs text-foreground-secondary mb-2">100%</p>
            <ProgressBar value={100} />
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

      {/* Pagination */}
      <SubSection title="pagination">
        <Pagination
          page={currentPage}
          totalPages={10}
          onPageChange={setCurrentPage}
        />
      </SubSection>

      {/* Dropdown Menu */}
      <SubSection title="dropdown menu">
        <DropdownMenu
          trigger={
            <Button variant="outline">
              Open Menu <Icon icon="chevronDown" size="sm" className="ml-2" />
            </Button>
          }
        >
          <DropdownMenuItem onSelect={() => {}}>Profile</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => {}}>Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => {}}>Logout</DropdownMenuItem>
        </DropdownMenu>
      </SubSection>

      {/* Popover */}
      <SubSection title="popover">
        <Popover
          content={
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Popover Title</h4>
              <p className="text-sm text-foreground-secondary">
                This is the popover content. It can contain any elements.
              </p>
            </div>
          }
        >
          <Button variant="outline">Open Popover</Button>
        </Popover>
      </SubSection>

      {/* Tooltip */}
      <SubSection title="tooltip">
        <div className="flex gap-4">
          <Tooltip content="This is a tooltip">
            <Button variant="outline">Hover me</Button>
          </Tooltip>
        </div>
      </SubSection>

      {/* Modal */}
      <SubSection title="modal">
        <Button onClick={() => setShowModal(true)}>Open Modal</Button>
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title="Modal Title"
          description="This is a modal dialog."
          footer={
            <>
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={() => setShowModal(false)}>Confirm</Button>
            </>
          }
        >
          <p className="text-foreground-secondary">Modal content goes here.</p>
        </Modal>
      </SubSection>

      {/* Drawer */}
      <SubSection title="drawer">
        <Button variant="outline" onClick={() => setShowDrawer(true)}>Open Drawer</Button>
        <Drawer
          open={showDrawer}
          onClose={() => setShowDrawer(false)}
          title="Drawer Content"
        >
          <p className="text-foreground-secondary">
            This is the drawer content. It slides in from the side.
          </p>
        </Drawer>
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

      {/* Skeleton */}
      <SubSection title="skeleton">
        <div className="space-y-4 max-w-md">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex items-center gap-4 mt-6">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </SubSection>

      {/* State Components */}
      <SubSection title="state components">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-dashed border-border p-4">
            <p className="font-mono text-xs text-foreground-secondary mb-4">empty state</p>
            <EmptyState
              icon="box"
              title="No items yet"
              description="Get started by creating your first item."
              action={<Button size="sm">Create Item</Button>}
            />
          </div>
          <div className="border border-dashed border-border p-4">
            <p className="font-mono text-xs text-foreground-secondary mb-4">error state</p>
            <ErrorState
              title="Something went wrong"
              message="Failed to load data. Please try again."
              onRetry={() => {}}
            />
          </div>
          <div className="border border-dashed border-border p-4">
            <p className="font-mono text-xs text-foreground-secondary mb-4">loading state</p>
            <LoadingState message="Loading data..." />
          </div>
        </div>
      </SubSection>

      {/* Page Header */}
      <SubSection title="page header">
        <div className="border border-dashed border-border p-4">
          <PageHeader
            title="Page Title"
            description="This is a description of the page content."
            actions={
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Secondary
                </Button>
                <Button size="sm">Primary</Button>
              </div>
            }
          />
        </div>
      </SubSection>

      {/* Stat Card */}
      <SubSection title="stat card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Total Tools" value={1234} subtext="+12% from last month" />
          <StatCard label="Downloads" value={45200} suffix="K" subtext="-3% from last month" />
          <StatCard label="Users" value={892} subtext="No change" />
        </div>
      </SubSection>

      {/* Quality Score */}
      <SubSection title="quality score">
        <div className="flex flex-wrap gap-8 items-center">
          <div className="text-center">
            <QualityScore score={0.95} size="lg" />
            <p className="font-mono text-xs text-foreground-secondary mt-2">excellent</p>
          </div>
          <div className="text-center">
            <QualityScore score={0.75} size="lg" />
            <p className="font-mono text-xs text-foreground-secondary mt-2">good</p>
          </div>
          <div className="text-center">
            <QualityScore score={0.5} size="lg" />
            <p className="font-mono text-xs text-foreground-secondary mt-2">average</p>
          </div>
          <div className="text-center">
            <QualityScore score={0.25} size="lg" />
            <p className="font-mono text-xs text-foreground-secondary mt-2">poor</p>
          </div>
        </div>
      </SubSection>

      {/* Install Snippet */}
      <SubSection title="install snippet">
        <InstallSnippet packageName="@tpmjs/example-tool" />
      </SubSection>

      {/* Toast */}
      <SubSection title="toast">
        <ToastProvider>
          <div className="space-y-4">
            <Button onClick={() => setShowToast(true)}>Show Toast</Button>
            <Toast
              open={showToast}
              onClose={() => setShowToast(false)}
              title="Success!"
              description="Your action was completed successfully."
              variant="success"
            />
            <p className="font-mono text-xs text-foreground-secondary">
              Toast variants: default, success, error, warning, info
            </p>
          </div>
        </ToastProvider>
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
