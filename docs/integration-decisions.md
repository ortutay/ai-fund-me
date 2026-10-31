# Integration decisions and constraints

These are planning decisions, not completed integrations. The user's confirmed choices override the pasted design where applicable: **all repositories public; MIT; OpenRouter with configurable GPT-6 Astra**. Recommended hosting: a dedicated Vercel Pro team and default Vercel domains. Pro is the appropriate starting tier for this platform's intended use. [Vercel plans](https://vercel.com/docs/plans), [fair-use guidance](https://vercel.com/docs/limits/fair-use-guidelines).

## D1 — Automatic deployment without user Vercel setup

The design asks for user-owned personal GitHub repos, only GitHub OAuth consent, no GitHub App installation, no user Vercel account, and native Vercel Git integration using the platform's credentials.

Vercel documents that importing/linking a personal repository requires the repository owner; collaborator access is insufficient. The platform's Vercel token and a user's AiFundMe OAuth token do not automatically establish Vercel's own GitHub integration access. Thus the exact proposed combination needs a proof before it can be promised. [Vercel personal repository permissions](https://vercel.com/docs/git/vercel-for-github#missing-git-repository).

**Recommendation:** keep public personal repositories and no user Vercel setup. AiFundMe installs signed repository webhooks using the user's OAuth token and drives Vercel deployments through its own API token. On an authorized PR revision, deploy a preview; on a verified human-reviewed merge into `main`, deploy production. Fetch the exact approved commit archive, upload source files, request the target environment, and retain SHA-to-deployment mappings. Do not execute builds in the trusted controller. The first release follows the user's explicit generation approval.

Vercel supports file-upload deployments via REST API. This is a proposed change to the deployment mechanism, not a claim that native Git integration works without its required authorization. Avoid duplicate native/API triggers. Validate API limits, quotas, commit metadata, preview URLs, and race handling in slice 0. [Vercel REST deployments](https://vercel.com/docs/deployments#vercel-rest-api).

**Decision before implementation:** accept this bridge or relax the no-extra-Vercel-authorization requirement. Do not silently replace personal repos with platform-owned organization repos.

## D2 — Human reviewer must differ from the PR author

GitHub does not allow PR authors to approve their own PRs. Opening a PR with Alice's OAuth token makes Alice its author, regardless of the commit author label. A required approval therefore prevents the specified Alice-alone review flow. [GitHub required reviews](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews).

**Recommendation for the Alice flow:** use a separate platform automation GitHub personal account, authenticated via OAuth and encrypted in the same Postgres credential table. With the owner's explicit in-app connection consent, the backend invites it as a collaborator and accepts the invitation through its credentials. Owner OAuth handles initial provisioning; the automation identity publishes only assigned feature branches/PRs through policy-checked server operations. Alice remains the human reviewer/merger. No GitHub App or organization repo is introduced, and no raw OAuth credential reaches the sandbox.

This is an additional identity/access decision, not already authorized resource creation. Validate the account setup and collaborator permissions before adoption. If it is not desired, require a second human maintainer with GitHub write access to review PRs opened using Alice's token. Never silently disable required reviews or have automation approve itself. Application membership must match actual GitHub repository review permissions.

## D3 — Minimal OAuth scopes and CI

Start with `read:user`, `user:email`, `public_repo`. GitHub documents that `public_repo` includes repository hooks, so do not add broad `admin:repo_hook` as a default. `workflow` is separately required to add/update GitHub Actions workflow files. Keep generated-repo checks in platform-orchestrated sandboxes with commit statuses initially; the platform repository can retain its normal GitHub Actions CI. If generated Actions workflows are added later, request/explain the extra scope then. [GitHub OAuth scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps).

Public OAuth scopes cover more than one selected repo: enforce a project/repository allowlist in every backend operation. Validate granted scopes, not just requested scopes. Store expiry/refresh details if returned; otherwise handle revocation with reconnection, without assuming a refresh token exists.

## D4 — OpenRouter and configurable GPT-6 Astra

Use `openai/gpt-6-astra` as `AI_DEFAULT_MODEL`, routed through OpenRouter at `https://openrouter.ai/api/v1`. OpenRouter lists this exact model. Contributors supply **OpenRouter API keys** for the first release; no direct OpenAI API key is needed. [OpenRouter model listing](https://openrouter.ai/openai/gpt-6-astra), [API reference](https://openrouter.ai/docs/api/reference/overview).

Allow a project-level model override from an administrator-approved catalog. Persist the resolved model, routing constraints, and pricing version on each execution; edits affect future runs only. Verify account access, tool support, bounded output, and pricing before dispatch. No silent model substitution. If upstream routing can vary price, constrain it or reserve the worst allowed price; reconcile the OpenRouter-reported charge/generation identifier. The contributor's key must authorize the selected model. Treat OpenRouter as the billing provider and record the underlying model/provider separately where available.

Proposed configurable pilot limits: initial grant $10, planning cap $0.50, generation cap $5, subsequent task cap $2, request cap $0.50, one run per project/two globally, 15-minute worker timeout, 20-minute generation timeout, two generation repair attempts. These are starting controls, not a guarantee every idea fits or authorization to spend now. Estimate affordability from the actual request; ask the user in-app to adjust scope/budget rather than silently exceed it. All retries and repairs share the same authorized budget.

## D5 — Stake eligibility defaults

The finalized formula is based on full eligible budget, never actual spend. Proposed: active and exhausted valid grants count; paused, revoked, expired, and invalid-key grants do not. Budget reduction is limited by spent plus in-flight authorized usage. Revocation excludes the whole grant from current allocation while preserving usage and historical snapshots. Paused/exhausted treatment needs product confirmation; every snapshot records its eligibility-policy version.

Grant declarations are not escrow or verified provider credit balances. Label stakes illustrative; a large declared grant is not proof of financial backing. Keep the pilot limited to invited contributors and validate credentials before counting a grant.

## D6 — Minimize accounts and custom infrastructure (approved)

The user approved Vercel Workflow + Sandbox after the orchestration explanation. Provision Neon Postgres through Vercel Marketplace. Keep GitHub, Vercel, OpenRouter, and Stripe as the main account surfaces, with the managed database connected through Vercel. Vercel's former native Postgres offering is no longer available; the marketplace supplies an external Postgres provider. [Postgres on Vercel](https://vercel.com/docs/postgres).

Remove AWS Secrets Manager, Inngest, and Vercel Blob from the MVP. Encrypt API/OAuth keys in Postgres using a separate server environment key. Use **Vercel Workflow** for durable orchestration and **Vercel Sandbox** for isolated shell execution. Both use the existing Vercel deployment/account. This supersedes the interim idea of implementing the agent scheduler entirely with Postgres and Cron. Cron remains only for reconciliation and cleanup. [Vercel Workflow](https://vercel.com/docs/workflows).

Postgres retains authoritative budgets, run state, a small dispatch outbox, and bounded source bundles/logs. Workflow checkpointing never stores decrypted credentials. Keep tests for duplicate dispatch, external-call idempotency, cancellation, and recovery. Add external storage or queue infrastructure only after measured limits justify it. The pasted source design stays unmodified; this later direction supersedes its dedicated secrets-manager requirement.
