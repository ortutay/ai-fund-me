# AiFundMe — MVP Design Document

## 1. Overview

AiFundMe is a platform for creating, funding, and developing software applications using AI.

Users can create entirely new software projects through an in-app wizard or contribute resources to existing projects. AI agents use contributed resources to develop the software, while humans maintain control over project direction and approve code changes.

**A core product requirement is that users can create a complete, working software project entirely through the AiFundMe interface.** Users should not need to manually create or configure GitHub repositories, Vercel projects, application boilerplate, or deployment pipelines.

The core workflow is:

1. A user signs into AiFundMe using GitHub OAuth.
2. The user creates a project using the AiFundMe project creation wizard.
3. The wizard generates an initial application based on the user's description and requirements.
4. AiFundMe automatically creates and configures a public GitHub repository in the user's personal GitHub account.
5. AiFundMe automatically provisions a Vercel project and deploys the application.
6. The wizard creates initial GitHub issues to establish the development roadmap.
7. The project is initialized and accessible through AiFundMe, with a working application and deployment.
8. Users contribute AI resources through AI Token Grants.
9. Project maintainers create and prioritize GitHub issues.
10. AI workers implement approved issues using the available grants.
11. Workers submit pull requests for human review.
12. Approved changes are merged and automatically deployed.
13. The platform tracks contributions, AI expenditure, project revenue, and simulated contributor stakes.
14. Paid projects can accept customer payments through Stripe.

The initial MVP will demonstrate the complete creation, development, and payment workflows. Stripe will operate in test mode, allowing the application to demonstrate real payment integrations without moving actual money.

Cryptocurrency tokens and actual contributor profit distributions are out of scope.

## 2. MVP Goals

The MVP should demonstrate that users can create complete software projects through AiFundMe, fund those projects with AI resources, and collectively develop them using AI agents under human direction.

### Goals

- GitHub-only user authentication.
- Create complete software projects through an in-app wizard.
- Generate initial application code from a project description.
- Automatically create and configure GitHub repositories.
- Automatically provision Vercel projects and deployments.
- Automatically create initial development issues.
- Allow users to contribute LLM API access and budgets through AI Token Grants.
- Run AI workers against approved GitHub issues.
- Require human approval before code reaches production.
- Track contributions and actual AI expenditure.
- Calculate simulated contributor stakes based on AI Token Grants.
- Support Stripe payments for paid projects.
- Display project revenue, expenses, and financials.
- Demonstrate the complete payment and accounting workflow using Stripe test mode.

### Non-goals

The following are explicitly deferred:

- Google, email/password, or other authentication providers.
- GitHub Apps.
- Organization-owned GitHub repositories.
- Real-money contributor payouts.
- Live Stripe payments.
- Ethereum or other blockchain integration.
- Issuing actual ownership interests or financial securities.
- Cryptocurrency wallet integration.
- Advanced project governance and voting.
- Multiple hosting providers.
- Sophisticated accounting and tax reporting.
- Supporting every possible LLM provider.
- Automated project monetization.

## 3. Tech Stack and Integrations

### 3.1 GitHub OAuth

GitHub OAuth is the only authentication method for the MVP.

There will be no Google OAuth or email/password authentication.

GitHub OAuth will serve two purposes:

1. Authenticate users into AiFundMe.
2. Authorize AiFundMe to operate on their behalf through the GitHub API.

The OAuth token will be used for:

- Identifying the user.
- Reading GitHub profile information.
- Creating public repositories.
- Reading and modifying repository contents.
- Creating and modifying GitHub issues.
- Creating feature branches.
- Creating pull requests.
- Reading pull request and deployment-related status information.
- Configuring repository settings and webhooks where authorized.

All MVP repositories must be public and created under the user's personal GitHub account.

The initial OAuth authorization should request the minimum practical scopes, expected to include `read:user`, `user:email`, and `public_repo`. Avoid requesting access to private repositories.

The backend must:

- Store OAuth credentials securely and encrypted.
- Never expose access tokens to the browser or AI workers.
- Handle token expiration and refresh where applicable.
- Handle revoked authorization.
- Allow users to reconnect GitHub.
- Revalidate the GitHub identity on authentication.
- Handle insufficient permissions and GitHub API errors.

GitHub OAuth tokens are used through a centralized backend integration. Workers must not receive unrestricted access to the user's OAuth credentials.

A future version may migrate repository automation to a GitHub App to provide finer-grained permissions and better independent automation. This is not required for the MVP.

### 3.2 Vercel

All projects will initially be deployed through Vercel.

AiFundMe will use its own Vercel account/team and a centrally managed Vercel API token to provision projects.

Users do not need to create Vercel accounts or connect their own Vercel accounts.

Use Vercel's API and GitHub integration to provision and configure deployments automatically.

Deployment model:

- `main`: Production branch.
- Feature branches: Development branches.
- Pull requests: Automatic preview deployments.
- Production: Automatic deployment following an approved merge into `main`.

A separate shared staging environment is not required initially. Vercel preview deployments will provide the initial staging functionality.

Project deployments and usage costs should be attributable to individual AiFundMe projects wherever possible.

### 3.3 AI Providers

The platform will initially support a limited number of LLM providers, with the architecture designed to accommodate additional providers.

Each AI Token Grant specifies:

- An LLM provider.
- An API key.
- A project.
- A dollar-denominated budget limit.

Potential providers include:

- OpenAI.
- Anthropic.
- OpenRouter.

The AI integration should use a provider abstraction so additional providers can be introduced without changing the worker architecture.

The platform must track usage and costs for every LLM request.

The API key owner remains responsible for provider billing. AiFundMe's budget represents the maximum authorized usage tracked by the platform, not money deposited into AiFundMe.

### 3.4 Stripe

Stripe integration is part of the MVP.

Use Stripe test mode to demonstrate the complete payment workflow, including:

- Customer checkout.
- Successful payments.
- Failed payments.
- Payment webhooks.
- Refunds.
- Transaction history.
- Project revenue reporting.

Use Stripe Checkout for initial one-time payments. Stripe Billing can be introduced if subscription billing is needed.

The application should distinguish between test-mode transactions and actual financial transactions.

The payment integration should be designed so that switching to live mode later does not require rewriting the payment architecture.

Stripe Connect and actual contributor payouts are deferred.

### 3.5 Infrastructure

Use Vercel for generated application hosting.

The AiFundMe backend and worker infrastructure run separately from generated applications.

The worker execution environment must support:

- Checking out GitHub repositories.
- Running shell commands.
- Installing dependencies.
- Running tests.
- Editing files.
- Committing changes.
- Creating pull requests.

Worker environments must be isolated from one another.

AWS can be used for backend infrastructure and isolated worker execution if appropriate.

Avoid building a generalized hosting abstraction.

## 4. Users and Permissions

### User

A user authenticates through GitHub OAuth.

A user can:

- Create projects.
- Create AI Token Grants.
- Contribute grants to projects.
- View project activity.
- View their contributions.
- View their simulated stake allocations.
- Make test-mode payments to paid projects.

### Project Owner

The project owner creates the project and is responsible for its initial configuration.

The owner can:

- Create projects through the wizard.
- Configure project settings.
- Manage project members.
- View project financials.
- Review and approve AI-generated pull requests.
- Configure project payment settings.

The project owner does not automatically receive any stake allocation.

The project owner receives simulated stake only by contributing an AI Token Grant, just like any other contributor.

### Project Maintainer

A maintainer is authorized to direct development.

Maintainers can:

- Create and prioritize issues.
- Approve issues for AI execution.
- Cancel or stop worker tasks.
- Review pull requests.
- Approve and merge pull requests.
- View project activity and costs.

For the MVP, project owners and maintainers can have the same permissions.

### Contributor

A contributor can:

- Create AI Token Grants.
- Associate grants with projects.
- Monitor grant consumption.
- View their contributions.
- View simulated stake allocations.

Contributors cannot directly modify project settings or approve code unless they also have the maintainer role.

## 5. Project Creation Wizard

**The project creation wizard is a central feature of the MVP. It must provide an end-to-end experience for creating a complete software project without requiring users to perform manual setup in GitHub or Vercel.**

The wizard should be designed for users who may have an idea for an application but do not necessarily know how to set up a software development environment.

All project-specific creation and configuration should be initiated and managed through AiFundMe.

GitHub authorization happens through the normal GitHub OAuth login. There is no separate GitHub App installation.

Vercel provisioning uses AiFundMe's centrally managed Vercel credentials. Users do not need to authorize a separate Vercel account.

### 5.1 Project Description

The user starts by describing the application they want to build.

For example:

"Create an application similar to Miro that lets teams collaborate on an infinite canvas with sticky notes, drawings, and real-time collaboration."

The wizard should collect:

- Project name.
- Project description.
- Desired functionality.
- Target users.
- Optional technology preferences.
- License selection.

The initial description can be relatively high-level. Users should not need to specify technical architecture or create a detailed development specification.

### 5.2 AI-Assisted Project Planning

Use an AI model to convert the user's description into an initial application plan.

The generated plan should include:

- Application overview.
- Initial functionality.
- Suggested application architecture.
- Technology stack.
- Initial development milestones.
- Initial GitHub issues.
- Suggested project structure.

The user should be able to review and modify the plan before proceeding.

The wizard should present the generated plan in an accessible format rather than requiring users to edit configuration files.

### 5.3 Initial AI Token Grant

Application generation and project planning consume LLM resources.

The wizard should allow the user to create an initial AI Token Grant before application generation.

The user provides:

- LLM provider.
- API key.
- Initial budget.

This initial grant is treated exactly like any other AI Token Grant.

The project owner receives simulated stake based on this grant, with no additional owner allocation.

The grant's API key should be securely stored and used through the AiFundMe AI provider gateway.

The user should be shown the expected or maximum initial generation budget before proceeding.

### 5.4 Application Generation

Based on the approved plan, generate the initial application.

The initial codebase should include:

- Application scaffold.
- Basic UI.
- Initial application functionality.
- README.
- LICENSE.
- Basic development documentation.
- Environment configuration template.
- Standardized repository conventions.

Use a limited set of supported application templates and technology stacks initially.

The goal is to generate a working initial application, not merely an empty repository or placeholder landing page.

The wizard should show the user a preview of the generated application when practical.

### 5.5 GitHub Repository Creation

AiFundMe automatically creates a public GitHub repository through the authenticated user's GitHub OAuth authorization.

The repository is created under the user's personal GitHub account.

The platform handles:

- Repository creation.
- Repository naming.
- Initial code upload.
- Default branch configuration.
- Branch protection where available.
- Repository metadata.
- Initial README and license.

The user should not need to manually create a repository, upload code, configure branches, or configure GitHub integrations.

For the MVP, organization-owned repositories are not supported.

### 5.6 Vercel Project Creation and Deployment

AiFundMe automatically provisions a Vercel project and connects it to the newly created GitHub repository.

The platform handles:

- Vercel project creation.
- GitHub repository connection.
- Production branch configuration.
- Build configuration.
- Environment variable configuration.
- Initial deployment.
- Preview deployment configuration.

Use AiFundMe's centralized Vercel account and API credentials.

If the generated application requires configuration or secrets, the wizard should collect them from the user through the AiFundMe interface.

Do not expose production secrets to AI workers.

The wizard should verify that the initial deployment succeeds and display the resulting application URL.

### 5.7 Initial GitHub Issues

The wizard creates an initial set of GitHub issues based on the approved project plan.

These issues should represent the initial development roadmap.

Issues can range from high-level product milestones to specific implementation tasks.

For example:

- Implement user authentication.
- Create the main application dashboard.
- Implement collaborative canvas functionality.
- Add persistent storage.
- Improve mobile responsiveness.

The user should be able to review and modify the proposed issues before they are created.

Issue creation is handled through the GitHub API. Users do not need to manually create these issues in GitHub.

### 5.8 Project Initialization

After successful setup, AiFundMe creates and associates:

- Project record.
- Project owner.
- Initial maintainers.
- GitHub repository.
- Vercel project.
- Production deployment.
- Initial AI Token Grant.
- Initial issues.

The user is redirected to the new project's dashboard within AiFundMe.

The project dashboard should display:

- Application preview or production URL.
- GitHub repository link.
- Initial roadmap.
- Project status.
- Available AI Token Grants.
- Recent activity.

At this point, the project should be usable as an application and ready for further AI-assisted development.

The user should not need to leave AiFundMe to complete any project-specific setup.

### 5.9 Provisioning Status and Failure Handling

Project creation involves multiple external services and may take time.

The wizard must show progress through the provisioning process.

Suggested steps:

1. Generating application plan.
2. Configuring initial AI Token Grant.
3. Generating application code.
4. Creating GitHub repository.
5. Uploading initial code.
6. Creating Vercel project.
7. Deploying application.
8. Creating initial GitHub issues.
9. Finalizing project.

The provisioning workflow must:

- Be asynchronous.
- Persist progress.
- Support retrying failed steps.
- Avoid creating duplicate repositories or projects on retries.
- Preserve successful work if a later step fails.
- Allow users to resume an interrupted setup.
- Clearly display actionable errors.
- Record LLM costs incurred during project generation.

For example, if Vercel deployment fails after GitHub repository creation, the user should be able to retry deployment without creating another repository.

Maintain an internal provisioning record containing the status of each step and associated external resource identifiers.

## 6. AI Token Grants

AI Token Grants are the primary mechanism for contributing resources to a project.

A grant consists of:

1. An LLM provider API key.
2. A project designation.
3. A dollar-denominated budget limit.

For example, Alice can create a grant for Project X using her OpenAI API key with a maximum budget of $100.

The project can then use that API key for AI development, subject to the grant's budget.

### 6.1 Grant Creation

The user selects:

- Project.
- LLM provider.
- API key.
- Maximum dollar budget.

Each grant belongs to one user and one project.

A user can create multiple grants for the same project, including grants using different providers.

### 6.2 Grant Management

A grant should have the following states:

- `active`
- `paused`
- `exhausted`
- `revoked`
- `expired`

Users should be able to:

- View grant usage.
- View remaining budget.
- Pause a grant.
- Revoke a grant.
- Increase or decrease its budget, subject to available funds and prior usage.

A grant's budget must not be exceeded by authorized worker requests.

### 6.3 API Key Security

API keys must never be stored as ordinary plaintext database fields.

Use encrypted credential storage backed by a dedicated secrets-management system.

Requirements:

- Encrypt API keys at rest.
- Restrict access to credentials.
- Never expose API keys in application responses or logs.
- Support revocation.
- Ensure workers cannot access credentials belonging to other projects.
- Do not give workers unrestricted access to the entire credential store.

Route LLM requests through a controlled platform-side gateway that retrieves credentials, enforces budgets, and records usage.

Workers should not receive raw provider API keys.

### 6.4 Grant Budget Enforcement

Each grant has a maximum authorized budget.

The platform must:

- Track actual LLM usage.
- Reserve budget before authorizing requests.
- Enforce per-request spending limits.
- Enforce task-level budgets.
- Prevent concurrent requests from collectively exceeding the available grant budget.
- Stop authorizing additional requests when the budget is exhausted.

Provider-side spending limits should be treated as supplemental safeguards, not the primary enforcement mechanism.

Because provider billing and usage reporting may be delayed, the platform should reconcile estimated usage against actual provider charges where possible. The platform's budget limit is an authorization control, not a guarantee that a provider will never report a delayed or additional charge.

### 6.5 Usage Accounting

Every LLM request must generate a usage record.

Store:

- Grant ID.
- User ID.
- Project ID.
- Task ID.
- Worker run ID.
- Provider.
- Model.
- Input tokens.
- Output tokens.
- Actual or estimated dollar cost.
- Timestamp.

Costs should be calculated using versioned provider pricing information.

Where provider cost information is not immediately available, record estimated costs and reconcile them later.

Do not silently overwrite historical usage records when provider pricing changes.

### 6.6 Grant Selection

When a worker needs to make an LLM request, the platform selects an eligible grant associated with the project.

Initially, a simple grant-selection policy is sufficient.

The platform should consider:

- Whether the grant is active.
- Whether the grant has sufficient remaining budget.
- Whether the provider supports the selected model.
- Whether the task is permitted to use that grant.

For the MVP, maintain a simple, transparent grant-selection strategy rather than implementing sophisticated optimization.

## 7. AI Worker Architecture

AI workers are responsible for implementing software changes in response to GitHub issues.

The worker system should be an asynchronous task-processing system.

### 7.1 Task Selection

Workers only operate on GitHub issues explicitly approved for AI execution.

Use a GitHub label:

`ai:ready`

A maintainer applies this label to indicate that an issue is ready for a worker.

Additional useful labels:

- `ai:in-progress`
- `ai:review`
- `ai:blocked`
- `ai:failed`

The platform monitors GitHub webhooks and schedules tasks when an issue becomes eligible.

### 7.2 Task Requirements

An issue should ideally include:

- Description of the requested work.
- Acceptance criteria.
- Optional priority.
- Maximum AI budget.
- Relevant dependencies.

A task must have an explicitly configured maximum budget before execution begins.

### 7.3 Worker Lifecycle

The worker lifecycle:

1. Identify an eligible GitHub issue.
2. Verify project funding through active AI Token Grants.
3. Reserve the maximum task budget against an eligible grant or grants.
4. Claim the issue so another worker cannot execute it simultaneously.
5. Create a dedicated feature branch.
6. Check out the repository using backend-authorized GitHub access.
7. Analyze the issue and existing code.
8. Implement the requested changes.
9. Run applicable tests.
10. Commit changes to the feature branch.
11. Create a GitHub pull request.
12. Record execution results and AI expenditure.
13. Release unused budget reservations.

The worker must not directly commit to `main` or deploy to production.

GitHub operations should be performed through a centralized backend integration using the authenticated user's authorized credentials. The worker runtime should receive only the repository access needed for its current task.

### 7.4 Human Review

All AI-generated code requires human approval.

A maintainer can:

- Approve and merge the PR.
- Request changes.
- Reject the PR.
- Close the associated issue.
- Request another worker attempt.

The initial MVP does not need an elaborate review interface. GitHub's existing pull request workflow should be used.

The platform should detect when a PR is merged or closed and update its internal task state.

### 7.5 Worker States

Each worker task should have one of the following states:

- `pending`
- `queued`
- `running`
- `waiting_for_review`
- `completed`
- `failed`
- `cancelled`
- `budget_exhausted`

A task is considered completed only after the associated pull request has been merged.

### 7.6 Task Scheduling

Initially use a simple priority queue.

Requirements:

- Only one worker can claim a particular issue at a time.
- Configurable maximum concurrent workers per project.
- Configurable maximum concurrent workers globally.
- Maintainers can cancel tasks.
- Failed tasks can be retried.
- Each retry creates a separate worker run.
- Workers respect project, grant, and task budgets.

### 7.7 Worker Isolation and Security

Workers execute code from public repositories and must be treated as untrusted execution environments.

Requirements:

- Ephemeral execution environments.
- Isolation between projects and worker runs.
- No production deployment secrets exposed to workers.
- Restricted GitHub access.
- No direct access to other projects' credentials.
- CPU, memory, storage, and execution-time limits.
- Restricted network access where practical.
- Execution logs retained for auditing.

GitHub issue descriptions, repository files, and other project-provided content must be treated as untrusted inputs to the AI agent.

## 8. Contributions and Simulated Stakes

All simulated contributor allocations are based exclusively on AI Token Grants.

There is no automatic allocation to the project owner.

The project owner, maintainers, and other users all follow exactly the same allocation rules.

A person receives simulated stake only by creating an eligible AI Token Grant.

### 8.1 Grant-Based Allocation

Each AI Token Grant has a budget that represents the contributor's commitment to the project.

For the MVP, simulated stake is proportional to the total eligible grant budgets associated with a project.

Formula:

`Contributor Stake = Contributor Eligible Grant Budget / Total Eligible Grant Budget for Project`

Example:

| Contributor | Eligible grant budget | Simulated stake |
|---|---:|---:|
| Alice | $100 | 10% |
| Bob | $400 | 40% |
| Carol | $500 | 50% |
| Total | $1,000 | 100% |

The project owner receives no automatic allocation. If the owner creates an eligible AI Token Grant, that grant is included in the same calculation.

For the MVP, grant budget rather than actual AI expenditure determines the allocation weight. Actual expenditure is tracked separately.

The platform should recalculate simulated allocations whenever eligible grant budgets change.

Revoking or reducing a grant should remove the corresponding eligible grant value from the active allocation calculation. Historical allocation snapshots should be preserved.

These percentages are illustrative product data only. They do not represent actual equity, ownership, securities, or legally enforceable financial entitlements.

### 8.2 Contribution History

For each contributor and project, display:

- Total grant budget committed.
- Total AI expenditure funded.
- Remaining grant budget.
- Active grants.
- Revoked or expired grants.
- Current simulated stake percentage.
- Historical allocation changes.

### 8.3 Allocation History

Stake allocation changes must be versioned.

Preserve historical records so the platform can show how allocations changed as grants were added, modified, or revoked.

## 9. Stripe Payments and Project Revenue

Stripe integration is an important part of the MVP.

The purpose is to demonstrate that applications developed through AiFundMe can accept payments and that project revenue is tracked by the platform.

Stripe will initially operate in test mode.

This is a real Stripe integration using actual payment APIs and webhook workflows, but test-mode payments do not transfer actual money.

### 9.1 Payment Use Cases

The MVP should support paid projects accepting customer payments.

For example:

- A project offers a paid application or service.
- A customer visits the deployed application.
- The customer completes a Stripe Checkout flow.
- Stripe processes the test-mode transaction.
- AiFundMe receives the resulting webhook.
- The payment is associated with the correct project.
- Project revenue is updated.

Use Stripe Checkout for initial one-time payments.

Subscription billing can be introduced later if needed.

### 9.2 Payment Flow

1. Customer initiates checkout in a project application.
2. Project application requests a checkout session from the appropriate Stripe integration.
3. AiFundMe creates the Stripe Checkout Session in test mode.
4. Customer completes the payment using a Stripe test payment method.
5. Stripe sends a webhook to AiFundMe.
6. AiFundMe verifies the webhook signature.
7. The payment is recorded.
8. Project financials are updated.
9. The customer is redirected to a success or failure page.

Payment records should be idempotent. Repeated webhook deliveries must not create duplicate financial transactions.

### 9.3 Payment Records

Track:

- Stripe payment ID.
- Project ID.
- Customer reference.
- Amount.
- Currency.
- Payment status.
- Payment type.
- Payment date.
- Refund status.
- Associated Stripe Checkout Session.

Support at least:

- Successful payments.
- Failed payments.
- Refunds.
- Duplicate webhook deliveries.

### 9.4 Stripe Configuration

Use Stripe test mode for all prototype transactions.

Store Stripe credentials securely.

Use webhook signature verification.

Keep test-mode and live-mode configuration separate.

The application architecture should support switching to live mode later without changing the underlying payment workflow.

Stripe Connect and actual payment transfers to project owners or contributors are deferred.

### 9.5 Financial Distinction

AI Token Grants and Stripe payments are separate systems.

**AI Token Grants** provide access to an LLM API key and an authorized spending budget for project development. The provider bills the API key owner directly.

**Stripe payments** represent customer revenue earned by a project application.

Grant usage is not a Stripe payment, and a grant does not create a cash balance in AiFundMe.

Likewise, project revenue is not automatically distributed to contributors.

## 10. Project Financials

Every project should have a Financials page.

The MVP financial dashboard provides visibility into AI resources contributed, AI expenditure, hosting costs, and project revenue.

### 10.1 Financial Categories

Track separately:

**AI development costs**
- LLM usage.
- Provider.
- Model.
- Associated worker task.
- Associated AI Token Grant.

**Hosting costs**
- Vercel.
- Other infrastructure costs when applicable.

**Other project expenses**
- Third-party API costs.
- Domains.
- Other services.

**Revenue**
- Stripe customer payments.
- Refunds.
- Net payment receipts.

**Payment processing fees**
- Stripe fees where available or otherwise manually estimated.

### 10.2 Financial Dashboard

Display:

- Total AI Token Grant budgets.
- Total actual AI expenditure.
- Remaining grant budgets.
- Total hosting expenses, when available.
- Other project expenses.
- Gross revenue.
- Refunds.
- Net payment receipts.
- Simulated contributor allocations.

AI development costs must be shown separately from ongoing hosting costs.

The prototype does not need a full double-entry accounting system. Maintain sufficiently detailed transaction records to support later accounting upgrades.

### 10.3 Revenue and Payouts

For the MVP, track Stripe test-mode payments and refunds.

Display simulated project financial results.

Actual contributor payouts are out of scope.

The dashboard may display hypothetical payout calculations based on simulated revenue and contributor stakes, but no actual distributions or financial obligations will be created.

## 11. GitHub Repository Conventions

All repositories should follow consistent conventions.

### Branches

- `main`: Production.
- `feature/<slug>`: New feature development.
- `fix/<slug>`: Bug fixes.

Workers create dedicated branches for each issue.

### Pull Requests

AI-generated PRs should include:

- Associated GitHub issue.
- Summary of changes.
- Implementation details.
- Tests performed.
- Test results.
- AI expenditure.
- Any known limitations.

### Branch Protection

The production branch must require pull request approval where supported.

Automated checks should run before merging.

Workers must not bypass branch protection.

### GitHub Webhooks

The platform should process relevant GitHub events, including:

- Issues created or updated.
- Issue labels changed.
- Issues closed.
- Pull requests opened.
- Pull requests merged or closed.
- CI checks completed.

Webhook signatures must be validated.

Webhook deliveries should be processed asynchronously and deduplicated.

Webhooks are configured using the user's authorized GitHub OAuth access. If authorization is revoked, the platform should detect the failure and prompt the user to reconnect.

## 12. Deployment

Each project has one Vercel project.

Project creation and configuration are handled through the AiFundMe wizard using AiFundMe's centrally managed Vercel account.

Deployment behavior:

- Merging into `main` triggers production deployment.
- Pull requests trigger preview deployments.
- Feature branches can have preview deployments.
- Production deployment status is tracked by AiFundMe.

The platform should display:

- Production URL.
- Latest deployment.
- Deployment status.
- Associated GitHub commit or PR.
- Preview URLs where available.

Project deployment configuration and production secrets must remain separate from worker execution credentials.

## 13. Data Model

The initial data model should include the following entities.

### User

- id
- github_user_id
- github_username
- email
- created_at
- updated_at

GitHub is the only identity provider in the MVP.

### GitHubOAuthCredential

- id
- user_id
- encrypted_access_token
- encrypted_refresh_token, if applicable
- token_expires_at
- authorized_scopes
- status
- created_at
- updated_at

Stores the user's encrypted GitHub OAuth credentials.

Credentials must never be returned to the browser or exposed to workers.

### Project

- id
- owner_id
- name
- description
- github_repository_id
- github_repository_url
- vercel_project_id
- production_url
- status
- created_at
- updated_at

### ProjectProvisioning

- id
- project_id
- status
- current_step
- github_repository_id
- vercel_project_id
- error_message
- created_at
- updated_at
- completed_at

Tracks asynchronous wizard execution and external resource creation.

Provisioning steps should be independently retryable and idempotent.

### ProjectMember

- id
- project_id
- user_id
- role

Roles initially include `owner` and `maintainer`.

### AiTokenGrant

- id
- user_id
- project_id
- provider
- encrypted_credential_reference
- budget_limit
- reserved_amount
- spent_amount
- status
- created_at
- updated_at
- expires_at

Each grant represents an API key authorized for a specific project and dollar budget.

The actual credential is stored securely outside ordinary database fields.

### GrantUsage

- id
- grant_id
- project_id
- task_id
- worker_run_id
- provider
- model
- input_tokens
- output_tokens
- estimated_cost
- actual_cost
- created_at

### IssueTask

- id
- project_id
- github_issue_id
- github_issue_number
- status
- priority
- budget_limit
- reserved_amount
- spent_amount
- created_at
- updated_at

### WorkerRun

- id
- task_id
- status
- branch_name
- pull_request_url
- started_at
- completed_at
- error_message

An issue may have multiple worker runs.

### Expense

- id
- project_id
- category
- provider
- amount
- description
- date

Used for hosting and other non-LLM expenses.

### StripePayment

- id
- project_id
- stripe_payment_id
- checkout_session_id
- customer_reference
- amount
- currency
- status
- payment_type
- created_at

### StripeRefund

- id
- payment_id
- stripe_refund_id
- amount
- status
- created_at

### StakeAllocation

- id
- project_id
- user_id
- eligible_grant_budget
- stake_percentage
- allocation_version
- created_at

Maintains the historical simulated stake allocation.

### Additional Entities

Additional entities can be introduced as needed for:

- Vercel deployment history.
- Webhook processing and deduplication.
- Audit logs.
- Worker task events.
- Payment processing reconciliation.
- Grant budget adjustments.

## 14. Backend Architecture

The backend should be organized around the following components.

### API Server

Responsible for:

- GitHub OAuth authentication.
- User management.
- Project management.
- Project provisioning.
- Contribution management.
- AI Token Grant management.
- Budget management.
- Payment session creation.
- Financial reporting.

### GitHub Integration

Responsible for:

- GitHub OAuth authorization.
- GitHub API operations using user-authorized credentials.
- Repository creation.
- Repository access.
- Issue synchronization.
- Pull request management.
- Webhook creation and ingestion.

All GitHub operations should be performed through a centralized backend integration. Avoid distributing OAuth credentials to different services or workers.

### Project Provisioning Service

Responsible for the project creation wizard's asynchronous workflow.

Responsibilities include:

- Generating initial application code.
- Creating GitHub repositories.
- Uploading initial code.
- Configuring repository settings.
- Creating Vercel projects.
- Configuring deployments.
- Creating initial GitHub issues.
- Tracking provisioning progress.
- Retrying failed provisioning steps.

This service ensures the wizard can create an entire project without requiring manual operations in external services.

### AI Provider Gateway

Responsible for:

- Secure credential retrieval.
- Provider API calls.
- Model selection.
- Budget enforcement.
- Usage metering.
- Cost calculation.

All worker LLM requests should pass through this component.

### Worker Scheduler

Responsible for:

- Identifying approved issues.
- Checking active grants.
- Reserving budgets.
- Claiming tasks.
- Scheduling worker execution.
- Managing retries and concurrency.

### Worker Runtime

Responsible for:

- Checking out repositories.
- Executing AI development workflows.
- Running tests.
- Creating branches and pull requests.
- Reporting usage and task results.

The worker runtime receives limited, task-specific GitHub access rather than unrestricted access to user OAuth tokens.

### Stripe Integration

Responsible for:

- Creating Checkout Sessions.
- Processing Stripe webhooks.
- Recording successful and failed payments.
- Processing refund events.
- Updating project revenue records.

### Usage and Financial Tracking

Responsible for:

- Recording AI Token Grant usage.
- Calculating AI costs.
- Tracking hosting and other expenses.
- Recording Stripe payments and refunds.
- Maintaining simulated stake allocations.
- Generating project financial reports.

These components can initially be implemented as a small number of services. Avoid premature microservice decomposition.

Use a persistent database as the source of truth for task state, provisioning state, OAuth credentials, grant budgets, usage, payments, contributions, and simulated allocations.

Use an asynchronous queue for background jobs.

## 15. MVP User Interface

The initial product should have the following pages.

### Dashboard

Displays:

- Projects owned.
- Projects contributed to.
- Recent project activity.
- Active AI Token Grants.
- Recent worker activity.

Provides a prominent action to create a new project through the wizard.

### Authentication

A single GitHub sign-in button.

There are no Google, email/password, or other authentication methods in the MVP.

After authentication, the application should display the connected GitHub username and connection status.

### Project Creation Wizard

The wizard is a first-class application interface.

It should let users:

- Describe an application idea.
- Review an AI-generated application plan.
- Select an initial technology stack.
- Select a software license.
- Create an initial AI Token Grant.
- Preview generated application code or functionality where practical.
- Initiate automatic repository creation.
- Initiate automatic deployment.
- Review proposed GitHub issues.
- Monitor project provisioning progress.

Users should not need to manually create repositories, configure deployments, install GitHub Apps, or create initial issues.

### Project Page

Displays:

- Project description.
- Application preview or production URL.
- GitHub repository.
- Deployment status.
- Maintainers.
- Total grant budgets.
- Available AI budget.
- Recent issues and pull requests.
- Project activity.

### AI Token Grants Page

Displays:

- Grants created by the user.
- Associated projects.
- LLM provider.
- Budget limit.
- Amount consumed.
- Remaining budget.
- Grant status.

Users can create, pause, modify, and revoke grants.

### Contributions Page

Displays:

- Amount of AI Token Grant budget contributed to each project.
- Actual AI expenditure funded.
- Remaining grant budgets.
- Simulated stake percentage.
- Historical grant activity.

### Financials Page

Displays:

- Total AI Token Grant budgets.
- Actual AI expenses.
- Hosting expenses.
- Other expenses.
- Stripe gross revenue.
- Refunds.
- Net payment receipts.
- Simulated contributor allocations.

### Worker Activity Page

Displays:

- Active tasks.
- Queued tasks.
- Completed tasks.
- Failed tasks.
- Associated GitHub issues.
- Pull requests.
- AI expenditure.

### Payment History Page

Displays:

- Successful test payments.
- Failed payments.
- Refunds.
- Associated project.
- Amount and currency.
- Stripe transaction reference.

The initial UI should complement GitHub rather than recreate its issue and code-review functionality.

## 16. Prototype Milestones

### Milestone 1: GitHub Authentication and Project Creation

- GitHub OAuth authentication.
- Secure OAuth credential storage.
- GitHub API integration.
- Project creation wizard.
- AI-assisted project planning.
- Initial application generation.
- Public repository creation under the user's personal GitHub account.
- Vercel project creation using AiFundMe's Vercel account.
- Initial deployment.
- Initial GitHub issues.
- Provisioning progress and error handling.

**Acceptance criterion:** A user signs in with GitHub, describes an application, reviews an AI-generated plan, and creates a complete working application through AiFundMe. The platform automatically creates the GitHub repository, provisions Vercel, deploys the application, and creates initial issues. No manual GitHub or Vercel project setup is required.

### Milestone 2: AI Token Grants

- Grant creation.
- Provider selection.
- Secure API key storage.
- Project association.
- Dollar budget configuration.
- Grant usage tracking.
- Grant revocation.
- Budget reservation and enforcement.

**Acceptance criterion:** A user can create an AI Token Grant using an API key and budget, and the project can use it for authorized AI requests without exceeding the platform-enforced budget.

### Milestone 3: AI Worker Execution

- GitHub webhook integration.
- Issue eligibility through `ai:ready`.
- Worker scheduler.
- Isolated worker execution.
- LLM provider gateway.
- Grant selection.
- Budget enforcement.
- Feature branch creation.
- Pull request creation.
- Usage tracking.

**Acceptance criterion:** A maintainer can approve an issue and have an AI worker implement it using an eligible AI Token Grant and create a pull request with tracked expenditure.

### Milestone 4: Human Review and Deployment

- PR status synchronization.
- Human review workflow.
- Merge detection.
- Vercel deployment tracking.
- Task completion tracking.

**Acceptance criterion:** A maintainer can review and merge an AI-generated PR, resulting in an updated production deployment.

### Milestone 5: Stripe Payments

- Stripe test-mode integration.
- Checkout Session creation.
- Customer checkout flow.
- Payment webhooks.
- Payment records.
- Failed payment handling.
- Refund handling.
- Project revenue reporting.

**Acceptance criterion:** A customer can complete a test-mode payment for a paid project, and AiFundMe correctly records the payment and updates the project's financial dashboard. Refunds and failed payments must also be represented correctly.

### Milestone 6: Simulated Economics

- Grant-based stake calculations.
- No automatic project-owner allocation.
- Historical stake records.
- Financial dashboard improvements.
- Simulated revenue and payout calculations.

**Acceptance criterion:** The platform can show how AI Token Grants translate into hypothetical contributor allocations and how project revenue could eventually be distributed.

## 17. Open Questions and Future Decisions

The following decisions do not need to block the prototype but should be revisited before production.

### GitHub Integration

- Should repositories eventually support organization-owned GitHub accounts?
- When should GitHub OAuth be replaced or supplemented by a GitHub App?
- How should the platform handle users who revoke OAuth authorization?
- How should ownership be transferred if a project owner leaves?

### AI Token Grants

- Which LLM providers should be supported first?
- How should grant budget changes affect historical simulated allocations?
- Can a contributor transfer a grant between projects?
- Should grants expire?
- Should an unused grant be fully revocable?
- How should provider billing discrepancies be reconciled?
- What happens when a provider's API key becomes invalid?

### Financial and Legal Structure

- What legal structure governs contributor financial rights?
- Does the project operate through its own legal entity?
- Who owns and operates the project?
- What rights do contributors receive?
- How are actual contributions and financial upside structured?
- What regulatory requirements apply?
- Which payment providers will support the model?
- What Stripe configuration will be appropriate for live payments?

### Payments

- Will projects eventually use their own Stripe accounts?
- Will AiFundMe operate as the payment intermediary?
- Will Stripe Connect be needed?
- Who is responsible for refunds and chargebacks?
- How will customer payments be allocated to project owners?
- How will actual contributor distributions work?

### AI Workers

- Which agent framework should be used?
- What is the preferred worker execution infrastructure?
- How should large, high-level issues be decomposed?
- Should multiple agents collaborate on a single issue?
- How should task retries and partial failures be handled?

### Project Governance

- Can contributors become maintainers?
- Can project ownership be transferred?
- How are maintainers appointed or removed?
- How are disputes between project stakeholders resolved?

These should be addressed incrementally as the product moves beyond the prototype.

## 18. Definition of MVP Success

The prototype is successful when the following end-to-end scenario works:

1. Alice signs into AiFundMe using GitHub OAuth.
2. Alice describes a new application through the project creation wizard.
3. AiFundMe generates an application plan and Alice approves it.
4. Alice provides an initial AI Token Grant consisting of her LLM API key and a $10 budget.
5. AiFundMe generates the initial application.
6. AiFundMe automatically creates a public GitHub repository under Alice's personal GitHub account.
7. AiFundMe automatically creates a Vercel project and deploys the application.
8. AiFundMe creates the initial GitHub issues.
9. Alice is redirected to her new project's AiFundMe dashboard.
10. Bob signs into AiFundMe using GitHub OAuth.
11. Bob creates another AI Token Grant for the project using his LLM API key and a $50 budget.
12. Alice creates a GitHub issue describing a new feature.
13. Alice marks the issue `ai:ready`.
14. An AI worker claims the issue and begins development.
15. The worker uses an eligible grant through the AI provider gateway, respecting its budget.
16. The worker modifies the code, runs tests, and opens a pull request.
17. Alice reviews and merges the pull request.
18. Vercel automatically deploys the updated application.
19. AiFundMe records AI expenditure against the appropriate grants.
20. The project displays the grant budgets, actual AI costs, and simulated contributor stake allocations.
21. A customer purchases the paid application using Stripe test mode.
22. AiFundMe records the payment and updates the project's revenue and financial dashboard.

The central product proposition is demonstrated when a user can create an entire application through AiFundMe, receive AI Token Grants from multiple contributors, develop the application through AI workers under human direction, accept customer payments, and transparently track contributions, development activity, costs, revenue, and simulated contributor allocations.