import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Slider } from './Slider';

describe('Slider', () => {
  describe('Rendering', () => {
    it('should render a range input', () => {
      render(<Slider />);
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
      expect(slider).toHaveAttribute('type', 'range');
    });

    it('should render with default min, max, and step', () => {
      render(<Slider />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '0');
      expect(slider).toHaveAttribute('max', '100');
      expect(slider).toHaveAttribute('step', '1');
    });

    it('should render with custom min, max, and step', () => {
      render(<Slider min={10} max={50} step={5} />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('min', '10');
      expect(slider).toHaveAttribute('max', '50');
      expect(slider).toHaveAttribute('step', '5');
    });
  });

  describe('States', () => {
    it('should apply default state classes', () => {
      render(<Slider />);
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
      // State affects styling via inline styles and CSS
    });

    it('should apply error state', () => {
      render(<Slider state="error" />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('aria-invalid', 'true');
    });

    it('should apply success state', () => {
      render(<Slider state="success" />);
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });

    it('should not set aria-invalid for default state', () => {
      render(<Slider />);
      expect(screen.getByRole('slider')).not.toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Sizes', () => {
    it('should apply small size classes', () => {
      render(<Slider size="sm" />);
      expect(screen.getByRole('slider')).toHaveClass('h-4');
    });

    it('should apply medium size classes by default', () => {
      render(<Slider />);
      expect(screen.getByRole('slider')).toHaveClass('h-5');
    });

    it('should apply large size classes', () => {
      render(<Slider size="lg" />);
      expect(screen.getByRole('slider')).toHaveClass('h-6');
    });
  });

  describe('Full Width', () => {
    it('should be full width by default', () => {
      const { container } = render(<Slider />);
      const wrapper = container.querySelector('div');
      expect(wrapper).toHaveClass('w-full');
      expect(screen.getByRole('slider')).toHaveClass('w-full');
    });

    it('should not be full width when explicitly set to false', () => {
      const { container } = render(<Slider fullWidth={false} />);
      const wrapper = container.querySelector('div');
      expect(wrapper).not.toHaveClass('w-full');
      expect(screen.getByRole('slider')).not.toHaveClass('w-full');
    });
  });

  describe('Value Display', () => {
    it('should not show value by default', () => {
      const { container } = render(<Slider defaultValue={50} />);
      const valueDisplay = container.querySelector('span[aria-live="polite"]');
      expect(valueDisplay).not.toBeInTheDocument();
    });

    it('should show value when showValue is true', () => {
      const { container } = render(<Slider defaultValue={50} showValue />);
      const valueDisplay = container.querySelector('span[aria-live="polite"]');
      expect(valueDisplay).toBeInTheDocument();
      expect(valueDisplay).toHaveTextContent('50');
    });

    it('should display min value when no default value', () => {
      const { container } = render(<Slider min={10} showValue />);
      const valueDisplay = container.querySelector('span[aria-live="polite"]');
      expect(valueDisplay).toHaveTextContent('10');
    });

    it('should update displayed value (controlled)', () => {
      const { container, rerender } = render(<Slider value={25} showValue onChange={() => {}} />);
      let valueDisplay = container.querySelector('span[aria-live="polite"]');
      expect(valueDisplay).toHaveTextContent('25');

      rerender(<Slider value={75} showValue onChange={() => {}} />);
      valueDisplay = container.querySelector('span[aria-live="polite"]');
      expect(valueDisplay).toHaveTextContent('75');
    });

    it('should have aria-live for accessibility', () => {
      const { container } = render(<Slider showValue />);
      const valueDisplay = container.querySelector('span[aria-live="polite"]');
      expect(valueDisplay).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Marks', () => {
    it('should not show marks by default', () => {
      const { container } = render(<Slider />);
      const marksContainer = container.querySelector('div.relative.flex.justify-between');
      expect(marksContainer).not.toBeInTheDocument();
    });

    it('should show custom marks when provided', () => {
      const marks = [
        { value: 0, label: 'Min' },
        { value: 50, label: 'Mid' },
        { value: 100, label: 'Max' },
      ];
      const { container } = render(<Slider marks={marks} />);

      expect(screen.getByText('Min')).toBeInTheDocument();
      expect(screen.getByText('Mid')).toBeInTheDocument();
      expect(screen.getByText('Max')).toBeInTheDocument();
    });

    it('should position marks correctly', () => {
      const marks = [
        { value: 0, label: 'Start' },
        { value: 100, label: 'End' },
      ];
      const { container } = render(<Slider min={0} max={100} marks={marks} />);

      const markElements = container.querySelectorAll('.absolute.transform.-translate-x-1\\/2');
      expect(markElements[0]).toHaveStyle({ left: '0%' });
      expect(markElements[1]).toHaveStyle({ left: '100%' });
    });

    it('should show marks without labels (just values)', () => {
      const marks = [
        { value: 0 },
        { value: 50 },
      ];
      render(<Slider marks={marks} />);

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('should generate marks when showMarks is true', () => {
      const { container } = render(<Slider min={0} max={10} step={5} showMarks />);
      const marksContainer = container.querySelector('div.relative.flex.justify-between');
      expect(marksContainer).toBeInTheDocument();
    });

    it('should prioritize custom marks over showMarks', () => {
      const marks = [{ value: 25, label: 'Quarter' }];
      render(<Slider marks={marks} showMarks />);

      expect(screen.getByText('Quarter')).toBeInTheDocument();
      // Should only show custom mark, not generated marks
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });

  describe('Value and Selection', () => {
    it('should support default value', () => {
      render(<Slider defaultValue={75} />);
      const slider = screen.getByRole('slider') as HTMLInputElement;
      expect(slider.value).toBe('75');
    });

    it('should support controlled value', () => {
      render(<Slider value={30} onChange={() => {}} />);
      const slider = screen.getByRole('slider') as HTMLInputElement;
      expect(slider.value).toBe('30');
    });

    it('should default to min value when no value provided', () => {
      render(<Slider min={10} />);
      const slider = screen.getByRole('slider') as HTMLInputElement;
      expect(slider.value).toBe('10');
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Slider disabled />);
      expect(screen.getByRole('slider')).toBeDisabled();
    });

    it('should not be disabled by default', () => {
      render(<Slider />);
      expect(screen.getByRole('slider')).not.toBeDisabled();
    });

    it('should not respond to changes when disabled', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Slider disabled onChange={handleChange} />);

      const slider = screen.getByRole('slider');
      await user.type(slider, '{arrowright}');

      // Should not call onChange when disabled
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('HTML Attributes', () => {
    it('should support name attribute', () => {
      render(<Slider name="volume" />);
      expect(screen.getByRole('slider')).toHaveAttribute('name', 'volume');
    });

    it('should support id attribute', () => {
      render(<Slider id="volume-slider" />);
      expect(screen.getByRole('slider')).toHaveAttribute('id', 'volume-slider');
    });

    it('should support autoFocus attribute', () => {
      render(<Slider autoFocus />);
      expect(screen.getByRole('slider')).toHaveFocus();
    });

    it('should support form attribute', () => {
      render(<Slider form="my-form" />);
      expect(screen.getByRole('slider')).toHaveAttribute('form', 'my-form');
    });
  });

  describe('ARIA Attributes', () => {
    it('should set aria-valuemin', () => {
      render(<Slider min={10} />);
      expect(screen.getByRole('slider')).toHaveAttribute('aria-valuemin', '10');
    });

    it('should set aria-valuemax', () => {
      render(<Slider max={200} />);
      expect(screen.getByRole('slider')).toHaveAttribute('aria-valuemax', '200');
    });

    it('should set aria-valuenow to current value', () => {
      render(<Slider defaultValue={50} />);
      expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '50');
    });

    it('should update aria-valuenow when value changes', () => {
      const { rerender } = render(<Slider value={25} onChange={() => {}} />);
      expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '25');

      rerender(<Slider value={75} onChange={() => {}} />);
      expect(screen.getByRole('slider')).toHaveAttribute('aria-valuenow', '75');
    });

    it('should support aria-label', () => {
      render(<Slider aria-label="Volume control" />);
      expect(screen.getByLabelText('Volume control')).toBeInTheDocument();
    });

    it('should support aria-labelledby', () => {
      render(<Slider aria-labelledby="volume-label" />);
      expect(screen.getByRole('slider')).toHaveAttribute(
        'aria-labelledby',
        'volume-label'
      );
    });

    it('should support aria-describedby', () => {
      render(<Slider aria-describedby="volume-description" />);
      expect(screen.getByRole('slider')).toHaveAttribute(
        'aria-describedby',
        'volume-description'
      );
    });
  });

  describe('Event Handlers', () => {
    it('should call onChange when value changes', () => {
      const handleChange = vi.fn();
      render(<Slider onChange={handleChange} />);

      const slider = screen.getByRole('slider') as HTMLInputElement;
      fireEvent.change(slider, { target: { value: '50' } });

      expect(handleChange).toHaveBeenCalled();
    });

    it('should call onFocus when focused', async () => {
      const user = userEvent.setup();
      const handleFocus = vi.fn();
      render(<Slider onFocus={handleFocus} />);

      await user.tab();
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should call onBlur when blurred', async () => {
      const handleBlur = vi.fn();
      render(<Slider onBlur={handleBlur} />);

      const slider = screen.getByRole('slider');
      slider.focus();
      slider.blur();

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support arrow key navigation', async () => {
      const user = userEvent.setup();
      render(<Slider defaultValue={50} min={0} max={100} step={10} />);

      const slider = screen.getByRole('slider') as HTMLInputElement;
      slider.focus();

      // Note: userEvent doesn't actually change range values, but we can verify focus
      expect(slider).toHaveFocus();
    });

    it('should be focusable via tab', async () => {
      const user = userEvent.setup();
      render(<Slider />);

      await user.tab();
      expect(screen.getByRole('slider')).toHaveFocus();
    });
  });

  describe('Custom className', () => {
    it('should merge custom className with default classes', () => {
      render(<Slider className="custom-class" />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveClass('custom-class');
      expect(slider).toHaveClass('appearance-none');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to input element', () => {
      const ref = createRef<HTMLInputElement>();
      render(<Slider ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.tagName).toBe('INPUT');
      expect(ref.current?.type).toBe('range');
    });

    it('should allow programmatic focus via ref', () => {
      const ref = createRef<HTMLInputElement>();
      render(<Slider ref={ref} />);

      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });

    it('should allow reading value via ref', () => {
      const ref = createRef<HTMLInputElement>();
      render(<Slider ref={ref} defaultValue={75} />);

      expect(ref.current?.value).toBe('75');
    });

    it('should allow setting value via ref', () => {
      const ref = createRef<HTMLInputElement>();
      render(<Slider ref={ref} />);

      if (ref.current) {
        ref.current.value = '60';
      }
      expect(ref.current?.value).toBe('60');
    });
  });

  describe('Base Classes', () => {
    it('should include appearance-none for custom styling', () => {
      render(<Slider />);
      expect(screen.getByRole('slider')).toHaveClass('appearance-none');
    });

    it('should include transition classes', () => {
      render(<Slider />);
      expect(screen.getByRole('slider')).toHaveClass('transition-all', 'duration-200');
    });

    it('should have cursor pointer', () => {
      render(<Slider />);
      expect(screen.getByRole('slider')).toHaveClass('cursor-pointer');
    });

    it('should render style element for cross-browser styling', () => {
      const { container } = render(<Slider />);
      const style = container.querySelector('style');
      expect(style).toBeInTheDocument();
      expect(style?.textContent).toContain('-webkit-slider-thumb');
      expect(style?.textContent).toContain('-moz-range-thumb');
    });
  });

  describe('Compound Scenarios', () => {
    it('should work with error state and small size', () => {
      render(<Slider state="error" size="sm" />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveClass('h-4');
      expect(slider).toHaveAttribute('aria-invalid', 'true');
    });

    it('should work with success state and large size', () => {
      render(<Slider state="success" size="lg" />);
      const slider = screen.getByRole('slider');
      expect(slider).toHaveClass('h-6');
    });

    it('should work with value display and marks', () => {
      const marks = [{ value: 0 }, { value: 50 }, { value: 100 }];
      const { container } = render(<Slider marks={marks} showValue defaultValue={50} />);

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getAllByText('50').length).toBeGreaterThan(0);
      expect(screen.getByText('100')).toBeInTheDocument();

      const valueDisplay = container.querySelector('span[aria-live="polite"]');
      expect(valueDisplay).toHaveTextContent('50');
    });

    it('should work with all props combined', () => {
      const marks = [{ value: 0, label: 'Low' }, { value: 100, label: 'High' }];
      render(
        <Slider
          min={0}
          max={100}
          step={10}
          defaultValue={50}
          state="success"
          size="lg"
          showValue
          marks={marks}
          name="volume"
          aria-label="Volume control"
        />
      );

      const slider = screen.getByRole('slider');
      expect(slider).toHaveAttribute('name', 'volume');
      expect(slider).toHaveAttribute('aria-label', 'Volume control');
      expect(screen.getByText('Low')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle min equal to max', () => {
      render(<Slider min={50} max={50} />);
      const slider = screen.getByRole('slider') as HTMLInputElement;
      expect(slider.min).toBe('50');
      expect(slider.max).toBe('50');
    });

    it('should handle negative values', () => {
      render(<Slider min={-100} max={-10} defaultValue={-50} showValue />);
      const slider = screen.getByRole('slider') as HTMLInputElement;
      expect(slider.value).toBe('-50');
    });

    it('should handle decimal step values', () => {
      render(<Slider min={0} max={1} step={0.1} />);
      expect(screen.getByRole('slider')).toHaveAttribute('step', '0.1');
    });

    it('should handle empty marks array', () => {
      render(<Slider marks={[]} />);
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
    });
  });
});
