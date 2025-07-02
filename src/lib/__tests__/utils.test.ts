import { cn } from '../utils';

describe('Utility Functions', () => {
  describe('cn (class names utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('px-4', 'py-2', 'bg-blue-500');
      expect(result).toBe('px-4 py-2 bg-blue-500');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const isDisabled = false;

      const result = cn(
        'base-class',
        isActive && 'active-class',
        isDisabled && 'disabled-class'
      );

      expect(result).toBe('base-class active-class');
    });

    it('should handle array of classes', () => {
      const result = cn(['px-4', 'py-2'], 'bg-blue-500');
      expect(result).toBe('px-4 py-2 bg-blue-500');
    });

    it('should handle object with boolean values', () => {
      const result = cn({
        'px-4': true,
        'py-2': true,
        'bg-blue-500': false,
        'text-white': true,
      });

      expect(result).toBe('px-4 py-2 text-white');
    });

    it('should handle mixed types', () => {
      const result = cn(
        'base-class',
        ['array-class-1', 'array-class-2'],
        {
          'object-class-1': true,
          'object-class-2': false,
        },
        null,
        undefined,
        'final-class'
      );

      expect(result).toBe(
        'base-class array-class-1 array-class-2 object-class-1 final-class'
      );
    });

    it('should handle empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle null and undefined values', () => {
      const result = cn('valid-class', null, undefined, 'another-valid-class');
      expect(result).toBe('valid-class another-valid-class');
    });

    it('should deduplicate classes', () => {
      const result = cn('px-4', 'py-2', 'px-4', 'bg-blue-500', 'py-2');
      // Class order may vary, just check that duplicates are removed
      expect(result.split(' ')).toHaveLength(3);
      expect(result).toContain('px-4');
      expect(result).toContain('py-2');
      expect(result).toContain('bg-blue-500');
    });

    it('should handle Tailwind CSS conflicts (later classes override earlier ones)', () => {
      const result = cn('px-2', 'px-4', 'py-1', 'py-3');
      expect(result).toBe('px-4 py-3');
    });

    it('should work with complex Tailwind classes', () => {
      const result = cn(
        'flex items-center justify-between',
        'px-4 py-2',
        'bg-white hover:bg-gray-50',
        'border border-gray-200 rounded-md',
        'text-sm font-medium text-gray-900'
      );

      expect(result).toContain('flex');
      expect(result).toContain('items-center');
      expect(result).toContain('justify-between');
      expect(result).toContain('px-4');
      expect(result).toContain('py-2');
      expect(result).toContain('bg-white');
      expect(result).toContain('hover:bg-gray-50');
    });

    it('should handle responsive and state variants', () => {
      const result = cn(
        'text-base md:text-lg lg:text-xl',
        'hover:bg-blue-500 focus:bg-blue-600',
        'dark:bg-gray-800 dark:text-white'
      );

      expect(result).toContain('text-base');
      expect(result).toContain('md:text-lg');
      expect(result).toContain('lg:text-xl');
      expect(result).toContain('hover:bg-blue-500');
      expect(result).toContain('focus:bg-blue-600');
      expect(result).toContain('dark:bg-gray-800');
      expect(result).toContain('dark:text-white');
    });
  });
});
