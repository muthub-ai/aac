import type { LucideIcon } from 'lucide-react';

export type UtilityStatus = 'available' | 'coming-soon' | 'beta';

export interface UtilityLink {
  label: string;
  url: string;
}

export interface UtilityInfo {
  id: string;
  name: string;
  tagline: string;
  icon: LucideIcon;
  color: string;
  status: UtilityStatus;
  version?: string;
  installCommand?: string;
  packageName?: string;
  links?: UtilityLink[];
  features?: string[];
}

export interface CliArgument {
  name: string;
  required: boolean;
  description: string;
  values?: string[];
  default?: string;
}

export interface CliFlag {
  long: string;
  short?: string;
  argument?: string;
  description: string;
  default?: string;
}

export interface CliExample {
  title: string;
  command: string;
}

export interface CliCommand {
  name: string;
  purpose: string;
  synopsis: string;
  description: string;
  arguments?: CliArgument[];
  flags?: CliFlag[];
  examples: CliExample[];
  notes?: string[];
}

export interface ExitCode {
  code: number;
  label: string;
  meaning: string;
}

export interface ConfigField {
  field: string;
  type: string;
  default: string;
  description: string;
}

export interface QuickStartStep {
  step: number;
  title: string;
  description: string;
  command: string;
}
