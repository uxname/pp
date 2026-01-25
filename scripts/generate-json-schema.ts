import { writeFile } from 'node:fs/promises';
import { execa } from 'execa';
import { configSchema } from '../src/core/config/config.schema';

async function main(): Promise<void> {
  const schema = configSchema.toJSONSchema();
  const schemaString = JSON.stringify(schema, null, 2);

  await writeFile('kodu.schema.json', schemaString, 'utf8');
  await execa('biome', ['format', '--write', 'kodu.schema.json']);

  console.log('✅ JSON schema generated: kodu.schema.json');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
