import {
  BufferGeometry,
  Float32BufferAttribute,
  type BufferAttribute,
  type InterleavedBufferAttribute,
} from "three";
import type { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

export type Text3DLiquidGeometryQuality = "low" | "medium" | "high";
export type Text3DLiquidGeometryProfile = "balloon" | "liquid";

export interface Text3DLiquidGeometryQualityBudget {
  maximumEdgeLengthScale: number;
  maximumIterations: number;
  maximumCapTriangleMultiplier: number;
  gridCellLengthScale: number;
  maximumGridSide: number;
  relaxationIterations: number;
}

export interface Text3DLiquidGeometryFieldStats {
  width: number;
  height: number;
  insideSampleCount: number;
}

export interface Text3DLiquidGeometryStats {
  profile: Text3DLiquidGeometryProfile;
  quality: Text3DLiquidGeometryQuality;
  relaxationIterations: number;
  capTriangleCount: number;
  fields: Text3DLiquidGeometryFieldStats[];
  rim?: {
    radius: number;
    ringCount: number;
  };
}

/**
 * Each tessellation pass can split one triangle into at most four conforming
 * children. The Cartesian field budgets scale the same physical solve across
 * qualities: halving the cell length approximately quadruples Jacobi work.
 * GPU Gems 38 documents the regular-grid five-point Jacobi stencil and its
 * fixed-iteration tradeoff:
 * https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-38-fast-fluid-dynamics-simulation-gpu
 *
 * Three.js displacement moves vertices as real geometry, so the edge budget
 * remains intentionally denser than ordinary flat text:
 * https://threejs.org/docs/pages/MeshStandardMaterial.html#displacementMap
 */
export const TEXT_3D_LIQUID_GEOMETRY_QUALITY: Readonly<
  Record<Text3DLiquidGeometryQuality, Text3DLiquidGeometryQualityBudget>
> = {
  low: {
    maximumEdgeLengthScale: 0.08,
    maximumIterations: 4,
    maximumCapTriangleMultiplier: 256,
    gridCellLengthScale: 0.035,
    maximumGridSide: 52,
    relaxationIterations: 192,
  },
  medium: {
    maximumEdgeLengthScale: 0.045,
    maximumIterations: 5,
    maximumCapTriangleMultiplier: 1024,
    gridCellLengthScale: 0.024,
    maximumGridSide: 76,
    relaxationIterations: 384,
  },
  high: {
    maximumEdgeLengthScale: 0.03,
    maximumIterations: 6,
    maximumCapTriangleMultiplier: 4096,
    gridCellLengthScale: 0.016,
    maximumGridSide: 108,
    relaxationIterations: 640,
  },
};

interface Vertex2D {
  x: number;
  y: number;
  u: number;
  v: number;
}

type Triangle = [number, number, number];

interface BoundarySegment {
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

interface BoundaryEdge {
  a: number;
  b: number;
}

interface ProfileSample {
  height: number;
  gradientX: number;
  gradientY: number;
}

interface CapMesh {
  vertices: Vertex2D[];
  triangles: Triangle[];
  boundaryEdges: BoundaryEdge[];
  boundarySegments: BoundarySegment[];
}

interface CapTriangle {
  vertices: [Vertex2D, Vertex2D, Vertex2D];
}

interface GeometryArrays {
  positions: number[];
  normals: number[];
  uvs: number[];
}

interface ProfileField {
  originX: number;
  originY: number;
  cellSize: number;
  width: number;
  height: number;
  heights: Float64Array;
  gradientX: Float64Array;
  gradientY: Float64Array;
  distances: Float64Array;
  distanceGradientX: Float64Array;
  distanceGradientY: Float64Array;
  insideSampleCount: number;
}

interface TessellateCapOptions {
  edgeLengthLimit?: (a: Vertex2D, b: Vertex2D) => number;
  maximumTriangles?: number;
}

interface LiquidSurfaceSample {
  height: number;
  unnormalized: [number, number, number];
}

type ReadableAttribute = BufferAttribute | InterleavedBufferAttribute;

const INFLATION_HEIGHT_SCALE = 0.12;
/**
 * Outline-smoothing radius and tessellation fallback, as a fraction of `size`.
 * The liquid *profile* no longer uses this as a global rollover: each stroke
 * is a self-similar ellipse of local half-width W, and this constant only
 * floors the φ-step length so hairlines cannot demand a finer mesh than the
 * quality budget. Canal surfaces still describe the circular normal-plane
 * profile that the local ellipse reduces to when A(W) = W:
 * https://mathworld.wolfram.com/CanalSurface.html
 */
export const LIQUID_RIM_RADIUS_SCALE = 0.05;
/**
 * Cap on the liquid half-thickness A(W) = min(W, this·size). Ordinary display
 * weights stay full semicircles (self-similar with thin strokes). Only a
 * counter-free blob, whose medial distance approaches half the glyph, is
 * flattened into an ellipse so it does not inflate to a hemisphere.
 */
const LIQUID_MAXIMUM_HALF_HEIGHT_SCALE = 0.2;
/**
 * Vertex rings across the rim band, counted in equal normal-angle steps of
 * the circular profile φ = arccos(1 − d/R). Uniform spacing in d undersamples
 * the silhouette, where curvature of √(d(2R−d)) diverges: the first Cartesian
 * ring at d = R/n turns by arccos(1 − 1/n), already 0.51 rad at n = 8. Equal
 * φ steps keep that turn at π/(2n). Medium stays above five rings so a
 * vertical tangent can shade as a smooth rollover; low/high scale with the
 * tessellation iteration budget.
 */
export const LIQUID_RIM_RING_COUNT: Readonly<Record<Text3DLiquidGeometryQuality, number>> = {
  low: 5,
  medium: 8,
  high: 12,
};
/**
 * Extra binary splits so clustered radial edges can reach the first φ-step
 * length R(1 − cos(π/(2n))) after the interior has already stopped refining.
 */
const LIQUID_RIM_TESSELLATION_EXTRA_ITERATIONS = 8;
/**
 * Isotropic Jacobi passes on the half-width field after ridge inheritance.
 * A Y-junction has more than one local W; picking a single ridge makes a step,
 * and on thin strokes the crest height is W itself, so that step is a fold.
 * Uniform strokes are already locally constant, so they are fixed points of
 * the stencil. GPU Gems 38's regular-grid Jacobi:
 * https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-38-fast-fluid-dynamics-simulation-gpu
 */
const LIQUID_HALF_WIDTH_SMOOTHING_PASSES = 64;
/**
 * Laplacian passes on each liquid outline loop, with the same window as the
 * canal radius R. One pass is a box filter; several approximate a Gaussian
 * that removes the spray-paint sawtooth whose wavelength is far below R.
 */
const LIQUID_OUTLINE_SMOOTHING_PASSES = 1;
/**
 * Douglas–Peucker tolerance as a fraction of R, applied after smoothing.
 * It only collapses near-collinear samples; intended curveSegments on clean
 * faces have a larger sagitta and are kept. Ramer–Douglas–Peucker:
 * https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm
 */
/**
 * Minimum kept edge length as a fraction of R. Features shorter than this
 * cannot appear on a canal of radius R, so merging them does not change the
 * visible surface:
 * https://mathworld.wolfram.com/CanalSurface.html
 */
const FIELD_PADDING = 2;

function edgeKey(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function quantizedPointKey(point: Vertex2D, quantum: number): string {
  return `${Math.round(point.x / quantum)}:${Math.round(point.y / quantum)}`;
}

function appendSourceVertex(
  arrays: GeometryArrays,
  positions: ReadableAttribute,
  normals: ReadableAttribute,
  uvs: ReadableAttribute,
  index: number,
): void {
  arrays.positions.push(positions.getX(index), positions.getY(index), positions.getZ(index));
  arrays.normals.push(normals.getX(index), normals.getY(index), normals.getZ(index));
  arrays.uvs.push(uvs.getX(index), uvs.getY(index));
}

function capPlane(
  positions: ReadableAttribute,
  triangleStart: number,
  minimumZ: number,
  maximumZ: number,
  tolerance: number,
): "back" | "front" | undefined {
  const z0 = positions.getZ(triangleStart);
  const z1 = positions.getZ(triangleStart + 1);
  const z2 = positions.getZ(triangleStart + 2);
  if (
    Math.abs(z0 - minimumZ) <= tolerance
    && Math.abs(z1 - minimumZ) <= tolerance
    && Math.abs(z2 - minimumZ) <= tolerance
  ) return "back";
  if (
    Math.abs(z0 - maximumZ) <= tolerance
    && Math.abs(z1 - maximumZ) <= tolerance
    && Math.abs(z2 - maximumZ) <= tolerance
  ) return "front";
  return undefined;
}

function capBoundary(
  vertices: readonly Vertex2D[],
  indexedTriangles: readonly Triangle[],
): Pick<CapMesh, "boundaryEdges" | "boundarySegments"> {
  const edges = new Map<string, { a: number; b: number; count: number }>();
  for (const [a, b, c] of indexedTriangles) {
    for (const [first, second] of [[a, b], [b, c], [c, a]] as const) {
      const key = edgeKey(first, second);
      const edge = edges.get(key);
      if (edge) edge.count += 1;
      else edges.set(key, { a: first, b: second, count: 1 });
    }
  }

  const boundaryEdges = [...edges.values()]
    .filter(({ count }) => count === 1)
    .map(({ a, b }) => ({ a, b }));
  const boundarySegments = boundaryEdges.map(({ a, b }) => ({
    ax: vertices[a]!.x,
    ay: vertices[a]!.y,
    bx: vertices[b]!.x,
    by: vertices[b]!.y,
  }));

  return { boundaryEdges, boundarySegments };
}

function buildCapMesh(triangles: readonly CapTriangle[], quantum: number): CapMesh {
  const vertices: Vertex2D[] = [];
  const indexedTriangles: Triangle[] = [];
  const vertexIndices = new Map<string, number>();

  for (const triangle of triangles) {
    const indices = triangle.vertices.map((point) => {
      const key = quantizedPointKey(point, quantum);
      const existing = vertexIndices.get(key);
      if (existing !== undefined) return existing;
      const index = vertices.length;
      vertices.push(point);
      vertexIndices.set(key, index);
      return index;
    }) as Triangle;
    if (new Set(indices).size === 3) indexedTriangles.push(indices);
  }

  return {
    vertices,
    triangles: indexedTriangles,
    ...capBoundary(vertices, indexedTriangles),
  };
}

function midpointIndex(
  vertices: Vertex2D[],
  midpoints: Map<string, number>,
  a: number,
  b: number,
): number {
  const key = edgeKey(a, b);
  const existing = midpoints.get(key);
  if (existing !== undefined) return existing;
  const first = vertices[a]!;
  const second = vertices[b]!;
  const index = vertices.length;
  vertices.push({
    x: (first.x + second.x) * 0.5,
    y: (first.y + second.y) * 0.5,
    u: (first.u + second.u) * 0.5,
    v: (first.v + second.v) * 0.5,
  });
  midpoints.set(key, index);
  return index;
}

function tessellateCap(
  cap: CapMesh,
  maximumEdgeLength: number,
  maximumIterations: number,
  options?: TessellateCapOptions,
): CapMesh {
  const vertices = [...cap.vertices];
  let triangles = [...cap.triangles];
  const maximumTriangles = options?.maximumTriangles;

  for (let iteration = 0; iteration < maximumIterations; iteration += 1) {
    const splitEdges = new Set<string>();
    const splitPriorities = new Map<string, number>();
    for (const [a, b, c] of triangles) {
      for (const [firstIndex, secondIndex] of [[a, b], [b, c], [c, a]] as const) {
        const first = vertices[firstIndex]!;
        const second = vertices[secondIndex]!;
        const dx = first.x - second.x;
        const dy = first.y - second.y;
        const limit = options?.edgeLengthLimit?.(first, second) ?? maximumEdgeLength;
        if (dx * dx + dy * dy > limit * limit) {
          const key = edgeKey(firstIndex, secondIndex);
          splitEdges.add(key);
          splitPriorities.set(key, Math.hypot(dx, dy) / Math.max(limit, 1e-12));
        }
      }
    }
    if (splitEdges.size === 0) break;

    const midpoints = new Map<string, number>();
    const nextTriangles: Triangle[] = [];
    for (const [a, b, c] of triangles) {
      const splitAB = splitEdges.has(edgeKey(a, b));
      const splitBC = splitEdges.has(edgeKey(b, c));
      const splitCA = splitEdges.has(edgeKey(c, a));
      const mask = Number(splitAB) | Number(splitBC) << 1 | Number(splitCA) << 2;
      const ab = splitAB ? midpointIndex(vertices, midpoints, a, b) : -1;
      const bc = splitBC ? midpointIndex(vertices, midpoints, b, c) : -1;
      const ca = splitCA ? midpointIndex(vertices, midpoints, c, a) : -1;

      switch (mask) {
        case 0:
          nextTriangles.push([a, b, c]);
          break;
        case 1:
          nextTriangles.push([a, ab, c], [ab, b, c]);
          break;
        case 2:
          nextTriangles.push([a, b, bc], [a, bc, c]);
          break;
        case 3:
          nextTriangles.push([b, bc, ab], [a, ab, c], [ab, bc, c]);
          break;
        case 4:
          nextTriangles.push([a, b, ca], [ca, b, c]);
          break;
        case 5:
          nextTriangles.push([a, ab, ca], [ab, b, c], [ca, ab, c]);
          break;
        case 6:
          nextTriangles.push([c, ca, bc], [a, b, ca], [b, bc, ca]);
          break;
        case 7:
          nextTriangles.push(
            [a, ab, ca],
            [ab, b, bc],
            [ca, bc, c],
            [ab, bc, ca],
          );
          break;
      }
    }
    if (maximumTriangles !== undefined && nextTriangles.length > maximumTriangles) {
      // A conforming split can otherwise let a handful of broad interior
      // triangles consume the whole pass. Retain the most under-resolved
      // edges, so the narrow rim gets its reserved triangles first.
      const permittedEdges = Math.max(1, Math.floor((maximumTriangles - triangles.length) / 2));
      const selected = [...splitEdges]
        .sort((first, second) => (splitPriorities.get(second) ?? 0) - (splitPriorities.get(first) ?? 0))
        .slice(0, permittedEdges);
      splitEdges.clear();
      for (const key of selected) splitEdges.add(key);

      const prioritizedMidpoints = new Map<string, number>();
      nextTriangles.length = 0;
      for (const [a, b, c] of triangles) {
        const splitAB = splitEdges.has(edgeKey(a, b));
        const splitBC = splitEdges.has(edgeKey(b, c));
        const splitCA = splitEdges.has(edgeKey(c, a));
        const mask = Number(splitAB) | Number(splitBC) << 1 | Number(splitCA) << 2;
        const ab = splitAB ? midpointIndex(vertices, prioritizedMidpoints, a, b) : -1;
        const bc = splitBC ? midpointIndex(vertices, prioritizedMidpoints, b, c) : -1;
        const ca = splitCA ? midpointIndex(vertices, prioritizedMidpoints, c, a) : -1;
        switch (mask) {
          case 0: nextTriangles.push([a, b, c]); break;
          case 1: nextTriangles.push([a, ab, c], [ab, b, c]); break;
          case 2: nextTriangles.push([a, b, bc], [a, bc, c]); break;
          case 3: nextTriangles.push([b, bc, ab], [a, ab, c], [ab, bc, c]); break;
          case 4: nextTriangles.push([a, b, ca], [ca, b, c]); break;
          case 5: nextTriangles.push([a, ab, ca], [ab, b, c], [ca, ab, c]); break;
          case 6: nextTriangles.push([c, ca, bc], [a, b, ca], [b, bc, ca]); break;
          case 7: nextTriangles.push([a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]); break;
        }
      }
      if (nextTriangles.length > maximumTriangles) break;
    }
    triangles = nextTriangles;
  }

  return { vertices, triangles, ...capBoundary(vertices, triangles) };
}



function extractBoundaryContours(cap: CapMesh): number[][] {
  const adjacent = new Map<number, number[]>();
  for (const { a, b } of cap.boundaryEdges) {
    const fromA = adjacent.get(a) ?? [];
    fromA.push(b);
    adjacent.set(a, fromA);
    const fromB = adjacent.get(b) ?? [];
    fromB.push(a);
    adjacent.set(b, fromB);
  }
  const unused = new Set(cap.boundaryEdges.map(({ a, b }) => edgeKey(a, b)));
  const contours: number[][] = [];
  while (unused.size > 0) {
    const seed = unused.values().next().value as string;
    unused.delete(seed);
    const colon = seed.indexOf(":");
    const start = Number(seed.slice(0, colon));
    const first = Number(seed.slice(colon + 1));
    const contour = [start];
    let previous = start;
    let current = first;
    let guard = cap.boundaryEdges.length + 1;
    while (current !== start && guard > 0) {
      guard -= 1;
      contour.push(current);
      const next = (adjacent.get(current) ?? []).find((candidate) => (
        candidate !== previous && unused.has(edgeKey(current, candidate))
      ));
      if (next === undefined) break;
      unused.delete(edgeKey(current, next));
      previous = current;
      current = next;
    }
    if (contour.length >= 3) contours.push(contour);
  }
  return contours;
}









function smoothClosedContour(
  vertices: Vertex2D[],
  contour: readonly number[],
  radius: number,
): void {
  const count = contour.length;
  if (count < 3 || radius <= 0) return;
  const origin = contour.map((index) => ({ ...vertices[index]! }));
  const edgeLengths = origin.map((point, index) => {
    const next = origin[(index + 1) % count]!;
    return Math.hypot(next.x - point.x, next.y - point.y);
  });
  for (let index = 0; index < count; index += 1) {
    const start = origin[index]!;
    let sumX = start.x;
    let sumY = start.y;
    let sumU = start.u;
    let sumV = start.v;
    let totalWeight = 1;
    for (const direction of [-1, 1] as const) {
      let distance = 0;
      for (let step = 1; step < count; step += 1) {
        const edgeIndex = direction === 1
          ? (index + step - 1) % count
          : (index - step + count) % count;
        distance += edgeLengths[edgeIndex]!;
        if (distance >= radius) break;
        const weight = 1 - distance / radius;
        const point = origin[(index + direction * step + count) % count]!;
        sumX += point.x * weight;
        sumY += point.y * weight;
        sumU += point.u * weight;
        sumV += point.v * weight;
        totalWeight += weight;
      }
    }
    const vertex = vertices[contour[index]!]!;
    vertex.x = sumX / totalWeight;
    vertex.y = sumY / totalWeight;
    vertex.u = sumU / totalWeight;
    vertex.v = sumV / totalWeight;
  }
}

/**
 * Liquid-only outline conditioner. Balloon keeps the source silhouette, including
 * distressed stencil faces. A canal of radius R cannot represent outline
 * features smaller than R, so those loops and samples are dropped before the
 * distance field is built; otherwise each spike becomes its own medial branch.
 */
/**
 * Smooths the glyph outline before the liquid field is built, and does nothing
 * else to it.
 *
 * Two further conditioning steps were tried here and deliberately removed:
 * filling contours smaller than the rim radius, and Ramer-Douglas-Peucker
 * simplification of each contour. Together they were meant to stop a sprayed
 * stencil face from shattering the medial axis, but they also closed real
 * counters and collapsed the sprayed edge into long straight runs -- which
 * renders as creased foil rather than as liquid metal. A glyph is a letterform
 * before it is a distance field, so its counters and its edge texture are not
 * noise this stage may discard. The sub-rim serration problem, if it is worth
 * solving at all, has to be solved without deleting outline features.
 */
function conditionLiquidCapBoundary(cap: CapMesh, size: number): CapMesh {
  const radius = size * LIQUID_RIM_RADIUS_SCALE;
  const vertices = cap.vertices.map((vertex) => ({ ...vertex }));
  const contours = extractBoundaryContours({ ...cap, vertices });
  for (let pass = 0; pass < LIQUID_OUTLINE_SMOOTHING_PASSES; pass += 1) {
    for (const contour of contours) {
      smoothClosedContour(vertices, contour, radius);
    }
  }
  return {
    vertices,
    triangles: cap.triangles,
    ...capBoundary(vertices, cap.triangles),
  };
}

function segmentDistance(x: number, y: number, segment: BoundarySegment): number {
  const dx = segment.bx - segment.ax;
  const dy = segment.by - segment.ay;
  const lengthSquared = dx * dx + dy * dy;
  const projection = lengthSquared > 0
    ? Math.max(0, Math.min(1, ((x - segment.ax) * dx + (y - segment.ay) * dy) / lengthSquared))
    : 0;
  const offsetX = x - (segment.ax + dx * projection);
  const offsetY = y - (segment.ay + dy * projection);
  return Math.hypot(offsetX, offsetY);
}

function boundaryDistance(x: number, y: number, segments: readonly BoundarySegment[]): number {
  let nearest = Number.POSITIVE_INFINITY;
  for (const segment of segments) {
    nearest = Math.min(nearest, segmentDistance(x, y, segment));
  }
  return Number.isFinite(nearest) ? nearest : 0;
}

function triangleContainsPoint(
  x: number,
  y: number,
  a: Vertex2D,
  b: Vertex2D,
  c: Vertex2D,
  epsilon: number,
): boolean {
  const ab = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x);
  const bc = (c.x - b.x) * (y - b.y) - (c.y - b.y) * (x - b.x);
  const ca = (a.x - c.x) * (y - c.y) - (a.y - c.y) * (x - c.x);
  const hasNegative = ab < -epsilon || bc < -epsilon || ca < -epsilon;
  const hasPositive = ab > epsilon || bc > epsilon || ca > epsilon;
  return !(hasNegative && hasPositive);
}

function fieldIndex(field: Pick<ProfileField, "width">, x: number, y: number): number {
  return y * field.width + x;
}

function fillUnsignedDistanceField(
  field: Pick<ProfileField, "originX" | "originY" | "cellSize" | "width" | "height">,
  segments: readonly BoundarySegment[],
  distances: Float64Array,
): void {
  for (let y = 0; y < field.height; y += 1) {
    const py = field.originY + y * field.cellSize;
    for (let x = 0; x < field.width; x += 1) {
      const px = field.originX + x * field.cellSize;
      let nearestSquared = Number.POSITIVE_INFINITY;
      for (const segment of segments) {
        const dx = segment.bx - segment.ax;
        const dy = segment.by - segment.ay;
        const lengthSquared = dx * dx + dy * dy;
        const projection = lengthSquared > 0
          ? Math.max(0, Math.min(1, ((px - segment.ax) * dx + (py - segment.ay) * dy) / lengthSquared))
          : 0;
        const offsetX = px - (segment.ax + dx * projection);
        const offsetY = py - (segment.ay + dy * projection);
        nearestSquared = Math.min(nearestSquared, offsetX * offsetX + offsetY * offsetY);
      }
      distances[y * field.width + x] = Number.isFinite(nearestSquared)
        ? Math.sqrt(nearestSquared)
        : 0;
    }
  }
}

function buildProfileField(
  cap: CapMesh,
  size: number,
  settings: Text3DLiquidGeometryQualityBudget,
  includeDistance = false,
): ProfileField {
  let minimumX = Number.POSITIVE_INFINITY;
  let minimumY = Number.POSITIVE_INFINITY;
  let maximumX = Number.NEGATIVE_INFINITY;
  let maximumY = Number.NEGATIVE_INFINITY;
  for (const vertex of cap.vertices) {
    minimumX = Math.min(minimumX, vertex.x);
    minimumY = Math.min(minimumY, vertex.y);
    maximumX = Math.max(maximumX, vertex.x);
    maximumY = Math.max(maximumY, vertex.y);
  }
  if (cap.vertices.length === 0) {
    minimumX = 0;
    minimumY = 0;
    maximumX = 0;
    maximumY = 0;
  }

  const spanX = maximumX - minimumX;
  const spanY = maximumY - minimumY;
  const maximumIntervals = settings.maximumGridSide - FIELD_PADDING * 2 - 1;
  const cellSize = Math.max(
    size * settings.gridCellLengthScale,
    Math.max(spanX, spanY) / maximumIntervals,
  );
  const width = Math.min(
    settings.maximumGridSide,
    Math.ceil(spanX / cellSize) + 1 + FIELD_PADDING * 2,
  );
  const height = Math.min(
    settings.maximumGridSide,
    Math.ceil(spanY / cellSize) + 1 + FIELD_PADDING * 2,
  );
  const originX = minimumX - FIELD_PADDING * cellSize;
  const originY = minimumY - FIELD_PADDING * cellSize;
  const sampleCount = width * height;
  const inside = new Uint8Array(sampleCount);
  const epsilon = Math.max(1e-12, cellSize * cellSize * 1e-7);

  for (const [aIndex, bIndex, cIndex] of cap.triangles) {
    const a = cap.vertices[aIndex]!;
    const b = cap.vertices[bIndex]!;
    const c = cap.vertices[cIndex]!;
    const triangleMinimumX = Math.min(a.x, b.x, c.x);
    const triangleMinimumY = Math.min(a.y, b.y, c.y);
    const triangleMaximumX = Math.max(a.x, b.x, c.x);
    const triangleMaximumY = Math.max(a.y, b.y, c.y);
    const gridMinimumX = Math.max(0, Math.floor((triangleMinimumX - originX) / cellSize));
    const gridMinimumY = Math.max(0, Math.floor((triangleMinimumY - originY) / cellSize));
    const gridMaximumX = Math.min(width - 1, Math.ceil((triangleMaximumX - originX) / cellSize));
    const gridMaximumY = Math.min(height - 1, Math.ceil((triangleMaximumY - originY) / cellSize));
    for (let gridY = gridMinimumY; gridY <= gridMaximumY; gridY += 1) {
      const y = originY + gridY * cellSize;
      for (let gridX = gridMinimumX; gridX <= gridMaximumX; gridX += 1) {
        const index = gridY * width + gridX;
        if (inside[index]) continue;
        const x = originX + gridX * cellSize;
        if (triangleContainsPoint(x, y, a, b, c, epsilon)) inside[index] = 1;
      }
    }
  }

  const fixedBoundary = new Uint8Array(sampleCount);
  let insideSampleCount = 0;
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      if (!inside[index]) continue;
      insideSampleCount += 1;
      if (
        !inside[index - 1]
        || !inside[index + 1]
        || !inside[index - width]
        || !inside[index + width]
      ) fixedBoundary[index] = 1;
    }
  }

  let current = new Float64Array(sampleCount);
  let next = new Float64Array(sampleCount);
  for (let iteration = 0; iteration < settings.relaxationIterations; iteration += 1) {
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = y * width + x;
        if (!inside[index] || fixedBoundary[index]) continue;
        next[index] = (
          current[index - 1]!
          + current[index + 1]!
          + current[index - width]!
          + current[index + width]!
          + 1
        ) * 0.25;
      }
    }
    [current, next] = [next, current];
  }

  let maximumHeight = 0;
  for (let index = 0; index < sampleCount; index += 1) {
    maximumHeight = Math.max(maximumHeight, current[index]!);
  }
  const authoredHeight = size * INFLATION_HEIGHT_SCALE;
  const normalization = maximumHeight > 0 ? authoredHeight / maximumHeight : 0;
  const heights = new Float64Array(sampleCount);
  for (let index = 0; index < sampleCount; index += 1) {
    heights[index] = current[index]! * normalization;
  }

  const gradientX = new Float64Array(sampleCount);
  const gradientY = new Float64Array(sampleCount);
  const inverseDiameter = 1 / (2 * cellSize);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      if (!inside[index]) continue;
      gradientX[index] = (heights[index + 1]! - heights[index - 1]!) * inverseDiameter;
      gradientY[index] = (heights[index + width]! - heights[index - width]!) * inverseDiameter;
    }
  }

  const distances = new Float64Array(sampleCount);
  const distanceGradientX = new Float64Array(sampleCount);
  const distanceGradientY = new Float64Array(sampleCount);
  if (includeDistance) {
    fillUnsignedDistanceField(
      { originX, originY, cellSize, width, height },
      cap.boundarySegments,
      distances,
    );
    for (let index = 0; index < sampleCount; index += 1) {
      // Sign the unsigned polyline distance so bilinear gradients point inward
      // across the outline. Unsigned distance has a crease on the contour;
      // the signed field is the 2D SDF whose gradient is the analytic
      // silhouette direction:
      // https://iquilezles.org/articles/distfunctions2d/
      if (!inside[index]) distances[index] = -(distances[index] ?? 0);
    }
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = y * width + x;
        distanceGradientX[index] = (distances[index + 1]! - distances[index - 1]!) * inverseDiameter;
        distanceGradientY[index] = (distances[index + width]! - distances[index - width]!) * inverseDiameter;
      }
    }
  }

  return {
    originX,
    originY,
    cellSize,
    width,
    height,
    heights,
    gradientX,
    gradientY,
    distances,
    distanceGradientX,
    distanceGradientY,
    insideSampleCount,
  };
}

function bilinearSample(field: ProfileField, values: Float64Array, x: number, y: number): number {
  const fieldX = Math.max(0, Math.min(field.width - 1, (x - field.originX) / field.cellSize));
  const fieldY = Math.max(0, Math.min(field.height - 1, (y - field.originY) / field.cellSize));
  const x0 = Math.min(field.width - 2, Math.floor(fieldX));
  const y0 = Math.min(field.height - 2, Math.floor(fieldY));
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  const tx = fieldX - x0;
  const ty = fieldY - y0;
  const top = values[fieldIndex(field, x0, y0)]! * (1 - tx)
    + values[fieldIndex(field, x1, y0)]! * tx;
  const bottom = values[fieldIndex(field, x0, y1)]! * (1 - tx)
    + values[fieldIndex(field, x1, y1)]! * tx;
  return top * (1 - ty) + bottom * ty;
}

function clampedFieldValue(
  field: Pick<ProfileField, "width" | "height">,
  values: Float64Array,
  x: number,
  y: number,
): number {
  const ix = Math.max(0, Math.min(field.width - 1, x));
  const iy = Math.max(0, Math.min(field.height - 1, y));
  return values[iy * field.width + ix]!;
}

/**
 * Centred Catmull-Rom cubic, C1, so the reconstructed gradient is continuous
 * across cell faces. Bilinear height is only C0; its derivative is piecewise
 * constant and shades a mirror as concentric grid rings:
 * https://en.wikipedia.org/wiki/Cubic_Hermite_spline#Catmull%E2%80%93Rom_spline
 */
function catmullRom(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (
    2 * p1
    + (-p0 + p2) * t
    + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2
    + (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

function catmullRomDerivative(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  return 0.5 * (
    (-p0 + p2)
    + 2 * (2 * p0 - 5 * p1 + 4 * p2 - p3) * t
    + 3 * (-p0 + 3 * p1 - 3 * p2 + p3) * t2
  );
}

function bicubicSampleWithGradient(
  field: ProfileField,
  values: Float64Array,
  x: number,
  y: number,
): { value: number; gradientX: number; gradientY: number } {
  const fieldX = (x - field.originX) / field.cellSize;
  const fieldY = (y - field.originY) / field.cellSize;
  const x1 = Math.floor(fieldX);
  const y1 = Math.floor(fieldY);
  const tx = fieldX - x1;
  const ty = fieldY - y1;
  const row = [0, 0, 0, 0];
  const rowDx = [0, 0, 0, 0];
  for (let offsetY = 0; offsetY < 4; offsetY += 1) {
    const sampleY = y1 + offsetY - 1;
    const p0 = clampedFieldValue(field, values, x1 - 1, sampleY);
    const p1 = clampedFieldValue(field, values, x1, sampleY);
    const p2 = clampedFieldValue(field, values, x1 + 1, sampleY);
    const p3 = clampedFieldValue(field, values, x1 + 2, sampleY);
    row[offsetY] = catmullRom(p0, p1, p2, p3, tx);
    rowDx[offsetY] = catmullRomDerivative(p0, p1, p2, p3, tx);
  }
  return {
    value: catmullRom(row[0]!, row[1]!, row[2]!, row[3]!, ty),
    gradientX: catmullRom(rowDx[0]!, rowDx[1]!, rowDx[2]!, rowDx[3]!, ty) / field.cellSize,
    gradientY: catmullRomDerivative(row[0]!, row[1]!, row[2]!, row[3]!, ty) / field.cellSize,
  };
}

/**
 * Local stroke half-width W: the distance-field value on the medial ridge that
 * each interior sample flows toward. For a strip this equals the true
 * half-width; Poisson's p_max = W²/2 identity is the infinite-strip special
 * case of the same quantity and under-reads at stroke ends, so the ridge of d
 * is the one that stays self-similar on real glyphs. Ridge inheritance alone
 * is discontinuous where three or more branches meet, so a short Jacobi
 * diffusion follows; W only scales the ellipse and does not need to be exact.
 * Do not pin W to d after the diffusion: a branch is a local maximum of d, and
 * that pin would keep a one-cell spike whose crest height is the fold.
 */
export function buildLiquidHalfWidthField(field: {
  width: number;
  height: number;
  distances: Float64Array;
}): Float64Array {
  const { width, height, distances } = field;
  const count = width * height;
  const assigned = new Float64Array(count);
  const interior: number[] = [];
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      if (distances[index]! > 0) interior.push(index);
    }
  }
  interior.sort((first, second) => distances[second]! - distances[first]!);
  const neighborOffsets = [-1, 1, -width, width, -width - 1, -width + 1, width - 1, width + 1];
  for (const index of interior) {
    const distance = distances[index]!;
    let isRidge = true;
    let inherited = 0;
    for (const offset of neighborOffsets) {
      const neighbor = index + offset;
      const neighborDistance = distances[neighbor] ?? Number.NEGATIVE_INFINITY;
      if (neighborDistance > distance) isRidge = false;
      if (neighborDistance >= distance && assigned[neighbor]! > inherited) {
        inherited = assigned[neighbor]!;
      }
    }
    assigned[index] = isRidge || inherited <= 0 ? distance : inherited;
  }
  for (let pass = 0; pass < 3; pass += 1) {
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = y * width + x;
        if (assigned[index]! > 0) continue;
        let sum = 0;
        let weight = 0;
        for (const offset of [-1, 1, -width, width]) {
          const neighbor = assigned[index + offset]!;
          if (neighbor > 0) {
            sum += neighbor;
            weight += 1;
          }
        }
        if (weight > 0) assigned[index] = sum / weight;
      }
    }
  }

  let current = assigned;
  let next = Float64Array.from(assigned);
  for (let pass = 0; pass < LIQUID_HALF_WIDTH_SMOOTHING_PASSES; pass += 1) {
    for (let y = 1; y < height - 1; y += 1) {
      for (let x = 1; x < width - 1; x += 1) {
        const index = y * width + x;
        if (distances[index]! <= 0) continue;
        let sum = current[index]!;
        let weight = 1;
        for (const offset of neighborOffsets) {
          const neighbor = current[index + offset]!;
          if (neighbor > 0) {
            sum += neighbor;
            weight += 1;
          }
        }
        next[index] = sum / weight;
      }
    }
    [current, next] = [next, current];
  }
  return current;
}

function profileCap(
  cap: CapMesh,
  field: ProfileField,
  orientation: -1 | 1,
  size: number,
): { heights: number[]; normals: Array<[number, number, number]> } {
  const seamTolerance = Math.max(1e-8, size * 1e-7);
  const samples = cap.vertices.map((vertex): ProfileSample => {
    const boundary = boundaryDistance(vertex.x, vertex.y, cap.boundarySegments) <= seamTolerance;
    const height = boundary
      ? 0
      : bilinearSample(field, field.heights, vertex.x, vertex.y);
    const gradientX = bilinearSample(field, field.gradientX, vertex.x, vertex.y);
    const gradientY = bilinearSample(field, field.gradientY, vertex.x, vertex.y);
    return { height, gradientX, gradientY };
  });
  const heights = samples.map(({ height }) => height);
  const normals = samples.map((sample): [number, number, number] => {
    const nx = -sample.gradientX;
    const ny = -sample.gradientY;
    const inverseLength = 1 / Math.hypot(nx, ny, orientation);
    return [nx * inverseLength, ny * inverseLength, orientation * inverseLength];
  });
  return { heights, normals };
}

function appendProfiledCap(
  arrays: GeometryArrays,
  cap: CapMesh,
  field: ProfileField,
  planeZ: number,
  orientation: -1 | 1,
  size: number,
): void {
  const capProfile = profileCap(cap, field, orientation, size);
  for (const triangle of cap.triangles) {
    for (const index of triangle) {
      const vertex = cap.vertices[index]!;
      arrays.positions.push(
        vertex.x,
        vertex.y,
        planeZ + orientation * capProfile.heights[index]!,
      );
      arrays.normals.push(...capProfile.normals[index]!);
      arrays.uvs.push(vertex.u, vertex.v);
    }
  }
}

/**
 * Half-thickness of the liquid blob, self-similar in the local half-width W.
 *
 * t = d/W, h = A(W) √(t(2 − t)), A = min(W, A_max). That is the upper half of
 * the ellipse (d − W)²/W² + h²/A² = 1. When A = W it is the same circular
 * canal profile thin strokes already used; when A < W the whole stroke still
 * rolls (no plateau, so no bead), just as a flatter ellipse. h(0) = 0 and
 * dh/dd → +∞ as d → 0+, so the mirrored halves share a vertical tangent.
 */
function liquidHalfHeight(
  distance: number,
  halfWidth: number,
  maximumHeight: number,
): { height: number; dHeightDd: number; dHeightDw: number } {
  const d = Math.max(0, distance);
  const width = Math.max(halfWidth, 1e-12);
  const amplitude = Math.min(width, Math.max(0, maximumHeight));
  const t = Math.min(1, d / width);
  if (t <= 0 || amplitude <= 0) {
    return { height: 0, dHeightDd: 0, dHeightDw: 0 };
  }
  const s = Math.sqrt(Math.max(0, t * (2 - t)));
  const height = amplitude * s;
  const dsDtOverS = s > 1e-12 ? (1 - t) / s : 0;
  const dHeightDd = amplitude * dsDtOverS / width;
  const dAmplitudeDw = amplitude < maximumHeight ? 1 : 0;
  const dHeightDw = dAmplitudeDw * s - amplitude * dsDtOverS * d / (width * width);
  return { height, dHeightDd, dHeightDw };
}

function liquidSurfaceSample(
  distance: number,
  halfWidth: number,
  distanceGradientX: number,
  distanceGradientY: number,
  halfWidthGradientX: number,
  halfWidthGradientY: number,
  maximumHeight: number,
): LiquidSurfaceSample {
  const d = Math.max(0, distance);
  const width = Math.max(halfWidth, 1e-12);
  const { height, dHeightDd, dHeightDw } = liquidHalfHeight(d, width, maximumHeight);
  const t = Math.min(1, d / width);
  const s = Math.sqrt(Math.max(0, t * (2 - t)));
  if (s <= 1e-8) {
    const amplitude = Math.min(width, Math.max(0, maximumHeight));
    const dtDx = distanceGradientX / width - d * halfWidthGradientX / (width * width);
    const dtDy = distanceGradientY / width - d * halfWidthGradientY / (width * width);
    const unnormalized: [number, number, number] = [
      -amplitude * (1 - t) * dtDx,
      -amplitude * (1 - t) * dtDy,
      s,
    ];
    if (Math.hypot(...unnormalized) <= 1e-12) {
      return { height, unnormalized: [-distanceGradientX, -distanceGradientY, 0] };
    }
    return { height, unnormalized };
  }
  const gradientX = dHeightDd * distanceGradientX + dHeightDw * halfWidthGradientX;
  const gradientY = dHeightDd * distanceGradientY + dHeightDw * halfWidthGradientY;
  return {
    height,
    unnormalized: [-gradientX, -gradientY, 1],
  };
}

function boundaryOutward(cap: CapMesh): Map<number, [number, number]> {
  const accumulated = new Map<number, { x: number; y: number }>();
  for (const { a, b } of cap.boundaryEdges) {
    const first = cap.vertices[a]!;
    const second = cap.vertices[b]!;
    const edgeX = second.x - first.x;
    const edgeY = second.y - first.y;
    const inverseLength = 1 / Math.max(1e-12, Math.hypot(edgeX, edgeY));
    // Front-cap winding keeps its filled domain on the left, hence right is out.
    const outwardX = edgeY * inverseLength;
    const outwardY = -edgeX * inverseLength;
    for (const index of [a, b]) {
      const current = accumulated.get(index) ?? { x: 0, y: 0 };
      current.x += outwardX;
      current.y += outwardY;
      accumulated.set(index, current);
    }
  }
  const outward = new Map<number, [number, number]>();
  for (const [index, sum] of accumulated) {
    const length = Math.hypot(sum.x, sum.y);
    outward.set(
      index,
      length > 1e-12 ? [sum.x / length, sum.y / length] : [-1, 0],
    );
  }
  return outward;
}

function liquidRadialStepLength(distance: number, radius: number, ringCount: number): number {
  const deltaPhi = (Math.PI / 2) / Math.max(1, ringCount);
  const firstStep = radius * (1 - Math.cos(deltaPhi));
  if (radius <= 0 || distance >= radius) {
    return Math.max(firstStep, radius * Math.sin(deltaPhi));
  }
  const phi = Math.acos(Math.max(-1, Math.min(1, 1 - distance / radius)));
  return Math.max(
    firstStep,
    radius * Math.abs(Math.cos(phi) - Math.cos(Math.min(Math.PI / 2, phi + deltaPhi))),
  );
}

function liquidEdgeLengthLimit(
  a: Vertex2D,
  b: Vertex2D,
  field: ProfileField,
  halfWidths: Float64Array,
  fallbackRadius: number,
  ringCount: number,
  interiorEdgeLength: number,
  aIsBoundary = false,
  bIsBoundary = false,
): number {
  const midpointX = (a.x + b.x) * 0.5;
  const midpointY = (a.y + b.y) * 0.5;
  const distanceA = aIsBoundary ? 0 : Math.max(0, bilinearSample(field, field.distances, a.x, a.y));
  const distanceB = bIsBoundary ? 0 : Math.max(0, bilinearSample(field, field.distances, b.x, b.y));
  const midpointDistance = Math.max(
    0,
    bilinearSample(field, field.distances, midpointX, midpointY),
  );
  const localWidth = Math.max(
    fallbackRadius,
    bilinearSample(field, halfWidths, midpointX, midpointY),
  );
  const firstRadialStep = liquidRadialStepLength(0, localWidth, ringCount);
  // A single silhouette endpoint must not impose rim spacing on a whole
  // radial span: that 4-splits the interior and exhausts the triangle budget
  // before the first ring can form. Use the min only for the stub that still
  // sits on the silhouette; otherwise the midpoint selects the band.
  const distance = Math.min(distanceA, distanceB) <= firstRadialStep
    ? Math.min(distanceA, distanceB, midpointDistance)
    : midpointDistance;
  const gradientX = bilinearSample(field, field.distanceGradientX, midpointX, midpointY);
  const gradientY = bilinearSample(field, field.distanceGradientY, midpointX, midpointY);
  const edgeX = b.x - a.x;
  const edgeY = b.y - a.y;
  const edgeLength = Math.hypot(edgeX, edgeY);
  const gradientLength = Math.hypot(gradientX, gradientY);
  const radialAlignment = gradientLength > 1e-12 && edgeLength > 1e-12
    ? Math.abs(edgeX * gradientX + edgeY * gradientY) / (edgeLength * gradientLength)
    : 0;
  const farInteriorLength = interiorEdgeLength * 4;
  let radialLimit = farInteriorLength;
  if (distance < localWidth) {
    radialLimit = liquidRadialStepLength(distance, localWidth, ringCount);
  } else if (distance < localWidth * 2) {
    radialLimit = (liquidRadialStepLength(localWidth, localWidth, ringCount) + interiorEdgeLength) * 0.5;
  }
  const tangentialLimit = distance < localWidth * 2 ? interiorEdgeLength : farInteriorLength;
  const radialWeight = radialAlignment * radialAlignment;
  return radialLimit * radialWeight + tangentialLimit * (1 - radialWeight);
}

/**
 * Interior chords whose endpoints both lie on the outline become a second
 * copy of the silhouette ring once height is zero there: each half emits two
 * triangles onto the same mid-plane edge, so welding sees four uses instead
 * of two. Insert a Steiner point on every such chord so the two halves share
 * one outline ring and the chord lifts off the mid-plane.
 */
function splitInteriorBoundaryChords(cap: CapMesh): CapMesh {
  const boundary = new Set<number>();
  for (const { a, b } of cap.boundaryEdges) {
    boundary.add(a);
    boundary.add(b);
  }
  const uses = new Map<string, number>();
  for (const [a, b, c] of cap.triangles) {
    for (const [first, second] of [[a, b], [b, c], [c, a]] as const) {
      const key = edgeKey(first, second);
      uses.set(key, (uses.get(key) ?? 0) + 1);
    }
  }
  const isSilhouetteChord = (first: number, second: number): boolean => {
    if (!boundary.has(first) || !boundary.has(second)) return false;
    if ((uses.get(edgeKey(first, second)) ?? 0) < 2) return false;
    const origin = cap.vertices[first]!;
    const other = cap.vertices[second]!;
    return Math.hypot(origin.x - other.x, origin.y - other.y) > 1e-18;
  };

  const vertices = [...cap.vertices];
  const midpoints = new Map<string, number>();
  const nextTriangles: Triangle[] = [];
  let splitCount = 0;
  for (const [a, b, c] of cap.triangles) {
    const splitAB = isSilhouetteChord(a, b);
    const splitBC = isSilhouetteChord(b, c);
    const splitCA = isSilhouetteChord(c, a);
    const mask = Number(splitAB) | Number(splitBC) << 1 | Number(splitCA) << 2;
    const ab = splitAB ? midpointIndex(vertices, midpoints, a, b) : -1;
    const bc = splitBC ? midpointIndex(vertices, midpoints, b, c) : -1;
    const ca = splitCA ? midpointIndex(vertices, midpoints, c, a) : -1;
    if (mask !== 0) splitCount += 1;
    switch (mask) {
      case 0:
        nextTriangles.push([a, b, c]);
        break;
      case 1:
        nextTriangles.push([a, ab, c], [ab, b, c]);
        break;
      case 2:
        nextTriangles.push([a, b, bc], [a, bc, c]);
        break;
      case 3:
        nextTriangles.push([b, bc, ab], [a, ab, c], [ab, bc, c]);
        break;
      case 4:
        nextTriangles.push([a, b, ca], [ca, b, c]);
        break;
      case 5:
        nextTriangles.push([a, ab, ca], [ab, b, c], [ca, ab, c]);
        break;
      case 6:
        nextTriangles.push([c, ca, bc], [a, b, ca], [b, bc, ca]);
        break;
      case 7:
        nextTriangles.push(
          [a, ab, ca],
          [ab, b, bc],
          [ca, bc, c],
          [ab, bc, ca],
        );
        break;
    }
  }
  if (splitCount === 0) return cap;
  const triangles = nextTriangles.filter((triangle) => new Set(triangle).size === 3);
  return { vertices, triangles, ...capBoundary(vertices, triangles) };
}

function weldDistinctInteriorHeight(height: number, size: number): number {
  const quantum = size * 1e-5;
  if (height >= quantum * 0.5) return height;
  return quantum * 0.51;
}

function appendLiquidCaps(
  arrays: GeometryArrays,
  cap: CapMesh,
  field: ProfileField,
  halfWidths: Float64Array,
  midpointZ: number,
  size: number,
): void {
  const maximumHeight = size * LIQUID_MAXIMUM_HALF_HEIGHT_SCALE;
  const boundary = new Set<number>();
  for (const { a, b } of cap.boundaryEdges) {
    boundary.add(a);
    boundary.add(b);
  }

  const heights: number[] = [];
  const frontNormals: Array<[number, number, number]> = [];
  const outward = boundaryOutward(cap);
  for (let index = 0; index < cap.vertices.length; index += 1) {
    const vertex = cap.vertices[index]!;
    const onBoundary = boundary.has(index);
    const distanceSample = onBoundary
      ? { value: 0, gradientX: 0, gradientY: 0 }
      : bicubicSampleWithGradient(field, field.distances, vertex.x, vertex.y);
    const widthSample = bicubicSampleWithGradient(field, halfWidths, vertex.x, vertex.y);
    const sample = liquidSurfaceSample(
      onBoundary ? 0 : Math.max(0, distanceSample.value),
      widthSample.value > 1e-8 ? widthSample.value : size * LIQUID_RIM_RADIUS_SCALE,
      distanceSample.gradientX,
      distanceSample.gradientY,
      widthSample.gradientX,
      widthSample.gradientY,
      maximumHeight,
    );
    if (onBoundary) {
      const lateral = Math.hypot(sample.unnormalized[0], sample.unnormalized[1]);
      const fallback = outward.get(index);
      heights.push(0);
      frontNormals.push([
        lateral > 1e-12 ? sample.unnormalized[0] / lateral : (fallback?.[0] ?? -1),
        lateral > 1e-12 ? sample.unnormalized[1] / lateral : (fallback?.[1] ?? 0),
        0,
      ]);
      continue;
    }
    // Interior samples whose true height falls inside the output weld quantum
    // would collapse onto the mid-plane silhouette. Nudge only those vertices
    // in emission; do not floor the visible field into a terrace.
    heights.push(weldDistinctInteriorHeight(sample.height, size));
    const inverseLength = 1 / Math.max(1e-12, Math.hypot(...sample.unnormalized));
    frontNormals.push([
      sample.unnormalized[0] * inverseLength,
      sample.unnormalized[1] * inverseLength,
      sample.unnormalized[2] * inverseLength,
    ]);
  }

  const emit = (orientation: -1 | 1): void => {
    for (const triangle of cap.triangles) {
      const indices: Triangle = orientation === 1
        ? triangle
        : [triangle[0], triangle[2], triangle[1]] as Triangle;
      for (const index of indices) {
        const vertex = cap.vertices[index]!;
        const normal = frontNormals[index]!;
        arrays.positions.push(
          vertex.x,
          vertex.y,
          midpointZ + orientation * heights[index]!,
        );
        arrays.normals.push(normal[0], normal[1], orientation * normal[2]);
        arrays.uvs.push(vertex.u, vertex.v);
      }
    }
  };

  emit(-1);
  emit(1);
}

/**
 * Rebuilds the planar front/back triangles of a glyph TextGeometry as
 * regular-grid profiled caps. Balloon retains the source wall and independent
 * front/back tessellation. Liquid evaluates one C1 height field on a shared
 * 2D domain so the two halves meet at a vertical-tangent silhouette. Triangles
 * establish filled-domain coverage, but neither their connectivity nor their
 * directions define the scalar field. Source positions, attributes and groups
 * are never mutated.
 */
export function buildText3DLiquidGeometry(
  source: TextGeometry,
  size: number,
  quality: Text3DLiquidGeometryQuality,
  profile: Text3DLiquidGeometryProfile,
): BufferGeometry {
  const geometry = source.index ? source.toNonIndexed() : source;
  const positions = geometry.getAttribute("position");
  const normals = geometry.getAttribute("normal");
  const uvs = geometry.getAttribute("uv");
  if (!positions || !normals || !uvs || positions.count % 3 !== 0) {
    if (geometry !== source) geometry.dispose();
    throw new Error("Liquid Text3D geometry requires non-indexed position, normal and uv triangles.");
  }

  const resolvedSize = Math.max(1e-6, Math.abs(size));
  let minimumZ = Number.POSITIVE_INFINITY;
  let maximumZ = Number.NEGATIVE_INFINITY;
  for (let index = 0; index < positions.count; index += 1) {
    minimumZ = Math.min(minimumZ, positions.getZ(index));
    maximumZ = Math.max(maximumZ, positions.getZ(index));
  }
  const planeTolerance = Math.max(1e-7, resolvedSize * 1e-6);
  const quantum = Math.max(1e-8, resolvedSize * 1e-6);
  const body: GeometryArrays = { positions: [], normals: [], uvs: [] };
  const frontTriangles: CapTriangle[] = [];
  const backTriangles: CapTriangle[] = [];

  for (let index = 0; index < positions.count; index += 3) {
    const side = capPlane(positions, index, minimumZ, maximumZ, planeTolerance);
    if (!side) {
      appendSourceVertex(body, positions, normals, uvs, index);
      appendSourceVertex(body, positions, normals, uvs, index + 1);
      appendSourceVertex(body, positions, normals, uvs, index + 2);
      continue;
    }
    const triangle: CapTriangle = {
      vertices: [0, 1, 2].map((offset) => ({
        x: positions.getX(index + offset),
        y: positions.getY(index + offset),
        u: uvs.getX(index + offset),
        v: uvs.getY(index + offset),
      })) as [Vertex2D, Vertex2D, Vertex2D],
    };
    (side === "front" ? frontTriangles : backTriangles).push(triangle);
  }

  const settings = TEXT_3D_LIQUID_GEOMETRY_QUALITY[quality];
  const maximumEdgeLength = resolvedSize * settings.maximumEdgeLengthScale;
  const result: GeometryArrays = { positions: [], normals: [], uvs: [] };
  const fields: Text3DLiquidGeometryFieldStats[] = [];
  let rim: Text3DLiquidGeometryStats["rim"];

  if (profile === "liquid") {
    const rawDomain = buildCapMesh(
      frontTriangles.length > 0 ? frontTriangles : backTriangles,
      quantum,
    );
    const domain = conditionLiquidCapBoundary(rawDomain, resolvedSize);
    const field = buildProfileField(domain, resolvedSize, settings, true);
    const halfWidths = buildLiquidHalfWidthField(field);
    fields.push({
      width: field.width,
      height: field.height,
      insideSampleCount: field.insideSampleCount,
    });
    const radius = resolvedSize * LIQUID_RIM_RADIUS_SCALE;
    const ringCount = LIQUID_RIM_RING_COUNT[quality];
    const sourceCapTriangleCount = frontTriangles.length + backTriangles.length;
    const prepared = splitInteriorBoundaryChords(domain);
    // Establish a modest uniform interior first. Starting the adaptive pass
    // from TextGeometry's long silhouette-to-silhouette fans makes their
    // zero-distance endpoints demand rim resolution across the whole glyph.
    // This leaves the remaining budget for the actual rim band.
    const coarse = tessellateCap(
      prepared,
      maximumEdgeLength * 4,
      settings.maximumIterations,
    );
    const coarseBoundary = new Set<Vertex2D>();
    for (const { a, b } of coarse.boundaryEdges) {
      coarseBoundary.add(coarse.vertices[a]!);
      coarseBoundary.add(coarse.vertices[b]!);
    }
    const cap = tessellateCap(
      coarse,
      maximumEdgeLength,
      settings.maximumIterations + LIQUID_RIM_TESSELLATION_EXTRA_ITERATIONS,
      {
        edgeLengthLimit: (a, b) => liquidEdgeLengthLimit(
          a,
          b,
          field,
          halfWidths,
          radius,
          ringCount,
          maximumEdgeLength,
          coarseBoundary.has(a),
          coarseBoundary.has(b),
        ),
        maximumTriangles: Math.max(
          coarse.triangles.length,
          Math.floor(sourceCapTriangleCount * settings.maximumCapTriangleMultiplier / 2),
        ),
      },
    );
    appendLiquidCaps(
      result,
      splitInteriorBoundaryChords(cap),
      field,
      halfWidths,
      (minimumZ + maximumZ) * 0.5,
      resolvedSize,
    );
    rim = { radius, ringCount };
  } else {
    const frontDomain = buildCapMesh(frontTriangles, quantum);
    const backDomain = buildCapMesh(backTriangles, quantum);
    const front = tessellateCap(
      frontDomain,
      maximumEdgeLength,
      settings.maximumIterations,
    );
    const back = tessellateCap(
      backDomain,
      maximumEdgeLength,
      settings.maximumIterations,
    );
    const fieldCache = new Map<string, ProfileField>();
    const fieldKey = (cap: CapMesh): string => cap.boundarySegments
      .map((segment) => {
        const first = `${Math.round(segment.ax / quantum)}:${Math.round(segment.ay / quantum)}`;
        const second = `${Math.round(segment.bx / quantum)}:${Math.round(segment.by / quantum)}`;
        return first < second ? `${first}|${second}` : `${second}|${first}`;
      })
      .sort()
      .join(",");
    const resolveField = (cap: CapMesh): ProfileField => {
      const key = fieldKey(cap);
      const cached = fieldCache.get(key);
      if (cached) return cached;
      const field = buildProfileField(cap, resolvedSize, settings);
      fieldCache.set(key, field);
      fields.push({
        width: field.width,
        height: field.height,
        insideSampleCount: field.insideSampleCount,
      });
      return field;
    };
    appendProfiledCap(
      result,
      back,
      resolveField(backDomain),
      minimumZ,
      -1,
      resolvedSize,
    );
    appendProfiledCap(
      result,
      front,
      resolveField(frontDomain),
      maximumZ,
      1,
      resolvedSize,
    );
    result.positions.push(...body.positions);
    result.normals.push(...body.normals);
    result.uvs.push(...body.uvs);
  }

  const capVertexCount = profile === "liquid"
    ? result.positions.length / 3
    : result.positions.length / 3 - body.positions.length / 3;
  const bodyVertexCount = result.positions.length / 3 - capVertexCount;

  const output = new BufferGeometry();
  output.setAttribute("position", new Float32BufferAttribute(result.positions, 3));
  output.setAttribute("normal", new Float32BufferAttribute(result.normals, 3));
  output.setAttribute("uv", new Float32BufferAttribute(result.uvs, 2));
  output.addGroup(0, capVertexCount, 0);
  output.addGroup(capVertexCount, bodyVertexCount, 1);
  output.userData.text3DLiquidGeometry = {
    profile,
    quality,
    relaxationIterations: settings.relaxationIterations,
    capTriangleCount: capVertexCount / 3,
    fields,
    rim,
  } satisfies Text3DLiquidGeometryStats;
  output.computeBoundingBox();
  output.computeBoundingSphere();
  if (geometry !== source) geometry.dispose();
  return output;
}
