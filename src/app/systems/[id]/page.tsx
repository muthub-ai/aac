import { notFound } from 'next/navigation';
import { DiagramWorkspace } from '@/components/diagram-workspace';
import { loadSystemById } from '@/lib/model/load-systems';

export default async function SystemDesignerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const system = loadSystemById(id);

  if (!system) {
    notFound();
  }

  return <DiagramWorkspace initialYaml={system.yamlContent} />;
}
