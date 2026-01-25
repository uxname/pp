import { z } from 'zod';

// Model ID format: provider/model-name (e.g., "openai/gpt-4o", "anthropic/claude-4-5-sonnet")
const modelIdSchema = z.string().regex(/^[a-zA-Z0-9-_]+\/[a-zA-Z0-9-_.]+$/, {
  message:
    "Model must be in format 'provider/model-name' (e.g., 'openai/gpt-4o')",
});

const llmSchema = z.object({
  model: modelIdSchema.default('openai/gpt-5-mini'),
  apiKeyEnv: z.string().default('OPENAI_API_KEY'),
});

const cleanerSchema = z.object({
  whitelist: z.array(z.string()).default(['//!']),
  keepJSDoc: z.boolean().default(true),
  useGitignore: z.boolean().default(true),
});

const packerSchema = z.object({
  ignore: z
    .array(z.string())
    .default([
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      '.git',
      '.kodu',
      'node_modules',
      'dist',
      'coverage',
    ]),
  useGitignore: z.boolean().default(true),
});

const promptSourceSchema = z.string();

const promptsSchema = z
  .object({
    review: z.record(z.string(), promptSourceSchema).optional(),
    commit: promptSourceSchema.optional(),
    pack: promptSourceSchema.optional(),
  })
  .optional();

export const configSchema = z.object({
  $schema: z.string().optional(),
  llm: llmSchema.optional(),
  cleaner: cleanerSchema.default({
    whitelist: ['//!'],
    keepJSDoc: true,
    useGitignore: true,
  }),
  packer: packerSchema.default({
    ignore: [
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      '.git',
      '.kodu',
      'node_modules',
      'dist',
      'coverage',
    ],
    useGitignore: true,
  }),
  prompts: promptsSchema,
});

export type KoduConfig = z.infer<typeof configSchema>;
