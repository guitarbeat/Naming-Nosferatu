/**
 * @module BumpChart
 * @description Interactive bump chart visualization showing ranking changes over time.
 * Displays how cat names move up/down in rankings across different time periods.
 * Features animated line drawing and staggered point appearances.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { TrendIndicator } from "../TrendIndicator";
import "./BumpChart.css";

// Animation configuration
const ANIMATION_CONFIG = {
  lineDuration: 800,
  lineStagger: 120,
  pointDelay: 400,
  pointStagger: 60,
  legendDelay: 600,
  legendStagger: 80,
};

// Color palette for the lines (vibrant, distinguishable colors)
const COLORS = [
  "var(--chart-1, hsl(220, 70%, 50%))",
  "var(--chart-2, hsl(160, 60%, 45%))",
  "var(--chart-3, hsl(30, 80%, 55%))",
  "var(--chart-4, hsl(280, 65%, 60%))",
  "var(--chart-5, hsl(0, 70%, 55%))",
  "var(--chart-6, hsl(190, 70%, 50%))",
  "var(--chart-7, hsl(45, 90%, 50%))",
  "var(--chart-8, hsl(320, 70%, 55%))",
  "var(--chart-9, hsl(100, 60%, 45%))",
  "var(--chart-10, hsl(250, 60%, 60%))",
];

/**
 * Generate SVG path for a bump chart line (smooth curves)
 */
function generatePath(points, chartWidth, chartHeight, padding, rankToY) {
  if (!points || points.length < 2) return "";

  const xStep = (chartWidth - padding * 2) / (points.length - 1);

  const coords = points.map((rank, i) => ({
    x: padding + i * xStep,
    y: rankToY(rank),
  }));

  // Create smooth bezier curve
  let path = `M ${coords[0].x} ${coords[0].y}`;

  for (let i = 0; i < coords.length - 1; i++) {
    const current = coords[i];
    const next = coords[i + 1];
    const midX = (current.x + next.x) / 2;

    path += ` C ${midX} ${current.y}, ${midX} ${next.y}, ${next.x} ${next.y}`;
  }

  return path;
}

/**
 * BumpChart Component
 */
export function BumpChart({
  data = [],
  timeLabels = [],
  maxDisplayed = 10,
  height = 320,
  showLegend = true,
  onNameClick,
  highlightedName = null,
  animated = true,
}) {
  const svgRef = useRef(null);
  const [hoveredName, setHoveredName] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 600, height });
  const [tooltipData, setTooltipData] = useState(null);
  const [useNormalizedScale, setUseNormalizedScale] = useState(false);
  const [highlightTopMovers, setHighlightTopMovers] = useState(false);
  const animationKey = useMemo(
    () =>
      animated
        ? `anim-${data.map((item) => item.id).join("|")}-${timeLabels.join("|")}`
        : "static",
    [animated, data, timeLabels]
  );

  // Responsive sizing
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current?.parentElement) {
        const parentWidth = svgRef.current.parentElement.offsetWidth;
        setDimensions({ width: Math.max(300, parentWidth - 20), height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [height]);

  // Process data into chart format
  const chartData = useMemo(() => {
    if (!data.length || !timeLabels.length) return { lines: [], maxRank: 10 };

    // Get top N names by final ranking
    const sortedNames = [...data]
      .sort((a, b) => {
        const aFinal = a.rankings[a.rankings.length - 1] ?? Infinity;
        const bFinal = b.rankings[b.rankings.length - 1] ?? Infinity;
        return aFinal - bFinal;
      })
      .slice(0, maxDisplayed);

    const maxRank = Math.max(
      ...sortedNames.flatMap((d) => d.rankings.filter((r) => r !== null)),
      10
    );

    const lines = sortedNames.map((item, idx) => ({
      id: item.id,
      name: item.name,
      color: COLORS[idx % COLORS.length],
      rankings: item.rankings,
      avgRating: item.avgRating,
      totalSelections: item.totalSelections,
      change: calculateChange(item.rankings),
    }));

    const topUpMover = lines
      .filter((l) => l.change > 0)
      .sort((a, b) => b.change - a.change)[0];
    const topDownMover = lines
      .filter((l) => l.change < 0)
      .sort((a, b) => a.change - b.change)[0];
    const mostSelected = lines
      .filter(
        (l) => l.totalSelections !== undefined && l.totalSelections !== null
      )
      .sort((a, b) => (b.totalSelections ?? 0) - (a.totalSelections ?? 0))[0];

    return {
      lines,
      maxRank: Math.min(maxRank, maxDisplayed),
      summary: {
        topUpMover,
        topDownMover,
        mostSelected,
      },
    };
  }, [data, timeLabels, maxDisplayed]);

  const handleMouseMove = useCallback(
    (e, line) => {
      if (!svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const padding = 50;
      const chartWidth = dimensions.width;
      const xStep = (chartWidth - padding * 2) / (timeLabels.length - 1);

      // Find closest time period
      const periodIndex = Math.round((x - padding) / xStep);
      const clampedIndex = Math.max(
        0,
        Math.min(periodIndex, timeLabels.length - 1)
      );
      const rank = line.rankings[clampedIndex];

      if (rank !== null) {
        // Calculate movement from previous period
        const previousRank =
          clampedIndex > 0 ? line.rankings[clampedIndex - 1] : null;
        const movement = previousRank !== null ? previousRank - rank : 0;

        setTooltipData({
          x: e.clientX,
          y: e.clientY,
          name: line.name,
          rank,
          period: timeLabels[clampedIndex],
          color: line.color,
          avgRating: line.avgRating,
          totalSelections: line.totalSelections,
          movement,
          previousRank,
        });
      }
    },
    [dimensions.width, timeLabels]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredName(null);
    setTooltipData(null);
  }, []);

  if (!chartData.lines.length) {
    return (
      <div className="bump-chart-empty">
        <p>No ranking data available yet.</p>
        <p className="bump-chart-empty-hint">
          Play more tournaments to see how names rank over time!
        </p>
      </div>
    );
  }

  const padding = 50;
  const { width } = dimensions;
  const chartHeight = height;

  const rankToY = useCallback(
    (rank) => {
      const maxRank = chartData.maxRank;
      const fraction = (rank - 1) / Math.max(1, maxRank - 1);
      const eased = useNormalizedScale ? Math.pow(fraction, 0.6) : fraction;
      return padding + eased * (chartHeight - padding * 2);
    },
    [chartData.maxRank, chartHeight, padding, useNormalizedScale]
  );

  const rankTicks = useNormalizedScale
    ? [0, 0.25, 0.5, 0.75, 1].map((t) => ({
        label: `${Math.round(t * 100)}%`,
        y: padding + t * (chartHeight - padding * 2),
      }))
    : Array.from({ length: chartData.maxRank }, (_, i) => ({
        label: `#${i + 1}`,
        y:
          padding +
          (i * (chartHeight - padding * 2)) /
            Math.max(1, chartData.maxRank - 1),
      }));

  return (
    <div className="bump-chart-container">
      <div className="bump-chart-description">
        <p>
          This chart shows how cat names rank over time. Higher positions (lower
          rank numbers) indicate stronger performance. Hover over lines to see
          detailed metrics.
        </p>
        <div className="bump-chart-controls">
          <button
            type="button"
            className={`bump-chart-control ${useNormalizedScale ? "active" : ""}`}
            onClick={() => setUseNormalizedScale((prev) => !prev)}
          >
            Normalize Y-axis
          </button>
          <button
            type="button"
            className={`bump-chart-control ${highlightTopMovers ? "active" : ""}`}
            onClick={() => setHighlightTopMovers((prev) => !prev)}
            disabled={
              !chartData.summary?.topUpMover && !chartData.summary?.topDownMover
            }
          >
            Highlight movers
          </button>
        </div>
        {chartData.summary && (
          <div className="bump-chart-summary">
            {chartData.summary.topUpMover && (
              <div className="bump-chart-chip">
                <span className="chip-label">Top climber</span>
                <span className="chip-value">
                  {chartData.summary.topUpMover.name} ↑
                  {chartData.summary.topUpMover.change}
                </span>
              </div>
            )}
            {chartData.summary.topDownMover && (
              <div className="bump-chart-chip chip-negative">
                <span className="chip-label">Biggest drop</span>
                <span className="chip-value">
                  {chartData.summary.topDownMover.name} ↓
                  {Math.abs(chartData.summary.topDownMover.change)}
                </span>
              </div>
            )}
            {chartData.summary.mostSelected && (
              <div className="bump-chart-chip">
                <span className="chip-label">Most picked</span>
                <span className="chip-value">
                  {chartData.summary.mostSelected.name} ·{" "}
                  {chartData.summary.mostSelected.totalSelections ?? 0}x
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      <svg
        ref={svgRef}
        className="bump-chart-svg"
        viewBox={`0 0 ${width} ${chartHeight}`}
        preserveAspectRatio="xMidYMid meet"
        aria-label="Bump chart showing cat name ranking changes over time"
      >
        {/* Background grid */}
        <g className="bump-chart-grid">
          {rankTicks.map((tick, idx) => (
            <g key={`grid-${idx}`}>
              <line
                x1={padding}
                y1={tick.y}
                x2={width - padding}
                y2={tick.y}
                className="bump-chart-gridline"
              />
              <text
                x={padding - 10}
                y={tick.y}
                className="bump-chart-rank-label"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {tick.label}
              </text>
            </g>
          ))}
        </g>

        {/* Time period labels */}
        <g className="bump-chart-time-labels">
          {timeLabels.map((label, i) => {
            const x =
              padding + (i * (width - padding * 2)) / (timeLabels.length - 1);
            return (
              <text
                key={`time-${i}`}
                x={x}
                y={chartHeight - 15}
                className="bump-chart-time-label"
                textAnchor="middle"
              >
                {label}
              </text>
            );
          })}
        </g>

        {/* Lines for each name */}
        <g className="bump-chart-lines">
          {chartData.lines.map((line, lineIndex) => {
            const moverNames = [
              chartData.summary?.topUpMover?.name,
              chartData.summary?.topDownMover?.name,
            ].filter(Boolean);
            const toggleHighlighted =
              highlightTopMovers && moverNames.includes(line.name);

            const isHighlighted =
              hoveredName === line.name ||
              highlightedName === line.name ||
              toggleHighlighted;
            const isOtherHighlighted =
              (hoveredName || highlightedName) && !isHighlighted;

            const pathD = generatePath(
              line.rankings,
              width,
              chartHeight,
              padding,
              rankToY
            );

            // Calculate path length for animation
            const getPathLength = (d) => {
              if (!d) return 0;
              try {
                const tempPath = document.createElementNS(
                  "http://www.w3.org/2000/svg",
                  "path"
                );
                tempPath.setAttribute("d", d);
                return tempPath.getTotalLength();
              } catch {
                return 1000;
              }
            };

            const pathLength = getPathLength(pathD);
            const lineDelay = lineIndex * ANIMATION_CONFIG.lineStagger;

            return (
              <g
                key={`${line.id}-${animationKey}`}
                className="bump-chart-line-group"
              >
                {/* Glow effect for highlighted line */}
                {isHighlighted && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke={line.color}
                    strokeWidth={8}
                    className="bump-chart-line-glow"
                  />
                )}

                {/* Main line with draw animation */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={isHighlighted ? 4 : 2.5}
                  className={`bump-chart-line ${animated ? "animated" : ""} ${isHighlighted ? "highlighted" : ""} ${isOtherHighlighted ? "dimmed" : ""}`}
                  onMouseEnter={() => setHoveredName(line.name)}
                  onMouseMove={(e) => handleMouseMove(e, line)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => onNameClick?.(line.id, line.name)}
                  style={{
                    cursor: onNameClick ? "pointer" : "default",
                    ...(animated && {
                      strokeDasharray: pathLength,
                      strokeDashoffset: pathLength,
                      animation: `drawLine ${ANIMATION_CONFIG.lineDuration}ms ease-out ${lineDelay}ms forwards`,
                    }),
                  }}
                />

                {/* Data points with staggered pop-in animation */}
                {line.rankings.map((rank, i) => {
                  if (rank === null) return null;
                  const x =
                    padding +
                    (i * (width - padding * 2)) / (timeLabels.length - 1);
                  const y = rankToY(rank);

                  const pointDelay = animated
                    ? lineDelay +
                      ANIMATION_CONFIG.pointDelay +
                      i * ANIMATION_CONFIG.pointStagger
                    : 0;

                  return (
                    <circle
                      key={`point-${line.id}-${i}`}
                      cx={x}
                      cy={y}
                      r={isHighlighted ? 6 : 4}
                      fill={line.color}
                      className={`bump-chart-point ${animated ? "animated" : ""} ${isHighlighted ? "highlighted" : ""} ${isOtherHighlighted ? "dimmed" : ""}`}
                      onMouseEnter={() => setHoveredName(line.name)}
                      onMouseLeave={handleMouseLeave}
                      style={
                        animated
                          ? {
                              animation: `popInPoint 300ms ease-out ${pointDelay}ms forwards`,
                            }
                          : undefined
                      }
                    />
                  );
                })}

                {/* End label with fade-in animation */}
                {line.rankings[line.rankings.length - 1] !== null && (
                  <text
                    x={width - padding + 8}
                    y={
                      padding +
                      ((line.rankings[line.rankings.length - 1] - 1) *
                        (chartHeight - padding * 2)) /
                        (chartData.maxRank - 1)
                    }
                    className={`bump-chart-name-label ${animated ? "animated" : ""} ${isHighlighted ? "highlighted" : ""} ${isOtherHighlighted ? "dimmed" : ""}`}
                    dominantBaseline="middle"
                    fill={line.color}
                    style={
                      animated
                        ? {
                            animation: `fadeSlideIn 400ms ease-out ${lineDelay + ANIMATION_CONFIG.lineDuration}ms forwards`,
                          }
                        : undefined
                    }
                  >
                    {line.name}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {tooltipData && (
        <div
          className="bump-chart-tooltip"
          style={{
            left: tooltipData.x + 10,
            top: tooltipData.y - 40,
            borderColor: tooltipData.color,
          }}
        >
          <div className="bump-chart-tooltip-header">
            <div className="bump-chart-tooltip-name">{tooltipData.name}</div>
            {tooltipData.movement !== 0 && (
              <TrendIndicator
                direction={tooltipData.movement > 0 ? "up" : "down"}
                percentChange={Math.abs(tooltipData.movement)}
                compact={true}
              />
            )}
          </div>
          <div className="bump-chart-tooltip-rank">
            Rank #{tooltipData.rank} · {tooltipData.period}
          </div>
          {tooltipData.previousRank !== null && (
            <div className="bump-chart-tooltip-metric">
              Δ vs prev:{" "}
              {tooltipData.movement > 0
                ? "↑"
                : tooltipData.movement < 0
                  ? "↓"
                  : "–"}
              {Math.abs(tooltipData.movement)}
              {tooltipData.previousRank
                ? ` (was #${tooltipData.previousRank})`
                : ""}
            </div>
          )}
          {tooltipData.avgRating && (
            <div className="bump-chart-tooltip-metric">
              Rating: {tooltipData.avgRating}
            </div>
          )}
          {tooltipData.totalSelections && (
            <div className="bump-chart-tooltip-metric">
              Selected: {tooltipData.totalSelections}x
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div className="bump-chart-legend" key={`legend-${animationKey}`}>
          {chartData.lines.slice(0, 5).map((line, idx) => {
            const legendDelay = animated
              ? ANIMATION_CONFIG.legendDelay +
                idx * ANIMATION_CONFIG.legendStagger
              : 0;

            return (
              <button
                key={line.id}
                type="button"
                className={`bump-chart-legend-item ${animated ? "animated" : ""} ${hoveredName === line.name ? "active" : ""}`}
                onMouseEnter={() => setHoveredName(line.name)}
                onMouseLeave={handleMouseLeave}
                onClick={() => onNameClick?.(line.id, line.name)}
                style={{
                  "--legend-color": line.color,
                  ...(animated && {
                    animation: `fadeSlideUp 400ms ease-out ${legendDelay}ms forwards`,
                  }),
                }}
              >
                <span className="bump-chart-legend-color" />
                <span className="bump-chart-legend-name">{line.name}</span>
                <span className="bump-chart-legend-change">
                  {formatChange(line.change)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function calculateChange(rankings) {
  const validRankings = rankings.filter((r) => r !== null);
  if (validRankings.length < 2) return 0;
  return validRankings[0] - validRankings[validRankings.length - 1];
}

function formatChange(change) {
  if (change > 0) return `↑${change}`;
  if (change < 0) return `↓${Math.abs(change)}`;
  return "—";
}

BumpChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      rankings: PropTypes.arrayOf(PropTypes.number).isRequired,
      avgRating: PropTypes.number,
      totalSelections: PropTypes.number,
    })
  ),
  timeLabels: PropTypes.arrayOf(PropTypes.string),
  maxDisplayed: PropTypes.number,
  animated: PropTypes.bool,
  height: PropTypes.number,
  showLegend: PropTypes.bool,
  onNameClick: PropTypes.func,
  highlightedName: PropTypes.string,
};

export default BumpChart;
