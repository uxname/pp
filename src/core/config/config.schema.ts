import { z } from 'zod';

const llmSchema = z.object({
  provider: z.literal('openai').default('openai'),
  model: z.string().default('gpt-5-mini'),
  apiKeyEnv: z.string().default('OPENAI_API_KEY'),
});

const cleanerSchema = z.object({
  whitelist: z.array(z.string()).default(['//!']),
  keepJSDoc: z.boolean().default(true),
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
});

const promptsSchema = z
  .object({
    review: z.record(z.string(), z.string()).optional(),
    commit: z.string().optional(),
  })
  .optional();

export const configSchema = z.object({
  $schema: z.string().optional(),
  llm: llmSchema.optional(),
  cleaner: cleanerSchema.default({ whitelist: ['//!'], keepJSDoc: true }),
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
  }),
  prompts: promptsSchema,
});

export type KoduConfig = z.infer<typeof configSchema>;
