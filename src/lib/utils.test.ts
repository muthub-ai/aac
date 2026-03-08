import { cn } from './utils';

describe('cn', () => {
  it('passes through a single class string', () => {
    expect(cn('px-4')).toBe('px-4');
  });

  it('merges multiple class strings', () => {
    expect(cn('font-bold', 'text-red-500')).toBe('font-bold text-red-500');
  });

  it('filters falsy values in conditional classes', () => {
    expect(cn('base', false && 'hidden', null, undefined, 'end')).toBe('base end');
  });

  it('resolves Tailwind conflicts by keeping the last value', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });

  it('supports object syntax', () => {
    expect(cn({ 'bg-red-500': true, 'bg-blue-500': false })).toBe('bg-red-500');
    expect(cn({ 'font-bold': true, 'italic': true })).toBe('font-bold italic');
    expect(cn({ hidden: false, block: false })).toBe('');
  });

  it('supports array syntax', () => {
    expect(cn(['px-2', 'py-3'])).toBe('px-2 py-3');
    expect(cn(['px-2'], ['py-3'])).toBe('px-2 py-3');
  });

  it('returns an empty string for no input', () => {
    expect(cn()).toBe('');
  });

  it('filters undefined, null, and false values', () => {
    expect(cn(undefined)).toBe('');
    expect(cn(null)).toBe('');
    expect(cn(false)).toBe('');
    expect(cn(undefined, null, false, 'visible')).toBe('visible');
  });
});
