# Contributing to AntAI

Thank you for your interest in contributing to AntAI!

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies: `bun install`
4. Run setup: `bun run setup`
5. Start dev server: `bun dev`

## Development

- `bun dev` — Start development server
- `bun run typecheck` — TypeScript type checking
- `bun run build` — Production build
- `bun run db:generate` — Generate database migrations
- `bun run db:push` — Apply migrations

## Code Style

- TypeScript strict mode
- Functional components with hooks
- Zustand for client state
- TanStack React Query for server state
- shadcn/ui for UI components

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Run `bun run typecheck` to verify
4. Submit a PR with a clear description

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.
