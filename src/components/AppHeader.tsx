import { Link } from "@tanstack/react-router";

export function AppHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary" />
          <span className="font-semibold tracking-tight">PathMatrix</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link to="/" className="rounded-md px-3 py-2 hover:bg-muted" activeProps={{ className: "rounded-md px-3 py-2 bg-muted" }}>
            Home
          </Link>
          <Link to="/part-a" className="rounded-md px-3 py-2 hover:bg-muted" activeProps={{ className: "rounded-md px-3 py-2 bg-muted" }}>
            Part A
          </Link>
        </nav>
      </div>
    </header>
  );
}