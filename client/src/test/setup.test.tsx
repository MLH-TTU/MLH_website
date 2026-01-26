import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider } from '../types';

// Simple component for testing
const TestComponent = () => <div>Test Component</div>;

describe('Project Setup', () => {
  it('should render components', () => {
    render(<TestComponent />);
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('should have proper types', () => {
    expect(AuthProvider.GOOGLE).toBe('GOOGLE');
  });
});