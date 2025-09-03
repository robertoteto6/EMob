import { debounce, formatNumber, cn, apiCache, throttle, prefersReducedMotion } from '../utils';

// Note: formatDate involves locale/timezone; skip for simplicity.

describe('formatNumber', () => {
  it('formats millions and thousands correctly', () => {
    expect(formatNumber(1_500_000)).toBe('1.5M');
    expect(formatNumber(1_500)).toBe('1.5K');
    expect(formatNumber(500)).toBe('500');
  });

  it('formats whole millions and thousands without trailing .0', () => {
    expect(formatNumber(1_000_000)).toBe('1M');
    expect(formatNumber(2_000)).toBe('2K');
  });
});

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', undefined, 'b', false, 'c')).toBe('a b c');
  });
});

describe('apiCache', () => {
  beforeEach(() => {
    apiCache.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('stores and expires values based on TTL', () => {
    apiCache.set('key', 'value');
    expect(apiCache.get('key')).toBe('value');
    jest.advanceTimersByTime(5 * 60 * 1000 + 1);
    expect(apiCache.get('key')).toBeNull();
  });
});

describe('debounce', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('delays function execution', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 1000);
    debounced();
    debounced();
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('throttle', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('limits function execution frequency', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 1000);
    throttled();
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(500);
    throttled();
    expect(fn).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(500);
    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('prefersReducedMotion', () => {
  it('returns false on server side', () => {
    expect(prefersReducedMotion()).toBe(false);
  });
});
