import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import type { ArchitectureStandard, StandardData } from '@/types/standard';

const STANDARDS_DIR = path.join(process.cwd(), 'standards');

/**
 * Load all architecture standards from the standards/ directory.
 * Each .yaml file is parsed and returned with its raw YAML content.
 */
export function loadStandards(): StandardData[] {
  if (!fs.existsSync(STANDARDS_DIR)) {
    return [];
  }

  const files = fs
    .readdirSync(STANDARDS_DIR)
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    .sort();

  const standards: StandardData[] = [];

  for (const fileName of files) {
    const filePath = path.join(STANDARDS_DIR, fileName);
    const yamlContent = fs.readFileSync(filePath, 'utf-8');
    const parsed = yaml.load(yamlContent) as ArchitectureStandard;

    standards.push({
      fileName,
      standard: parsed,
      yamlContent,
    });
  }

  return standards;
}
