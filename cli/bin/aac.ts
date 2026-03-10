#!/usr/bin/env npx tsx
/* ── aac — Architecture as Code CLI ─────────────────────────── */

import { Command } from 'commander';
import { runInit } from '../src/commands/init.js';
import { runCreate, CREATE_TYPES } from '../src/commands/create.js';
import { runValidate } from '../src/commands/validate.js';
import { VALID_TYPES } from '../src/schema-manager.js';

const program = new Command();

program
  .name('aac')
  .description('Architecture as Code — validate, scaffold, and manage architecture artifacts')
  .version('1.0.0');

/* ── aac init ─────────────────────────────────────────────────── */

program
  .command('init')
  .description('Initialize a new AaC project with config and standard directories')
  .action(() => {
    runInit();
  });

/* ── aac create <type> [name] ─────────────────────────────────── */

program
  .command('create <type> [name]')
  .description(`Scaffold a boilerplate YAML artifact (types: ${CREATE_TYPES.join(', ')})`)
  .action((type: string, name?: string) => {
    runCreate(type, name);
  });

/* ── aac validate <filepath> ──────────────────────────────────── */

program
  .command('validate <filepath>')
  .description('Validate architecture artifacts against live JSON schemas')
  .option('-t, --type <type>', `Schema type (${VALID_TYPES.join(', ')})`)
  .option('-o, --output <format>', 'Output format: json for machine-readable')
  .option('-f, --force-refresh', 'Bypass ETag cache and force schema download')
  .action(async (filepath: string, opts: { type?: string; output?: string; forceRefresh?: boolean }) => {
    await runValidate(filepath, {
      type: opts.type ?? '',
      output: opts.output,
      forceRefresh: opts.forceRefresh,
    });
  });

program.parse();
