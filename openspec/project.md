# Project Context

## Purpose
**Kodu** is a high-performance CLI utility designed to bridge the gap between local development environments and Large Language Models (LLMs). It automates the "last mile" of AI-assisted programming: preparing optimized context, stripping noise (comments) from code, performing instant code reviews, and drafting commit messages.

The project prioritizes **Speed** (startup <0.5s), **Determinism** (no AI for critical file modifications), and **Developer Experience** (modern UI, seamless Git integration).

## Tech Stack
The project enforces a "Fresh & Modern" stack strategy. Legacy libraries are strictly prohibited.

- **Runtime & Language:** Node.js (ESM `nodenext`), TypeScript (Strict Mode).
- **Framework:** NestJS + `nest-commander` (CLI architecture).
- **AI Orchestration:** `@mastra/core` (Model routing and agent management).
- **Code Analysis (AST):** `ts-morph` (Safe, deterministic code manipulation).
- **Tokenization:** `js-tiktoken` (Accurate token counting).
- **Validation & Config:** `zod` (Schema validation), `lilconfig` (Config loading).
- **System & Git:** `execa` (Process execution), `tinyglobby` (Fast globbing), `node:fs/promises`.
- **UI/UX:** `@inquirer/*` (Prompts), `yocto-spinner` (Spinners), `picocolors` (Formatting).
- **Quality Control:** Biome (Linting/Formatting), Knip (Dead code detection).

## Project Conventions

### Code Style
- **Linter/Formatter:** We use **Biome** exclusively. Run `npm run lint:fix` to apply standards.
- **Quotes:** Single quotes preferred.
- **Indentation:** 2 spaces.
- **Strictness:** `strictNullChecks` is ON. Avoid `any`; use `unknown` with narrowing/validation (Zod) where possible.
- **Imports:** Explicit imports preferred. No circular dependencies (enforced by NestJS module structure).

### Architecture Patterns
- **Modular Monolith:** The app is structured into semantic modules:
  - `core/`: Global infrastructure (Config, UI, FS).
  - `shared/`: Reusable business logic (Git, AI, Tokenizer, Cleaner).
  - `commands/`: Feature modules implementing specific CLI commands.
- **Dependency Injection:** All services must be injected via NestJS DI containers.
- **Config-First:** Configuration is loaded once in `ConfigModule`, validated via Zod, and injected where needed.
- **Deterministic Cleaning:** The `clean` command relies purely on AST parsing (`ts-morph`), never on AI generation, to guarantee code safety.

### Testing Strategy
- **Static Analysis as Primary Gate:** We rely heavily on strict static analysis.
- **Mandatory Check:** Before any commit or PR, you MUST run:
  ```bash
  npm run check
  ```
This command executes:
1. `ts:check` (TypeScript compilation check)
2. `lint:fix` (Biome formatting and linting)
3. `knip` (Detection of unused files, exports, and dependencies)

### Git Workflow
- **Commit Messages:** Must follow **Conventional Commits** specification (e.g., `feat:`, `fix:`, `chore:`, `refactor:`).
- **Branching:** Feature branches off `main`.
- **Pre-requisites:** The CLI relies on the presence of a git repository for `review` and `commit` commands.

## Domain Context
- **Context Packing:** The core value is converting a file tree into a single, token-optimized string prompt.
- **Token Budgeting:** Users must always be aware of the "cost" of their context. We display token counts and USD estimates (based on GPT-4o/5 pricing) before API calls.
- **Privacy:** By default, sensitive files (`.env`, lockfiles) are ignored. Kodu respects both `.gitignore` and its own `kodu.json` ignore lists.
- **Review Modes:** Code reviews are categorized by intent: `bug` (logic errors), `style` (readability), `security` (vulnerabilities).
- **Cleaner Logic:** We distinguish between "System comments" (`@ts-ignore`, `TODO`) which are often kept, and "Noise comments" which are removed to save tokens.

## Important Constraints
1. **No Legacy Deps:** Do not install `chalk`, `ora`, `glob`, `inquirer` (legacy), or `fs-extra`. Use the modern alternatives listed in Tech Stack.
2. **Secrets Management:** API keys are **never** stored in `kodu.json`. They are read strictly from environment variables (default `OPENAI_API_KEY`).
3. **Performance:** Import costs matter. Use lightweight libraries. The CLI must feel instant.
4. **Safety:** The `clean` command must handle files safely. It supports dry-runs (`--dry-run`) to preview destruction.
5. **Validation:** If `kodu.json` is invalid, the app must crash gracefully with a clear error message pointing to the specific Zod validation failure.

## External Dependencies
- **LLM Providers:** Requires access to OpenAI, Anthropic, or Google APIs (via Mastra).
- **Git CLI:** The user must have `git` installed and initialized in their project.
- **Clipboard:** Relies on system clipboard access (via `clipboardy`) for `--copy` commands.
