export interface FigmaMapping {
  component: string;
  importPath: string;
  fileKey: string;
  nodeId: string;
  nodeUrl: string;
  status: 'mapped' | 'adapter-mapped';
  target: {
    componentName: string;
    importPath: string;
    sourcePath: string;
  };
}

export async function loadFigmaMappings(): Promise<FigmaMapping[]> {
  const module = await import('../generated/code-connect.json', {
    with: {type: 'json'},
  });
  return module.default as FigmaMapping[];
}
