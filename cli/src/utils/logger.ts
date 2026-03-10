/* ── Styled terminal logger — stdout for data, stderr for diagnostics ── */

import chalk from 'chalk';

/** Machine-readable / success output → stdout */
export function info(msg: string): void {
  process.stdout.write(`${msg}\n`);
}

export function success(msg: string): void {
  process.stdout.write(`${chalk.green('✓')} ${msg}\n`);
}

export function json(data: unknown): void {
  process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}

/** Diagnostics / errors → stderr */
export function warn(msg: string): void {
  process.stderr.write(`${chalk.yellow('⚠')} ${msg}\n`);
}

export function error(msg: string): void {
  process.stderr.write(`${chalk.red('✖')} ${msg}\n`);
}

export function dim(msg: string): void {
  process.stderr.write(`${chalk.dim(msg)}\n`);
}

/** Validation result helpers */
export function validationPass(filePath: string): void {
  process.stdout.write(`${chalk.green('PASS')} ${filePath}\n`);
}

export function validationFail(filePath: string): void {
  process.stderr.write(`${chalk.red('FAIL')} ${filePath}\n`);
}

export function validationError(path: string, message: string): void {
  process.stderr.write(`  ${chalk.dim('→')} ${chalk.cyan(path)} ${message}\n`);
}
