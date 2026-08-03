import {z} from 'zod';

export const maturitySchema = z.enum([
  'experimental',
  'beta',
  'stable',
  'deprecated',
]);

export const propDocSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  description: z.string().min(1),
  required: z.boolean().optional(),
  default: z.string().optional(),
});

export const exampleDocSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  code: z.string().min(1),
});

export const bestPracticeSchema = z.object({
  type: z.enum(['do', 'dont']),
  description: z.string().min(1),
});

export const sourcePropSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  required: z.boolean().optional(),
  default: z.string().optional(),
});

export const sourceComponentContractSchema = z.object({
  id: z.string().regex(/^source-component:/),
  name: z.string().min(1),
  source: z.literal('node-site-venom'),
  sourcePath: z.string().min(1),
  implementation: z.string().min(1),
  adapter: z.string().min(1).optional(),
  adapterPackage: z.string().startsWith('@edmunds/').optional(),
  canonicalComponent: z.string().min(1).optional(),
  props: z.array(sourcePropSchema).min(1),
  notes: z.array(z.string()).min(1),
  figma: z.object({
    fileKey: z.string().min(1),
    nodeId: z.string().regex(/^\d+:\d+$/),
    nodeUrl: z.string().url(),
    status: z.enum(['mapped', 'pending']),
  }).optional(),
});

export const figmaPropertySchema = z.object({
  figmaName: z.string().min(1),
  propName: z.string().min(1),
  kind: z.enum(['enum', 'boolean', 'string']),
  mapping: z.record(z.string(), z.union([z.string(), z.boolean()])).optional(),
});

export const figmaMappingSchema = z.object({
  status: z.enum(['mapped', 'adapter-mapped', 'pending']),
  fileKey: z.string().min(1).optional(),
  nodeId: z.string().regex(/^\d+:\d+$/).optional(),
  nodeUrl: z.string().url().optional(),
  componentKey: z.string().min(1).optional(),
  target: z.object({
    componentName: z.string().regex(/^[A-Z][A-Za-z0-9]+$/),
    importPath: z.string().min(1),
    sourcePath: z.string().min(1),
    properties: z.array(figmaPropertySchema),
  }).optional(),
}).superRefine((value, context) => {
  if (value.status === 'pending') return;
  for (const field of ['fileKey', 'nodeId', 'nodeUrl', 'target'] as const) {
    if (!value[field]) {
      context.addIssue({
        code: 'custom',
        path: [field],
        message: `${field} is required when a Figma mapping is active`,
      });
    }
  }
});

export const componentDocSchema = z.object({
  kind: z.literal('component').default('component'),
  id: z.string().regex(/^component:/),
  name: z.string().regex(/^[A-Z][A-Za-z0-9]+$/),
  displayName: z.string().min(1),
  package: z.string().startsWith('@edmunds/'),
  importPath: z.string().startsWith('@edmunds/'),
  version: z.string(),
  maturity: maturitySchema,
  category: z.string().min(1),
  keywords: z.array(z.string()).min(1),
  description: z.string().min(1),
  whenNotToUse: z.string().min(1),
  props: z.array(propDocSchema),
  anatomy: z.array(z.string()).min(1),
  accessibility: z.array(z.string()).min(1),
  keyboard: z.array(z.string()),
  bestPractices: z.array(bestPracticeSchema).min(2),
  examples: z.array(exampleDocSchema).min(1),
  responsive: z.string(),
  theming: z.object({
    className: z.string().startsWith('eds-'),
    tokens: z.array(z.string().startsWith('--eds-')),
  }),
  related: z.array(z.string()),
  source: z.object({
    path: z.string().min(1),
    propsType: z.string().regex(/^[A-Z][A-Za-z0-9]+$/),
  }),
  figma: figmaMappingSchema,
  dense: z.string().min(1),
});

export const referenceDocSchema = z.object({
  kind: z.literal('doc'),
  id: z.string().regex(/^doc:/),
  title: z.string(),
  category: z.enum(['guide', 'foundation']),
  description: z.string(),
  sections: z.array(
    z.object({
      title: z.string(),
      body: z.string(),
      code: z.string().optional(),
    }),
  ),
  dense: z.string(),
});

export const templateDocSchema = z.object({
  kind: z.literal('template'),
  id: z.string().regex(/^template:/),
  name: z.string(),
  category: z.string(),
  description: z.string(),
  components: z.array(z.string()),
  sourcePath: z.string(),
  skeleton: z.string(),
  maturity: maturitySchema,
  dense: z.string(),
});

export const registryItemSchema = z.discriminatedUnion('kind', [
  componentDocSchema,
  referenceDocSchema,
  templateDocSchema,
]);

export const registrySchema = z.object({
  name: z.literal('Edmunds Design System'),
  version: z.string(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/),
  items: z.array(registryItemSchema),
  sourceComponents: z.array(sourceComponentContractSchema).default([]),
});

export type ComponentDoc = z.infer<typeof componentDocSchema>;
export type ReferenceDoc = z.infer<typeof referenceDocSchema>;
export type TemplateDoc = z.infer<typeof templateDocSchema>;
export type SourceComponentContract = z.infer<typeof sourceComponentContractSchema>;
export type RegistryItem = z.infer<typeof registryItemSchema>;
export type Registry = z.infer<typeof registrySchema>;

export function defineComponentDoc(doc: ComponentDoc): ComponentDoc {
  return componentDocSchema.parse(doc);
}

export function defineReferenceDoc(doc: ReferenceDoc): ReferenceDoc {
  return referenceDocSchema.parse(doc);
}

export function defineTemplateDoc(doc: TemplateDoc): TemplateDoc {
  return templateDocSchema.parse(doc);
}
