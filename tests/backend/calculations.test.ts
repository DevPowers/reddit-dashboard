import { describe, it, expect } from 'vitest';
import {
	getQuarterEndBaseline,
	calculateSubVelocity,
	normalizeVelocityScore,
	findClosestToDate,
} from '../../src/lib/calculations';

describe('Calculations Utilities', () => {
	describe('getQuarterEndBaseline', () => {
		it('should return March 31 for dates in Q2 (April - June)', () => {
			const today = new Date('2026-05-15T12:00:00Z');
			const baseline = getQuarterEndBaseline(today);
			expect(baseline.toISOString()).toBe('2026-03-31T00:00:00.000Z');
		});

		it('should return June 30 for dates in Q3 (July - Sept)', () => {
			const today = new Date('2026-08-10T12:00:00Z');
			const baseline = getQuarterEndBaseline(today);
			expect(baseline.toISOString()).toBe('2026-06-30T00:00:00.000Z');
		});

		it('should return Sept 30 for dates in Q4 (Oct - Dec)', () => {
			const today = new Date('2026-11-20T12:00:00Z');
			const baseline = getQuarterEndBaseline(today);
			expect(baseline.toISOString()).toBe('2026-09-30T00:00:00.000Z');
		});

		it('should return Dec 31 of previous year for dates in Q1 (Jan - Mar)', () => {
			const today = new Date('2026-02-14T12:00:00Z');
			const baseline = getQuarterEndBaseline(today);
			expect(baseline.toISOString()).toBe('2025-12-31T00:00:00.000Z');
		});
	});

	describe('calculateSubVelocity', () => {
		it('should calculate percentage-based velocity correctly', () => {
			const current = 110;
			const baseline = 100;
			const arpuMult = 2.0;
			const monWeight = 3.0;
			
			// Growth = 10% -> 0.1 * 2.0 * 3.0 = 0.6
			const result = calculateSubVelocity(current, baseline, arpuMult, monWeight);
			expect(result).toBeCloseTo(0.6);
		});

		it('should return 0 if baseline is 0 or negative', () => {
			const result = calculateSubVelocity(100, 0, 1.0, 1.0);
			expect(result).toBe(0);
		});

		it('should handle negative growth', () => {
			const result = calculateSubVelocity(90, 100, 1.0, 1.0);
			expect(result).toBeCloseTo(-0.1);
		});
	});

	describe('normalizeVelocityScore', () => {
		it('should scale average velocity by 10', () => {
			// Total = 2.0, count = 4 -> Avg = 0.5 -> Scaled = 5.0
			const result = normalizeVelocityScore(2.0, 4);
			expect(result).toBe(5.0);
		});

		it('should clamp scores to a maximum of 10', () => {
			// Avg = 2.0 -> Scaled = 20 -> Clamped = 10
			const result = normalizeVelocityScore(8.0, 4);
			expect(result).toBe(10);
		});

		it('should clamp scores to a minimum of -10', () => {
			// Avg = -2.0 -> Scaled = -20 -> Clamped = -10
			const result = normalizeVelocityScore(-8.0, 4);
			expect(result).toBe(-10);
		});

		it('should return 0 if contributor count is 0', () => {
			expect(normalizeVelocityScore(10, 0)).toBe(0);
		});
	});

	describe('findClosestToDate', () => {
		const history = [
			{ recordedAt: new Date('2026-05-01T00:00:00Z'), id: 1 },
			{ recordedAt: new Date('2026-05-10T00:00:00Z'), id: 2 },
			{ recordedAt: new Date('2026-05-20T00:00:00Z'), id: 3 },
		];

		it('should find the exact match', () => {
			const target = new Date('2026-05-10T00:00:00Z');
			const match = findClosestToDate(history, target);
			expect(match?.id).toBe(2);
		});

		it('should find the closest prior date if exactly between or near', () => {
			const target = new Date('2026-05-09T00:00:00Z');
			const match = findClosestToDate(history, target);
			expect(match?.id).toBe(2); // 1 day diff vs 8 days diff to the 1st
		});

		it('should return undefined for empty history', () => {
			expect(findClosestToDate([], new Date())).toBeUndefined();
		});
	});
});
