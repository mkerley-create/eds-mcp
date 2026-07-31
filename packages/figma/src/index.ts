export interface FigmaMapping {
  component: string;
  importPath: string;
  componentKey: string;
  status: 'mapped' | 'pending';
}

export async function loadFigmaMappings(): Promise<FigmaMapping[]> {
  const module = await import('../generated/code-connect.json', {
    with: {type: 'json'},
  });
  return module.default as FigmaMapping[];
}
