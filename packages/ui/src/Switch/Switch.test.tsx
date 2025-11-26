import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from './Switch';
import React from 'react';

describe('Switch', () => {
  describe('Rendering', () => {
    it('should render a switch button', () => {
      render(<Switch />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl).toBeInTheDocument();
      expect(switchEl).toHaveAttribute('type', 'button');
    });

    it('should render with a label when provided', () => {
      render(<Switch label="Enable notifications" />);
      expect(screen.getByText('Enable notifications')).toBeInTheDocument();
    });

    it('should render without a label by default', () => {
      const { container } = render(<Switch />);
      expect(container.querySelector('label')).not.toBeInTheDocument();
    });

    it('should use provided ID', () => {
      render(<Switch id="my-switch" />);
      expect(screen.getByRole('switch')).toHaveAttribute('id', 'my-switch');
    });

    it('should generate unique ID when not provided', () => {
      const { container } = render(
        <>
          <Switch />
          <Switch />
        </>
      );
      const switches = container.querySelectorAll('button[role="switch"]');
      expect(switches).toHaveLength(2);
      expect(switches[0]?.id).not.toBe(switches[1]?.id);
    });
  });

  describe('States', () => {
    it('should apply default state classes', () => {
      render(<Switch />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl).toHaveClass('bg-border');
    });

    it('should apply error state classes', () => {
      render(<Switch state="error" />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl).toHaveClass('data-[state=checked]:bg-error');
    });

    it('should apply success state classes', () => {
      render(<Switch state="success" />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl).toHaveClass('data-[state=checked]:bg-success');
    });
  });

  describe('Sizes', () => {
    it('should apply small size classes', () => {
      render(<Switch size="sm" />);
      expect(screen.getByRole('switch')).toHaveClass('h-5', 'w-9');
    });

    it('should apply medium size classes by default', () => {
      render(<Switch />);
      expect(screen.getByRole('switch')).toHaveClass('h-6', 'w-11');
    });

    it('should apply large size classes', () => {
      render(<Switch size="lg" />);
      expect(screen.getByRole('switch')).toHaveClass('h-7', 'w-13');
    });

    it('should apply size-specific label classes', () => {
      const { rerender } = render(<Switch label="Text" size="sm" />);
      expect(screen.getByText('Text')).toHaveClass('text-xs');

      rerender(<Switch label="Text" size="md" />);
      expect(screen.getByText('Text')).toHaveClass('text-sm');

      rerender(<Switch label="Text" size="lg" />);
      expect(screen.getByText('Text')).toHaveClass('text-base');
    });
  });

  describe('Label Position', () => {
    it('should position label on the right by default', () => {
      render(<Switch label="Right label" />);
      const label = screen.getByText('Right label');
      expect(label).toHaveClass('ml-2');
      expect(label).not.toHaveClass('mr-2');
    });

    it('should position label on the left when specified', () => {
      render(<Switch label="Left label" labelPosition="left" />);
      const label = screen.getByText('Left label');
      expect(label).toHaveClass('mr-2');
      expect(label).not.toHaveClass('ml-2');
    });
  });

  describe('Checked State', () => {
    it('should be unchecked by default', () => {
      render(<Switch />);
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    });

    it('should be checked when defaultChecked is true', () => {
      render(<Switch defaultChecked />);
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });

    it('should be checked when checked is true (controlled)', () => {
      render(<Switch checked onChange={() => {}} />);
      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
    });

    it('should toggle checked state when clicked (uncontrolled)', async () => {
      const user = userEvent.setup();
      render(<Switch />);
      const switchEl = screen.getByRole('switch');

      expect(switchEl).toHaveAttribute('aria-checked', 'false');

      await user.click(switchEl);
      expect(switchEl).toHaveAttribute('aria-checked', 'true');

      await user.click(switchEl);
      expect(switchEl).toHaveAttribute('aria-checked', 'false');
    });

    it('should update data-state attribute based on checked state', async () => {
      const user = userEvent.setup();
      render(<Switch />);
      const switchEl = screen.getByRole('switch');

      expect(switchEl).toHaveAttribute('data-state', 'unchecked');

      await user.click(switchEl);
      expect(switchEl).toHaveAttribute('data-state', 'checked');
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      const { container } = render(<Switch loading />);
      const spinner = container.querySelector('svg.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should not show spinner by default', () => {
      const { container } = render(<Switch />);
      const spinner = container.querySelector('svg.animate-spin');
      expect(spinner).not.toBeInTheDocument();
    });

    it('should apply loading classes when loading', () => {
      render(<Switch loading />);
      expect(screen.getByRole('switch')).toHaveClass('cursor-wait', 'pointer-events-none');
    });

    it('should disable interaction when loading', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Switch loading onChange={handleChange} />);
      const switchEl = screen.getByRole('switch');

      await user.click(switchEl);
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should apply correct spinner size based on switch size', () => {
      const { container, rerender } = render(<Switch loading size="sm" />);
      let spinner = container.querySelector('svg.animate-spin');
      expect(spinner).toHaveAttribute('width', '10');
      expect(spinner).toHaveAttribute('height', '10');

      rerender(<Switch loading size="md" />);
      spinner = container.querySelector('svg.animate-spin');
      expect(spinner).toHaveAttribute('width', '12');
      expect(spinner).toHaveAttribute('height', '12');

      rerender(<Switch loading size="lg" />);
      spinner = container.querySelector('svg.animate-spin');
      expect(spinner).toHaveAttribute('width', '14');
      expect(spinner).toHaveAttribute('height', '14');
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Switch disabled />);
      expect(screen.getByRole('switch')).toBeDisabled();
    });

    it('should not be disabled by default', () => {
      render(<Switch />);
      expect(screen.getByRole('switch')).not.toBeDisabled();
    });

    it('should not toggle when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Switch disabled onChange={handleChange} />);
      const switchEl = screen.getByRole('switch');

      await user.click(switchEl);
      expect(handleChange).not.toHaveBeenCalled();
      expect(switchEl).toHaveAttribute('aria-checked', 'false');
    });

    it('should apply disabled cursor to wrapper', () => {
      const { container } = render(<Switch disabled />);
      const wrapper = container.querySelector('div');
      expect(wrapper).toHaveClass('cursor-not-allowed');
    });

    it('should apply disabled opacity to label', () => {
      render(<Switch label="Disabled" disabled />);
      const label = screen.getByText('Disabled');
      expect(label).toHaveClass('opacity-50');
    });
  });

  describe('Form Integration', () => {
    it('should include hidden input when name is provided', () => {
      const { container } = render(<Switch name="notifications" />);
      const hiddenInput = container.querySelector('input[name="notifications"]');
      expect(hiddenInput).toBeInTheDocument();
      expect(hiddenInput).toHaveAttribute('type', 'checkbox');
      expect(hiddenInput).toHaveAttribute('tabindex', '-1');
      expect(hiddenInput).toHaveAttribute('aria-hidden', 'true');
    });

    it('should not include hidden input when name is not provided', () => {
      const { container } = render(<Switch />);
      const hiddenInput = container.querySelector('input[type="checkbox"]');
      expect(hiddenInput).not.toBeInTheDocument();
    });

    it('should sync hidden input checked state', async () => {
      const user = userEvent.setup();
      const { container } = render(<Switch name="test" />);
      const hiddenInput = container.querySelector(
        'input[name="test"]'
      ) as HTMLInputElement;
      const switchEl = screen.getByRole('switch');

      expect(hiddenInput?.checked).toBe(false);

      await user.click(switchEl);
      expect(hiddenInput?.checked).toBe(true);
    });

    it('should include value in hidden input', () => {
      const { container } = render(<Switch name="test" value="yes" />);
      const hiddenInput = container.querySelector('input[name="test"]');
      expect(hiddenInput).toHaveAttribute('value', 'yes');
    });
  });

  describe('ARIA Attributes', () => {
    it('should have role="switch"', () => {
      render(<Switch />);
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('should set aria-checked correctly', async () => {
      const user = userEvent.setup();
      render(<Switch />);
      const switchEl = screen.getByRole('switch');

      expect(switchEl).toHaveAttribute('aria-checked', 'false');

      await user.click(switchEl);
      expect(switchEl).toHaveAttribute('aria-checked', 'true');
    });

    it('should support aria-label when no label is provided', () => {
      render(<Switch aria-label="Toggle feature" />);
      expect(screen.getByLabelText('Toggle feature')).toBeInTheDocument();
    });

    it('should use aria-labelledby when label is provided', () => {
      render(<Switch label="My switch" id="my-switch" />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl).toHaveAttribute('aria-labelledby', 'my-switch-label');
    });

    it('should support custom aria-labelledby', () => {
      render(<Switch aria-labelledby="custom-label" />);
      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-labelledby',
        'custom-label'
      );
    });

    it('should set aria-hidden on thumb', () => {
      const { container } = render(<Switch />);
      const thumb = container.querySelector('span[aria-hidden="true"]');
      expect(thumb).toBeInTheDocument();
    });
  });

  describe('Event Handlers', () => {
    it('should call onChange when clicked', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Switch onChange={handleChange} />);

      await user.click(screen.getByRole('switch'));
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it('should call onChange with correct value', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Switch onChange={handleChange} />);
      const switchEl = screen.getByRole('switch');

      await user.click(switchEl);
      expect(handleChange).toHaveBeenCalledWith(true);

      await user.click(switchEl);
      expect(handleChange).toHaveBeenCalledWith(false);
    });

    it('should toggle with Space key', async () => {
      const user = userEvent.setup();
      render(<Switch />);
      const switchEl = screen.getByRole('switch');

      switchEl.focus();
      expect(switchEl).toHaveAttribute('aria-checked', 'false');

      await user.keyboard(' ');
      expect(switchEl).toHaveAttribute('aria-checked', 'true');

      await user.keyboard(' ');
      expect(switchEl).toHaveAttribute('aria-checked', 'false');
    });

    it('should toggle with Enter key', async () => {
      const user = userEvent.setup();
      render(<Switch />);
      const switchEl = screen.getByRole('switch');

      switchEl.focus();
      expect(switchEl).toHaveAttribute('aria-checked', 'false');

      await user.keyboard('{Enter}');
      expect(switchEl).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('Custom className', () => {
    it('should merge custom className with default classes', () => {
      render(<Switch className="custom-class" />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl).toHaveClass('custom-class');
      expect(switchEl).toHaveClass('rounded-full');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to button element', () => {
      const ref = createRef<HTMLButtonElement>();
      render(<Switch ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.tagName).toBe('BUTTON');
    });

    it('should allow programmatic focus via ref', () => {
      const ref = createRef<HTMLButtonElement>();
      render(<Switch ref={ref} />);

      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });

    it('should allow programmatic click via ref', async () => {
      const ref = createRef<HTMLButtonElement>();
      const handleChange = vi.fn();
      render(<Switch ref={ref} onChange={handleChange} />);

      ref.current?.click();
      expect(handleChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Base Classes', () => {
    it('should include layout classes', () => {
      render(<Switch />);
      expect(screen.getByRole('switch')).toHaveClass('inline-flex', 'items-center');
    });

    it('should include transition classes', () => {
      render(<Switch />);
      expect(screen.getByRole('switch')).toHaveClass('transition-all', 'duration-200');
    });

    it('should include rounded-full for circular shape', () => {
      render(<Switch />);
      expect(screen.getByRole('switch')).toHaveClass('rounded-full');
    });

    it('should render animated thumb', () => {
      const { container } = render(<Switch />);
      const thumb = container.querySelector('span[data-state]');
      expect(thumb).toBeInTheDocument();
      expect(thumb).toHaveClass('transition-transform');
    });

    it('should update thumb position based on checked state', async () => {
      const user = userEvent.setup();
      const { container } = render(<Switch size="md" />);
      const thumb = container.querySelector('span[data-state]');

      expect(thumb).toHaveAttribute('data-state', 'unchecked');

      await user.click(screen.getByRole('switch'));
      expect(thumb).toHaveAttribute('data-state', 'checked');
    });
  });

  describe('Label Integration', () => {
    it('should toggle switch when label is clicked', async () => {
      const user = userEvent.setup();
      render(<Switch label="Click me" />);
      const switchEl = screen.getByRole('switch');

      expect(switchEl).toHaveAttribute('aria-checked', 'false');

      await user.click(screen.getByText('Click me'));
      expect(switchEl).toHaveAttribute('aria-checked', 'true');
    });

    it('should associate label with switch', () => {
      render(<Switch label="My label" id="my-id" />);
      const label = screen.getByText('My label');
      expect(label).toHaveAttribute('id', 'my-id-label');
    });

    it('should not toggle when label clicked and disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Switch label="Disabled" disabled onChange={handleChange} />);

      await user.click(screen.getByText('Disabled'));
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should not toggle when label clicked and loading', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Switch label="Loading" loading onChange={handleChange} />);

      await user.click(screen.getByText('Loading'));
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Controlled vs Uncontrolled', () => {
    it('should work as uncontrolled with defaultChecked', async () => {
      const user = userEvent.setup();
      render(<Switch defaultChecked={true} />);
      const switchEl = screen.getByRole('switch');

      expect(switchEl).toHaveAttribute('aria-checked', 'true');

      await user.click(switchEl);
      expect(switchEl).toHaveAttribute('aria-checked', 'false');
    });

    it('should work as controlled with checked and onChange', async () => {
      const user = userEvent.setup();
      const ControlledSwitch = () => {
        const [checked, setChecked] = React.useState(false);
        return <Switch checked={checked} onChange={setChecked} />;
      };

      render(<ControlledSwitch />);
      const switchEl = screen.getByRole('switch');

      expect(switchEl).toHaveAttribute('aria-checked', 'false');

      await user.click(switchEl);
      expect(switchEl).toHaveAttribute('aria-checked', 'true');

      await user.click(switchEl);
      expect(switchEl).toHaveAttribute('aria-checked', 'false');
    });

    it('should not change when controlled without onChange updating value', async () => {
      const user = userEvent.setup();
      render(<Switch checked={false} onChange={() => {}} />);
      const switchEl = screen.getByRole('switch');

      expect(switchEl).toHaveAttribute('aria-checked', 'false');

      await user.click(switchEl);
      expect(switchEl).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('Compound Scenarios', () => {
    it('should work with error state and small size', () => {
      render(<Switch state="error" size="sm" />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl).toHaveClass('h-5', 'w-9');
      expect(switchEl).toHaveClass('data-[state=checked]:bg-error');
    });

    it('should work with success state and large size', () => {
      render(<Switch state="success" size="lg" />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl).toHaveClass('h-7', 'w-13');
      expect(switchEl).toHaveClass('data-[state=checked]:bg-success');
    });

    it('should work with loading and checked states', () => {
      const { container } = render(<Switch loading checked onChange={() => {}} />);
      const switchEl = screen.getByRole('switch');
      expect(switchEl).toHaveAttribute('aria-checked', 'true');
      expect(switchEl).toHaveAttribute('data-state', 'checked');
      expect(container.querySelector('svg.animate-spin')).toBeInTheDocument();
    });

    it('should work with all props combined', () => {
      const handleChange = vi.fn();
      render(
        <Switch
          state="success"
          size="lg"
          label="Enable feature"
          labelPosition="left"
          checked={true}
          onChange={handleChange}
          name="feature"
          value="enabled"
          aria-describedby="description"
        />
      );

      const switchEl = screen.getByRole('switch');
      expect(switchEl).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByText('Enable feature')).toBeInTheDocument();
    });
  });
});
