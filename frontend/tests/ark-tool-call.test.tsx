import {describe, it, expect} from 'vitest';
import React from 'react';
import {render, screen, fireEvent} from '@testing-library/react';
import {ArkToolCall} from '../src/components/ark/ark-tool-call';

describe('ArkToolCall', () => {
  it('renders pending state with name and badge', () => {
    render(<ArkToolCall name="search" status="pending" />);
    expect(screen.getByText('search')).toBeTruthy();
    expect(screen.getByText('Pending')).toBeTruthy();
    expect(screen.getByText('⏳')).toBeTruthy();
  });

  it('renders working state with spinner icon', () => {
    render(<ArkToolCall name="fetch_data" status="working" />);
    expect(screen.getByText('fetch_data')).toBeTruthy();
    expect(screen.getByText('Working')).toBeTruthy();
    expect(screen.getByText('⚙️')).toBeTruthy();
  });

  it('renders completed state with result', () => {
    render(
      <ArkToolCall
        name="calculate"
        status="completed"
        result={{answer: 42}}
        durationMs={150}
      />
    );
    expect(screen.getByText('calculate')).toBeTruthy();
    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.getByText('✓')).toBeTruthy();
    expect(screen.getByText('150ms')).toBeTruthy();
  });

  it('renders failed state with error details expanded', () => {
    render(
      <ArkToolCall
        name="broken_tool"
        status="failed"
        error={{code: 'TIMEOUT', message: 'Request timed out'}}
      />
    );
    expect(screen.getByText('broken_tool')).toBeTruthy();
    expect(screen.getByText('Failed')).toBeTruthy();
    // Failed state auto-expands
    expect(screen.getByText('TIMEOUT:')).toBeTruthy();
    expect(screen.getByText('Request timed out')).toBeTruthy();
  });

  it('shows arguments when expanded', () => {
    render(
      <ArkToolCall
        name="search"
        status="pending"
        arguments_={{query: 'hello', limit: 10}}
      />
    );
    // Click to expand
    fireEvent.click(screen.getByText('search'));
    expect(screen.getByText('Arguments')).toBeTruthy();
    expect(screen.getByText(/"query": "hello"/)).toBeTruthy();
  });

  it('shows completed result when expanded', () => {
    render(
      <ArkToolCall
        name="calculate"
        status="completed"
        result="The answer is 42"
      />
    );
    // Click to expand
    fireEvent.click(screen.getByText('calculate'));
    expect(screen.getByText('Result')).toBeTruthy();
    expect(screen.getByText('The answer is 42')).toBeTruthy();
  });

  it('toggles collapse on click', () => {
    render(<ArkToolCall name="test" status="pending" arguments_={{a: 1}} />);
    // Initially collapsed for non-failed
    expect(screen.queryByText('Arguments')).toBeNull();
    // Expand
    fireEvent.click(screen.getByText('test'));
    expect(screen.getByText('Arguments')).toBeTruthy();
    // Collapse
    fireEvent.click(screen.getByText('test'));
    expect(screen.queryByText('Arguments')).toBeNull();
  });
});
