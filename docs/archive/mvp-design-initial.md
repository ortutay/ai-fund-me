# AiFundMe — MVP Design Document

## 1. Overview

AiFundMe is a platform for crowdfunding and developing software applications using AI.

Users can create projects or contribute resources to existing projects. AI agents use those resources to develop the software, while humans maintain control over project direction and approve code changes.

The core workflow is:

1. A user creates a project.
2. The platform creates a GitHub repository and deploys an initial application.
3. Users contribute AI credits to the project.
4. Project maintainers create and prioritize GitHub issues.
5. AI workers implement approved issues.
6. Workers submit pull requests for human review.
7. Approved changes are merged and automatically deployed.
8. The platform tracks contributions, AI expenditure, and simulated contributor stakes.

The initial MVP will focus on proving this workflow. Real-money crowdfunding, cryptocurrency tokens, and automated payouts are explicitly out of scope.

## 2. MVP Goals

The MVP should demonstrate that multiple people can fund an application and collectively develop it using AI agents, while retaining human control over the direction and quality of the project.

### Goals

- Allow users to create and manage projects.
- Integrate with GitHub for repositories, issues, and pull requests.
- Automatically deploy projects through Vercel.
- Allow users to allocate AI credits to projects.
- Run AI workers against approved GitHub issues.
- Require human approval before code reaches production.
- Track contributions and actual AI expenditure.
- Display project financials and simulated contributor stakes.

### Non-goals

The following are explicitly deferred:

- Real-money crowdfunding.
- Real-money contributor payouts.
- Ethereum or other blockchain integration.
- Issuing actual ownership interests or financial securities.
- Stripe Connect and marketplace payment processing.
- Supporting multiple LLM providers.
- User-provided API keys (BYOK).
- Multiple hosting providers.
- Advanced project governance and voting.
- Sophisticated accounting and tax reporting.
- Automated project monetization.

The prototype will use simulated credits and stakes to demonstrate the economic model without creating real financial obligations.

## 3. Tech Stack and Integrations

### GitHub

All projects must be associated with a public GitHub repository.

Use a GitHub App for repository operations, rather than relying on users' personal OAuth tokens.

GitHub is used for:

- Repository creation and management.
- Issue management.
- Task prioritization.
- Feature branches.
- Pull requests.
- Code review.
- Webhooks for tracking repository activity.

GitHub OAuth will initially be supported for user authentication. The GitHub App installation will separately authorize repository access.

### Vercel

All projects will be deployed through Vercel.

Use Vercel's GitHub integration and automatic deployments.

The deployment model:

- `main`: Production branch.
- Feature branches: Temporary development branches.
- Pull requests: Automatic preview deployments.
- Production: Automatic deployment following an approved merge into `main`.

A separate shared staging environment is not required initially. Vercel preview deployments will provide the initial staging functionality.

### AI Provider

Initially support one LLM provider, using an AiFundMe-managed API account.

The AI integration should be implemented behind a provider abstraction so additional providers can be introduced later.

Track the following for every LLM request:

- Provider.
- Model.
- Input tokens.
- Output tokens.
- Actual or estimated dollar cost.
- Project.
- Worker run.
- Associated GitHub issue.

The platform will manage API credentials. Individual contributors will not provide their own API keys in the MVP.

### Hosting and Infrastructure

Use Vercel for application hosting.

The AiFundMe backend and worker infrastructure can run separately from the generated applications.

The worker execution environment must support:
- Checking out GitHub repositories.
- Running shell commands.
- Installing dependencies.
- Running tests.
- Editing files.
- Committing changes.
- Creating pull requests.

Worker execution environments must be isolated from one another.

AWS can be used for backend infrastructure and isolated worker execution if appropriate, but building a generalized hosting abstraction is out of scope.

### Stripe

Stripe is not required for the prototype.

Credits will initially be granted through an administrative mechanism or simulated funding interface.

Real-money contributions and payment processing will be introduced only after the legal and payment-provider requirements have been established.

### Ethereum

Ethereum integration is deferred.

The MVP will maintain simulated stake allocations in the database.

## 4. Users and Permissions

### User

A user authenticates through GitHub.

Google authentication may be added later.

A user can:

- Create projects.
- Contribute AI credits to projects.
- View project activity.
- View their contributions.
- View their simulated stake allocations.

### Project Owner

The project owner creates the project and is responsible for its initial configuration.

The owner can:

- Configure the project.
- Manage project members.
- Connect the GitHub repository.
- Manage project settings.
- Allocate project budgets.
- View project financials.
- Approve or reject AI-generated pull requests.

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

A contributor can allocate AI credits to a project and track their contribution.

Contributors cannot directly modify project settings or approve code unless they also have the maintainer role.

## 5. Project Creation Wizard

The project creation wizard should automate initial project setup.

### Step 1: Project Information

The user provides:

- Project name.
- Description.
- Basic application requirements.
- Initial technology preference, if applicable.
- License selection.

All projects must have a public GitHub repository and an explicitly selected open-source license.

### Step 2: Repository Creation

The platform creates a GitHub repository associated with the project.

The repository should include:

- Initial application code.
- README.
- LICENSE.
- Basic development documentation.
- Environment configuration template.
- Standardized repository conventions.

The platform should maintain a stable internal project ID independent of the repository name or URL.

### Step 3: Initial Deployment

Create a Vercel project associated with the GitHub repository.

Configure production deployment from `main`.

Ensure pull request preview deployments are enabled.

The creation wizard should verify that the initial deployment succeeds.

### Step 4: Initial GitHub Issues

Create a set of initial GitHub issues based on the project description.

These issues should represent the initial development roadmap.

Issues can range from high-level product milestones to specific implementation tasks.

Initially, issue creation can be assisted by an AI model, but the project owner must approve the proposed issues and roadmap.

### Step 5: Project Initialization

Create the project record and associate:

- Owner.
- GitHub repository.
- Vercel project.
- Initial maintainers.
- Initial project budget.
- Initial issues.

The project is now ready for contributions and AI development.

## 6. AI Worker Architecture

AI workers are responsible for implementing software changes in response to GitHub issues.

The worker system should be designed as an asynchronous task-processing system.

### 6.1 Task Selection

Workers only operate on GitHub issues explicitly approved for AI execution.

Use a GitHub label:

`ai:ready`

A maintainer applies this label to indicate that an issue is ready for a worker.

Additional useful labels:

- `ai:in-progress`
- `ai:review`
- `ai:blocked`
- `ai:failed`

The platform should monitor GitHub webhooks and schedule tasks when an issue becomes eligible.

### 6.2 Task Requirements

An issue should ideally include:

- Description of the requested work.
- Acceptance criteria.
- Optional priority.
- Maximum AI budget.
- Relevant dependencies.

A task must have an explicitly configured maximum budget before execution begins.

### 6.3 Worker Lifecycle

The worker lifecycle:

1. Identify an eligible GitHub issue.
2. Verify project funding and available budget.
3. Atomically reserve the maximum task budget.
4. Claim the issue so another worker cannot execute it simultaneously.
5. Create a dedicated feature branch.
6. Check out the repository.
7. Analyze the issue and existing code.
8. Implement the requested changes.
9. Run applicable tests.
10. Commit changes to the feature branch.
11. Create a GitHub pull request.
12. Record execution results and AI expenditure.
13. Release unused budget reservations.

The worker must not directly commit to `main` or deploy to production.

### 6.4 Human Review

All AI-generated code requires human approval.

A maintainer can:

- Approve and merge the PR.
- Request changes.
- Reject the PR.
- Close the associated issue.
- Request another worker attempt.

The initial MVP does not need an elaborate review interface. GitHub's existing pull request workflow should be used.

The platform should detect when a PR is merged or closed and update its internal task state.

### 6.5 Worker States

Each worker task should have one of the following states:

- `pending`
- `queued`
- `running`
- `waiting_for_review`
- `completed`
- `failed`
- `cancelled`
- `budget_exhausted`

A task should be considered completed only after the associated pull request has been merged.

### 6.6 Task Scheduling

Initially use a simple priority queue.

Requirements:

- Only one worker can claim a particular issue at a time.
- A configurable maximum number of concurrent workers per project.
- A configurable maximum number of concurrent workers globally.
- Maintainers can cancel tasks.
- Failed tasks can be retried.
- Each retry creates a separate worker run.
- Workers must respect project and task budgets.

Complex dependency resolution and automated prioritization are deferred.

### 6.7 Worker Isolation and Security

Workers execute code from public repositories and must be treated as untrusted execution environments.

Requirements:

- Ephemeral execution environments.
- Isolation between projects and worker runs.
- No production deployment secrets exposed to workers.
- Restricted GitHub installation permissions.
- No direct access to other projects' credentials.
- CPU, memory, storage, and execution-time limits.
- Restricted network access where practical.
- Execution logs retained for auditing.

GitHub issue descriptions, repository files, and other project-provided content must be treated as untrusted inputs to the AI agent.

## 7. Credits and Contributions

The MVP will use internal, simulated AI credits.

Credits are denominated in US dollars for ease of understanding.

For example, a user can allocate $10 in AI credits to a project.

No actual money needs to change hands during the prototype.

### 7.1 Contribution Records

Track:

- User.
- Project.
- Amount committed.
- Amount consumed.
- Remaining amount.
- Creation date.

Contributions should be immutable transactions, with adjustments recorded as separate entries.

### 7.2 Credit Allocation

Users can allocate credits to any project they are permitted to contribute to.

Credits are project-specific once allocated.

Workers may consume credits only from the project to which the task belongs.

### 7.3 Budget Management

Implement budget controls at three levels:

**Project budget**

Maximum AI expenditure allowed for the project.

**Task budget**

Maximum AI expenditure allowed for a particular GitHub issue.

**Worker request budget**

Maximum amount that can be consumed by an individual LLM request or execution.

The platform must reserve budget before executing concurrent requests.

It must stop authorizing additional LLM requests when the available budget is exhausted.

Provider spending limits should be treated as supplemental safeguards, not as the primary enforcement mechanism.

### 7.4 Usage Accounting

Every LLM request should generate a usage record.

Store actual token counts and calculate cost using a versioned provider pricing table.

Where provider cost information is not immediately available, record the estimated cost and reconcile it later.

Do not silently overwrite historical usage records when pricing changes.

### 7.5 Simulated Stake Allocations

The prototype should demonstrate the future contributor-stake model.

For the MVP, calculate simulated stake based on actual eligible AI expenditure funded by each contributor.

Formula:

`Contributor Stake = Contributor Eligible Contribution / Total Eligible Contributions`

Example:

| Contributor | AI expenditure funded | Simulated stake |
|---|---:|---:|
| Alice | $100 | 10% |
| Bob | $400 | 40% |
| Carol | $500 | 50% |
| Total | $1,000 | 100% |

Unspent allocated credits do not count toward simulated stake.

These percentages are illustrative product data only. They do not represent actual equity, ownership, securities, or enforceable financial entitlements.

For the prototype, no project-owner allocation or dilution mechanism is required.

Maintain historical allocation records so changes can be inspected over time.

## 8. Project Financials

Every project should have a Financials page.

The MVP financial dashboard should provide visibility into project funding, AI expenditure, and hosting costs.

### 8.1 Financial Categories

Track separately:

**AI development costs**
- LLM usage.
- Provider.
- Model.
- Associated worker task.

**Hosting costs**
- Vercel.
- Other infrastructure costs when applicable.

**Other project expenses**
- Third-party API costs.
- Domains.
- Other services.

**Revenue**
- Initially optional and manually entered or simulated.

### 8.2 Financial Dashboard

Display:

- Total contributed credits.
- Total AI expenditure.
- Remaining available credits.
- Total hosting expenses, when available.
- Other project expenses.
- Revenue, if applicable.
- Simulated contributor stakes.

AI development costs must be shown separately from ongoing hosting costs.

The prototype does not need a full double-entry accounting system. Maintain sufficiently detailed transaction records to support later reconciliation and accounting upgrades.

### 8.3 Payouts

Actual contributor payouts are out of scope.

The dashboard may display hypothetical payout calculations based on simulated project revenue and contributor stakes.

No real transfers or financial obligations will be created.

## 9. GitHub Repository Conventions

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

The production branch must require pull request approval.

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
- GitHub App installations removed.

Webhook signatures must be validated.

Webhook deliveries should be processed asynchronously and deduplicated.

## 10. Deployment

Each project has one Vercel project.

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

## 11. Data Model

The initial data model should include the following entities.

### User

- id
- email
- created_at
- updated_at

### ExternalIdentity

- id
- user_id
- provider
- provider_user_id
- access metadata

Stores connections to GitHub and other authentication providers.

Sensitive credentials must not be stored as ordinary plaintext fields.

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

### ProjectMember

- id
- project_id
- user_id
- role

Roles initially include `owner` and `maintainer`.

### Contribution

- id
- project_id
- user_id
- amount_committed
- amount_consumed
- created_at

Contributions must support multiple contributions from one user to one project.

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

### UsageRecord

- id
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

Usage records should be retained for auditing.

### Expense

- id
- project_id
- category
- provider
- amount
- description
- date

Used for hosting and other non-LLM expenses.

### StakeAllocation

- id
- project_id
- user_id
- eligible_contribution_amount
- stake_percentage
- allocation_version
- created_at

Maintains the historical simulated stake allocation.

### Additional Entities

Other entities can be introduced as needed for deployment history, webhook processing, audit logs, and task events.

## 12. Backend Architecture

The backend should be organized around the following components:

### API Server

Responsible for:

- User authentication.
- Project management.
- Contribution management.
- Budget management.
- Financial reporting.
- Worker task management.

### GitHub Integration

Responsible for:

- GitHub App authentication.
- Repository creation and access.
- Issue synchronization.
- Pull request management.
- Webhook ingestion.

### Worker Scheduler

Responsible for:

- Identifying approved issues.
- Checking budgets.
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

### Usage and Financial Tracking

Responsible for:

- Recording LLM usage.
- Calculating costs.
- Updating contribution balances.
- Maintaining simulated stake allocations.
- Tracking other expenses.

These components can initially be implemented as a small number of services. Avoid premature microservice decomposition.

Use a persistent database as the source of truth for task state, budgets, contributions, and usage.

Use an asynchronous queue for background jobs.

## 13. MVP User Interface

The initial product should have the following pages.

### Dashboard

Displays:

- Projects owned.
- Projects contributed to.
- Recent project activity.
- Available AI credits.
- Recent worker activity.

### Project Page

Displays:

- Project description.
- GitHub repository.
- Production deployment.
- Maintainers.
- Available credits.
- Recent issues and pull requests.
- Project activity.

### Contributions Page

Displays:

- Amount contributed to each project.
- Amount consumed.
- Remaining balance.
- Simulated stake percentage.

### Financials Page

Displays:

- Total project funding.
- AI expenses.
- Hosting expenses.
- Other expenses.
- Revenue, if available.
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

The initial UI should complement GitHub rather than recreate its issue and code-review functionality.

## 14. Prototype Milestones

### Milestone 1: Project Creation

- GitHub authentication.
- GitHub App installation.
- Project creation.
- Repository creation.
- Initial application template.
- Vercel project creation.
- Initial deployment.

**Acceptance criterion:** A user can create a project and receive a working, deployed application connected to GitHub.

### Milestone 2: Contributions and Budgets

- Simulated credit allocation.
- Project budget tracking.
- Contribution records.
- Basic project financial dashboard.

**Acceptance criterion:** Users can allocate credits to projects and see available balances.

### Milestone 3: AI Worker Execution

- GitHub webhook integration.
- Issue eligibility through `ai:ready`.
- Worker scheduler.
- Isolated worker execution.
- LLM integration.
- Budget enforcement.
- Feature branch creation.
- Pull request creation.
- Usage tracking.

**Acceptance criterion:** A maintainer can approve an issue and have an AI worker implement it and create a pull request without exceeding its authorized budget.

### Milestone 4: Human Review and Deployment

- PR status synchronization.
- Human review workflow.
- Merge detection.
- Vercel deployment tracking.
- Task completion tracking.

**Acceptance criterion:** A maintainer can review and merge an AI-generated PR, resulting in an updated production deployment.

### Milestone 5: Simulated Economics

- Contributor stake calculations.
- Historical stake records.
- Financial dashboard improvements.
- Simulated revenue and payout calculations.

**Acceptance criterion:** The platform can demonstrate how project contributions translate into hypothetical financial allocations.

## 15. Open Questions and Future Decisions

The following decisions do not need to block the prototype, but should be revisited before a production launch.

### Financial and Legal Structure

- What legal structure governs contributor financial rights?
- Does the project operate through its own legal entity?
- Who owns and operates the project?
- What rights do contributors receive?
- How are real contributions and financial upside structured?
- What regulatory requirements apply?
- Which payment providers will support the model?

### Credit System

- Will users purchase credits directly?
- Will credits be refundable?
- Will credits expire?
- Can credits be transferred between projects?
- Will different contribution types have different stake valuations?

### AI Workers

- Which agent framework should be used?
- What is the preferred worker execution infrastructure?
- How should large, high-level issues be decomposed?
- Should multiple agents collaborate on a single issue?
- How should task retries and partial failures be handled?

### Project Economics

- How are hosting costs attributed to projects?
- How is project revenue measured?
- What expenses are deducted before calculating distributable profit?
- How are refunds and chargebacks handled?
- What happens when a project becomes inactive or insolvent?

### Project Governance

- Can contributors become maintainers?
- Can project ownership be transferred?
- How are maintainers appointed or removed?
- How are disputes between project stakeholders resolved?

These should be addressed incrementally as the product moves beyond the prototype.

---

## 16. Definition of MVP Success

The prototype is successful when the following end-to-end scenario works:

1. Alice creates a project on AiFundMe.
2. AiFundMe creates a GitHub repository and deploys the initial application to Vercel.
3. Bob contributes $10 in simulated AI credits to the project.
4. Alice creates a GitHub issue describing a new feature.
5. Alice marks the issue `ai:ready`.
6. An AI worker claims the issue and begins development.
7. The worker consumes AI credits, modifies the code, runs tests, and opens a pull request.
8. Alice reviews and merges the pull request.
9. Vercel automatically deploys the updated application.
10. AiFundMe records the AI expenditure and updates the project's remaining balance and simulated contributor allocations.

The central product proposition is demonstrated when a project can be funded by multiple people and developed by AI workers under human direction, with transparent tracking of contributions, development activity, and costs.