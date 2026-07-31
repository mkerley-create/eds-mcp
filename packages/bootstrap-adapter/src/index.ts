export interface BootstrapEnvironment {
  bootstrapVersion?: string;
  hasLegacyVenomRoot: boolean;
  warnings: string[];
}

export function inspectBootstrapEnvironment(
  root: Document | HTMLElement = document,
): BootstrapEnvironment {
  const hasLegacyVenomRoot = Boolean(root.querySelector('[data-venom-app], .venom-app'));
  const documentElement = root instanceof Document ? root.documentElement : root;
  const version =
    documentElement.getAttribute('data-bootstrap-version') ?? undefined;
  const warnings: string[] = [];
  if (version && !version.startsWith('5.3')) {
    warnings.push(`EDS is tested with Bootstrap 5.3; detected ${version}.`);
  }
  return {bootstrapVersion: version, hasLegacyVenomRoot, warnings};
}
