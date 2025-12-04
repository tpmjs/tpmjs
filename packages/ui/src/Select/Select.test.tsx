import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Select } from './Select';

describe('Select', () => {
  const simpleOptions = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'orange', label: 'Orange' },
  ];

  const optionGroups = [
    {
      label: 'Fruits',
      options: [
        { value: 'apple', label: 'Apple' },
        { value: 'banana', label: 'Banana' },
      ],
    },
    {
      label: 'Vegetables',
      options: [
        { value: 'carrot', label: 'Carrot' },
        { value: 'broccoli', label: 'Broccoli' },
      ],
    },
  ];

  describe('Rendering', () => {
    it('should render a select element', () => {
      render(<Select options={simpleOptions} />);
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(select.tagName).toBe('SELECT');
    });

    it('should render with options', () => {
      render(<Select options={simpleOptions} />);
      expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Banana' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Orange' })).toBeInTheDocument();
    });

    it('should render with option groups', () => {
      const { container } = render(<Select optionGroups={optionGroups} />);
      const groups = container.querySelectorAll('optgroup');
      expect(groups).toHaveLength(2);
      expect(groups[0]).toHaveAttribute('label', 'Fruits');
      expect(groups[1]).toHaveAttribute('label', 'Vegetables');
    });

    it('should render placeholder when provided', () => {
      render(<Select options={simpleOptions} placeholder="Select a fruit" />);
      expect(screen.getByRole('option', { name: 'Select a fruit' })).toBeInTheDocument();
    });

    it('should render children when provided', () => {
      render(
        <Select>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      );
      expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument();
    });

    it('should prioritize children over options prop', () => {
      render(
        <Select options={simpleOptions}>
          <option value="custom">Custom Option</option>
        </Select>
      );
      expect(screen.getByRole('option', { name: 'Custom Option' })).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: 'Apple' })).not.toBeInTheDocument();
    });

    it('should render chevron down icon by default', () => {
      const { container } = render(<Select options={simpleOptions} />);
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('States', () => {
    it('should apply default state classes', () => {
      render(<Select options={simpleOptions} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('border-border');
    });

    it('should apply error state classes', () => {
      render(<Select options={simpleOptions} state="error" />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('border-error');
    });

    it('should apply success state classes', () => {
      render(<Select options={simpleOptions} state="success" />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('border-success');
    });

    it('should set aria-invalid when state is error', () => {
      render(<Select options={simpleOptions} state="error" />);
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('should not set aria-invalid for default state', () => {
      render(<Select options={simpleOptions} />);
      expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Sizes', () => {
    it('should apply small size classes', () => {
      render(<Select options={simpleOptions} size="sm" />);
      expect(screen.getByRole('combobox')).toHaveClass('h-9', 'text-sm');
    });

    it('should apply medium size classes by default', () => {
      render(<Select options={simpleOptions} />);
      expect(screen.getByRole('combobox')).toHaveClass('h-10', 'text-base');
    });

    it('should apply large size classes', () => {
      render(<Select options={simpleOptions} size="lg" />);
      expect(screen.getByRole('combobox')).toHaveClass('h-11', 'text-lg');
    });
  });

  describe('Full Width', () => {
    it('should be full width by default', () => {
      const { container } = render(<Select options={simpleOptions} />);
      const wrapper = container.querySelector('div');
      expect(wrapper).toHaveClass('w-full');
      expect(screen.getByRole('combobox')).toHaveClass('w-full');
    });

    it('should not be full width when explicitly set to false', () => {
      const { container } = render(<Select options={simpleOptions} fullWidth={false} />);
      const wrapper = container.querySelector('div');
      expect(wrapper).not.toHaveClass('w-full');
      expect(screen.getByRole('combobox')).not.toHaveClass('w-full');
    });
  });

  describe('Placeholder', () => {
    it('should render placeholder as first option', () => {
      const { container } = render(
        <Select options={simpleOptions} placeholder="Choose an option" />
      );
      const options = container.querySelectorAll('option');
      expect(options[0]).toHaveTextContent('Choose an option');
    });

    it('should make placeholder option disabled', () => {
      render(<Select options={simpleOptions} placeholder="Choose an option" />);
      const placeholder = screen.getByRole('option', { name: 'Choose an option' });
      expect(placeholder).toBeDisabled();
    });

    it('should give placeholder empty value', () => {
      render(<Select options={simpleOptions} placeholder="Choose an option" />);
      const placeholder = screen.getByRole('option', { name: 'Choose an option' });
      expect(placeholder).toHaveAttribute('value', '');
    });
  });

  describe('Options', () => {
    it('should render all options with correct values', () => {
      render(<Select options={simpleOptions} />);
      const apple = screen.getByRole('option', { name: 'Apple' });
      const banana = screen.getByRole('option', { name: 'Banana' });

      expect(apple).toHaveAttribute('value', 'apple');
      expect(banana).toHaveAttribute('value', 'banana');
    });

    it('should handle disabled options', () => {
      const optionsWithDisabled = [
        { value: '1', label: 'Option 1' },
        { value: '2', label: 'Option 2', disabled: true },
        { value: '3', label: 'Option 3' },
      ];

      render(<Select options={optionsWithDisabled} />);
      const option2 = screen.getByRole('option', { name: 'Option 2' });
      expect(option2).toBeDisabled();
    });

    it('should render option groups with correct structure', () => {
      const { container } = render(<Select optionGroups={optionGroups} />);
      const fruitsGroup = container.querySelector('optgroup[label="Fruits"]');
      const veggiesGroup = container.querySelector('optgroup[label="Vegetables"]');

      expect(fruitsGroup).toBeInTheDocument();
      expect(veggiesGroup).toBeInTheDocument();

      const fruitsOptions = fruitsGroup?.querySelectorAll('option');
      expect(fruitsOptions).toHaveLength(2);
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      const { container } = render(<Select options={simpleOptions} loading />);
      const spinner = container.querySelector('svg.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should hide chevron icon when loading', () => {
      const { container } = render(<Select options={simpleOptions} loading />);
      const icons = container.querySelectorAll('svg');
      // Should only have spinner, not chevron
      expect(icons).toHaveLength(1);
      expect(icons[0]).toHaveClass('animate-spin');
    });

    it('should disable select when loading', () => {
      render(<Select options={simpleOptions} loading />);
      expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('should apply loading data attribute', () => {
      render(<Select options={simpleOptions} loading />);
      expect(screen.getByRole('combobox')).toHaveAttribute('data-loading', 'true');
    });

    it('should apply correct spinner size based on select size', () => {
      const { container, rerender } = render(<Select options={simpleOptions} loading size="sm" />);
      let spinner = container.querySelector('svg.animate-spin');
      expect(spinner).toHaveAttribute('width', '14');

      rerender(<Select options={simpleOptions} loading size="md" />);
      spinner = container.querySelector('svg.animate-spin');
      expect(spinner).toHaveAttribute('width', '16');

      rerender(<Select options={simpleOptions} loading size="lg" />);
      spinner = container.querySelector('svg.animate-spin');
      expect(spinner).toHaveAttribute('width', '18');
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Select options={simpleOptions} disabled />);
      expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('should not be disabled by default', () => {
      render(<Select options={simpleOptions} />);
      expect(screen.getByRole('combobox')).not.toBeDisabled();
    });
  });

  describe('HTML Attributes', () => {
    it('should support name attribute', () => {
      render(<Select options={simpleOptions} name="fruit" />);
      expect(screen.getByRole('combobox')).toHaveAttribute('name', 'fruit');
    });

    it('should support id attribute', () => {
      render(<Select options={simpleOptions} id="fruit-select" />);
      expect(screen.getByRole('combobox')).toHaveAttribute('id', 'fruit-select');
    });

    it('should support required attribute', () => {
      render(<Select options={simpleOptions} required />);
      expect(screen.getByRole('combobox')).toBeRequired();
    });

    it('should support multiple attribute', () => {
      render(<Select options={simpleOptions} multiple />);
      const select = screen.getByRole('listbox'); // Multiple select has role listbox
      expect(select).toHaveAttribute('multiple');
    });

    it('should support autoFocus attribute', () => {
      render(<Select options={simpleOptions} autoFocus />);
      expect(screen.getByRole('combobox')).toHaveFocus();
    });

    it('should support form attribute', () => {
      render(<Select options={simpleOptions} form="my-form" />);
      expect(screen.getByRole('combobox')).toHaveAttribute('form', 'my-form');
    });
  });

  describe('ARIA Attributes', () => {
    it('should support aria-label', () => {
      render(<Select options={simpleOptions} aria-label="Choose fruit" />);
      expect(screen.getByLabelText('Choose fruit')).toBeInTheDocument();
    });

    it('should support aria-describedby', () => {
      render(<Select options={simpleOptions} aria-describedby="description" />);
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-describedby', 'description');
    });

    it('should support aria-labelledby', () => {
      render(<Select options={simpleOptions} aria-labelledby="label-id" />);
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-labelledby', 'label-id');
    });

    it('should support aria-required', () => {
      render(<Select options={simpleOptions} aria-required="true" />);
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('Event Handlers', () => {
    it('should call onChange when value changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Select options={simpleOptions} onChange={handleChange} />);

      await user.selectOptions(screen.getByRole('combobox'), 'banana');
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('should call onFocus when focused', async () => {
      const user = userEvent.setup();
      const handleFocus = vi.fn();
      render(<Select options={simpleOptions} onFocus={handleFocus} />);

      await user.tab();
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should call onBlur when blurred', async () => {
      const handleBlur = vi.fn();
      render(<Select options={simpleOptions} onBlur={handleBlur} />);

      const select = screen.getByRole('combobox');
      select.focus();
      select.blur();

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should not call onChange when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Select options={simpleOptions} disabled onChange={handleChange} />);

      await user.selectOptions(screen.getByRole('combobox'), 'banana');
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should not call onChange when loading', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Select options={simpleOptions} loading onChange={handleChange} />);

      await user.selectOptions(screen.getByRole('combobox'), 'banana');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Selection', () => {
    it('should support default value', () => {
      render(<Select options={simpleOptions} defaultValue="banana" />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('banana');
    });

    it('should support controlled value', () => {
      render(<Select options={simpleOptions} value="orange" onChange={() => {}} />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('orange');
    });

    it('should update value when selection changes (uncontrolled)', async () => {
      const user = userEvent.setup();
      render(<Select options={simpleOptions} defaultValue="apple" />);
      const select = screen.getByRole('combobox') as HTMLSelectElement;

      expect(select.value).toBe('apple');

      await user.selectOptions(select, 'banana');
      expect(select.value).toBe('banana');
    });
  });

  describe('Custom className', () => {
    it('should merge custom className with default classes', () => {
      render(<Select options={simpleOptions} className="custom-class" />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('custom-class');
      expect(select).toHaveClass('appearance-none'); // Default class
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to select element', () => {
      const ref = createRef<HTMLSelectElement>();
      render(<Select options={simpleOptions} ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLSelectElement);
      expect(ref.current?.tagName).toBe('SELECT');
    });

    it('should allow programmatic focus via ref', () => {
      const ref = createRef<HTMLSelectElement>();
      render(<Select options={simpleOptions} ref={ref} />);

      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });

    it('should allow reading value via ref', async () => {
      const user = userEvent.setup();
      const ref = createRef<HTMLSelectElement>();
      render(<Select options={simpleOptions} ref={ref} />);

      await user.selectOptions(screen.getByRole('combobox'), 'banana');
      expect(ref.current?.value).toBe('banana');
    });
  });

  describe('Base Classes', () => {
    it('should include layout classes', () => {
      render(<Select options={simpleOptions} />);
      expect(screen.getByRole('combobox')).toHaveClass('flex', 'w-full');
    });

    it('should include transition classes', () => {
      render(<Select options={simpleOptions} />);
      expect(screen.getByRole('combobox')).toHaveClass('transition-base');
    });

    it('should include border and background classes', () => {
      render(<Select options={simpleOptions} />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('rounded-md', 'border', 'bg-surface');
    });

    it('should remove native appearance', () => {
      render(<Select options={simpleOptions} />);
      expect(screen.getByRole('combobox')).toHaveClass('appearance-none');
    });

    it('should have cursor pointer', () => {
      render(<Select options={simpleOptions} />);
      expect(screen.getByRole('combobox')).toHaveClass('cursor-pointer');
    });

    it('should have proper padding for icon', () => {
      render(<Select options={simpleOptions} size="md" />);
      expect(screen.getByRole('combobox')).toHaveClass('pr-10');
    });
  });

  describe('Icon Rendering', () => {
    it('should render chevron icon with correct size for sm', () => {
      const { container } = render(<Select options={simpleOptions} size="sm" />);
      const icon = container.querySelector('svg:not(.animate-spin)');
      expect(icon).toHaveAttribute('width', '16');
      expect(icon).toHaveAttribute('height', '16');
    });

    it('should render chevron icon with correct size for md', () => {
      const { container } = render(<Select options={simpleOptions} size="md" />);
      const icon = container.querySelector('svg:not(.animate-spin)');
      expect(icon).toHaveAttribute('width', '20');
      expect(icon).toHaveAttribute('height', '20');
    });

    it('should render chevron icon with correct size for lg', () => {
      const { container } = render(<Select options={simpleOptions} size="lg" />);
      const icon = container.querySelector('svg:not(.animate-spin)');
      expect(icon).toHaveAttribute('width', '24');
      expect(icon).toHaveAttribute('height', '24');
    });

    it('should position icon absolutely', () => {
      const { container } = render(<Select options={simpleOptions} />);
      const iconContainer = container.querySelector('span[aria-hidden="true"]');
      expect(iconContainer).toHaveClass('absolute');
    });
  });

  describe('Compound Scenarios', () => {
    it('should work with error state and small size', () => {
      render(<Select options={simpleOptions} state="error" size="sm" />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('border-error', 'h-9', 'text-sm');
    });

    it('should work with success state and large size', () => {
      render(<Select options={simpleOptions} state="success" size="lg" />);
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('border-success', 'h-11', 'text-lg');
    });

    it('should work with loading and disabled states', () => {
      const { container } = render(<Select options={simpleOptions} loading disabled />);
      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
      expect(container.querySelector('svg.animate-spin')).toBeInTheDocument();
    });

    it('should work with all props combined', () => {
      render(
        <Select
          options={simpleOptions}
          state="success"
          size="lg"
          placeholder="Select an option"
          defaultValue="banana"
          name="fruit"
          required
          aria-label="Fruit selection"
        />
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select).toHaveAttribute('name', 'fruit');
      expect(select).toBeRequired();
      expect(select.value).toBe('banana');
      expect(screen.getByRole('option', { name: 'Select an option' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty options array', () => {
      render(<Select options={[]} />);
      const select = screen.getByRole('combobox');
      expect(select.querySelectorAll('option')).toHaveLength(0);
    });

    it('should handle empty option groups array', () => {
      render(<Select optionGroups={[]} />);
      const select = screen.getByRole('combobox');
      expect(select.querySelectorAll('optgroup')).toHaveLength(0);
    });

    it('should render without options, optionGroups, or children', () => {
      render(<Select />);
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('should handle placeholder with no options', () => {
      render(<Select placeholder="Choose an option" />);
      expect(screen.getByRole('option', { name: 'Choose an option' })).toBeInTheDocument();
    });
  });
});
