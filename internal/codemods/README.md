# EDS codemods

Versioned transforms live here and are discovered by `eds upgrade`. A codemod
must be idempotent, preserve unrelated formatting, provide a dry-run receipt,
and include fixtures for already-migrated, typical, and ambiguous inputs.

The 0.1 release has no upgrade transforms.
