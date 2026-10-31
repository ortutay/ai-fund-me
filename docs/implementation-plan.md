# AiFundMe — implementation plan

Updated October 30, 2026 against the [finalized design](mvp-design.md). **Planning only:** the repository still contains a scaffold; none of the features below are implemented. This plan replaces the previous managed-organization/simulated-credit plan. [Account setup](deployment.md) and [integration decisions](integration-decisions.md) accompany it.

## Product contract

Confirmed choices: all repositories public, MIT for the platform and initial generated template, OpenRouter with configurable GPT-6 Astra. Recommended hosting: a dedicated Vercel Pro team using default domains. Later user direction also requires encrypted credentials in Postgres and minimizing services; this supersedes the design document's dedicated secrets-manager requirement.

A user signs in with GitHub, describes an application, supplies an AI Token Grant, approves an AI-generated plan, and receives a working application, public personal GitHub repository, Vercel deployment, and initial issues entirely through AiFundMe. Further grants fund issue-based development; humans review PRs before production. A paid generated application supports Stripe test checkout, failure handling, refunds, and revenue reporting.

| Previous assumption | Finalized requirement |
| --- | --- |
| GitHub App and organization repos | GitHub OAuth for login and API access; public repos in each owner's personal account |
| Admin-issued credits/platform AI key | Contributor-supplied API key plus project-specific authorized budget; provider bills contributor |
| Placeholder/template-first wizard | AI planning and a working initial feature, with user approval and metered generation |
| Stakes from consumed credit | Stakes from eligible grant budget; no automatic owner allocation |
| Payments deferred | Stripe test-mode Checkout, failures, refunds, and transaction history are MVP |

Keep the first implementation narrow: one Next.js template, OpenRouter as the first provider, defaulting to configurable `openai/gpt-6-astra`, one active worker per project, small global concurrency, one-time USD card checkout, and manually entered hosting/other expenses. More providers and templates are later additions, not prerequisites. No wallet balances, real payments, Stripe Connect, subscriptions, distributions, organization repos, or custom governance.

## Architecture

Use **GitHub, Vercel, OpenRouter, and Stripe**, with **Neon Postgres provisioned through Vercel Marketplace**. Postgres remains a managed database under the integration, rather than a Vercel-native database engine. One Next.js/TypeScript application on Vercel holds the UI, API, auth, and trusted control logic. Use Drizzle for Postgres, Better Auth for GitHub-only sessions, and Octokit for OAuth-authenticated GitHub operations. These libraries do not require separate hosted services.

Postgres holds application data, encrypted credentials, dispatch/reconciliation records, and bounded temporary source artifacts/logs. Vercel provides hosting, Workflow for durable orchestration, Sandbox for ephemeral untrusted execution, and Cron for periodic reconciliation under the same account. No separate secrets manager, queue vendor, Redis, or object-storage service is needed for the MVP.

The AI gateway is a server module, not another microservice. It selects an authorized grant, reserves usage, retrieves its key, calls the provider, and records costs. Sandbox tools read/edit/test code; neither tools nor generated applications receive provider keys, OAuth tokens, Stripe keys, database credentials, or deployment tokens. The backend publishes approved branches and requests deployments.

Add dependencies only with the slice using them. Suggested module boundaries: `src/server/{auth,projects,credentials,github,grants,ai,provisioning,workers,deployments,payments,financials}`. Job handlers delegate to those modules. Persist every job's progress so retries do not depend on a long-lived HTTP request or sandbox filesystem.

### Credentials in the database

Store credentials using authenticated encryption (AES-256-GCM), with a unique random nonce for each encryption and associated data binding the credential ID, owner/project scope, and credential type. Keep ciphertext, nonce, authentication tag, and key version in a dedicated `EncryptedCredential` table; grants/OAuth records reference it. `CREDENTIAL_ENCRYPTION_KEY_BASE64` contains a random 32-byte key in server environment settings, separate from the DB, session secret, and source code. No plaintext fallback, client-side decryption, raw-secret logging, or key exposure to sandboxes. Retain previous key versions during explicit rotation until all rows/backups that need them are handled. Losing the key loses access to the encrypted credentials; plan encrypted backups and key recovery separately.

### Workers through Vercel Workflow and Sandbox

Use Vercel Workflow SDK for multi-step provisioning and issue execution. Workflow manages step persistence, waits, and retries under the existing Vercel deployment. It replaces the previously proposed Postgres/Cron execution loop; do not build both. [Vercel Workflow](https://vercel.com/docs/workflows).

1. In one Postgres transaction, authorize the issue, reserve budget, claim the task, and insert a unique `WorkflowDispatch` record. Enforce one run per project and a small global cap; funded tasks waiting for slots stay pending.
2. Dispatch a workflow using the internal run ID and store its returned workflow ID. The first step atomically claims the run generation, so duplicate dispatch attempts cannot produce two active executions. External calls still use operation IDs and saved receipts.
3. Start an ephemeral Vercel Sandbox and save its ID. Trusted workflow steps call the AI gateway and invoke sandbox read/edit/command tools. Shell commands and repository code execute only in the sandbox.
4. Keep each step inside its Vercel Function limit. Start long sandbox commands asynchronously, persist command IDs, then use durable waits/polling. The whole workflow can span multiple invocations; do not assume one HTTP request lasts for the entire agent run.
5. After checks pass, trusted backend steps publish the assigned branch/PR, settle usage, release unused funds, and stop the sandbox. Human review/merge status is tracked separately.

Store credential IDs, never decrypted keys, in workflow arguments/results. Retrieve/decrypt a key and call the provider inside the same trusted step; ensure logs and persisted results contain no raw secrets. Workflow retries do not make payments/model calls exactly-once: request IDs, DB uniqueness, conservative holds, and reconciliation still protect external side effects. An unknown billed call must not be automatically repeated.

Cancellation sets a DB flag, revokes further authorizations, requests workflow termination, and stops the sandbox. Each side-effecting step rechecks its run generation and current permission. A small Vercel Cron reconciliation endpoint, protected by `CRON_SECRET`, scans missed dispatches, orphaned sandboxes, expired leases, and unresolved holds. Cron is recovery/cleanup, not the agent execution engine. SDK local development runs workflows without a separate queue account; real Sandbox/provider calls still need credentials. Test Workflow/Sandbox access and quotas on the selected Vercel team in slice 0. [Workflow concepts](https://vercel.com/docs/workflows/concepts), [Cron authentication](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

### Small artifacts in Postgres

Persist compressed source bundles with hashes in `SourceArtifact` before destroying the generation sandbox; after publication, GitHub is the durable source of truth. Exclude dependencies, build outputs, and secrets. Proposed limits: 10 MiB compressed/50 MiB expanded per source bundle, 1 MiB redacted logs per run, and seven-day cleanup after successful publication; retain failed provisioning artifacts up to 30 days for resume. Reject oversize generation with a clear recoverable error. Transfer bounded chunks below the platform HTTP payload limits. Keep credential encryption separate from ordinary source storage; artifacts contain no credentials. Add object storage only if measured size/retention needs exceed these MVP limits.

## Resolve these before promising end-to-end automation

1. **Vercel Git linking:** native integration is not proven compatible with arbitrary personal repos plus only AiFundMe's Vercel account. Recommend an AiFundMe-managed webhook → deployment API bridge if the account spike confirms the restriction. This preserves automatic previews/production, but changes the specified native Git integration mechanism. See decision D1.
2. **PR author identity:** an owner cannot approve a PR opened with that owner's token. Recommend a separate platform automation account authenticated through OAuth, added by the backend as a collaborator, so Alice can approve its PRs. This is an additional identity proposal requiring acceptance, not an implemented feature. A second human maintainer is the simpler alternative. See D2.
3. **Generation funding:** collect the initial grant before AI planning, despite the sample scenario listing it after planning. No free/unmetered planning call. This resolves a dependency conflict without adding a platform-funded wallet.
4. **Grant eligibility:** paused/exhausted eligibility is unspecified. Proposed rules below must be confirmed before reporting stakes.

## Ordered delivery slices

The specification's milestone numbers are product milestones, not a safe coding order: a minimal part of M2 is required to deliver M1. The sequence below keeps those dependencies explicit.

| Slice | Build | Acceptance gate | Spec coverage |
| --- | --- | --- | --- |
| 0. Integration proof | Exercise OAuth public repo/settings/webhooks; verify deployment path; prove separate PR author/reviewer; validate credential encryption and Workflow/Sandbox access | Working evidence for the three service boundaries, with unresolved deviations recorded | Prerequisite |
| 1. Identity + grants | GitHub sign-in/reconnect, draft project, DB credential encryption, basic grant form, provider gateway, reservations and metering | One authorized bounded AI request with no leaked credentials or duplicate charge | M1 foundation, minimum M2 |
| 2. Creation wizard | Description → grant → AI plan/approval → functional app generation → review → repo → deploy → issues | User receives a working app and roadmap without manual repo/Vercel setup; retry resumes | M1 |
| 3. Grant management | Pause/revoke/expiry, budget edits, history, deterministic selection, initial stake snapshots | Every change updates eligibility/budget correctly, including during an active run | M2, foundation M6 |
| 4. Worker + review loop | Approved issue → reserved run → isolated edit/test → PR → human review → deployment | One budgeted issue yields a reviewed production change; task completes only on merge | M3 + M4 |
| 5. Paid-project template | Paid-product settings, central Checkout, signed events, payment/refund records, simple purchase confirmation | Success, decline, duplicate event, and partial/full refund work in Stripe test mode | M5 |
| 6. Financials + pilot | Grant-budget stakes, history, separate costs/revenue/fees, activity/history views, recovery checks | Complete Alice/Bob/customer flow, with traceable usage and test revenue | M6 and MVP success |

### Slice 0 — short integration proof, before product polish

Use disposable test accounts/resources when implementation starts. Verify `read:user`, `user:email`, and `public_repo` are sufficient for personal repo creation, hooks, settings, issues, branches, PRs, and commit status reporting. Do not request private repo access. Avoid generated GitHub Actions files initially; run checks in a fresh sandbox and post commit statuses, avoiding the additional `workflow` scope.

Verify Vercel creates a project in the platform team, accepts the exact source revision, returns a live URL, and supports subsequent preview/production deployments without making the user register on Vercel. Test PR approval with the actual identities and branch protection. Verify credentials decrypt only in trusted server code and queue retries cannot repeat billed work. Do not build the wizard around an untested permission assumption.

### Slices 1–2 — grants first, then the complete wizard

Create an internal project UUID in `draft` state before external provisioning or a grant. GitHub identity uses immutable user ID; usernames and email are display data. Preserve session/credential separation, granted scopes, credential status, and refresh/expiry metadata if issued. Revoked authorization stops GitHub writes and prompts reconnection; a different signed-in account must not silently take over existing projects.

Wizard sequence:

1. **Describe:** name, idea, target users, desired features, template choice, MIT license confirmation.
2. **Fund:** provider, key, maximum grant budget; display a bounded planning/generation allowance. Store an encrypted-credential row and expose only its reference and safe label/fingerprint. Do not echo the key after submission.
3. **Plan:** gateway generates a concise feature list, architecture, milestones, and proposed issues. The user edits and approves a version. Regeneration is another metered request.
4. **Generate:** run the approved plan against a versioned Next.js template inside a sandbox; implement at least one complete useful feature, run lint/type/build and a feature smoke test. Bound repair attempts by the same approved budget.
5. **Review:** show a sandbox preview or screenshots and acceptance-check results, explain scope omissions, and obtain approval of the generated revision before the trusted bootstrap publishes the first `main`. Keep generated text/code untrusted.
6. **Provision:** create the public repo with `POST /user/repos`, upload the reviewed source, set metadata/default branch/protection, create webhooks, provision Vercel and scoped app settings, deploy, verify HTTP health and deployment readiness.
7. **Roadmap:** create only user-approved issues, deduplicated by provisioning step. Initial issues are not automatically labeled `ai:ready`.
8. **Finish:** mark ready only when the source, initial deployment, and roadmap exist; display live URL and GitHub links.

Start with an achievable template: a small browser application with persistent local state (for example a personal kanban board), responsive UI, and one complete create/edit/delete flow. A Miro-like request becomes a user-approved small first version; do not claim multiplayer or server persistence without implementing it. Database-backed generated apps, additional auth integrations, and arbitrary stacks can follow later. The paid variant adds a checkout button and verified purchase confirmation in slice 5.

Persist `ProjectProvisioning` step state, approved plan/version, generation run, artifact row/hash, resource IDs, and retry receipts. Save a bounded compressed source artifact in Postgres before destroying the sandbox; a later deployment retry must not regenerate or repay for code. Put no secrets in the artifact. Resume successful steps, surface actionable failures, and never delete existing external work as automatic compensation. Unknown external-create outcomes must be reconciled before repeating them.

### Slice 3 — grant lifecycle and accounting

States: `active`, `paused`, `exhausted`, `revoked`, `expired`. API-key failure is a credential-health error; pause execution and ask the contributor to replace/revalidate it. Contributors alone may edit/revoke their grants; project maintainers can authorize tasks but cannot retrieve donor keys or enlarge donor budgets.

- Store budget/costs in integer USD microdollars; serialize large integers as strings. Keep append-only budget/usage adjustments and pricing versions.
- `available = max(0, budget_limit - settled_spend - outstanding_reservations)`. Reserve and claim under a database transaction/lock; enforce project, task, grant, and request limits. Count prior attempts in a task's cumulative cap.
- Choose the oldest eligible compatible grant (created time then ID). For the first version, reserve each run against **one grant** and one provider/model. If no single grant can cover its cap, queue as blocked; explain that combined balances do not imply compatibility. Do not silently combine keys or switch providers mid-run.
- Each request consumes a subdivision of the run reservation, not a second project deduction. Check grant status again before authorization; use a conservative input/output/tool maximum, fail closed for unknown pricing, and record provider request ID/token categories/estimated or actual cost.
- Budget decreases cannot go below settled spend plus authorized in-flight usage. Allow queued/unused holds to be cancelled and released first. Pause/revoke stops new calls immediately; already-authorized calls can still incur cost. Revocation is permanent for that grant, removes active stake value, and removes key access after in-flight settlement; historical usage remains.
- Timeouts with unknown billing keep their hold until reconciled. Retrying a job must not blindly replay a potentially billed request. Store reconciliation status and adjustment entries; provider billing can still differ from estimates.
- Planning and generation use `AiExecution` records with kind `planning` or `generation`; `task_id`/`worker_run_id` are nullable. Every call still references project, user, grant, provider, and model. Do not invent GitHub issues solely to meter bootstrap costs.

### Slice 4 — one complete issue-to-production loop

A verified GitHub webhook is persisted/deduplicated before asynchronous handling. Recheck current issue state, project membership/repository permission of the approving actor, `ai:ready`, explicit task cap, grant eligibility, and slots. Claim once, reserve funds, create a unique run/branch, then start the sandbox.

The bounded agent loop inspects the issue/code, edits files, and runs declared checks. The trusted controller validates paths, patch size, assigned branch, and current authorization before publication. Block automatic changes to workflows/security configuration. Re-run required checks in a fresh sandbox against the exact PR revision and post the result as a commit status. Queue retries reuse step identities; an explicit retry creates a new `WorkerRun`.

Require PR review and checks on public `main`, dismiss stale approvals, and keep automation out of bypass paths. Only the trusted first-commit bootstrap is exempt from PR workflow, after user approval. The worker cannot invoke a merge or production-deploy tool. The proposed automation identity and reviewer must differ (D2).

Cancellation, issue closure/label removal, credential revocation, and budget exhaustion stop future requests and terminate execution; settle known charges and release unused holds. Persist heartbeats/leases, reject stale completions, and reconcile stranded jobs. Use one run per project initially, plus a configurable global cap.

Task states are the specified `pending`, `queued`, `running`, `waiting_for_review`, `completed`, `failed`, `cancelled`, `budget_exhausted`. PR creation means waiting for review; only merge means completed. A failed deployment is a separate state. Deployment records bind project/environment to exact commit SHA, ignore stale completion events, and prevent an older queued production deployment replacing a newer release.

### Slice 5 — Stripe test payments from generated applications

Use one platform Stripe test account and one simple USD product/price per paid project. Owners/maintainers configure the product in AiFundMe. Generated apps link to an AiFundMe-hosted purchase route using an opaque product ID; the backend looks up price, project, allowed return URL, and enabled state. This keeps the Stripe key and price authority out of generated apps and avoids provisioning customer-specific Stripe credentials.

Create a local `Purchase` before creating Checkout, use its ID as the idempotency key, and include server-owned project/purchase references on the Session and PaymentIntent. A public checkout route is intentionally available to customers; apply rate limits and do not trust browser-provided amounts, metadata, or redirects. GitHub remains the only platform user login; hosted checkout may collect a customer email without creating an email/password login.

Verify Stripe signatures on raw bodies, persist/deduplicate event IDs, and process asynchronously. Use paid-state verification for success, preserve failed attempts and expired/cancelled sessions distinctly, and reconcile out-of-order events against Stripe objects. Never grant access or record revenue merely because the browser reaches a success URL. If a paid feature is gated, use a scoped purchase receipt verified by the backend; a checkout URL alone is not entitlement proof. See [Stripe fulfillment](https://docs.stripe.com/checkout/fulfillment.md?ui=full-page).

Support idempotent owner/maintainer refunds, capped by the payment's refundable remainder; record partial/full refunds and pending/failed statuses. Update successful refunds without overwriting original payments. Keep `livemode` on all records and reject live credentials/events in MVP. Stripe test money never buys AI grants, funds provider bills, or creates contributor distributions. [Stripe refunds](https://docs.stripe.com/refunds), [webhooks](https://docs.stripe.com/webhooks).

### Slice 6 — grant-budget stakes and project financials

Use **eligible full grant budget**, not remaining funds or usage. Proposed policy: valid `active` and `exhausted` grants count at their current total budget; `paused`, `revoked`, `expired`, or invalid-key grants count zero. Including exhausted grants prevents successfully consuming a contribution from erasing its allocation. These state choices are proposed because the design defines revocation/reduction but not every state.

`user stake = sum(user eligible grant budgets) / sum(all project eligible grant budgets)`

No eligible budget means no allocation. No owner bonus. For eligible Alice $10 and Bob $50, stakes are 16.67%/83.33% even if their usage differs. If Bob revokes, Alice becomes 100% of current eligible budgets while Bob's past spend and snapshots remain. Snapshots store contributing grant/budget versions, eligibility-policy version, and timestamp. Recalculate on grant/credential eligibility changes; cost corrections do not change stake unless eligibility/budget changes.

Show grant commitments, spend, outstanding holds, and available budget separately from money. Revenue reporting shows successful gross test payments, successful refunds, net receipts (`gross - refunds`), known/estimated fees separately, and after-fee receipts. Use currency minor units for Stripe amounts, not AI microdollars. Manual hosting/other expenses never affect grant balances or stake. Hypothetical payouts are optional illustrations only.

## Data and UI needed

| Area | Minimal persistent records |
| --- | --- |
| Identity | Auth user/session; `EncryptedCredential`; `GitHubOAuthCredential` credential reference, scopes, status, expiry; `ProjectMember` |
| Creation | `Project`, `ProjectProvisioning`, approved plan/version, `AiExecution`, `SourceArtifact` |
| Grants | `AiTokenGrant`, encrypted-credential reference, budget/eligibility history, `BudgetReservation`, `GrantUsage`, pricing version |
| Work | `IssueTask`, `WorkerRun`, task events and lease metadata |
| Deployments | `Deployment` with environment, SHA, provider ID/status, URL |
| Commerce | `ProjectProduct`, `Purchase`, `StripePayment`, `StripeRefund`, event-to-project mapping |
| Reporting/reliability | `StakeAllocation` snapshots, `Expense`, `WebhookDelivery`, `WorkflowDispatch`, bounded run logs, audit records |

Database uniqueness prevents duplicate repository mappings, deliveries, provider-request settlements, payment/refund records, and active issue runs. Use DB authorization and transactions as the source of truth; a job service's retries are not a substitute.

UI: GitHub sign-in/connection status; dashboard; resumable wizard; project overview/roadmap; grants and contribution history; worker activity; financials/payment history. Grant forms never expose saved keys. Use GitHub for full code review. Product settings and test-payment status remain clearly labeled.

## Verification and rollout

Add tests with each slice: project authorization, secret redaction, duplicate webhook/dispatch recovery, concurrent grant holds, pause/revoke races, budget edits, expired leases, generation retry from saved source, PR/merge state, and Stripe event replay/refunds. Use real Postgres for locking tests and provider stubs for routine AI tests; a small operator-approved real API budget validates the integrated path.

Final acceptance: Alice creates a useful app from the wizard using a $10 grant; Bob adds $50; an issue consumes metered grant usage and yields a human-reviewed PR; production changes; budget-based stakes match; a customer completes test checkout; decline and refund scenarios appear correctly. Re-run with interrupted provisioning and duplicate events. No test requires manual project setup outside AiFundMe beyond normal OAuth consent; any necessary extra authorization must be exposed as an unresolved requirement, not hidden in the demo.

Separate development, preview, and production credentials/data. Generated preview builds are untrusted and get no production secrets; use only isolated test resources. Keep bounded source/log artifacts private in Postgres with the specified retention limits. Deployments and sandbox jobs need bounded compute quotas in addition to grant budgets, since grants only authorize LLM spend.

## Immediate next implementation target

Deliver slice 0, then slice 1 and the end-to-end creation wizard. Defer dashboard polish and additional providers until that flow works. Before implementation resolve D1/D2, approve grant eligibility defaults, validate the selected GPT-6 Astra model through OpenRouter, and confirm the proposed pilot AI/compute caps. Model configuration and defaults are in D4. Account provisioning requirements are listed in [deployment.md](deployment.md).
