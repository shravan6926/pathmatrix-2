// Part A: Sightseeing Route Optimization
// Hybrid: Beam Search (top-k by initial satisfaction) + Simulated Annealing.
//
// Distance / score model (matches the hackathon spec):
//   * Effective score at stop i = score_i * exp(-decay * cumBefore_i) * catPenalty
//     where cumBefore_i is the distance already travelled to reach the PREVIOUS
//     stop from source. For the very first stop, cumBefore = 0.
//   * If a category has appeared more than `categoryThreshold` times up to and
//     including this stop, multiply that stop's score by (1 - penalty).
//   * Optional distanceMatrix (indexed by node id) overrides Euclidean.

export interface Location {
  id: string;
  name: string;
  x: number;
  y: number;
  score: number;
  category: string;
  detour: number; // reserved
}

export interface Endpoint {
  id: string;
  name: string;
  x: number;
  y: number;
}

export type DistanceMatrix = Record<string, Record<string, number>>;

export interface PartAInput {
  source: Endpoint;
  destination: Endpoint;
  locations: Location[];
  distanceBudget: number;
  categoryThreshold: number;
  k?: number;
  decay?: number;
  penalty?: number;
  distanceMatrix?: DistanceMatrix;
}

export interface PartAResult {
  route: (Endpoint | Location)[];
  totalDistance: number;
  effectiveSatisfaction: number;
  runtimeMs: number;
  perStop: { name: string; cumulativeDist: number; effective: number }[];
}

type Node = { id: string; x: number; y: number };

function makeDist(matrix?: DistanceMatrix) {
  return (a: Node, b: Node): number => {
    if (matrix) {
      const row = matrix[a.id];
      if (row && typeof row[b.id] === "number") return row[b.id];
      const rev = matrix[b.id];
      if (rev && typeof rev[a.id] === "number") return rev[a.id];
    }
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
}

function routeDistance(nodes: Node[], d: (a: Node, b: Node) => number): number {
  let s = 0;
  for (let i = 1; i < nodes.length; i++) s += d(nodes[i - 1], nodes[i]);
  return s;
}

function evaluate(
  source: Endpoint,
  destination: Endpoint,
  selection: Location[],
  order: number[],
  budget: number,
  threshold: number,
  decay: number,
  penalty: number,
  d: (a: Node, b: Node) => number,
): { total: number; effective: number; perStop: PartAResult["perStop"] } {
  const ordered = order.map((i) => selection[i]);
  const nodes: Node[] = [source, ...ordered, destination];
  const total = routeDistance(nodes, d);
  if (total > budget) return { total, effective: -Infinity, perStop: [] };

  let cumBefore = 0;
  let effective = 0;
  const catCount: Record<string, number> = {};
  const perStop: PartAResult["perStop"] = [];
  for (let i = 1; i < nodes.length - 1; i++) {
    const loc = ordered[i - 1];
    catCount[loc.category] = (catCount[loc.category] ?? 0) + 1;
    let s = loc.score * Math.exp(-decay * cumBefore);
    if (catCount[loc.category] > threshold) s *= 1 - penalty;
    effective += s;
    perStop.push({ name: loc.name, cumulativeDist: cumBefore, effective: s });
    // Advance by the edge that reaches THIS stop so the next iteration's
    // cumBefore is "distance to the previous stop from source".
    cumBefore += d(nodes[i - 1], nodes[i]);
  }
  return { total, effective, perStop };
}

function nearestNeighborOrder(
  source: Endpoint,
  destination: Endpoint,
  picks: Location[],
  d: (a: Node, b: Node) => number,
): number[] {
  const remaining = picks.map((_, i) => i);
  const order: number[] = [];
  let cur: Node = source;
  while (remaining.length) {
    let best = 0;
    let bd = Infinity;
    for (let k = 0; k < remaining.length; k++) {
      const dd = d(cur, picks[remaining[k]]);
      if (dd < bd) {
        bd = dd;
        best = k;
      }
    }
    const idx = remaining.splice(best, 1)[0];
    order.push(idx);
    cur = picks[idx];
  }
  void destination;
  return order;
}

function beamSearchSelections(
  input: PartAInput,
  beamWidth: number,
  d: (a: Node, b: Node) => number,
): Location[][] {
  const { source, destination, locations, distanceBudget } = input;
  const sorted = [...locations].sort((a, b) => b.score - a.score);

  type Beam = { picks: Location[]; scoreSum: number };
  let beams: Beam[] = [{ picks: [], scoreSum: 0 }];

  for (const loc of sorted) {
    const candidates: Beam[] = [];
    for (const b of beams) {
      candidates.push(b);
      const newPicks = [...b.picks, loc];
      const order = nearestNeighborOrder(source, destination, newPicks, d);
      const nodes: Node[] = [source, ...order.map((i) => newPicks[i]), destination];
      if (routeDistance(nodes, d) <= distanceBudget) {
        candidates.push({ picks: newPicks, scoreSum: b.scoreSum + loc.score });
      }
    }
    candidates.sort((a, b) => b.scoreSum - a.scoreSum);
    beams = candidates.slice(0, beamWidth);
  }
  return beams.map((b) => b.picks).filter((p) => p.length > 0);
}

function simulatedAnnealing(
  input: PartAInput,
  selection: Location[],
  d: (a: Node, b: Node) => number,
): { order: number[]; effective: number; total: number; perStop: PartAResult["perStop"] } {
  const { source, destination, distanceBudget, categoryThreshold } = input;
  const decay = input.decay ?? 0.1;
  const penalty = input.penalty ?? 0.1;

  let order = nearestNeighborOrder(source, destination, selection, d);
  let curEval = evaluate(source, destination, selection, order, distanceBudget, categoryThreshold, decay, penalty, d);
  let best = { order: [...order], ...curEval };

  let T = 1.0;
  const cooling = 0.995;
  const iters = 1500;
  for (let i = 0; i < iters; i++) {
    if (order.length < 2) break;
    const a = Math.floor(Math.random() * order.length);
    let b = Math.floor(Math.random() * order.length);
    if (a === b) b = (b + 1) % order.length;
    const next = [...order];
    [next[a], next[b]] = [next[b], next[a]];
    const ev = evaluate(source, destination, selection, next, distanceBudget, categoryThreshold, decay, penalty, d);
    const delta = ev.effective - curEval.effective;
    if (delta > 0 || Math.random() < Math.exp(delta / Math.max(T, 1e-6))) {
      order = next;
      curEval = ev;
      if (ev.effective > best.effective) best = { order: [...order], ...ev };
    }
    T *= cooling;
  }
  return best;
}

export function runPartA(input: PartAInput): PartAResult {
  const t0 = performance.now();
  const d = makeDist(input.distanceMatrix);
  const beamWidth = input.k ?? 5;
  const selections = beamSearchSelections(input, beamWidth, d);

  let best: {
    selection: Location[];
    order: number[];
    effective: number;
    total: number;
    perStop: PartAResult["perStop"];
  } | null = null;

  const decay = input.decay ?? 0.1;
  const penalty = input.penalty ?? 0.1;
  const empty = evaluate(input.source, input.destination, [], [], input.distanceBudget, input.categoryThreshold, decay, penalty, d);
  if (empty.effective > -Infinity) {
    best = { selection: [], order: [], effective: empty.effective, total: empty.total, perStop: [] };
  }

  for (const sel of selections) {
    const sa = simulatedAnnealing(input, sel, d);
    if (!best || sa.effective > best.effective) {
      best = { selection: sel, order: sa.order, effective: sa.effective, total: sa.total, perStop: sa.perStop };
    }
  }

  const routeNodes: (Endpoint | Location)[] = best
    ? [input.source, ...best.order.map((i) => best!.selection[i]), input.destination]
    : [input.source, input.destination];

  return {
    route: routeNodes,
    totalDistance: best?.total ?? routeDistance([input.source, input.destination], d),
    effectiveSatisfaction: best?.effective ?? 0,
    runtimeMs: performance.now() - t0,
    perStop: best?.perStop ?? [],
  };
}
