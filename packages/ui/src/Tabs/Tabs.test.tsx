import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Tabs } from './Tabs';
import type { Tab } from './types';

const mockTabs: Tab[] = [
  { id: 'all', label: 'All Tools', count: 1234 },
  { id: 'featured', label: 'Featured', count: 42 },
  { id: 'recent', label: 'Recent' },
];

describe('Tabs', () => {
  describe('Rendering', () => {
    it('renders tabs container', () => {
      const handleChange = vi.fn();
      render(
        <Tabs tabs={mockTabs} activeTab="all" onTabChange={handleChange} data-testid="tabs" />
      );
      const tabs = screen.getByTestId('tabs');
      expect(tabs).toBeInTheDocument();
      expect(tabs.tagName).toBe('DIV');
    });

    it('has tablist role', () => {
      const handleChange = vi.fn();
      render(
        <Tabs tabs={mockTabs} activeTab="all" onTabChange={handleChange} data-testid="tabs" />
      );
      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveAttribute('role', 'tablist');
    });

    it('renders all tabs', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="all" onTabChange={handleChange} />);
      expect(screen.getByTestId('tab-all')).toBeInTheDocument();
      expect(screen.getByTestId('tab-featured')).toBeInTheDocument();
      expect(screen.getByTestId('tab-recent')).toBeInTheDocument();
    });

    it('renders tab labels', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="all" onTabChange={handleChange} />);
      expect(screen.getByText('All Tools')).toBeInTheDocument();
      expect(screen.getByText('Featured')).toBeInTheDocument();
      expect(screen.getByText('Recent')).toBeInTheDocument();
    });

    it('renders tabs as buttons', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="all" onTabChange={handleChange} />);
      const tab = screen.getByTestId('tab-all');
      expect(tab.tagName).toBe('BUTTON');
      expect(tab).toHaveAttribute('type', 'button');
    });
  });

  describe('Active State', () => {
    it('marks active tab with aria-selected', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="featured" onTabChange={handleChange} />);
      expect(screen.getByTestId('tab-featured')).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('tab-all')).toHaveAttribute('aria-selected', 'false');
      expect(screen.getByTestId('tab-recent')).toHaveAttribute('aria-selected', 'false');
    });

    it('applies active styling to active tab', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="all" onTabChange={handleChange} />);
      const activeTab = screen.getByTestId('tab-all');
      expect(activeTab.className).toContain('text-foreground');
      expect(activeTab.className).toContain('border-primary');
    });

    it('applies inactive styling to inactive tabs', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="all" onTabChange={handleChange} />);
      const inactiveTab = screen.getByTestId('tab-featured');
      expect(inactiveTab.className).toContain('text-foreground-secondary');
      expect(inactiveTab.className).toContain('border-transparent');
    });
  });

  describe('Click Handling', () => {
    it('calls onTabChange when tab is clicked', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="all" onTabChange={handleChange} />);
      screen.getByTestId('tab-featured').click();
      expect(handleChange).toHaveBeenCalledWith('featured');
    });

    it('calls onTabChange with correct tab ID', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="all" onTabChange={handleChange} />);
      screen.getByTestId('tab-recent').click();
      expect(handleChange).toHaveBeenCalledWith('recent');
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('allows clicking already active tab', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="all" onTabChange={handleChange} />);
      screen.getByTestId('tab-all').click();
      expect(handleChange).toHaveBeenCalledWith('all');
    });
  });

  describe('Count Badges', () => {
    it('renders count badge when count is provided', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="all" onTabChange={handleChange} />);
      expect(screen.getByText('1234')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('does not render count badge when count is undefined', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="all" onTabChange={handleChange} />);
      const recentTab = screen.getByTestId('tab-recent');
      const badge = recentTab.querySelector('span[aria-label]');
      expect(badge).not.toBeInTheDocument();
    });

    it('count badge has aria-label', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="all" onTabChange={handleChange} />);
      const badge = screen.getByText('1234');
      expect(badge).toHaveAttribute('aria-label', '1234 items');
    });

    it('applies active styling to count badge on active tab', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="all" onTabChange={handleChange} />);
      const activeBadge = screen.getByText('1234');
      expect(activeBadge.className).toContain('text-foreground');
    });

    it('applies inactive styling to count badge on inactive tab', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="all" onTabChange={handleChange} />);
      const inactiveBadge = screen.getByText('42');
      expect(inactiveBadge.className).toContain('text-foreground-tertiary');
    });

    it('handles zero count', () => {
      const handleChange = vi.fn();
      const tabsWithZero: Tab[] = [{ id: 'empty', label: 'Empty', count: 0 }];
      render(<Tabs tabs={tabsWithZero} activeTab="empty" onTabChange={handleChange} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('applies small size', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="all" onTabChange={handleChange} size="sm" />);
      const tab = screen.getByTestId('tab-all');
      expect(tab.className).toContain('text-sm');
      expect(tab.className).toContain('px-3');
      expect(tab.className).toContain('py-2');
    });

    it('applies medium size', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="all" onTabChange={handleChange} size="md" />);
      const tab = screen.getByTestId('tab-all');
      expect(tab.className).toContain('text-base');
      expect(tab.className).toContain('px-4');
      expect(tab.className).toContain('py-3');
    });

    it('applies large size', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="all" onTabChange={handleChange} size="lg" />);
      const tab = screen.getByTestId('tab-all');
      expect(tab.className).toContain('text-lg');
      expect(tab.className).toContain('px-6');
      expect(tab.className).toContain('py-4');
    });

    it('uses md size by default', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="all" onTabChange={handleChange} />);
      const tab = screen.getByTestId('tab-all');
      expect(tab.className).toContain('text-base');
      expect(tab.className).toContain('px-4');
      expect(tab.className).toContain('py-3');
    });
  });

  describe('Accessibility', () => {
    it('tabs have role="tab"', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="all" onTabChange={handleChange} />);
      const tab = screen.getByTestId('tab-all');
      expect(tab).toHaveAttribute('role', 'tab');
    });

    it('tabs have unique IDs', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="all" onTabChange={handleChange} />);
      expect(screen.getByTestId('tab-all')).toHaveAttribute('id', 'tab-all');
      expect(screen.getByTestId('tab-featured')).toHaveAttribute('id', 'tab-featured');
      expect(screen.getByTestId('tab-recent')).toHaveAttribute('id', 'tab-recent');
    });

    it('tabs have aria-controls attribute', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="all" onTabChange={handleChange} />);
      expect(screen.getByTestId('tab-all')).toHaveAttribute('aria-controls', 'tabpanel-all');
      expect(screen.getByTestId('tab-featured')).toHaveAttribute(
        'aria-controls',
        'tabpanel-featured'
      );
    });
  });

  describe('HTML Attributes', () => {
    it('passes through id attribute', () => {
      const handleChange = vi.fn();
      render(
        <Tabs
          tabs={mockTabs}
          activeTab="all"
          onTabChange={handleChange}
          id="tabs-id"
          data-testid="tabs"
        />
      );
      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveAttribute('id', 'tabs-id');
    });

    it('passes through data attributes', () => {
      const handleChange = vi.fn();
      render(
        <Tabs
          tabs={mockTabs}
          activeTab="all"
          onTabChange={handleChange}
          data-custom="test"
          data-testid="tabs"
        />
      );
      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveAttribute('data-custom', 'test');
    });
  });

  describe('Custom className', () => {
    it('merges custom className with variant classes', () => {
      const handleChange = vi.fn();
      render(
        <Tabs
          tabs={mockTabs}
          activeTab="all"
          onTabChange={handleChange}
          className="custom-class"
          data-testid="tabs"
        />
      );
      const tabs = screen.getByTestId('tabs');
      expect(tabs.className).toContain('custom-class');
      expect(tabs.className).toContain('flex');
      expect(tabs.className).toContain('border-b');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to container element', () => {
      const handleChange = vi.fn();
      let ref: HTMLDivElement | null = null;
      render(
        <Tabs
          tabs={mockTabs}
          activeTab="all"
          onTabChange={handleChange}
          ref={(el) => {
            ref = el;
          }}
        />
      );
      expect(ref).toBeInstanceOf(HTMLDivElement);
      expect(ref).toHaveAttribute('role', 'tablist');
    });
  });

  describe('Base Classes', () => {
    it('container includes base classes', () => {
      const handleChange = vi.fn();
      render(
        <Tabs tabs={mockTabs} activeTab="all" onTabChange={handleChange} data-testid="tabs" />
      );
      const tabs = screen.getByTestId('tabs');
      expect(tabs.className).toContain('flex');
      expect(tabs.className).toContain('items-center');
      expect(tabs.className).toContain('overflow-x-auto');
      expect(tabs.className).toContain('border-b');
    });

    it('tab buttons include base classes', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="all" onTabChange={handleChange} />);
      const tab = screen.getByTestId('tab-all');
      expect(tab.className).toContain('inline-flex');
      expect(tab.className).toContain('items-center');
      expect(tab.className).toContain('font-medium');
      expect(tab.className).toContain('whitespace-nowrap');
      expect(tab.className).toContain('border-b-2');
      expect(tab.className).toContain('transition-colors');
    });
  });

  describe('Compound Scenarios', () => {
    it('works correctly with large size and active tab with count', () => {
      const handleChange = vi.fn();
      render(<Tabs tabs={mockTabs} activeTab="featured" onTabChange={handleChange} size="lg" />);
      const tab = screen.getByTestId('tab-featured');
      expect(tab.className).toContain('text-lg');
      expect(tab.className).toContain('px-6');
      expect(tab.className).toContain('py-4');
      expect(tab.className).toContain('text-foreground');
      expect(tab.className).toContain('border-primary');
      const badge = screen.getByText('42');
      expect(badge.className).toContain('text-foreground');
    });

    it('handles single tab', () => {
      const handleChange = vi.fn();
      const singleTab: Tab[] = [{ id: 'only', label: 'Only Tab' }];
      render(<Tabs tabs={singleTab} activeTab="only" onTabChange={handleChange} />);
      expect(screen.getByTestId('tab-only')).toBeInTheDocument();
      expect(screen.getByText('Only Tab')).toBeInTheDocument();
    });

    it('handles empty tabs array', () => {
      const handleChange = vi.fn();
      const { container } = render(<Tabs tabs={[]} activeTab="" onTabChange={handleChange} />);
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(0);
    });
  });
});
