import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormField } from './FormField';

describe('FormField', () => {
  describe('Rendering', () => {
    it('should render children', () => {
      render(
        <FormField>
          <input data-testid="test-input" />
        </FormField>
      );
      expect(screen.getByTestId('test-input')).toBeInTheDocument();
    });

    it('should render without label', () => {
      const { container } = render(
        <FormField>
          <input />
        </FormField>
      );
      expect(container.querySelector('label')).not.toBeInTheDocument();
    });

    it('should render with label', () => {
      render(
        <FormField label="Username">
          <input />
        </FormField>
      );
      expect(screen.getByText('Username')).toBeInTheDocument();
    });
  });

  describe('Label', () => {
    it('should associate label with control via htmlFor', () => {
      render(
        <FormField label="Email" htmlFor="email-input">
          <input id="email-input" />
        </FormField>
      );
      const label = screen.getByText('Email');
      expect(label).toHaveAttribute('for', 'email-input');
    });

    it('should show required indicator when required', () => {
      render(
        <FormField label="Password" required>
          <input />
        </FormField>
      );
      const required = screen.getByLabelText('required');
      expect(required).toBeInTheDocument();
      expect(required).toHaveTextContent('*');
    });

    it('should not show required indicator by default', () => {
      render(
        <FormField label="Username">
          <input />
        </FormField>
      );
      expect(screen.queryByLabelText('required')).not.toBeInTheDocument();
    });

    it('should apply default state color to label', () => {
      render(
        <FormField label="Name" state="default">
          <input />
        </FormField>
      );
      expect(screen.getByText('Name')).toHaveClass('text-foreground');
    });

    it('should apply error state color to label', () => {
      render(
        <FormField label="Email" state="error">
          <input />
        </FormField>
      );
      expect(screen.getByText('Email')).toHaveClass('text-error');
    });

    it('should apply success state color to label', () => {
      render(
        <FormField label="Username" state="success">
          <input />
        </FormField>
      );
      expect(screen.getByText('Username')).toHaveClass('text-success');
    });

    it('should apply disabled styling to label when disabled', () => {
      render(
        <FormField label="Disabled field" disabled>
          <input />
        </FormField>
      );
      expect(screen.getByText('Disabled field')).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Helper Text', () => {
    it('should not show helper text by default', () => {
      render(
        <FormField label="Username">
          <input />
        </FormField>
      );
      const container = screen.getByText('Username').closest('div');
      expect(container?.querySelector('[id*="description"]')).not.toBeInTheDocument();
    });

    it('should show helper text when provided', () => {
      render(
        <FormField label="Email" helperText="We'll never share your email">
          <input />
        </FormField>
      );
      expect(screen.getByText("We'll never share your email")).toBeInTheDocument();
    });

    it('should generate ID for helper text', () => {
      render(
        <FormField label="Email" htmlFor="email" helperText="Enter your email">
          <input id="email" />
        </FormField>
      );
      const helperText = screen.getByText('Enter your email');
      expect(helperText).toHaveAttribute('id', 'email-description');
    });

    it('should apply default styling to helper text', () => {
      render(
        <FormField helperText="Helper text">
          <input />
        </FormField>
      );
      const helper = screen.getByText('Helper text');
      expect(helper).toHaveClass('text-foreground-secondary');
    });

    it('should apply success color to helper text when state is success', () => {
      render(
        <FormField state="success" helperText="Looks good!">
          <input />
        </FormField>
      );
      expect(screen.getByText('Looks good!')).toHaveClass('text-success');
    });
  });

  describe('Error Message', () => {
    it('should not show error message by default', () => {
      const { container } = render(
        <FormField label="Username">
          <input />
        </FormField>
      );
      expect(container.querySelector('[role="alert"]')).not.toBeInTheDocument();
    });

    it('should show error message when provided', () => {
      render(
        <FormField label="Email" error="Invalid email address">
          <input />
        </FormField>
      );
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });

    it('should have role="alert" for accessibility', () => {
      render(
        <FormField error="Error message">
          <input />
        </FormField>
      );
      const error = screen.getByText('Error message');
      expect(error).toHaveAttribute('role', 'alert');
    });

    it('should have aria-live="polite"', () => {
      render(
        <FormField error="Error message">
          <input />
        </FormField>
      );
      const error = screen.getByText('Error message');
      expect(error).toHaveAttribute('aria-live', 'polite');
    });

    it('should hide helper text when error is present', () => {
      render(
        <FormField helperText="This is helper text" error="This is an error">
          <input />
        </FormField>
      );
      expect(screen.getByText('This is an error')).toBeInTheDocument();
      expect(screen.queryByText('This is helper text')).not.toBeInTheDocument();
    });

    it('should override state to error when error is present', () => {
      render(
        <FormField label="Field" state="success" error="Error occurred">
          <input />
        </FormField>
      );
      const label = screen.getByText('Field');
      expect(label).toHaveClass('text-error');
    });

    it('should generate ID for error message', () => {
      render(
        <FormField htmlFor="test" error="Error message">
          <input id="test" />
        </FormField>
      );
      const error = screen.getByText('Error message');
      expect(error).toHaveAttribute('id', 'test-description');
    });
  });

  describe('Orientation', () => {
    it('should use vertical orientation by default', () => {
      const { container } = render(
        <FormField label="Label">
          <input />
        </FormField>
      );
      const wrapper = container.querySelector('div');
      expect(wrapper).toHaveClass('flex-col');
    });

    it('should apply vertical orientation classes', () => {
      const { container } = render(
        <FormField label="Label" orientation="vertical">
          <input />
        </FormField>
      );
      const wrapper = container.querySelector('div');
      expect(wrapper).toHaveClass('flex-col');
      expect(wrapper).not.toHaveClass('flex-row');
    });

    it('should apply horizontal orientation classes', () => {
      const { container } = render(
        <FormField label="Label" orientation="horizontal">
          <input />
        </FormField>
      );
      const wrapper = container.querySelector('div');
      expect(wrapper).toHaveClass('flex-row', 'items-center', 'gap-4');
    });
  });

  describe('Disabled State', () => {
    it('should not be disabled by default', () => {
      const { container } = render(
        <FormField>
          <input />
        </FormField>
      );
      const wrapper = container.querySelector('div');
      expect(wrapper).not.toHaveClass('opacity-60');
    });

    it('should apply disabled classes when disabled', () => {
      const { container } = render(
        <FormField disabled>
          <input />
        </FormField>
      );
      const wrapper = container.querySelector('div');
      expect(wrapper).toHaveClass('opacity-60', 'cursor-not-allowed');
    });

    it('should apply disabled styling to label', () => {
      render(
        <FormField label="Disabled" disabled>
          <input />
        </FormField>
      );
      expect(screen.getByText('Disabled')).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Custom className', () => {
    it('should merge custom className with default classes', () => {
      const { container } = render(
        <FormField className="custom-field-class">
          <input />
        </FormField>
      );
      const wrapper = container.querySelector('div');
      expect(wrapper).toHaveClass('custom-field-class');
      expect(wrapper).toHaveClass('flex');
    });
  });

  describe('HTML Attributes', () => {
    it('should support data attributes', () => {
      const { container } = render(
        <FormField data-testid="form-field">
          <input />
        </FormField>
      );
      expect(container.querySelector('[data-testid="form-field"]')).toBeInTheDocument();
    });

    it('should pass through other div props', () => {
      const { container } = render(
        <FormField id="my-form-field">
          <input />
        </FormField>
      );
      const wrapper = container.querySelector('#my-form-field');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Composition', () => {
    it('should work with any form control as children', () => {
      render(
        <FormField label="Options">
          <select>
            <option>Option 1</option>
            <option>Option 2</option>
          </select>
        </FormField>
      );
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should work with multiple children', () => {
      render(
        <FormField label="Multi">
          <div>
            <input type="text" data-testid="input1" />
            <input type="text" data-testid="input2" />
          </div>
        </FormField>
      );
      expect(screen.getByTestId('input1')).toBeInTheDocument();
      expect(screen.getByTestId('input2')).toBeInTheDocument();
    });
  });

  describe('Compound Scenarios', () => {
    it('should work with all props combined', () => {
      render(
        <FormField
          label="Email Address"
          htmlFor="email"
          required
          error="Email is required"
          helperText="This helper text should be hidden"
          state="error"
          disabled={false}
          orientation="vertical"
          className="custom-class"
        >
          <input id="email" type="email" />
        </FormField>
      );

      expect(screen.getByText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.queryByText('This helper text should be hidden')).not.toBeInTheDocument();
    });

    it('should work with horizontal layout and helper text', () => {
      render(
        <FormField
          label="Subscribe"
          htmlFor="subscribe"
          helperText="Receive weekly updates"
          orientation="horizontal"
        >
          <input type="checkbox" id="subscribe" />
        </FormField>
      );

      expect(screen.getByText('Subscribe')).toBeInTheDocument();
      expect(screen.getByText('Receive weekly updates')).toBeInTheDocument();
    });

    it('should work with success state and helper text', () => {
      render(
        <FormField label="Username" state="success" helperText="Username is available!">
          <input />
        </FormField>
      );

      const label = screen.getByText('Username');
      const helper = screen.getByText('Username is available!');

      expect(label).toHaveClass('text-success');
      expect(helper).toHaveClass('text-success');
    });

    it('should work with disabled state and all features', () => {
      render(
        <FormField
          label="Disabled Field"
          htmlFor="disabled"
          required
          helperText="This field is disabled"
          disabled
        >
          <input id="disabled" disabled />
        </FormField>
      );

      expect(screen.getByText('Disabled Field')).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Accessibility', () => {
    it('should associate helper text with control via aria-describedby', () => {
      render(
        <FormField htmlFor="test" helperText="Helper text">
          <input id="test" aria-describedby="test-description" />
        </FormField>
      );

      const helper = screen.getByText('Helper text');
      expect(helper).toHaveAttribute('id', 'test-description');
    });

    it('should associate error with control via aria-describedby', () => {
      render(
        <FormField htmlFor="test" error="Error message">
          <input id="test" aria-describedby="test-description" />
        </FormField>
      );

      const error = screen.getByText('Error message');
      expect(error).toHaveAttribute('id', 'test-description');
    });

    it('should have proper label association', () => {
      render(
        <FormField label="Username" htmlFor="username-input">
          <input id="username-input" />
        </FormField>
      );

      const label = screen.getByText('Username');
      const input = screen.getByRole('textbox');

      expect(label).toHaveAttribute('for', 'username-input');
      expect(input).toHaveAttribute('id', 'username-input');
    });
  });
});
