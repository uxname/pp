# kodu

This repository currently holds only the infrastructure required to rebuild the **kodu** CLI from scratch.

## Структура проекта

- `package.json`, `bun.lock`, `tsconfig.json`, `biome.json`, and `.gitignore` keep the tooling and scripts intact.
- `src/index.ts` now wires the boilerplate and delegates behavior to `src/core/cli.ts` and `src/commands`.
- `src/core` owns CLI initialization helpers (`runCli`, shared helpers like `printScaffoldStatus`) and any future infrastructure logic.
- `src/commands` contains individual command modules that register themselves with `commander` through a shared `CommandModule` interface.

## Как начать

```bash
bun install
bun run dev    # run the scaffold locally
bun run build  # produce the bundled CLI
```

## Следующие шаги

1. Реализуйте команду как модуль в `src/commands`, экспортируйте `CommandModule`-совместимый объект и добавьте его в `src/commands/index.ts`.
2. Храните общий CLI-инфраструктурный код (флаги, shared helpers, загрузчики команд) в `src/core/cli.ts` и смежных файлах.
3. При появлении новой логики обновляйте документацию, README и AGENTS.md, чтобы поддерживать DX.

## Лицензия

MIT
