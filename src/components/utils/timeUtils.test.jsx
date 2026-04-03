import { describe, it, expect } from 'vitest';
import { calculateDurationHours, calculateEarnings, formatDate } from './timeUtils';

describe('timeUtils', () => {
  it('should calculate duration correctly for same day', () => {
    expect(calculateDurationHours('08:00', '16:30')).toBe(8.5);
    expect(calculateDurationHours('09:00', '10:00')).toBe(1);
  });

  it('should calculate duration correctly for night shifts', () => {
    expect(calculateDurationHours('22:00', '06:00')).toBe(8);
    expect(calculateDurationHours('23:30', '01:30')).toBe(2);
  });

  it('should calculate earnings correctly', () => {
    expect(calculateEarnings(8, 200)).toBe(1600);
    expect(calculateEarnings(7.5, 150)).toBe(1125);
  });

  it('should format date correctly', () => {
    expect(formatDate('2025-03-15')).toBe('15.03.2025');
    expect(formatDate('')).toBe('');
  });
});
