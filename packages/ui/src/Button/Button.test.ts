import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';
import { createElement } from 'react';

describe('Button', () => {
  it('renders with default variant', () => {
    render(createElement(Button, { children: 'Click me' }));
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('applies variant classes', () => {
    render(createElement(Button, { variant: 'destructive', children: 'Delete' }));
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-destructive');
  });

  it('applies size classes', () => {
    render(createElement(Button, { size: 'lg', children: 'Large' }));
    const button = screen.getByRole('button');
    expect(button.className).toContain('h-11');
  });
});
