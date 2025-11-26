import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  describe('Rendering', () => {
    it('should render a checkbox input', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute('type', 'checkbox');
    });

    it('should render with a label when provided', () => {
      render(<Checkbox label="Accept terms" />);
      expect(screen.getByText('Accept terms')).toBeInTheDocument();
      expect(screen.getByLabelText('Accept terms')).toBeInTheDocument();
    });

    it('should render without a label by default', () => {
      render(<Checkbox />);
      expect(screen.queryByRole('checkbox')).toBeInTheDocument();
      // No label text should be present
      const container = screen.getByRole('checkbox').parentElement?.parentElement;
      expect(container?.querySelector('label')).not.toBeInTheDocument();
    });

    it('should generate unique ID when not provided', () => {
      const { container } = render(
        <>
          <Checkbox />
          <Checkbox />
        </>
      );
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes).toHaveLength(2);
      expect(checkboxes[0]?.id).not.toBe(checkboxes[1]?.id);
    });

    it('should use provided ID', () => {
      render(<Checkbox id="my-checkbox" />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('id', 'my-checkbox');
    });
  });

  describe('States', () => {
    it('should apply default state classes', () => {
      const { container } = render(<Checkbox />);
      const ui = container.querySelector('span');
      expect(ui).toHaveClass('border-border');
    });

    it('should apply error state classes', () => {
      const { container } = render(<Checkbox state="error" />);
      const ui = container.querySelector('span');
      expect(ui).toHaveClass('border-error');
    });

    it('should apply success state classes', () => {
      const { container } = render(<Checkbox state="success" />);
      const ui = container.querySelector('span');
      expect(ui).toHaveClass('border-success');
    });
  });

  describe('Sizes', () => {
    it('should apply small size classes', () => {
      const { container } = render(<Checkbox size="sm" />);
      const ui = container.querySelector('span');
      expect(ui).toHaveClass('h-4', 'w-4');
    });

    it('should apply medium size classes by default', () => {
      const { container } = render(<Checkbox />);
      const ui = container.querySelector('span');
      expect(ui).toHaveClass('h-5', 'w-5');
    });

    it('should apply large size classes', () => {
      const { container } = render(<Checkbox size="lg" />);
      const ui = container.querySelector('span');
      expect(ui).toHaveClass('h-6', 'w-6');
    });

    it('should apply size-specific label classes', () => {
      const { rerender } = render(<Checkbox label="Text" size="sm" />);
      expect(screen.getByText('Text')).toHaveClass('text-xs');

      rerender(<Checkbox label="Text" size="md" />);
      expect(screen.getByText('Text')).toHaveClass('text-sm');

      rerender(<Checkbox label="Text" size="lg" />);
      expect(screen.getByText('Text')).toHaveClass('text-base');
    });
  });

  describe('Label Position', () => {
    it('should position label on the right by default', () => {
      const { container } = render(<Checkbox label="Right label" />);
      const label = screen.getByText('Right label');
      expect(label).toHaveClass('ml-2');
      expect(label).not.toHaveClass('mr-2');

      // Check DOM order: input comes before label
      const wrapper = container.querySelector('div');
      const children = Array.from(wrapper?.children || []);
      const labelIndex = children.findIndex((child) => child.tagName === 'LABEL');
      const inputWrapperIndex = children.findIndex((child) =>
        child.querySelector('input')
      );
      expect(inputWrapperIndex).toBeLessThan(labelIndex);
    });

    it('should position label on the left when specified', () => {
      const { container } = render(<Checkbox label="Left label" labelPosition="left" />);
      const label = screen.getByText('Left label');
      expect(label).toHaveClass('mr-2');
      expect(label).not.toHaveClass('ml-2');

      // Check DOM order: label comes before input
      const wrapper = container.querySelector('div');
      const children = Array.from(wrapper?.children || []);
      const labelIndex = children.findIndex((child) => child.tagName === 'LABEL');
      const inputWrapperIndex = children.findIndex((child) =>
        child.querySelector('input')
      );
      expect(labelIndex).toBeLessThan(inputWrapperIndex);
    });
  });

  describe('Indeterminate State', () => {
    it('should set indeterminate property when indeterminate prop is true', () => {
      render(<Checkbox indeterminate={true} />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.indeterminate).toBe(true);
    });

    it('should not set indeterminate property by default', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.indeterminate).toBe(false);
    });

    it('should update indeterminate property when prop changes', () => {
      const { rerender } = render(<Checkbox indeterminate={false} />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.indeterminate).toBe(false);

      rerender(<Checkbox indeterminate={true} />);
      expect(checkbox.indeterminate).toBe(true);

      rerender(<Checkbox indeterminate={false} />);
      expect(checkbox.indeterminate).toBe(false);
    });

    it('should set data-indeterminate attribute when indeterminate', () => {
      render(<Checkbox indeterminate={true} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('data-indeterminate', 'true');
    });

    it('should set aria-checked="mixed" when indeterminate', () => {
      render(<Checkbox indeterminate={true} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    });

    it('should not set aria-checked when not indeterminate', () => {
      render(<Checkbox indeterminate={false} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toHaveAttribute('aria-checked', 'mixed');
    });
  });

  describe('Checked State', () => {
    it('should be unchecked by default', () => {
      render(<Checkbox />);
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('should render as checked when defaultChecked is true', () => {
      render(<Checkbox defaultChecked />);
      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('should render as checked when checked is true (controlled)', () => {
      render(<Checkbox checked onChange={() => {}} />);
      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('should toggle checked state when clicked (uncontrolled)', async () => {
      const user = userEvent.setup();
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('HTML Attributes', () => {
    it('should support name attribute', () => {
      render(<Checkbox name="terms" />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('name', 'terms');
    });

    it('should support value attribute', () => {
      render(<Checkbox value="accept" />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('value', 'accept');
    });

    it('should support required attribute', () => {
      render(<Checkbox required />);
      expect(screen.getByRole('checkbox')).toBeRequired();
    });

    it('should support disabled attribute', () => {
      render(<Checkbox disabled />);
      expect(screen.getByRole('checkbox')).toBeDisabled();
    });

    it('should apply disabled cursor to wrapper when disabled', () => {
      const { container } = render(<Checkbox disabled />);
      const wrapper = container.querySelector('div');
      expect(wrapper).toHaveClass('cursor-not-allowed');
    });

    it('should support form attribute', () => {
      render(<Checkbox form="my-form" />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('form', 'my-form');
    });

    it('should support autoFocus attribute', () => {
      render(<Checkbox autoFocus />);
      expect(screen.getByRole('checkbox')).toHaveFocus();
    });
  });

  describe('ARIA Attributes', () => {
    it('should support aria-label', () => {
      render(<Checkbox aria-label="Custom checkbox" />);
      expect(screen.getByLabelText('Custom checkbox')).toBeInTheDocument();
    });

    it('should support aria-describedby', () => {
      render(<Checkbox aria-describedby="description" />);
      expect(screen.getByRole('checkbox')).toHaveAttribute(
        'aria-describedby',
        'description'
      );
    });

    it('should support aria-labelledby', () => {
      render(<Checkbox aria-labelledby="label-id" />);
      expect(screen.getByRole('checkbox')).toHaveAttribute(
        'aria-labelledby',
        'label-id'
      );
    });

    it('should support aria-required', () => {
      render(<Checkbox aria-required="true" />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-required', 'true');
    });

    it('should support aria-invalid', () => {
      render(<Checkbox aria-invalid="true" />);
      expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Event Handlers', () => {
    it('should call onChange when clicked', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox onChange={handleChange} />);

      await user.click(screen.getByRole('checkbox'));
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('should call onChange with event when clicked', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox onChange={handleChange} />);

      await user.click(screen.getByRole('checkbox'));
      expect(handleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            checked: true,
          }),
        })
      );
    });

    it('should call onFocus when focused', async () => {
      const user = userEvent.setup();
      const handleFocus = vi.fn();
      render(<Checkbox onFocus={handleFocus} />);

      await user.tab();
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should call onBlur when blurred', async () => {
      const handleBlur = vi.fn();
      render(<Checkbox onBlur={handleBlur} />);

      const checkbox = screen.getByRole('checkbox');
      checkbox.focus();
      checkbox.blur();

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should toggle with Space key', async () => {
      const user = userEvent.setup();
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');

      checkbox.focus();
      expect(checkbox).not.toBeChecked();

      await user.keyboard(' ');
      expect(checkbox).toBeChecked();

      await user.keyboard(' ');
      expect(checkbox).not.toBeChecked();
    });

    it('should not call onChange when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Checkbox disabled onChange={handleChange} />);

      await user.click(screen.getByRole('checkbox'));
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Custom className', () => {
    it('should merge custom className with default classes', () => {
      render(<Checkbox className="custom-class" />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('custom-class');
      expect(checkbox).toHaveClass('peer'); // Default class
    });

    it('should allow className override', () => {
      render(<Checkbox className="my-custom-checkbox" />);
      expect(screen.getByRole('checkbox')).toHaveClass('my-custom-checkbox');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to input element', () => {
      const ref = createRef<HTMLInputElement>();
      render(<Checkbox ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.tagName).toBe('INPUT');
    });

    it('should allow programmatic focus via ref', () => {
      const ref = createRef<HTMLInputElement>();
      render(<Checkbox ref={ref} />);

      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });

    it('should allow reading checked state via ref', async () => {
      const user = userEvent.setup();
      const ref = createRef<HTMLInputElement>();
      render(<Checkbox ref={ref} />);

      expect(ref.current?.checked).toBe(false);

      await user.click(screen.getByRole('checkbox'));
      expect(ref.current?.checked).toBe(true);
    });

    it('should allow setting indeterminate via ref', () => {
      const ref = createRef<HTMLInputElement>();
      render(<Checkbox ref={ref} />);

      if (ref.current) {
        ref.current.indeterminate = true;
      }
      expect(ref.current?.indeterminate).toBe(true);
    });
  });

  describe('Base Classes', () => {
    it('should include layout classes on input', () => {
      render(<Checkbox />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveClass('peer', 'sr-only');
    });

    it('should include transition classes on UI element', () => {
      const { container } = render(<Checkbox />);
      const ui = container.querySelector('span');
      expect(ui).toHaveClass('transition-all', 'duration-200');
    });

    it('should include border and background classes on UI element', () => {
      const { container } = render(<Checkbox />);
      const ui = container.querySelector('span');
      expect(ui).toHaveClass('border-2', 'bg-background', 'rounded-sm');
    });

    it('should include cursor classes on UI element', () => {
      const { container } = render(<Checkbox />);
      const ui = container.querySelector('span');
      expect(ui).toHaveClass('inline-flex', 'items-center', 'justify-center');
    });

    it('should render checkmark SVG', () => {
      const { container } = render(<Checkbox />);
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThanOrEqual(1);

      // Checkmark path
      const checkmarkPath = container.querySelector('path[d*="M13.5 4.5"]');
      expect(checkmarkPath).toBeInTheDocument();
    });

    it('should render indeterminate line SVG', () => {
      const { container } = render(<Checkbox />);
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThanOrEqual(2);

      // Indeterminate path
      const indeterminatePath = container.querySelector('path[d*="M4 8H12"]');
      expect(indeterminatePath).toBeInTheDocument();
    });

    it('should hide SVG icons with aria-hidden', () => {
      const { container } = render(<Checkbox />);
      const svgs = container.querySelectorAll('svg');
      svgs.forEach((svg) => {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Compound Scenarios', () => {
    it('should work with error state and small size', () => {
      const { container } = render(<Checkbox state="error" size="sm" />);
      const ui = container.querySelector('span');
      expect(ui).toHaveClass('border-error', 'h-4', 'w-4');
    });

    it('should work with success state and large size', () => {
      const { container } = render(<Checkbox state="success" size="lg" />);
      const ui = container.querySelector('span');
      expect(ui).toHaveClass('border-success', 'h-6', 'w-6');
    });

    it('should work with indeterminate state and label', () => {
      render(<Checkbox indeterminate label="Select all" />);
      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.indeterminate).toBe(true);
      expect(screen.getByText('Select all')).toBeInTheDocument();
    });

    it('should work with disabled and checked states', () => {
      render(<Checkbox disabled checked onChange={() => {}} />);
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
      expect(checkbox).toBeChecked();
    });

    it('should work with all props combined', () => {
      const handleChange = vi.fn();
      render(
        <Checkbox
          state="success"
          size="lg"
          label="I agree"
          labelPosition="left"
          disabled={false}
          indeterminate={false}
          checked={true}
          onChange={handleChange}
          aria-label="Agreement checkbox"
        />
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toBeChecked();
      expect(screen.getByText('I agree')).toBeInTheDocument();
    });
  });

  describe('Controlled vs Uncontrolled', () => {
    it('should work as uncontrolled with defaultChecked', async () => {
      const user = userEvent.setup();
      render(<Checkbox defaultChecked={true} />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('should work as controlled with checked and onChange', async () => {
      const user = userEvent.setup();
      const ControlledCheckbox = () => {
        const [checked, setChecked] = React.useState(false);
        return (
          <Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        );
      };

      render(<ControlledCheckbox />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('should not change when controlled without onChange', async () => {
      const user = userEvent.setup();
      render(<Checkbox checked={false} onChange={() => {}} />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).not.toBeChecked();

      // Should remain unchecked since onChange doesn't update the value
      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  describe('Label Integration', () => {
    it('should toggle checkbox when label is clicked', async () => {
      const user = userEvent.setup();
      render(<Checkbox label="Click me" />);
      const checkbox = screen.getByRole('checkbox');

      expect(checkbox).not.toBeChecked();

      await user.click(screen.getByText('Click me'));
      expect(checkbox).toBeChecked();
    });

    it('should associate label with input via htmlFor', () => {
      render(<Checkbox label="My label" id="my-id" />);
      const label = screen.getByText('My label');
      expect(label).toHaveAttribute('for', 'my-id');
    });

    it('should apply cursor-pointer to label', () => {
      render(<Checkbox label="Clickable" />);
      const label = screen.getByText('Clickable');
      expect(label).toHaveClass('cursor-pointer');
    });

    it('should apply disabled cursor to label when disabled', () => {
      render(<Checkbox label="Disabled" disabled />);
      const label = screen.getByText('Disabled');
      expect(label).toHaveClass('peer-disabled:cursor-not-allowed');
    });
  });
});

// Import React for controlled component test
import React from 'react';
