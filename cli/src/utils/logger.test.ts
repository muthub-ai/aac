import * as logger from './logger';

describe('logger', () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    stderrSpy = vi.spyOn(process.stderr, 'write').mockReturnValue(true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  it('1 - info writes to stdout', () => {
    logger.info('hello');
    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    const output = stdoutSpy.mock.calls[0][0] as string;
    expect(output).toContain('hello');
    expect(output).toMatch(/\n$/);
  });

  it('2 - success writes to stdout with checkmark', () => {
    logger.success('done');
    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    const output = stdoutSpy.mock.calls[0][0] as string;
    expect(output).toContain('done');
  });

  it('3 - json writes formatted JSON to stdout', () => {
    logger.json({ key: 'value' });
    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    const output = stdoutSpy.mock.calls[0][0] as string;
    expect(JSON.parse(output)).toEqual({ key: 'value' });
  });

  it('4 - warn writes to stderr', () => {
    logger.warn('careful');
    expect(stderrSpy).toHaveBeenCalledTimes(1);
    const output = stderrSpy.mock.calls[0][0] as string;
    expect(output).toContain('careful');
  });

  it('5 - error writes to stderr', () => {
    logger.error('failed');
    expect(stderrSpy).toHaveBeenCalledTimes(1);
    const output = stderrSpy.mock.calls[0][0] as string;
    expect(output).toContain('failed');
  });

  it('6 - dim writes to stderr', () => {
    logger.dim('subtle');
    expect(stderrSpy).toHaveBeenCalledTimes(1);
    const output = stderrSpy.mock.calls[0][0] as string;
    expect(output).toContain('subtle');
  });

  it('7 - validationPass writes to stdout', () => {
    logger.validationPass('model/sys.yaml');
    expect(stdoutSpy).toHaveBeenCalledTimes(1);
    const output = stdoutSpy.mock.calls[0][0] as string;
    expect(output).toContain('model/sys.yaml');
  });

  it('8 - validationFail writes to stderr', () => {
    logger.validationFail('model/bad.yaml');
    expect(stderrSpy).toHaveBeenCalledTimes(1);
    const output = stderrSpy.mock.calls[0][0] as string;
    expect(output).toContain('model/bad.yaml');
  });

  it('9 - validationError writes indented error to stderr', () => {
    logger.validationError('/name', 'must be string');
    expect(stderrSpy).toHaveBeenCalledTimes(1);
    const output = stderrSpy.mock.calls[0][0] as string;
    expect(output).toContain('/name');
    expect(output).toContain('must be string');
  });
});
