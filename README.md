# kodu

This repository currently holds only the infrastructure required to rebuild the **kodu** CLI from scratch.

## Структура проекта

- `package.json`, `bun.lock`, `tsconfig.json`, `biome.json`, and `.gitignore` keep the tooling and scripts intact.
- `src/index.ts` provides a tiny CLI scaffold that can be extended with new commands.

## Как начать

```bash
bun install
bun run dev    # run the scaffold locally
bun run build  # produce the bundled CLI
```

## Следующие шаги

1. Добавьте новые команды в `src/commands` и подключите их в `src/index.ts`.
2. Перенесите любую инфраструктурную логику (history, сканеры, и т.п.) в новые модули под `src/core` с необходимой типизацией.
3. Обновите документацию и AGENTS.md по мере появления реальных фич.

## Лицензия

MIT
