import { describe, it, expect, vi } from 'vitest';
import { assertAdmin } from './authUtils';
import useAppStore from '@/store/appStore';

// Mock useAppStore
vi.mock('@/store/appStore', () => ({
	default: {
		getState: vi.fn()
	}
}));

describe('authUtils', () => {
	describe('assertAdmin', () => {
		it('does not throw when user is an admin', () => {
			vi.mocked(useAppStore.getState).mockReturnValue({
				user: { isAdmin: true }
			} as any);

			expect(() => assertAdmin()).not.toThrow();
		});

		it('throws an error when user is not an admin', () => {
			vi.mocked(useAppStore.getState).mockReturnValue({
				user: { isAdmin: false }
			} as any);

			expect(() => assertAdmin()).toThrow('Admin privileges required');
		});

		it('throws an error when user is null/undefined', () => {
			vi.mocked(useAppStore.getState).mockReturnValue({
				user: null
			} as any);

			expect(() => assertAdmin()).toThrow('Admin privileges required');
		});

		it('throws an error with custom message', () => {
			vi.mocked(useAppStore.getState).mockReturnValue({
				user: null
			} as any);

			expect(() => assertAdmin('Custom error message')).toThrow('Custom error message');
		});
	});
});
