import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Radio } from './Radio';
import { RadioGroup } from './RadioGroup';

describe('Radio', () => {
  describe('Rendering', () => {
    it('should throw error when not used within RadioGroup', () => {
      // Suppress console.error for this test
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<Radio value="test" />)).toThrow(
        'Radio must be used within a RadioGroup'
      );

      spy.mockRestore();
    });

    it('should render a radio input within RadioGroup', () => {
      render(
        <RadioGroup name="test">
          <Radio value="option1" />
        </RadioGroup>
      );
      const radio = screen.getByRole('radio');
      expect(radio).toBeInTheDocument();
      expect(radio).toHaveAttribute('type', 'radio');
    });

    it('should render with a label when provided', () => {
      render(
        <RadioGroup name="test">
          <Radio value="option1" label="Option 1" />
        </RadioGroup>
      );
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Option 1')).toBeInTheDocument();
    });

    it('should render without a label by default', () => {
      const { container } = render(
        <RadioGroup name="test">
          <Radio value="option1" />
        </RadioGroup>
      );
      expect(screen.getByRole('radio')).toBeInTheDocument();
      expect(container.querySelector('label')).not.toBeInTheDocument();
    });

    it('should use provided ID', () => {
      render(
        <RadioGroup name="test">
          <Radio value="option1" id="my-radio" />
        </RadioGroup>
      );
      expect(screen.getByRole('radio')).toHaveAttribute('id', 'my-radio');
    });

    it('should generate ID from name and value', () => {
      render(
        <RadioGroup name="size">
          <Radio value="small" />
        </RadioGroup>
      );
      expect(screen.getByRole('radio')).toHaveAttribute('id', 'radio-size-small');
    });
  });

  describe('States', () => {
    it('should apply default state from RadioGroup', () => {
      const { container } = render(
        <RadioGroup name="test" state="default">
          <Radio value="option1" />
        </RadioGroup>
      );
      const ui = container.querySelector('span');
      expect(ui).toHaveClass('border-border');
    });

    it('should apply error state from RadioGroup', () => {
      const { container } = render(
        <RadioGroup name="test" state="error">
          <Radio value="option1" />
        </RadioGroup>
      );
      const ui = container.querySelector('span');
      expect(ui).toHaveClass('border-error');
    });

    it('should apply success state from RadioGroup', () => {
      const { container } = render(
        <RadioGroup name="test" state="success">
          <Radio value="option1" />
        </RadioGroup>
      );
      const ui = container.querySelector('span');
      expect(ui).toHaveClass('border-success');
    });

    it('should allow Radio to override RadioGroup state', () => {
      const { container } = render(
        <RadioGroup name="test" state="default">
          <Radio value="option1" state="error" />
        </RadioGroup>
      );
      const ui = container.querySelector('span');
      expect(ui).toHaveClass('border-error');
    });
  });

  describe('Sizes', () => {
    it('should apply small size from RadioGroup', () => {
      const { container } = render(
        <RadioGroup name="test" size="sm">
          <Radio value="option1" />
        </RadioGroup>
      );
      const ui = container.querySelector('span');
      expect(ui).toHaveClass('h-4', 'w-4');
    });

    it('should apply medium size from RadioGroup by default', () => {
      const { container } = render(
        <RadioGroup name="test">
          <Radio value="option1" />
        </RadioGroup>
      );
      const ui = container.querySelector('span');
      expect(ui).toHaveClass('h-5', 'w-5');
    });

    it('should apply large size from RadioGroup', () => {
      const { container } = render(
        <RadioGroup name="test" size="lg">
          <Radio value="option1" />
        </RadioGroup>
      );
      const ui = container.querySelector('span');
      expect(ui).toHaveClass('h-6', 'w-6');
    });

    it('should allow Radio to override RadioGroup size', () => {
      const { container } = render(
        <RadioGroup name="test" size="sm">
          <Radio value="option1" size="lg" />
        </RadioGroup>
      );
      const ui = container.querySelector('span');
      expect(ui).toHaveClass('h-6', 'w-6');
    });

    it('should apply size-specific label classes', () => {
      const { rerender } = render(
        <RadioGroup name="test" size="sm">
          <Radio value="option1" label="Text" />
        </RadioGroup>
      );
      expect(screen.getByText('Text')).toHaveClass('text-xs');

      rerender(
        <RadioGroup name="test" size="md">
          <Radio value="option1" label="Text" />
        </RadioGroup>
      );
      expect(screen.getByText('Text')).toHaveClass('text-sm');

      rerender(
        <RadioGroup name="test" size="lg">
          <Radio value="option1" label="Text" />
        </RadioGroup>
      );
      expect(screen.getByText('Text')).toHaveClass('text-base');
    });
  });

  describe('Label Position', () => {
    it('should position label on the right by default', () => {
      render(
        <RadioGroup name="test">
          <Radio value="option1" label="Right label" />
        </RadioGroup>
      );
      const label = screen.getByText('Right label');
      expect(label).toHaveClass('ml-2');
      expect(label).not.toHaveClass('mr-2');
    });

    it('should position label on the left when specified', () => {
      render(
        <RadioGroup name="test">
          <Radio value="option1" label="Left label" labelPosition="left" />
        </RadioGroup>
      );
      const label = screen.getByText('Left label');
      expect(label).toHaveClass('mr-2');
      expect(label).not.toHaveClass('ml-2');
    });
  });

  describe('Checked State', () => {
    it('should be unchecked by default', () => {
      render(
        <RadioGroup name="test">
          <Radio value="option1" />
        </RadioGroup>
      );
      expect(screen.getByRole('radio')).not.toBeChecked();
    });

    it('should be checked when value matches RadioGroup defaultValue', () => {
      render(
        <RadioGroup name="test" defaultValue="option1">
          <Radio value="option1" />
          <Radio value="option2" />
        </RadioGroup>
      );
      const radios = screen.getAllByRole('radio');
      expect(radios[0]).toBeChecked();
      expect(radios[1]).not.toBeChecked();
    });

    it('should be checked when value matches RadioGroup controlled value', () => {
      render(
        <RadioGroup name="test" value="option2" onChange={() => {}}>
          <Radio value="option1" />
          <Radio value="option2" />
        </RadioGroup>
      );
      const radios = screen.getAllByRole('radio');
      expect(radios[0]).not.toBeChecked();
      expect(radios[1]).toBeChecked();
    });

    it('should update checked state when clicking (uncontrolled)', async () => {
      const user = userEvent.setup();
      render(
        <RadioGroup name="test">
          <Radio value="option1" />
          <Radio value="option2" />
        </RadioGroup>
      );
      const radios = screen.getAllByRole('radio');

      expect(radios[0]).not.toBeChecked();
      expect(radios[1]).not.toBeChecked();

      await user.click(radios[0]!);
      expect(radios[0]).toBeChecked();
      expect(radios[1]).not.toBeChecked();

      await user.click(radios[1]!);
      expect(radios[0]).not.toBeChecked();
      expect(radios[1]).toBeChecked();
    });
  });

  describe('Name Attribute', () => {
    it('should use name from RadioGroup', () => {
      render(
        <RadioGroup name="my-group">
          <Radio value="option1" />
          <Radio value="option2" />
        </RadioGroup>
      );
      const radios = screen.getAllByRole('radio');
      expect(radios[0]).toHaveAttribute('name', 'my-group');
      expect(radios[1]).toHaveAttribute('name', 'my-group');
    });

    it('should share same name for all radios in group', () => {
      render(
        <RadioGroup name="test">
          <Radio value="a" />
          <Radio value="b" />
          <Radio value="c" />
        </RadioGroup>
      );
      const radios = screen.getAllByRole('radio');
      const names = radios.map((r) => r.getAttribute('name'));
      expect(new Set(names).size).toBe(1);
      expect(names[0]).toBe('test');
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when RadioGroup is disabled', () => {
      render(
        <RadioGroup name="test" disabled>
          <Radio value="option1" />
        </RadioGroup>
      );
      expect(screen.getByRole('radio')).toBeDisabled();
    });

    it('should allow Radio to override disabled state', () => {
      render(
        <RadioGroup name="test" disabled={false}>
          <Radio value="option1" disabled={true} />
        </RadioGroup>
      );
      expect(screen.getByRole('radio')).toBeDisabled();
    });

    it('should apply disabled cursor to wrapper when disabled', () => {
      const { container } = render(
        <RadioGroup name="test" disabled>
          <Radio value="option1" />
        </RadioGroup>
      );
      const wrapper = container.querySelector('.cursor-not-allowed');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('cursor-not-allowed');
    });

    it('should not change value when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(
        <RadioGroup name="test" onChange={handleChange} disabled>
          <Radio value="option1" />
        </RadioGroup>
      );
      const radio = screen.getByRole('radio');

      await user.click(radio);
      expect(handleChange).not.toHaveBeenCalled();
      expect(radio).not.toBeChecked();
    });
  });

  describe('ARIA Attributes', () => {
    it('should support aria-label', () => {
      render(
        <RadioGroup name="test">
          <Radio value="option1" aria-label="Custom radio" />
        </RadioGroup>
      );
      expect(screen.getByLabelText('Custom radio')).toBeInTheDocument();
    });

    it('should support aria-describedby', () => {
      render(
        <RadioGroup name="test">
          <Radio value="option1" aria-describedby="description" />
        </RadioGroup>
      );
      expect(screen.getByRole('radio')).toHaveAttribute('aria-describedby', 'description');
    });

    it('should support aria-labelledby', () => {
      render(
        <RadioGroup name="test">
          <Radio value="option1" aria-labelledby="label-id" />
        </RadioGroup>
      );
      expect(screen.getByRole('radio')).toHaveAttribute('aria-labelledby', 'label-id');
    });
  });

  describe('Event Handlers', () => {
    it('should call RadioGroup onChange when clicked', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(
        <RadioGroup name="test" onChange={handleChange}>
          <Radio value="option1" />
        </RadioGroup>
      );

      await user.click(screen.getByRole('radio'));
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith('option1');
    });

    it('should call RadioGroup onChange with correct value', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(
        <RadioGroup name="test" onChange={handleChange}>
          <Radio value="small" />
          <Radio value="large" />
        </RadioGroup>
      );
      const radios = screen.getAllByRole('radio');

      await user.click(radios[0]!);
      expect(handleChange).toHaveBeenCalledWith('small');

      await user.click(radios[1]!);
      expect(handleChange).toHaveBeenCalledWith('large');
    });

    it('should toggle with Space key', async () => {
      const user = userEvent.setup();
      render(
        <RadioGroup name="test">
          <Radio value="option1" />
        </RadioGroup>
      );
      const radio = screen.getByRole('radio');

      radio.focus();
      expect(radio).not.toBeChecked();

      await user.keyboard(' ');
      expect(radio).toBeChecked();
    });
  });

  describe('Custom className', () => {
    it('should merge custom className with default classes', () => {
      render(
        <RadioGroup name="test">
          <Radio value="option1" className="custom-class" />
        </RadioGroup>
      );
      const radio = screen.getByRole('radio');
      expect(radio).toHaveClass('custom-class');
      expect(radio).toHaveClass('peer');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to input element', () => {
      const ref = createRef<HTMLInputElement>();
      render(
        <RadioGroup name="test">
          <Radio value="option1" ref={ref} />
        </RadioGroup>
      );

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.tagName).toBe('INPUT');
    });

    it('should allow programmatic focus via ref', () => {
      const ref = createRef<HTMLInputElement>();
      render(
        <RadioGroup name="test">
          <Radio value="option1" ref={ref} />
        </RadioGroup>
      );

      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });
  });

  describe('Base Classes', () => {
    it('should include layout classes on input', () => {
      render(
        <RadioGroup name="test">
          <Radio value="option1" />
        </RadioGroup>
      );
      expect(screen.getByRole('radio')).toHaveClass('peer', 'sr-only');
    });

    it('should include transition classes on UI element', () => {
      const { container } = render(
        <RadioGroup name="test">
          <Radio value="option1" />
        </RadioGroup>
      );
      const ui = container.querySelector('span');
      expect(ui).toHaveClass('transition-all', 'duration-200');
    });

    it('should include circular border on UI element', () => {
      const { container } = render(
        <RadioGroup name="test">
          <Radio value="option1" />
        </RadioGroup>
      );
      const ui = container.querySelector('span');
      expect(ui).toHaveClass('rounded-full', 'border-2', 'bg-background');
    });

    it('should render inner dot element', () => {
      const { container } = render(
        <RadioGroup name="test">
          <Radio value="option1" />
        </RadioGroup>
      );
      const dots = container.querySelectorAll('span span');
      expect(dots.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Label Integration', () => {
    it('should toggle radio when label is clicked', async () => {
      const user = userEvent.setup();
      render(
        <RadioGroup name="test">
          <Radio value="option1" label="Click me" />
        </RadioGroup>
      );
      const radio = screen.getByRole('radio');

      expect(radio).not.toBeChecked();

      await user.click(screen.getByText('Click me'));
      expect(radio).toBeChecked();
    });

    it('should associate label with input via htmlFor', () => {
      render(
        <RadioGroup name="test">
          <Radio value="option1" label="My label" id="my-id" />
        </RadioGroup>
      );
      const label = screen.getByText('My label');
      expect(label).toHaveAttribute('for', 'my-id');
    });
  });
});

describe('RadioGroup', () => {
  describe('Rendering', () => {
    it('should render with role="radiogroup"', () => {
      render(
        <RadioGroup name="test">
          <Radio value="option1" />
        </RadioGroup>
      );
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('should render children', () => {
      render(
        <RadioGroup name="test">
          <Radio value="option1" label="Option 1" />
          <Radio value="option2" label="Option 2" />
        </RadioGroup>
      );
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });
  });

  describe('Orientation', () => {
    it('should apply vertical orientation by default', () => {
      const { container } = render(
        <RadioGroup name="test">
          <Radio value="option1" />
        </RadioGroup>
      );
      const group = container.querySelector('[role="radiogroup"]');
      expect(group).toHaveClass('flex-col', 'gap-2.5');
    });

    it('should apply horizontal orientation when specified', () => {
      const { container } = render(
        <RadioGroup name="test" orientation="horizontal">
          <Radio value="option1" />
        </RadioGroup>
      );
      const group = container.querySelector('[role="radiogroup"]');
      expect(group).toHaveClass('flex-row', 'gap-4');
    });
  });

  describe('ARIA Attributes', () => {
    it('should support aria-label', () => {
      render(
        <RadioGroup name="test" aria-label="Choose size">
          <Radio value="option1" />
        </RadioGroup>
      );
      expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-label', 'Choose size');
    });

    it('should support aria-labelledby', () => {
      render(
        <RadioGroup name="test" aria-labelledby="label-id">
          <Radio value="option1" />
        </RadioGroup>
      );
      expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-labelledby', 'label-id');
    });

    it('should support aria-describedby', () => {
      render(
        <RadioGroup name="test" aria-describedby="description-id">
          <Radio value="option1" />
        </RadioGroup>
      );
      expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-describedby', 'description-id');
    });

    it('should support aria-required', () => {
      render(
        <RadioGroup name="test" required>
          <Radio value="option1" />
        </RadioGroup>
      );
      expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('Controlled vs Uncontrolled', () => {
    it('should work as uncontrolled with defaultValue', async () => {
      const user = userEvent.setup();
      render(
        <RadioGroup name="test" defaultValue="option1">
          <Radio value="option1" />
          <Radio value="option2" />
        </RadioGroup>
      );
      const radios = screen.getAllByRole('radio');

      expect(radios[0]).toBeChecked();
      expect(radios[1]).not.toBeChecked();

      await user.click(radios[1]!);
      expect(radios[0]).not.toBeChecked();
      expect(radios[1]).toBeChecked();
    });

    it('should work as controlled with value and onChange', async () => {
      const user = userEvent.setup();
      const ControlledRadioGroup = () => {
        const [value, setValue] = React.useState('option1');
        return (
          <RadioGroup name="test" value={value} onChange={setValue}>
            <Radio value="option1" />
            <Radio value="option2" />
          </RadioGroup>
        );
      };

      render(<ControlledRadioGroup />);
      const radios = screen.getAllByRole('radio');

      expect(radios[0]).toBeChecked();
      expect(radios[1]).not.toBeChecked();

      await user.click(radios[1]!);
      expect(radios[0]).not.toBeChecked();
      expect(radios[1]).toBeChecked();
    });

    it('should not change when controlled without onChange updating value', async () => {
      const user = userEvent.setup();
      render(
        <RadioGroup name="test" value="option1" onChange={() => {}}>
          <Radio value="option1" />
          <Radio value="option2" />
        </RadioGroup>
      );
      const radios = screen.getAllByRole('radio');

      expect(radios[0]).toBeChecked();

      await user.click(radios[1]!);
      expect(radios[0]).toBeChecked();
      expect(radios[1]).not.toBeChecked();
    });
  });

  describe('Custom className', () => {
    it('should merge custom className with default classes', () => {
      const { container } = render(
        <RadioGroup name="test" className="custom-group-class">
          <Radio value="option1" />
        </RadioGroup>
      );
      const group = container.querySelector('[role="radiogroup"]');
      expect(group).toHaveClass('custom-group-class');
      expect(group).toHaveClass('flex');
    });
  });

  describe('Compound Scenarios', () => {
    it('should work with error state and small size', () => {
      const { container } = render(
        <RadioGroup name="test" state="error" size="sm">
          <Radio value="option1" />
        </RadioGroup>
      );
      const ui = container.querySelector('span');
      expect(ui).toHaveClass('border-error', 'h-4', 'w-4');
    });

    it('should work with success state and large size', () => {
      const { container } = render(
        <RadioGroup name="test" state="success" size="lg">
          <Radio value="option1" />
        </RadioGroup>
      );
      const ui = container.querySelector('span');
      expect(ui).toHaveClass('border-success', 'h-6', 'w-6');
    });

    it('should work with horizontal orientation and multiple radios', () => {
      const { container } = render(
        <RadioGroup name="test" orientation="horizontal">
          <Radio value="small" label="Small" />
          <Radio value="medium" label="Medium" />
          <Radio value="large" label="Large" />
        </RadioGroup>
      );
      const group = container.querySelector('[role="radiogroup"]');
      expect(group).toHaveClass('flex-row');
      expect(screen.getAllByRole('radio')).toHaveLength(3);
    });

    it('should handle complex scenario with all props', () => {
      const handleChange = vi.fn();
      render(
        <RadioGroup
          name="size"
          value="medium"
          onChange={handleChange}
          orientation="horizontal"
          state="success"
          size="lg"
          aria-label="Size selection"
          required
        >
          <Radio value="small" label="Small" />
          <Radio value="medium" label="Medium" />
          <Radio value="large" label="Large" />
        </RadioGroup>
      );

      const group = screen.getByRole('radiogroup');
      expect(group).toHaveAttribute('aria-label', 'Size selection');
      expect(group).toHaveAttribute('aria-required', 'true');
      expect(screen.getAllByRole('radio')).toHaveLength(3);
      expect(screen.getByLabelText('Medium')).toBeChecked();
    });
  });
});
