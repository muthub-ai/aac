import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import type { ArchitectureWaiver, WaiverData } from '@/types/waiver';

const WAIVERS_DIR = path.join(process.cwd(), 'waivers');

/**
 * Load all architecture waivers from the waivers/ directory.
 * Each .yaml file is parsed and returned with its raw YAML content.
 */
export function loadWaivers(): WaiverData[] {
  if (!fs.existsSync(WAIVERS_DIR)) {
    return [];
  }

  const files = fs
    .readdirSync(WAIVERS_DIR)
    .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
    .sort();

  const waivers: WaiverData[] = [];

  for (const fileName of files) {
    const filePath = path.join(WAIVERS_DIR, fileName);
    const yamlContent = fs.readFileSync(filePath, 'utf-8');
    const parsed = yaml.load(yamlContent) as ArchitectureWaiver;

    waivers.push({
      fileName,
      waiver: parsed,
      yamlContent,
    });
  }

  return waivers;
}
