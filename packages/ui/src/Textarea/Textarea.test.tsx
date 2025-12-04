import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  describe('Rendering', () => {
    it('renders a textarea element', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('renders with placeholder text', () => {
      render(<Textarea placeholder="Enter message" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('placeholder', 'Enter message');
    });

    it('renders with default value', () => {
      render(<Textarea defaultValue="Default text" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveValue('Default text');
    });
  });

  describe('States', () => {
    it('applies default state classes', () => {
      render(<Textarea state="default" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('border-border');
      expect(textarea.className).toContain('text-foreground');
    });

    it('applies error state classes', () => {
      render(<Textarea state="error" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('border-error');
    });

    it('applies success state classes', () => {
      render(<Textarea state="success" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('border-success');
    });

    it('sets aria-invalid on error state', () => {
      render(<Textarea state="error" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
    });

    it('does not set aria-invalid on default state', () => {
      render(<Textarea state="default" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).not.toHaveAttribute('aria-invalid');
    });

    it('does not set aria-invalid on success state', () => {
      render(<Textarea state="success" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).not.toHaveAttribute('aria-invalid');
    });
  });

  describe('Sizes', () => {
    it('applies small size classes', () => {
      render(<Textarea size="sm" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('min-h-20');
      expect(textarea.className).toContain('px-3');
      expect(textarea.className).toContain('text-sm');
    });

    it('applies medium size classes (default)', () => {
      render(<Textarea size="md" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('min-h-32');
      expect(textarea.className).toContain('px-3');
      expect(textarea.className).toContain('text-base');
    });

    it('applies large size classes', () => {
      render(<Textarea size="lg" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('min-h-40');
      expect(textarea.className).toContain('px-4');
      expect(textarea.className).toContain('text-lg');
    });

    it('uses medium size by default', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('min-h-32');
    });
  });

  describe('Full Width', () => {
    it('is full width by default', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('w-full');
    });

    it('applies full width when explicitly true', () => {
      render(<Textarea fullWidth data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('w-full');
    });

    it('does not apply full width when false', () => {
      render(<Textarea fullWidth={false} data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('w-auto');
    });
  });

  describe('Resize Behavior', () => {
    it('is vertically resizable by default', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('resize-y');
    });

    it('applies resize none', () => {
      render(<Textarea resize="none" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('resize-none');
    });

    it('applies resize vertical', () => {
      render(<Textarea resize="vertical" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('resize-y');
    });

    it('applies resize horizontal', () => {
      render(<Textarea resize="horizontal" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('resize-x');
    });

    it('applies resize both', () => {
      render(<Textarea resize="both" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('resize');
      expect(textarea.className).not.toContain('resize-');
    });
  });

  describe('Character Counter', () => {
    it('does not show counter by default', () => {
      render(<Textarea data-testid="textarea" />);
      const counter = screen.queryByText(/\d/);
      expect(counter).not.toBeInTheDocument();
    });

    it('shows character count when showCount is true', () => {
      render(<Textarea showCount defaultValue="Hello" data-testid="textarea" />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('shows character count with max length', () => {
      const { container } = render(
        <Textarea showCount maxLength={100} defaultValue="Hello" data-testid="textarea" />
      );
      const counter = container.querySelector('[aria-live="polite"]');
      expect(counter).toBeInTheDocument();
      expect(counter?.textContent).toContain('5');
      expect(counter?.textContent).toContain('100');
    });

    it('updates character count on input', () => {
      function ControlledTextarea() {
        const [value, setValue] = React.useState('');
        return (
          <Textarea
            showCount
            data-testid="textarea"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        );
      }

      const { container } = render(<ControlledTextarea />);
      const textarea = screen.getByTestId('textarea');
      const counter = container.querySelector('[aria-live="polite"]');

      fireEvent.change(textarea, { target: { value: 'Test' } });
      expect(counter?.textContent).toContain('4');

      fireEvent.change(textarea, { target: { value: 'Testing' } });
      expect(counter?.textContent).toContain('7');
    });

    it('applies error color to counter when in error state', () => {
      const { container } = render(<Textarea showCount state="error" data-testid="textarea" />);
      const counter = container.querySelector('[aria-live="polite"]');
      expect(counter).toBeInTheDocument();
      expect(counter?.className).toContain('text-error');
    });

    it('applies secondary color to counter when not in error state', () => {
      const { container } = render(<Textarea showCount state="default" data-testid="textarea" />);
      const counter = container.querySelector('[aria-live="polite"]');
      expect(counter).toBeInTheDocument();
      expect(counter?.className).toContain('text-foreground-secondary');
    });

    it('counter has aria-live for accessibility', () => {
      const { container } = render(<Textarea showCount data-testid="textarea" />);
      const counter = container.querySelector('[aria-live="polite"]');
      expect(counter).toBeInTheDocument();
    });

    it('counter has aria-atomic for accessibility', () => {
      const { container } = render(<Textarea showCount data-testid="textarea" />);
      const counter = container.querySelector('[aria-atomic="true"]');
      expect(counter).toBeInTheDocument();
    });
  });

  describe('HTML Attributes', () => {
    it('forwards rows attribute', () => {
      render(<Textarea rows={10} data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('rows', '10');
    });

    it('forwards cols attribute', () => {
      render(<Textarea cols={50} data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('cols', '50');
    });

    it('forwards maxLength attribute', () => {
      render(<Textarea maxLength={500} data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('maxLength', '500');
    });

    it('forwards name attribute', () => {
      render(<Textarea name="message" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('name', 'message');
    });

    it('forwards id attribute', () => {
      render(<Textarea id="textarea-id" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('id', 'textarea-id');
    });

    it('forwards required attribute', () => {
      render(<Textarea required data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toBeRequired();
    });

    it('forwards disabled attribute', () => {
      render(<Textarea disabled data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toBeDisabled();
    });

    it('forwards readOnly attribute', () => {
      render(<Textarea readOnly data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('readOnly');
    });

    it('forwards autoFocus attribute', () => {
      render(<Textarea autoFocus data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveFocus();
    });
  });

  describe('ARIA Attributes', () => {
    it('forwards aria-label', () => {
      render(<Textarea aria-label="Message input" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('aria-label', 'Message input');
    });

    it('forwards aria-describedby', () => {
      render(<Textarea aria-describedby="helper-text" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('aria-describedby', 'helper-text');
    });

    it('forwards aria-labelledby', () => {
      render(<Textarea aria-labelledby="label-id" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('aria-labelledby', 'label-id');
    });

    it('forwards aria-required', () => {
      render(<Textarea aria-required="true" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('Event Handlers', () => {
    it('calls onChange when value changes', () => {
      const handleChange = vi.fn();
      render(<Textarea onChange={handleChange} data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');

      fireEvent.change(textarea, { target: { value: 'New text' } });
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('calls onFocus when focused', () => {
      const handleFocus = vi.fn();
      render(<Textarea onFocus={handleFocus} data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');

      fireEvent.focus(textarea);
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('calls onBlur when blurred', () => {
      const handleBlur = vi.fn();
      render(<Textarea onBlur={handleBlur} data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');

      fireEvent.focus(textarea);
      fireEvent.blur(textarea);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('calls onKeyDown when key is pressed', () => {
      const handleKeyDown = vi.fn();
      render(<Textarea onKeyDown={handleKeyDown} data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');

      fireEvent.keyDown(textarea, { key: 'Enter' });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
    });

    it('calls onKeyUp when key is released', () => {
      const handleKeyUp = vi.fn();
      render(<Textarea onKeyUp={handleKeyUp} data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');

      fireEvent.keyUp(textarea, { key: 'Enter' });
      expect(handleKeyUp).toHaveBeenCalledTimes(1);
    });
  });

  describe('Custom className', () => {
    it('merges custom className with default classes', () => {
      render(<Textarea className="custom-class" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('custom-class');
      expect(textarea.className).toContain('rounded-md');
      expect(textarea.className).toContain('border');
    });

    it('allows overriding default classes', () => {
      render(<Textarea className="border-red-500" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('border-red-500');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to textarea element', () => {
      let ref: HTMLTextAreaElement | null = null;
      render(
        <Textarea
          ref={(el) => {
            ref = el;
          }}
        />
      );
      expect(ref).toBeInstanceOf(HTMLTextAreaElement);
      expect(ref!.tagName).toBe('TEXTAREA');
    });

    it('allows programmatic focus via ref', () => {
      let ref: HTMLTextAreaElement | null = null;
      render(
        <Textarea
          data-testid="textarea"
          ref={(el) => {
            ref = el;
          }}
        />
      );
      const textarea = screen.getByTestId('textarea');
      expect(textarea).not.toHaveFocus();

      ref!.focus();
      expect(textarea).toHaveFocus();
    });

    it('allows reading value via ref', () => {
      let ref: HTMLTextAreaElement | null = null;
      render(
        <Textarea
          defaultValue="Test value"
          ref={(el) => {
            ref = el;
          }}
        />
      );
      expect(ref!.value).toBe('Test value');
    });
  });

  describe('Base Classes', () => {
    it('always includes base layout classes', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('flex');
      expect(textarea.className).toContain('w-full');
    });

    it('always includes typography classes', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('font-sans');
    });

    it('always includes border and radius classes', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('rounded-md');
      expect(textarea.className).toContain('border');
    });

    it('always includes background color class', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('bg-surface');
    });

    it('always includes transition classes', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('transition-base');
    });

    it('always includes focus ring classes', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('focus-ring');
    });

    it('always includes placeholder styling', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('placeholder:text-foreground-tertiary');
    });

    it('always includes disabled state classes', () => {
      render(<Textarea data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('disabled:cursor-not-allowed');
      expect(textarea.className).toContain('disabled:opacity-50');
    });
  });

  describe('Compound Scenarios', () => {
    it('works with error state and small size', () => {
      render(<Textarea state="error" size="sm" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('border-error');
      expect(textarea.className).toContain('min-h-20');
      expect(textarea.className).toContain('text-sm');
    });

    it('works with success state and large size', () => {
      render(<Textarea state="success" size="lg" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('border-success');
      expect(textarea.className).toContain('min-h-40');
      expect(textarea.className).toContain('text-lg');
    });

    it('works with character counter and error state', () => {
      const { container } = render(
        <Textarea
          showCount
          state="error"
          maxLength={100}
          defaultValue="Error text"
          data-testid="textarea"
        />
      );
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('border-error');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');

      const counter = container.querySelector('[aria-live="polite"]');
      expect(counter).toBeInTheDocument();
      expect(counter?.className).toContain('text-error');
      expect(counter?.textContent).toContain('10');
      expect(counter?.textContent).toContain('100');
    });

    it('works with resize none and full width', () => {
      render(<Textarea resize="none" fullWidth data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea');
      expect(textarea.className).toContain('resize-none');
      expect(textarea.className).toContain('w-full');
    });

    it('works with all props combined', () => {
      const handleChange = vi.fn();
      render(
        <Textarea
          state="success"
          size="lg"
          resize="vertical"
          showCount
          maxLength={500}
          placeholder="Enter your message"
          required
          onChange={handleChange}
          data-testid="textarea"
        />
      );
      const textarea = screen.getByTestId('textarea');

      expect(textarea.className).toContain('border-success');
      expect(textarea.className).toContain('min-h-40');
      expect(textarea.className).toContain('resize-y');
      expect(textarea).toHaveAttribute('placeholder', 'Enter your message');
      expect(textarea).toBeRequired();
      expect(textarea).toHaveAttribute('maxLength', '500');

      const { container } = render(
        <Textarea showCount maxLength={500} data-testid="counter-check" />
      );
      const counter = container.querySelector('[aria-live="polite"]');
      expect(counter).toBeInTheDocument();
      expect(counter?.textContent).toContain('0');
      expect(counter?.textContent).toContain('500');

      fireEvent.change(textarea, { target: { value: 'Test' } });
      expect(handleChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Controlled vs Uncontrolled', () => {
    it('works as uncontrolled component with defaultValue', () => {
      render(<Textarea defaultValue="Initial" data-testid="textarea" />);
      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Initial');

      fireEvent.change(textarea, { target: { value: 'Updated' } });
      expect(textarea.value).toBe('Updated');
    });

    it('works as controlled component with value prop', () => {
      const { rerender } = render(
        <Textarea value="Controlled" onChange={() => {}} data-testid="textarea" />
      );
      const textarea = screen.getByTestId('textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Controlled');

      rerender(<Textarea value="Updated" onChange={() => {}} data-testid="textarea" />);
      expect(textarea.value).toBe('Updated');
    });
  });
});
