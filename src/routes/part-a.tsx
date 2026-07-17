import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RouteCanvas, type CanvasNode } from "@/components/RouteCanvas";
import { runPartA, type DistanceMatrix, type Endpoint, type Location, type PartAResult } from "@/lib/algorithms/beam-sa";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/part-a")({
  head: () => ({
    meta: [
      { title: "Sightseeing Route Optimizer — PathMatrix" },
      {
        name: "description",
        content:
          "Beam Search + Simulated Annealing hybrid for satisfaction-maximizing sightseeing routes with distance and category constraints.",
      },
    ],
  }),
  component: PartA,
});

const DEFAULT_LOCATIONS: Location[] = [
  { id: "l1", name: "Fort", x: 20, y: 40, score: 10, category: "Historical", detour: 5 },
  { id: "l2", name: "Museum", x: 35, y: 55, score: 8, category: "Historical", detour: 4 },
  { id: "l3", name: "Temple", x: 55, y: 70, score: 7, category: "Historical", detour: 6 },
  { id: "l4", name: "Waterfall", x: 45, y: 20, score: 9, category: "Nature", detour: 10 },
  { id: "l5", name: "Cafe", x: 60, y: 40, score: 6, category: "Food", detour: 3 },
  { id: "l6", name: "Park", x: 30, y: 25, score: 8, category: "Nature", detour: 6 },
];

function PartA() {
  const [source, setSource] = useState<Endpoint>({ id: "src", name: "College", x: 5, y: 5 });
  const [destination, setDestination] = useState<Endpoint>({ id: "dst", name: "Beach", x: 80, y: 80 });
  const [locations, setLocations] = useState<Location[]>(DEFAULT_LOCATIONS);
  const [budget, setBudget] = useState(200);
  const [threshold, setThreshold] = useState(2);
  const [beamK, setBeamK] = useState(5);
  const [matrixText, setMatrixText] = useState<string>("");
  const [useMatrix, setUseMatrix] = useState(false);
  const [result, setResult] = useState<PartAResult | null>(null);
  const [matrixError, setMatrixError] = useState<string | null>(null);

  const nodes: CanvasNode[] = useMemo(() => {
    const arr: CanvasNode[] = [
      { id: source.id, name: source.name, x: source.x, y: source.y, kind: "source" },
      { id: destination.id, name: destination.name, x: destination.x, y: destination.y, kind: "destination" },
    ];
    for (const l of locations) arr.push({ id: l.id, name: l.name, x: l.x, y: l.y, kind: "stop" });
    return arr;
  }, [source, destination, locations]);

  const route = result?.route ?? [source, destination];

  function run() {
    let distanceMatrix: DistanceMatrix | undefined;
    setMatrixError(null);
    if (useMatrix && matrixText.trim()) {
      const parsed = validateMatrix(matrixText, [source.id, destination.id, ...locations.map((l) => l.id)]);
      if (!parsed.ok) {
        setMatrixError(parsed.error);
        return;
      }
      distanceMatrix = parsed.matrix;
    }
    const r = runPartA({
      source,
      destination,
      locations,
      distanceBudget: budget,
      categoryThreshold: threshold,
      k: beamK,
      distanceMatrix,
    });
    setResult(r);
  }

  function loadPdfSample() {
    // Hackathon PDF Test Case 4: Station → Restaurant → Mall → Mosque → Zoo → Airport
    // Edge distances 3, 2, 6, 5, 14 (total = 30). Budget = 30, n = 1, decay = 0.1.
    // Cumulative-before-this-stop => Restaurant:0, Mall:3, Mosque:5, Zoo:11.
    // Effective = 5 + 7·e^-0.3 + 6·e^-0.5 + 10·e^-1.1 ≈ 17.15
    const src: Endpoint = { id: "Station", name: "Station", x: 5, y: 50 };
    const dst: Endpoint = { id: "Airport", name: "Airport", x: 95, y: 50 };
    const locs: Location[] = [
      { id: "Restaurant", name: "Restaurant", x: 20, y: 60, score: 5,  category: "Food",     detour: 0 },
      { id: "Mall",       name: "Mall",       x: 35, y: 40, score: 7,  category: "Shopping", detour: 0 },
      { id: "Mosque",     name: "Mosque",     x: 55, y: 55, score: 6,  category: "Religious",detour: 0 },
      { id: "Zoo",        name: "Zoo",        x: 75, y: 45, score: 10, category: "Nature",   detour: 0 },
    ];
    const m: DistanceMatrix = {
      Station:    { Restaurant: 3, Mall: 5, Mosque: 11, Zoo: 16, Airport: 30 },
      Restaurant: { Station: 3, Mall: 2, Mosque: 8, Zoo: 13, Airport: 27 },
      Mall:       { Station: 5, Restaurant: 2, Mosque: 6, Zoo: 11, Airport: 25 },
      Mosque:     { Station: 11, Restaurant: 8, Mall: 6, Zoo: 5, Airport: 19 },
      Zoo:        { Station: 16, Restaurant: 13, Mall: 11, Mosque: 5, Airport: 14 },
      Airport:    { Station: 30, Restaurant: 27, Mall: 25, Mosque: 19, Zoo: 14 },
    };
    setSource(src);
    setDestination(dst);
    setLocations(locs);
    setBudget(30);
    setThreshold(1);
    setBeamK(5);
    setMatrixText(JSON.stringify(m, null, 2));
    setUseMatrix(true);
  }

  function addLoc() {
    setLocations((ls) => [
      ...ls,
      {
        id: `l${Date.now()}`,
        name: `Spot ${ls.length + 1}`,
        x: Math.round(Math.random() * 80 + 10),
        y: Math.round(Math.random() * 80 + 10),
        score: 5,
        category: "Nature",
        detour: 5,
      },
    ]);
  }

  function updateLoc(id: string, patch: Partial<Location>) {
    setLocations((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">Sightseeing Route Optimizer</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hybrid Beam Search + Simulated Annealing. Beam selects the top-K subsets by initial
            satisfaction; SA anneals the visit order under exponential decay, category penalty, and
            a distance budget.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          <section className="space-y-5 rounded-xl border border-border bg-card p-5">
            <div className="grid grid-cols-2 gap-3">
              <EndpointFields label="Source" value={source} onChange={setSource} />
              <EndpointFields label="Destination" value={destination} onChange={setDestination} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <NumberField label="Distance Budget" value={budget} onChange={setBudget} />
              <NumberField label="Category n" value={threshold} onChange={setThreshold} />
              <NumberField label="Beam K" value={beamK} onChange={setBeamK} />
            </div>

            <details className="rounded-md border border-border bg-muted/40 p-2 text-xs">
              <summary className="cursor-pointer select-none font-medium">
                Distance matrix (optional, overrides Euclidean)
              </summary>
              <label className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useMatrix}
                  onChange={(e) => setUseMatrix(e.target.checked)}
                />
                Use matrix distances
              </label>
              <textarea
                className="mt-2 h-40 w-full rounded-md border border-border bg-background p-2 font-mono text-[11px]"
                placeholder='{"A":{"B":3},"B":{"C":6}}'
                value={matrixText}
                onChange={(e) => setMatrixText(e.target.value)}
              />
              {matrixError && (
                <p className="mt-1 rounded border border-destructive/40 bg-destructive/10 p-1.5 text-[11px] text-destructive">
                  {matrixError}
                </p>
              )}
              <p className="mt-1 text-muted-foreground">
                Keys are node IDs (source/destination/location ids). Missing pairs fall back to Euclidean.
              </p>
            </details>

            <Button variant="outline" size="sm" className="w-full" onClick={loadPdfSample}>
              Load PDF Test Case 4 (expects ≈ 17.15, 30 km)
            </Button>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Locations</Label>
                <Button size="sm" variant="secondary" onClick={addLoc}>
                  <Plus className="mr-1 h-4 w-4" /> Add
                </Button>
              </div>
              <div className="max-h-80 space-y-2 overflow-auto pr-1">
                {locations.map((l) => (
                  <div key={l.id} className="rounded-md border border-border bg-muted/40 p-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={l.name}
                        onChange={(e) => updateLoc(l.id, { name: e.target.value })}
                        className="h-8 flex-1"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setLocations((ls) => ls.filter((x) => x.id !== l.id))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                      <Field label="x" value={l.x} onChange={(v) => updateLoc(l.id, { x: v })} />
                      <Field label="y" value={l.y} onChange={(v) => updateLoc(l.id, { y: v })} />
                      <Field label="score" value={l.score} onChange={(v) => updateLoc(l.id, { score: v })} />
                      <div>
                        <Label className="text-[10px] text-muted-foreground">category</Label>
                        <Input
                          value={l.category}
                          onChange={(e) => updateLoc(l.id, { category: e.target.value })}
                          className="h-7"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={run} className="w-full">
              Run Optimizer
            </Button>
          </section>

          <section className="space-y-4">
            <RouteCanvas nodes={nodes} route={route} />

            {result && (
              <div className="grid gap-3 md:grid-cols-3">
                <Stat label="Effective Satisfaction" value={result.effectiveSatisfaction.toFixed(2)} />
                <Stat label="Total Distance" value={`${result.totalDistance.toFixed(2)}`} />
                <Stat label="Runtime" value={`${result.runtimeMs.toFixed(1)} ms`} />
              </div>
            )}

            {result && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-2 text-sm font-semibold">Route</h3>
                <p className="text-sm text-muted-foreground">
                  {result.route.map((n) => n.name).join(" → ")}
                </p>
                {result.perStop.length > 0 && (
                  <div className="mt-4 overflow-hidden rounded-md border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40 text-left">
                        <tr>
                          <th className="p-2">Stop</th>
                          <th className="p-2">Cumulative Dist</th>
                          <th className="p-2">Effective Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.perStop.map((s, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="p-2">{s.name}</td>
                            <td className="p-2">{s.cumulativeDist.toFixed(2)}</td>
                            <td className="p-2">{s.effective.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function EndpointFields({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Endpoint;
  onChange: (v: Endpoint) => void;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/40 p-2">
      <Label className="text-[10px] uppercase text-muted-foreground">{label}</Label>
      <Input
        className="h-8"
        value={value.name}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Field label="x" value={value.x} onChange={(v) => onChange({ ...value, x: v })} />
        <Field label="y" value={value.y} onChange={(v) => onChange({ ...value, y: v })} />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label className="text-[10px] text-muted-foreground">{label}</Label>
      <Input
        type="number"
        className="h-7"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-primary">{value}</div>
    </div>
  );
}

type MatrixValidation =
  | { ok: true; matrix: DistanceMatrix }
  | { ok: false; error: string };

function validateMatrix(text: string, knownIds: string[]): MatrixValidation {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: `Invalid JSON: ${(e as Error).message}` };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "Matrix must be a JSON object keyed by node id." };
  }
  const known = new Set(knownIds);
  const matrix = parsed as Record<string, unknown>;
  const cleaned: DistanceMatrix = {};
  const unknown: string[] = [];
  for (const [from, row] of Object.entries(matrix)) {
    if (!known.has(from)) unknown.push(from);
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      return { ok: false, error: `Row "${from}" must be an object of {toId: distance}.` };
    }
    const rowObj = row as Record<string, unknown>;
    cleaned[from] = {};
    for (const [to, val] of Object.entries(rowObj)) {
      if (!known.has(to)) unknown.push(to);
      if (typeof val !== "number" || !Number.isFinite(val)) {
        return { ok: false, error: `Distance ${from} → ${to} must be a finite number.` };
      }
      if (val < 0) {
        return { ok: false, error: `Distance ${from} → ${to} cannot be negative.` };
      }
      cleaned[from][to] = val;
    }
  }
  if (unknown.length) {
    const uniq = Array.from(new Set(unknown));
    return {
      ok: false,
      error: `Unknown node id(s): ${uniq.join(", ")}. Expected one of: ${knownIds.join(", ")}.`,
    };
  }
  return { ok: true, matrix: cleaned };
}