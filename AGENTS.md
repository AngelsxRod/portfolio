# Repository instructions

<!-- CODEGRAPH_START -->

## CodeGraph

If a `.codegraph/` directory exists at the repository root, use CodeGraph before searching or reading code to locate symbols. Use `codegraph_explore` when available, or `codegraph explore "<question>"` in the shell. If `.codegraph/` is absent, skip CodeGraph.
<!-- CODEGRAPH_END -->

@/home/angels/.codex/RTK.md

## UI

- Always use the installed shadcn/ui components from `@repo/ui/components/*` for application controls and UI patterns when a matching component exists.
- Add missing components with `pnpm dlx shadcn@canary add <component> -c apps/web`; keep shared components in `packages/ui/src/components`.
- Use Tailwind CSS v4 and the theme tokens in `packages/ui/src/styles/globals.css` for styling.
- Never use native date controls (`type="date"`, `type="month"`). Use the shadcn `Calendar` with `Popover`; `@repo/ui/components/month-picker` covers month/year values.
- Build every form with React Hook Form, a Zod schema (`zodResolver`) and `FormField` from `apps/web/src/components/form-field.tsx` (`Controller` + shadcn `Field`). Map API `fields` errors with `applyServerErrors` in `apps/web/src/lib/form.ts`.
- Keep semantic HTML for page structure and accessibility; do not duplicate an available shadcn/ui component with a custom control.

## Portfolio CMS

- Read `PROGRESS.md` before starting CMS work. Implement only its active stage and update its checklist and delivery log with verified results.
- Read `docs/architecture.md` before changing the content model, publication flow, authentication, or admin routes.
- Keep the public portfolio read-only. Every content mutation belongs behind server-side authentication and authorization in the API.
- Validate request data at runtime and keep database access in the API. Never expose secrets or unpublished content through client bundles or public endpoints.
- Project skills live in `.agents/skills`; `.claude/skills` holds symlinks to them so Claude Code reads the same files, and `CLAUDE.md` imports this file.
- Use the project skills in `.agents/skills` when relevant: `codebase-design` and `improve-codebase-architecture` for architectural reviews, `security-best-practices` for security-sensitive changes, `frontend-design` for the public site, `tdd` for important behavior, and `agent-browser` for end-to-end checks.
