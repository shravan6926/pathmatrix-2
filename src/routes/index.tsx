import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary" />
            <span className="font-semibold tracking-tight">PathMatrix</span>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/part-a" className="rounded-md px-3 py-2 hover:bg-muted">
              Part A
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <section className="text-center">
          <p className="mb-3 inline-block rounded-full border border-border px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground">
            Coding Club · IIT Dharwad · Summer of Innovation
          </p>
          <h1 className="mx-auto max-w-3xl text-5xl font-semibold tracking-tight md:text-6xl">
            Intelligent Sightseeing<br />
            <span className="text-primary">Route Optimization</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-muted-foreground">
            Optimize scenic sightseeing routes with a Beam Search + Simulated Annealing
            hybrid — maximize satisfaction under distance budget, category diversity,
            and exponential decay constraints.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/part-a">Sightseeing Optimizer</Link>
            </Button>
          </div>
        </section>

        <section className="mt-20 grid gap-6 md:grid-cols-1">
          <FeatureCard
            title="Part A — Sightseeing Optimizer"
            body="Hybrid Beam Search + Simulated Annealing. Beam picks the top-K promising subsets by initial satisfaction; SA refines the visit order under exponential distance decay, category diversity penalties, and a hard distance budget."
            to="/part-a"
          />
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Built for Summer of Innovation · Hackathon Prototype
      </footer>
    </div>
  );
}

function FeatureCard({ title, body, to }: { title: string; body: string; to: string }) {
  return (
    <Link
      to={to}
      className="group rounded-xl border border-border bg-card p-6 transition hover:border-primary"
    >
      <h3 className="text-lg font-semibold group-hover:text-primary">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      <p className="mt-4 text-xs text-primary">Open →</p>
    </Link>
  );
}
