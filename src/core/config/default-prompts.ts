export const DEFAULT_REVIEW_PROMPTS = {
  bug: `Ты — строгий ревьюер кода. Формат ответа: краткий markdown с пунктами.
Режим: {mode}. Найди потенциальные баги, логические ошибки, регрессы.
Дай сжатый список проблем и рекомендаций. Если критичных нет — скажи об этом.

Diff:
{diff}`,

  style: `Ты — строгий ревьюер кода. Формат ответа: краткий markdown с пунктами.
Режим: {mode}. Проверь читаемость, согласованность, форматирование и нейминг.
Дай сжатый список проблем и рекомендаций. Если критичных нет — скажи об этом.

Diff:
{diff}`,

  security: `Ты — строгий ревьюер кода. Формат ответа: краткий markdown с пунктами.
Режим: {mode}. Найди уязвимости, утечки секретов, неправильные проверки прав.
Дай сжатый список проблем и рекомендаций. Если критичных нет — скажи об этом.

Diff:
{diff}`,
} as const;

export const DEFAULT_COMMIT_PROMPT = `You generate Conventional Commit messages.
Rules:
- Format: <type>(<optional scope>): <subject>
- Lowercase subject, no trailing period.
- Keep under 70 characters.
- Summarize the diff accurately.

Diff:
{diff}`;

export const STANDARD_REVIEW_MODES = ['bug', 'style', 'security'] as const;

export function replacePromptVariables(
  prompt: string,
  variables: Record<string, string>,
): string {
  let result = prompt;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}
