import { describe, expect, it } from 'vitest';
import { gainFor } from './synth';

// Audio output itself is checked in e2e (AudioContext is not available in the node test environment).
describe('gainFor', () => {
  it('raises the peak gain with each volume step', () => {
    expect(gainFor('low')).toBeGreaterThan(0);
    expect(gainFor('medium')).toBeGreaterThan(gainFor('low'));
    expect(gainFor('high')).toBeGreaterThan(gainFor('medium'));
  });

  it('never exceeds a gentle ceiling', () => {
    expect(gainFor('high')).toBeLessThanOrEqual(0.25);
  });
});
