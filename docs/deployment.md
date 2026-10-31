# Accounts, API keys, and deployment

The scaffold and mocked feature development need no live keys. For the functional MVP use GitHub, Vercel, OpenRouter, and Stripe; provision **Neon Postgres through Vercel Marketplace**. No AWS, Inngest, or Blob setup is required. All repositories are public and MIT; the default model is configurable GPT-6 Astra via OpenRouter.

## Values to provide or connect

| Service | Values/access | Purpose |
| --- | --- | --- |
| GitHub | Local `gh`/SSH login and destination owner/name | Push the public platform repo |
| GitHub OAuth | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | GitHub-only login and personal public-repo automation |
| Vercel | `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, platform `VERCEL_PROJECT_ID` | Provision generated apps and Sandbox access |
| Postgres via Vercel | `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | Application data and migrations; integration can populate connection settings |
| OpenRouter | A funded test key with a small budget | Initial test grant for planning/generation/worker calls |
| Stripe test account | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Test Checkout, payment events, refunds |

Generate locally: `BETTER_AUTH_SECRET`, `CREDENTIAL_ENCRYPTION_KEY_BASE64`, and `CRON_SECRET`. Use different random values for each. Per-repository GitHub webhook secrets are generated during provisioning and encrypted in the DB. Set `VERCEL_WEBHOOK_SECRET` when registering deployment webhooks, if used.

Credentials go in Git-ignored `.env.local` and Vercel environment settings, not chat or source control. [`.env.example`](../.env.example) contains the same variable names without values. No separate API key is needed for hosted Vercel Workflow; Sandbox uses Vercel OIDC. Local Sandbox access may need a short-lived OIDC token from Vercel CLI.

## Vercel and Postgres

Use a dedicated Vercel Pro team with default `.vercel.app` domains. Import the platform's public GitHub repo using Next.js, root `.`, Node.js 22.x, `npm run build`, and `main`. A token is unnecessary for this initial dashboard import, but necessary for automated generated-project provisioning.

In Vercel Marketplace/Storage, connect a Neon Postgres integration to the platform project. Map its pooled development connection to `DATABASE_URL` and direct migration connection to `DATABASE_URL_UNPOOLED`; inspect the integration's generated names rather than assuming they match. Use separate development and production database branches/credentials. New databases use a marketplace provider; the old native Vercel Postgres product is no longer available. [Postgres documentation](https://vercel.com/docs/postgres).

Enable/test Workflow and Sandbox in the same Vercel team. Workflow handles durable steps, waits, and retries; Sandbox runs untrusted code. Add a small Cron cleanup/reconciliation route protected by `CRON_SECRET`. There is no Inngest account or custom Cron agent execution loop. [Workflow](https://vercel.com/docs/workflows), [Cron management](https://vercel.com/docs/cron-jobs/manage-cron-jobs).

The generated-repository deployment and PR-identity constraints remain in [integration decisions](integration-decisions.md); simplifying hosting does not remove those permission boundaries.

## Encryption and artifacts

Encrypt retained OAuth/provider credentials in Postgres using AES-256-GCM with a new nonce on each encryption. Save ciphertext, nonce, tag, key version, and scope metadata. Keep the random 32-byte base64 encryption key in server environment settings, separate from the database and auth secret. Bind credential ID/type/ownership as authenticated associated data. Never expose plaintext through APIs, logs, workflow checkpoints, or sandboxes.

Generate the encryption key with `openssl rand -base64 32`; save it securely and keep it stable across redeployments. Do not casually regenerate it: existing encrypted records would become unreadable. Plan explicit rotation with old/new versions and safe key recovery alongside database backups. Use independent keys for development and production. The user's request for DB encryption supersedes the pasted specification's dedicated secrets-manager requirement.

Small compressed source artifacts and redacted logs also reside in Postgres with size/retention limits; published source lives in GitHub. They contain no credentials. No Blob/object-storage token is needed.

## GitHub OAuth

Create separate development/production OAuth registrations. Local callback: `http://localhost:3000/api/auth/callback/github`; production callback: `https://<platform-domain>/api/auth/callback/github`. Set `BETTER_AUTH_URL` accordingly.

Request `read:user`, `user:email`, `public_repo`, validate granted scopes, and support reconnect. No private `repo` scope or GitHub App credentials. The public-repo scope includes hooks; initial generated checks run in sandboxes instead of uploading Actions workflows that require an extra `workflow` scope. [GitHub scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps).

User OAuth tokens come from login, not manual entry. If the proposed separate automation account is adopted, connect it through OAuth too; its token is encrypted in the same DB credential table.

## OpenRouter

Set `AI_DEFAULT_MODEL=openai/gpt-6-astra`. Validate account access and current rates before use; record the resolved model per run and permit approved project overrides. [OpenRouter model](https://openrouter.ai/openai/gpt-6-astra).

Use `OPENROUTER_TEST_API_KEY` only for explicit local integration tests backed by a test grant. Production contributors enter keys through grant forms and those keys are encrypted in Postgres. There is no shared production fallback key, direct OpenAI key, or provider admin key. A provider-side cap supplements the app's grant/task/request limits.

## Stripe

Use one platform test account/sandbox, one-time USD hosted Checkout initially. `STRIPE_SECRET_KEY` is a test restricted key (`rk_test_`) with the required Checkout/payment/refund permissions or a test secret key (`sk_test_`). Never use live keys in MVP. A hosted redirect needs no publishable key unless a later UI uses Stripe.js/Elements. [Stripe keys](https://docs.stripe.com/keys).

Register `/api/webhooks/stripe` and copy its separate `whsec_` signing secret. Local Stripe CLI forwarding supplies a different local signing secret. Verify raw-body signatures, event IDs, project ownership, and `livemode=false`. Generated apps use a public product identifier and central purchase route; no Stripe secret is placed in generated code.

Test successful/declined payments, cancelled/expired sessions, repeated/out-of-order events, and partial/full/pending/failed refunds. Record paid state from Stripe, not browser redirects. Test revenue does not purchase grants or pay contributors. [Stripe testing](https://docs.stripe.com/testing).

## Setup order

1. Push public MIT scaffold and deploy it on Vercel.
2. Connect Postgres in Vercel; fill OAuth values and generated auth/encryption/cron secrets.
3. Enable Workflow/Sandbox, supply the Vercel provisioning token, and verify the service boundaries.
4. Supply a budgeted OpenRouter test grant; validate the complete creation and worker flows.
5. Add Stripe test keys and validate checkout/refunds.

Migrate the database in an explicit release step. Give untrusted PRs and generated previews no production credentials. Keep API keys and encryption keys out of workflow arguments/results. No additional infrastructure should be added until an observed MVP limit justifies it.
