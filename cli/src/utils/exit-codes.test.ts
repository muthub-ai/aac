import { EXIT_SUCCESS, EXIT_SYSTEM_ERROR, EXIT_VALIDATION_FAILED } from './exit-codes';

describe('exit-codes', () => {
  it('1 - EXIT_SUCCESS is 0', () => {
    expect(EXIT_SUCCESS).toBe(0);
  });

  it('2 - EXIT_SYSTEM_ERROR is 1', () => {
    expect(EXIT_SYSTEM_ERROR).toBe(1);
  });

  it('3 - EXIT_VALIDATION_FAILED is 2', () => {
    expect(EXIT_VALIDATION_FAILED).toBe(2);
  });
});
