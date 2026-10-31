const milestones = [
  ["01", "Create a project", "Sign in with GitHub, create a public repository, and launch its first Vercel deployment."],
  ["02", "Pool AI credits", "Allocate simulated credits and set clear project and task budgets."],
  ["03", "Put AI to work", "Approve an issue. An isolated worker implements it, runs checks, and opens a pull request."],
  ["04", "Review and ship", "A human reviews and merges the change. Vercel deploys the approved version."],
  ["05", "See where it went", "Track AI usage, remaining credits, and simulated contributor stakes."],
] as const;

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-8 sm:px-12">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/15 pb-6">
        <span className="text-xl font-bold tracking-tight">AiFundMe<span className="text-green-700">.</span></span>
        <span className="rounded-full border border-black/15 px-3 py-1 text-xs font-medium">MVP · In development</span>
      </header>
      <section className="max-w-3xl py-20 sm:py-28" aria-labelledby="intro">
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-green-800">Community-funded software</p>
        <h1 id="intro" className="text-5xl font-semibold leading-[1.07] tracking-tight sm:text-7xl">Built by AI.<br />Directed by people.</h1>
        <p className="mt-7 max-w-xl text-lg leading-relaxed text-stone-600">Turn a shared idea into working software. Pool AI credits, choose what gets built, and review every change before it ships.</p>
        <a href="#roadmap" className="mt-9 inline-flex rounded-full bg-[#233c2d] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-800">Explore the MVP roadmap <span aria-hidden="true" className="ml-4">↓</span></a>
      </section>
      <section id="roadmap" aria-labelledby="roadmap-title" className="border-t border-black/15 py-10">
        <div className="mb-10 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="roadmap-title" className="text-2xl font-semibold tracking-tight">From idea to approved release</h2>
          <p className="text-sm text-stone-600">Five milestones. One complete workflow.</p>
        </div>
        <ol className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
          {milestones.map(([number, title, description]) => (
            <li key={number} className="border-t border-black/10 py-7">
              <span className="text-xs font-semibold text-green-800">{number} / PLANNED</span>
              <h3 className="mb-3 mt-4 text-lg font-semibold">{title}</h3>
              <p className="max-w-sm text-sm leading-relaxed text-stone-600">{description}</p>
            </li>
          ))}
        </ol>
      </section>
      <footer className="flex flex-wrap justify-between gap-4 border-t border-black/15 py-6 text-xs leading-relaxed text-stone-600">
        <p className="max-w-xl">Prototype only. Credits and stakes are simulated. They do not represent payments, equity, or financial entitlements.</p>
        <a className="underline underline-offset-4 hover:text-green-800" href="/api/health">Application health</a>
      </footer>
    </main>
  );
}
