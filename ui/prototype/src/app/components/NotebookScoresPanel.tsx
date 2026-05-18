import { useMemo } from 'react';

export interface NotebookScore {
  id: string;
  name: string;
  score: number;
}

interface ScoreSlice {
  index: number;
  bandStart: number;
  count: number;
  color: string;
  label: string;
  ratio: number;
}

interface RadarSlice {
  label: string;
  color: string;
  ratio: number;
}

const SCORE_BAND_COLORS = ['#ef4444', '#f59e0b', '#facc15', '#a7f3d0', '#22c55e'];
const SCORE_BAND_STARTS = [0, 0.2, 0.4, 0.6, 0.8];

export interface NotebookScoresPanelProps {
  notebooks: NotebookScore[];
  patternName?: string | null;
  focusRange?: { start: number; end: number } | null;
}

type NotebookRow = {
  id: string;
  name: string;
  score: number;
  color: string;
  label: string;
};

function clampScore(score: number) {
  return Math.max(0, Math.min(1, score));
}

function scoreToBandIndex(score: number) {
  const value = clampScore(score);

  if (value <= 0.2) return 0;
  if (value <= 0.4) return 1;
  if (value <= 0.6) return 2;
  if (value <= 0.8) return 3;
  return 4;
}

function scoreToBandColor(index: number) {
  return SCORE_BAND_COLORS[index] ?? SCORE_BAND_COLORS[SCORE_BAND_COLORS.length - 1];
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map(character => character + character).join('')
    : normalized;

  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);

  return { red, green, blue };
}

function rgbToHex(red: number, green: number, blue: number) {
  const clampChannel = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
  return `#${[clampChannel(red), clampChannel(green), clampChannel(blue)]
    .map(channel => channel.toString(16).padStart(2, '0'))
    .join('')}`;
}

function mixColors(startColor: string, endColor: string, ratio: number) {
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  const start = hexToRgb(startColor);
  const end = hexToRgb(endColor);

  return rgbToHex(
    start.red + (end.red - start.red) * clampedRatio,
    start.green + (end.green - start.green) * clampedRatio,
    start.blue + (end.blue - start.blue) * clampedRatio
  );
}

function scoreToColor(score: number) {
  const value = clampScore(score);
  const segment = Math.min(SCORE_BAND_COLORS.length - 2, Math.floor(value * (SCORE_BAND_COLORS.length - 1)));
  const segmentStart = segment / (SCORE_BAND_COLORS.length - 1);
  const segmentEnd = (segment + 1) / (SCORE_BAND_COLORS.length - 1);
  const localRatio = segmentEnd > segmentStart ? (value - segmentStart) / (segmentEnd - segmentStart) : 0;

  return mixColors(SCORE_BAND_COLORS[segment], SCORE_BAND_COLORS[segment + 1], localRatio);
}

function describeBand(index: number) {
  if (index === 0) return '0 - 0.2';
  if (index === 1) return '0.2 - 0.4';
  if (index === 2) return '0.4 - 0.6';
  if (index === 3) return '0.6 - 0.8';
  return '0.8 - 1';
}

export function NotebookScoresPanel({ notebooks, patternName, focusRange }: NotebookScoresPanelProps) {
  const selectedNotebooks = notebooks;

  const { slices, averageScore, totalCount } = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0];
    const scoreTotals = [0, 0, 0, 0, 0];
    let total = 0;

    selectedNotebooks.forEach(item => {
      const value = clampScore(item.score);
      const bucket = scoreToBandIndex(value);
      buckets[bucket] += 1;
      scoreTotals[bucket] += value;
      total += value;
    });

    const average = selectedNotebooks.length > 0 ? total / selectedNotebooks.length : 0;

    const nextSlices = buckets.map((count, index): ScoreSlice => {
      const averageBucketScore = count > 0
        ? scoreTotals[index] / count
        : SCORE_BAND_STARTS[index] + 0.1;

      return {
        index,
        bandStart: SCORE_BAND_STARTS[index],
        count,
        color: scoreToColor(averageBucketScore),
        label: describeBand(index),
        ratio: selectedNotebooks.length > 0 ? count / selectedNotebooks.length : 0,
      };
    }).sort((left, right) => left.bandStart - right.bandStart);

    return {
      slices: nextSlices,
      averageScore: average,
      totalCount: selectedNotebooks.length,
    };
  }, [selectedNotebooks]);

  const radarSize = 210;
  const radarCenter = radarSize / 2;
  const radarRadius = 72;
  const radarAxes = 5;

  const radarSlices = useMemo<RadarSlice[]>(() => {
    const buckets = [0, 0, 0, 0, 0];
    const scoreTotals = [0, 0, 0, 0, 0];

    selectedNotebooks.forEach(item => {
      const value = clampScore(item.score);

      if (value <= 0.2) {
        buckets[0] += 1;
        scoreTotals[0] += value;
      } else if (value <= 0.4) {
        buckets[1] += 1;
        scoreTotals[1] += value;
      } else if (value <= 0.6) {
        buckets[2] += 1;
        scoreTotals[2] += value;
      } else if (value <= 0.8) {
        buckets[3] += 1;
        scoreTotals[3] += value;
      } else {
        buckets[4] += 1;
        scoreTotals[4] += value;
      }
    });

    const labels = ['0 - 0.2', '0.2 - 0.4', '0.4 - 0.6', '0.6 - 0.8', '0.8 - 1'];

    return buckets.map((count, index) => ({
      label: labels[index],
      color: scoreToColor(count > 0 ? scoreTotals[index] / count : SCORE_BAND_STARTS[index] + 0.1),
      ratio: selectedNotebooks.length > 0 ? count / selectedNotebooks.length : 0,
    }));
  }, [selectedNotebooks]);

  const radarPoints = radarSlices.map((slice, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / radarAxes;
    const distance = radarRadius * (0.18 + slice.ratio * 0.82);
    const x = radarCenter + Math.cos(angle) * distance;
    const y = radarCenter + Math.sin(angle) * distance;

    return { x, y };
  });

  const radarPolygonPoints = radarPoints.map(point => `${point.x},${point.y}`).join(' ');

  const axisPoints = Array.from({ length: radarAxes }, (_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / radarAxes;
    return {
      x: radarCenter + Math.cos(angle) * radarRadius,
      y: radarCenter + Math.sin(angle) * radarRadius,
    };
  });

  const heatmapColumns = 12;
  const heatmapRows = 5;
  const heatmapYAxisLabels = ['1.00', '0.75', '0.50', '0.25', '0.00'];
  const heatmapXAxisLabels = Array.from({ length: heatmapColumns }, (_, index) => {
    const value = index / (heatmapColumns - 1);
    return value.toFixed(2);
  });

  const heatmapGrid = useMemo(() => {
    return Array.from({ length: heatmapRows }, (_, rowIndex) =>
      Array.from({ length: heatmapColumns }, (_, columnIndex) => {
        const scoreBandIndex = columnIndex < 2
          ? 0
          : columnIndex < 4
            ? 1
            : columnIndex < 7
              ? 2
              : columnIndex < 9
                ? 3
                : 4;

        const baseColor = SCORE_BAND_COLORS[scoreBandIndex];
        const rowFactor = (heatmapRows - rowIndex) / heatmapRows;
        const colFactor = (columnIndex + 1) / heatmapColumns;
        const opacity = Math.max(0.18, Math.min(0.96, 0.28 + rowFactor * 0.36 + colFactor * 0.24));

        return {
          color: baseColor,
          opacity,
        };
      })
    );
  }, [heatmapColumns, heatmapRows]);

  const notebookRows = useMemo<NotebookRow[]>(() => {
    return notebooks
      .map(item => ({
        id: item.id,
        name: item.name,
        score: clampScore(item.score),
        color: scoreToColor(item.score),
        label: describeBand(scoreToBandIndex(item.score)),
      }))
      .sort((left, right) => {
        if (left.score !== right.score) {
          return left.score - right.score;
        }

        return left.name.localeCompare(right.name);
      });
  }, [notebooks]);

  const gradientStops: string[] = [];

  if (totalCount > 0) {
    let start = 0;

    slices.forEach(slice => {
      const span = slice.ratio * 100;
      const end = start + span;

      if (span > 0) {
        gradientStops.push(`${slice.color} ${start}% ${end}%`);
      }

      start = end;
    });
  }

  const conicGradient = totalCount > 0 && gradientStops.length > 0
    ? `conic-gradient(${gradientStops.join(', ')})`
    : 'conic-gradient(#e2e8f0 0% 100%)';

  return (
    <section
      className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl p-3"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="text-[13px] font-semibold text-slate-900">
            Répartition des notebooks par score
          </div>
        </div>
      </div>

      <div className="mt-3 grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-4">
          <div className="w-full rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <div className="mb-3">
              <div className="text-[13px] font-semibold text-slate-900">Moyenne des notebooks</div>
              <div className="text-[10px] text-slate-500">Répartition globale des scores</div>
            </div>

            <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-center lg:justify-center lg:gap-6">
              <div className="relative flex h-[176px] w-[176px] items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: conicGradient,
                    boxShadow: 'inset 0 0 0 1px rgba(148,163,184,0.20)',
                  }}
                />
                <div
                  className="absolute rounded-full bg-white shadow-[0_0_0_1px_rgba(148,163,184,0.12)]"
                  style={{ width: 116, height: 116 }}
                />

                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Moyenne
                  </div>
                  <div className="text-2xl font-semibold text-slate-900">
                    {averageScore.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                {slices
                  .filter(slice => slice.count > 0)
                  .map(slice => (
                    <div key={slice.index} className="min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-[0_4px_18px_rgba(15,23,42,0.03)]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 whitespace-nowrap">
                            {slice.label}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[12px] text-slate-500">
                            <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: slice.color }} />
                            <span>{slice.count} notebooks</span>
                            {/* <span>notebooks</span> */}
                          </div>
                        </div>
{/* 
                        <div className="shrink-0 text-right text-[12px] font-semibold text-slate-900">
                          {slice.ratio.toFixed(2)}
                        </div> */}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="h-fit self-start rounded-2xl border border-slate-200 bg-white/70 p-2.5 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <div>
                <div className="text-[13px] font-semibold text-slate-900">Spider chart</div>
                <div className="text-[10px] text-slate-500">Répartition des notebooks par tranche de score</div>
              </div>
            </div>

            <div className="flex justify-center">
              <svg viewBox={`0 0 ${radarSize} ${radarSize}`} className="h-[160px] w-[160px] max-w-full overflow-visible">
                <defs>
                  <linearGradient id="radar-fill-notebook-scores" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0f172a" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0.06" />
                  </linearGradient>
                </defs>

                {[0.28, 0.52, 0.76, 1].map(ring => (
                  <polygon
                    key={ring}
                    points={Array.from({ length: radarAxes }, (_, index) => {
                      const angle = -Math.PI / 2 + (index * Math.PI * 2) / radarAxes;
                      const x = radarCenter + Math.cos(angle) * radarRadius * ring;
                      const y = radarCenter + Math.sin(angle) * radarRadius * ring;
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="rgba(148,163,184,0.22)"
                    strokeWidth="1"
                  />
                ))}

                {axisPoints.map((point, index) => (
                  <line
                    key={`axis-${index}`}
                    x1={radarCenter}
                    y1={radarCenter}
                    x2={point.x}
                    y2={point.y}
                    stroke="rgba(148,163,184,0.30)"
                    strokeWidth="1"
                  />
                ))}

                {radarPoints.length > 0 && (
                  <polygon
                    points={radarPolygonPoints}
                    fill="url(#radar-fill-notebook-scores)"
                    stroke="#0f172a"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                )}

                {radarPoints.map((point, index) => (
                  <g key={`point-${index}`}>
                    <circle cx={point.x} cy={point.y} r="4.2" fill={radarSlices[index]?.color ?? '#0f172a'} stroke="#ffffff" strokeWidth="2" />
                    <text
                      x={axisPoints[index].x}
                      y={axisPoints[index].y}
                      dy={axisPoints[index].y < radarCenter ? -10 : 18}
                      textAnchor="middle"
                      fill="#475569"
                      fontSize="10"
                      fontWeight="600"
                    >
                      {radarSlices[index]?.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>

        <div className="h-fit self-start rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-[13px] font-semibold text-slate-900">Heatmap</div>
              <div className="text-[10px] text-slate-500">Grille cohérente par score et intensité</div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-[15px]">
            <div className="grid items-start gap-3" style={{ gridTemplateColumns: '36px minmax(0, 1fr)' }}>
              <div className="grid gap-[4px] py-5 text-[11px] font-semibold text-slate-400" style={{ gridTemplateRows: `repeat(${heatmapRows}, 42px)` }}>
                {heatmapYAxisLabels.map(label => (
                  <div key={label} className="flex items-center justify-end leading-none">
                    {label}
                  </div>
                ))}
              </div>

              <div className="flex w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white/80 p-3">
                <div
                  className="grid w-full gap-[2px]"
                  style={{ gridTemplateColumns: `repeat(${heatmapColumns}, minmax(0, 1fr))`, gridAutoRows: '42px' }}
                >
                  {heatmapGrid.flatMap((row, rowIndex) =>
                    row.map((cell, columnIndex) => (
                      <div
                        key={`${rowIndex}-${columnIndex}`}
                        className="h-9 w-full rounded-[3px] border border-white/70"
                        style={{
                          backgroundColor: cell.color,
                          opacity: cell.opacity,
                        }}
                      />
                    ))
                  )}
                </div>

                <div className="mt-4 grid w-full gap-[2px] text-[9px] font-semibold leading-none text-slate-400" style={{ gridTemplateColumns: `repeat(${heatmapColumns}, minmax(0, 1fr))` }}>
                  {heatmapXAxisLabels.map(label => (
                    <div key={label} className="text-center">
                      {label}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 text-[10px] text-slate-500">
                  <span>Faible densité</span>
                  <div className="h-2 flex-1 rounded-full bg-gradient-to-r from-rose-400 via-yellow-300 to-emerald-400" />
                  <span>Forte densité</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default NotebookScoresPanel;
