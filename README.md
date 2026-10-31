# AiFundMe

Community-funded software built by AI workers under human direction.

This repository currently contains a deployable **scaffold and implementation plan**, not a working crowdfunding or worker service. Sign-in, secure AI Token Grants, automated project generation, workers, and Stripe test payments are planned. Grant budgets authorize real usage billed to the key owner; stakes and payment revenue are illustrative/test data. Live payments and contributor distributions are out of scope. The placeholder landing page still reflects the initial scaffold, not the finalized feature set.

## Run locally

Use Node.js 22 and npm. No API keys or database are needed for the scaffold.

```sh
nvm use
npm ci
npm run dev
```

Open http://localhost:3000. `/api/health` reports application liveness only; it does not check integrations.

```sh
npm run lint       # ESLint, no warnings
npm run typecheck  # Generate route types and run strict TypeScript checks
npm run build     # Production build
npm run check     # All three checks, also used by GitHub Actions
```

Copy `.env.example` to `.env.local` when implementing integrations. Its variables are a planned configuration contract; nothing currently reads them. Never commit credentials.

## Stack

Installed: Next.js App Router, React, TypeScript, Tailwind CSS, ESLint, npm lockfile, and GitHub Actions CI. Node.js 22 is specified for local, CI, and Vercel runtimes. The app uses system fonts so builds do not fetch external font files.

Planned: Better Auth with GitHub OAuth; Neon Postgres via Vercel Marketplace with Drizzle; GitHub OAuth/Octokit; Postgres-backed state, encrypted credentials, and small artifacts; Vercel Workflow/Sandbox plus Cron cleanup; Stripe test Checkout; and OpenRouter with configurable `openai/gpt-6-astra`. Dependencies will be added with the features that use them. Use GitHub, Vercel, OpenRouter, and Stripe, with Postgres provisioned through Vercel Marketplace. No separate queue, secrets-manager, or object-storage account is planned.

## Project documents

- [Finalized MVP design](docs/mvp-design.md)
- [Integration decisions and constraints](docs/integration-decisions.md)
- [Earlier design (superseded)](docs/archive/mvp-design-initial.md)
- [Implementation plan and acceptance criteria](docs/implementation-plan.md)
- [Accounts, credentials, GitHub, and Vercel setup](docs/deployment.md)
- [Environment variable template](.env.example)

## Deploy the scaffold

Push this repository to your chosen GitHub owner, then import it into Vercel with the **Next.js** preset, repository root as the root directory, and `main` as production. Use Node.js 22.x and the default npm build settings. The current scaffold needs no environment variables. No `vercel.json` overrides are necessary.

GitHub Actions runs quality checks on PRs and pushes to `main`. Enable branch protection requiring **Quality checks** and a human review before merging. Vercel's GitHub integration handles preview and production builds; the CI workflow does not deploy.

See the deployment guide for the distinction between deploying AiFundMe itself and allowing AiFundMe to create repositories and deployments for its users.

## License

[MIT](LICENSE). The platform repository and generated repositories are public; the initial generated template also uses MIT.

## Dependency audit note

At setup, the production dependency audit reported no vulnerabilities. The full audit reported 16 moderate findings in the development-only ESLint dependency chain, rooted in a `minimatch` advisory. The suggested forced fix downgrades core lint packages to incompatible versions, so it was not applied. Recheck for compatible upstream updates before release.
