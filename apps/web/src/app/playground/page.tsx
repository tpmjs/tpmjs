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
import { Container } from '@tpmjs/ui/Container/Container';
import { FormField } from '@tpmjs/ui/FormField/FormField';
import { Header } from '@tpmjs/ui/Header/Header';
import { Icon } from '@tpmjs/ui/Icon/Icon';
import { Input } from '@tpmjs/ui/Input/Input';
import { Label } from '@tpmjs/ui/Label/Label';
import { ProgressBar } from '@tpmjs/ui/ProgressBar/ProgressBar';
import { Radio } from '@tpmjs/ui/Radio/Radio';
import { RadioGroup } from '@tpmjs/ui/Radio/RadioGroup';
import { Select } from '@tpmjs/ui/Select/Select';
import { Slider } from '@tpmjs/ui/Slider/Slider';
import { Switch } from '@tpmjs/ui/Switch/Switch';
import { Tabs } from '@tpmjs/ui/Tabs/Tabs';
import { Textarea } from '@tpmjs/ui/Textarea/Textarea';
import Link from 'next/link';
import { useState } from 'react';
import { ThemeToggle } from '../../components/ThemeToggle';

export default function PlaygroundPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [progress, setProgress] = useState(65);

  // Form state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [newsletter, setNewsletter] = useState(false);
  const [terms, setTerms] = useState(false);
  const [theme, setTheme] = useState('system');
  const [notifications, setNotifications] = useState(true);
  const [country, setCountry] = useState('');
  const [volume, setVolume] = useState(50);
  const [privacy, setPrivacy] = useState('public');

  return (
    <div className="min-h-screen flex flex-col dotted-grid-background">
      {/* Header */}
      <Header
        title={
          <Link href="/" className="text-foreground hover:text-foreground">
            TPMJS Playground
          </Link>
        }
        size="md"
        sticky={true}
        actions={
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-foreground hover:text-foreground">
                Home
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        }
      />

      <main className="flex-1 py-12 relative">
        <div className="absolute inset-0 bg-background/95 -z-10" />
        <Container size="xl" padding="lg">
          <div className="space-y-16">
            {/* Page Title */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold">Component Playground</h1>
              <p className="text-lg text-foreground-secondary">
                Explore and test all TPMJS UI components in one place
              </p>
            </div>

            {/* Buttons Section */}
            <section className="space-y-6">
              <h2 className="text-3xl font-semibold border-b border-border pb-2">Buttons</h2>
              <div className="space-y-8">
                {/* Button Variants */}
                <div className="space-y-4">
                  <h3 className="text-xl font-medium">Variants</h3>
                  <div className="flex flex-wrap gap-4">
                    <Button variant="default">Default</Button>
                    <Button variant="destructive">Destructive</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                  </div>
                </div>

                {/* Button Sizes */}
                <div className="space-y-4">
                  <h3 className="text-xl font-medium">Sizes</h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                  </div>
                </div>

                {/* Button States */}
                <div className="space-y-4">
                  <h3 className="text-xl font-medium">States</h3>
                  <div className="flex flex-wrap gap-4">
                    <Button>Normal</Button>
                    <Button disabled>Disabled</Button>
                    <Button loading>Loading</Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Badges Section */}
            <section className="space-y-6">
              <h2 className="text-3xl font-semibold border-b border-border pb-2">Badges</h2>
              <div className="space-y-8">
                {/* Badge Variants */}
                <div className="space-y-4">
                  <h3 className="text-xl font-medium">Variants</h3>
                  <div className="flex flex-wrap gap-4">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="error">Error</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="info">Info</Badge>
                  </div>
                </div>

                {/* Badge Sizes */}
                <div className="space-y-4">
                  <h3 className="text-xl font-medium">Sizes</h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <Badge size="sm">Small</Badge>
                    <Badge size="md">Medium</Badge>
                    <Badge size="lg">Large</Badge>
                  </div>
                </div>
              </div>
            </section>

            {/* Icons Section */}
            <section className="space-y-6">
              <h2 className="text-3xl font-semibold border-b border-border pb-2">Icons</h2>
              <div className="space-y-8">
                {/* Icon Sizes */}
                <div className="space-y-4">
                  <h3 className="text-xl font-medium">Sizes</h3>
                  <div className="flex flex-wrap items-end gap-6">
                    <div className="flex flex-col items-center gap-2">
                      <Icon icon="check" size="sm" />
                      <span className="text-xs">Small</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <Icon icon="check" size="md" />
                      <span className="text-xs">Medium</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <Icon icon="check" size="lg" />
                      <span className="text-xs">Large</span>
                    </div>
                  </div>
                </div>

                {/* Icon Gallery */}
                <div className="space-y-4">
                  <h3 className="text-xl font-medium">Available Icons</h3>
                  <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
                    {(
                      [
                        'check',
                        'x',
                        'chevronDown',
                        'copy',
                        'externalLink',
                        'github',
                        'sun',
                        'moon',
                      ] as const
                    ).map((icon) => (
                      <div
                        key={icon}
                        className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-surface transition-colors"
                      >
                        <Icon icon={icon} size="lg" />
                        <span className="text-xs text-center">{icon}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Cards Section */}
            <section className="space-y-6">
              <h2 className="text-3xl font-semibold border-b border-border pb-2">Cards</h2>
              <div className="space-y-8">
                {/* Card Variants */}
                <div className="space-y-4">
                  <h3 className="text-xl font-medium">Variants</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card variant="default">
                      <CardHeader>
                        <CardTitle>Default Card</CardTitle>
                        <CardDescription>This is the default card style</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">Cards are flexible containers for content.</p>
                      </CardContent>
                      <CardFooter>
                        <Button size="sm">Action</Button>
                      </CardFooter>
                    </Card>

                    <Card variant="elevated">
                      <CardHeader>
                        <CardTitle>Elevated Card</CardTitle>
                        <CardDescription>This card has a shadow elevation</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">Perfect for highlighting important content.</p>
                      </CardContent>
                      <CardFooter>
                        <Button size="sm">Action</Button>
                      </CardFooter>
                    </Card>

                    <Card variant="outline">
                      <CardHeader>
                        <CardTitle>Outline Card</CardTitle>
                        <CardDescription>This card has an outline border</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">Great for subtle content separation.</p>
                      </CardContent>
                      <CardFooter>
                        <Button size="sm">Action</Button>
                      </CardFooter>
                    </Card>
                  </div>
                </div>
              </div>
            </section>

            {/* Inputs Section */}
            <section className="space-y-6">
              <h2 className="text-3xl font-semibold border-b border-border pb-2">Inputs</h2>
              <div className="space-y-8">
                {/* Input Sizes */}
                <div className="space-y-4">
                  <h3 className="text-xl font-medium">Sizes</h3>
                  <div className="space-y-4 max-w-md">
                    <Input size="sm" placeholder="Small input" />
                    <Input size="md" placeholder="Medium input" />
                    <Input size="lg" placeholder="Large input" />
                  </div>
                </div>

                {/* Input States */}
                <div className="space-y-4">
                  <h3 className="text-xl font-medium">States</h3>
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label>Default Input</Label>
                      <Input placeholder="Enter text..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Error State</Label>
                      <Input state="error" placeholder="Error input" />
                    </div>
                    <div className="space-y-2">
                      <Label>Success State</Label>
                      <Input state="success" placeholder="Success input" />
                    </div>
                    <div className="space-y-2">
                      <Label>Disabled Input</Label>
                      <Input disabled placeholder="Disabled input" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Progress Bars Section */}
            <section className="space-y-6">
              <h2 className="text-3xl font-semibold border-b border-border pb-2">Progress Bars</h2>
              <div className="space-y-8">
                {/* Progress Bar Variants */}
                <div className="space-y-4">
                  <h3 className="text-xl font-medium">Variants</h3>
                  <div className="space-y-6 max-w-xl">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Primary</span>
                        <span>{progress}%</span>
                      </div>
                      <ProgressBar value={progress} variant="primary" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Success</span>
                        <span>100%</span>
                      </div>
                      <ProgressBar value={100} variant="success" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Warning</span>
                        <span>45%</span>
                      </div>
                      <ProgressBar value={45} variant="warning" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Danger</span>
                        <span>20%</span>
                      </div>
                      <ProgressBar value={20} variant="danger" />
                    </div>
                  </div>
                </div>

                {/* Interactive Progress */}
                <div className="space-y-4">
                  <h3 className="text-xl font-medium">Interactive</h3>
                  <Card className="max-w-xl">
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Adjust Progress</span>
                          <span className="text-sm text-foreground-secondary">{progress}%</span>
                        </div>
                        <ProgressBar value={progress} />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => setProgress(Math.max(0, progress - 10))}>
                          -10%
                        </Button>
                        <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>
                          +10%
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setProgress(0)}>
                          Reset
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            {/* Tabs Section */}
            <section className="space-y-6">
              <h2 className="text-3xl font-semibold border-b border-border pb-2">Tabs</h2>
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-medium">Interactive Tabs</h3>
                  <Card>
                    <CardContent className="p-6">
                      <Tabs
                        tabs={[
                          { id: 'all', label: 'All Tools', count: 1234 },
                          { id: 'featured', label: 'Featured', count: 42 },
                          { id: 'popular', label: 'Popular', count: 156 },
                          { id: 'recent', label: 'Recent' },
                        ]}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                      />
                      <div className="mt-6 p-4 bg-surface rounded-lg">
                        <p className="text-sm text-foreground-secondary">
                          Active tab: <strong>{activeTab}</strong>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            {/* Code Block Section */}
            <section className="space-y-6">
              <h2 className="text-3xl font-semibold border-b border-border pb-2">Code Block</h2>
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-medium">Example Code</h3>
                  <CodeBlock
                    language="typescript"
                    code={`import { Button } from "@tpmjs/ui/Button/Button";

export default function Example() {
  return (
    <Button variant="default" size="md">
      Click me!
    </Button>
  );
}`}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-medium">JSON Example</h3>
                  <CodeBlock
                    language="json"
                    code={`{
  "name": "@tpmjs/ui",
  "version": "0.1.3",
  "type": "module"
}`}
                  />
                </div>
              </div>
            </section>

            {/* Containers Section */}
            <section className="space-y-6">
              <h2 className="text-3xl font-semibold border-b border-border pb-2">Containers</h2>
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-medium">Container Sizes</h3>
                  <div className="space-y-6">
                    <Container size="sm" padding="md">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <code className="text-sm">size=&quot;sm&quot;</code>
                        </CardContent>
                      </Card>
                    </Container>
                    <Container size="md" padding="md">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <code className="text-sm">size=&quot;md&quot;</code>
                        </CardContent>
                      </Card>
                    </Container>
                    <Container size="lg" padding="md">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <code className="text-sm">size=&quot;lg&quot;</code>
                        </CardContent>
                      </Card>
                    </Container>
                    <Container size="xl" padding="md">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <code className="text-sm">size=&quot;xl&quot;</code>
                        </CardContent>
                      </Card>
                    </Container>
                  </div>
                </div>
              </div>
            </section>

            {/* Forms Section */}
            <section className="space-y-6">
              <h2 className="text-3xl font-semibold border-b border-border pb-2">
                Form Components
              </h2>

              {/* Textarea */}
              <div className="space-y-4">
                <h3 className="text-xl font-medium">Textarea</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Bio" helperText="Tell us about yourself">
                    <Textarea
                      placeholder="Write something..."
                      rows={4}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </FormField>
                  <FormField label="Feedback" helperText="Maximum 200 characters">
                    <Textarea placeholder="Your feedback..." rows={4} maxLength={200} showCount />
                  </FormField>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-4">
                <h3 className="text-xl font-medium">Checkboxes</h3>
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <Checkbox
                      checked={newsletter}
                      onChange={(e) => setNewsletter(e.target.checked)}
                      label="Subscribe to newsletter"
                    />
                    <Checkbox
                      checked={terms}
                      onChange={(e) => setTerms(e.target.checked)}
                      label="I agree to the terms and conditions"
                    />
                    <Checkbox disabled label="Disabled checkbox" />
                    <Checkbox checked disabled label="Checked and disabled" />
                  </CardContent>
                </Card>
              </div>

              {/* Radio Buttons */}
              <div className="space-y-4">
                <h3 className="text-xl font-medium">Radio Buttons</h3>
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <FormField label="Theme Preference">
                      <RadioGroup name="theme" value={theme} onChange={setTheme}>
                        <Radio value="light" label="Light" />
                        <Radio value="dark" label="Dark" />
                        <Radio value="system" label="System" />
                      </RadioGroup>
                    </FormField>

                    <FormField label="Privacy Setting">
                      <RadioGroup name="privacy" value={privacy} onChange={setPrivacy}>
                        <Radio value="public" label="Public" />
                        <Radio value="private" label="Private" />
                        <Radio value="friends" label="Friends only" />
                      </RadioGroup>
                    </FormField>
                  </CardContent>
                </Card>
              </div>

              {/* Switches */}
              <div className="space-y-4">
                <h3 className="text-xl font-medium">Switches</h3>
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Enable notifications</Label>
                        <p className="text-sm text-foreground-secondary">
                          Receive email notifications about updates
                        </p>
                      </div>
                      <Switch checked={notifications} onChange={setNotifications} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Marketing emails</Label>
                        <p className="text-sm text-foreground-secondary">
                          Receive marketing and promotional emails
                        </p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between opacity-50">
                      <div className="space-y-0.5">
                        <Label>Disabled switch</Label>
                        <p className="text-sm text-foreground-secondary">This switch is disabled</p>
                      </div>
                      <Switch disabled />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Select */}
              <div className="space-y-4">
                <h3 className="text-xl font-medium">Select</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Country" helperText="Select your country">
                    <Select
                      placeholder="Choose a country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      options={[
                        { value: 'us', label: 'United States' },
                        { value: 'uk', label: 'United Kingdom' },
                        { value: 'ca', label: 'Canada' },
                        { value: 'au', label: 'Australia' },
                      ]}
                    />
                  </FormField>
                  <FormField label="Size">
                    <Select
                      placeholder="Choose a size"
                      size="md"
                      options={[
                        { value: 'xs', label: 'Extra Small' },
                        { value: 's', label: 'Small' },
                        { value: 'm', label: 'Medium' },
                        { value: 'l', label: 'Large' },
                        { value: 'xl', label: 'Extra Large' },
                      ]}
                    />
                  </FormField>
                </div>
              </div>

              {/* Slider */}
              <div className="space-y-4">
                <h3 className="text-xl font-medium">Slider</h3>
                <Card>
                  <CardContent className="p-6 space-y-8">
                    <FormField label="Volume" helperText={`Current volume: ${volume}%`}>
                      <Slider
                        min={0}
                        max={100}
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        showValue
                      />
                    </FormField>

                    <FormField label="Temperature (°C)">
                      <Slider
                        min={0}
                        max={100}
                        step={5}
                        defaultValue={20}
                        showMarks
                        marks={[
                          { value: 0, label: 'Cold' },
                          { value: 50, label: 'Warm' },
                          { value: 100, label: 'Hot' },
                        ]}
                      />
                    </FormField>
                  </CardContent>
                </Card>
              </div>

              {/* Complete Form Example */}
              <div className="space-y-4">
                <h3 className="text-xl font-medium">Complete Form Example</h3>
                <Card>
                  <CardHeader>
                    <CardTitle>User Profile</CardTitle>
                    <CardDescription>Update your profile information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField label="Name" htmlFor="profile-name" required>
                      <Input
                        id="profile-name"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </FormField>

                    <FormField
                      label="Bio"
                      htmlFor="profile-bio"
                      helperText="Tell us about yourself"
                    >
                      <Textarea
                        id="profile-bio"
                        placeholder="Write something..."
                        rows={4}
                        maxLength={500}
                        showCount
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                      />
                    </FormField>

                    <FormField label="Country" htmlFor="profile-country">
                      <Select
                        id="profile-country"
                        placeholder="Select your country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        options={[
                          { value: 'us', label: 'United States' },
                          { value: 'uk', label: 'United Kingdom' },
                          { value: 'ca', label: 'Canada' },
                        ]}
                      />
                    </FormField>

                    <div className="space-y-3">
                      <Checkbox
                        checked={newsletter}
                        onChange={(e) => setNewsletter(e.target.checked)}
                        label="Subscribe to newsletter"
                      />
                      <Checkbox
                        checked={terms}
                        onChange={(e) => setTerms(e.target.checked)}
                        label="I agree to the terms and conditions"
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button disabled={!terms}>Save Changes</Button>
                  </CardFooter>
                </Card>
              </div>
            </section>

            {/* Labels Section */}
            <section className="space-y-6">
              <h2 className="text-3xl font-semibold border-b border-border pb-2">Labels</h2>
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-medium">Form Labels</h3>
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" placeholder="you@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" required>
                        Password
                      </Label>
                      <Input id="password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Input id="bio" placeholder="Tell us about yourself" />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </Container>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-surface mt-16">
        <Container size="xl" padding="lg">
          <p className="text-sm text-foreground-secondary text-center">
            TPMJS Component Playground
          </p>
        </Container>
      </footer>
    </div>
  );
}
