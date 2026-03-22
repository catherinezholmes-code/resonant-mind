const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl(tagName, attrs = {}, children = []) {
  const node = document.createElementNS(SVG_NS, tagName);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== false) {
      node.setAttribute(key, String(value));
    }
  });
  children.forEach((child) => {
    if (child) node.appendChild(child);
  });
  return node;
}

function polarToCartesian(cx, cy, radius, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad)
  };
}

function describeArc(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function toneColor(score) {
  if (score >= 70) return "rgba(76, 207, 255, 0.85)";
  if (score >= 40) return "rgba(255, 163, 74, 0.85)";
  return "rgba(255, 71, 92, 0.85)";
}

function toneGlow(score) {
  if (score >= 70) return "rgba(76, 207, 255, 0.3)";
  if (score >= 40) return "rgba(255, 163, 74, 0.25)";
  return "rgba(255, 71, 92, 0.25)";
}

/**
 * Create a compact arc gauge (for Arrive page flanking the brain)
 * @param {object} opts
 * @param {string} opts.label - Subsystem name
 * @param {number} opts.score - 0-100
 * @param {number} [opts.size=64] - SVG size in px
 * @param {number} [opts.sweep=180] - Arc sweep in degrees
 */
export function createArcGauge({ label, score, size = 64, sweep = 180 }) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size / 2) - 6;
  const strokeWidth = 3;
  const startAngle = -sweep / 2;
  const endAngle = sweep / 2;
  const valueAngle = startAngle + (sweep * Math.min(score, 100)) / 100;

  const color = toneColor(score);
  const glow = toneGlow(score);

  const trackPath = describeArc(cx, cy, radius, startAngle, endAngle);
  const valuePath = score > 0
    ? describeArc(cx, cy, radius, startAngle, valueAngle)
    : "";

  const defs = svgEl("defs", {}, [
    svgEl("filter", { id: `gauge-glow-${label.replace(/\s/g, "")}`, x: "-30%", y: "-30%", width: "160%", height: "160%" }, [
      svgEl("feGaussianBlur", { in: "SourceGraphic", stdDeviation: "2", result: "blur" }),
      svgEl("feMerge", {}, [
        svgEl("feMergeNode", { in: "blur" }),
        svgEl("feMergeNode", { in: "SourceGraphic" })
      ])
    ])
  ]);

  const children = [
    defs,
    // Track (background arc)
    svgEl("path", {
      d: trackPath,
      fill: "none",
      stroke: "rgba(76, 207, 255, 0.08)",
      "stroke-width": strokeWidth,
      "stroke-linecap": "round"
    })
  ];

  // Value arc
  if (valuePath) {
    children.push(
      svgEl("path", {
        d: valuePath,
        fill: "none",
        stroke: color,
        "stroke-width": strokeWidth,
        "stroke-linecap": "round",
        filter: `url(#gauge-glow-${label.replace(/\s/g, "")})`,
        class: "gauge-arc__value"
      })
    );
  }

  // Score text
  children.push(
    svgEl("text", {
      x: cx,
      y: cy + 2,
      "text-anchor": "middle",
      "dominant-baseline": "middle",
      fill: color,
      "font-size": size > 80 ? "14" : "11",
      "font-weight": "700",
      "font-family": "Manrope, sans-serif"
    })
  );
  children[children.length - 1].textContent = `${score}`;

  // Label text
  children.push(
    svgEl("text", {
      x: cx,
      y: cy + (size > 80 ? 16 : 13),
      "text-anchor": "middle",
      "dominant-baseline": "middle",
      fill: "rgba(217, 237, 244, 0.4)",
      "font-size": size > 80 ? "7" : "5.5",
      "font-weight": "600",
      "letter-spacing": "0.12em",
      "font-family": "Manrope, sans-serif"
    })
  );
  children[children.length - 1].textContent = label.toUpperCase();

  return svgEl("svg", {
    class: "arc-gauge",
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`,
    "aria-label": `${label}: ${score}%`
  }, children);
}

/**
 * Create a larger gauge card for the Health page
 * @param {object} opts
 * @param {string} opts.label
 * @param {number} opts.score
 * @param {string} [opts.detail] - Extra detail text
 */
export function createGaugeCard({ label, score, detail }) {
  const wrapper = document.createElement("div");
  wrapper.className = "gauge-card";

  const gauge = createArcGauge({ label, score, size: 96, sweep: 200 });
  wrapper.appendChild(gauge);

  if (detail) {
    const detailEl = document.createElement("p");
    detailEl.className = "gauge-card__detail";
    detailEl.textContent = detail;
    wrapper.appendChild(detailEl);
  }

  return wrapper;
}

/**
 * Create a horizontal stacked bar for distributions
 * @param {Array<{label: string, value: number, color: string}>} segments
 */
export function createStackedBar(segments) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return document.createElement("div");

  const wrapper = document.createElement("div");
  wrapper.className = "stacked-bar";

  const bar = document.createElement("div");
  bar.className = "stacked-bar__track";

  segments.forEach((seg) => {
    const pct = (seg.value / total) * 100;
    if (pct <= 0) return;
    const fill = document.createElement("div");
    fill.className = "stacked-bar__fill";
    fill.style.width = `${pct}%`;
    fill.style.background = seg.color;
    fill.title = `${seg.label}: ${seg.value} (${Math.round(pct)}%)`;
    bar.appendChild(fill);
  });

  wrapper.appendChild(bar);

  const legend = document.createElement("div");
  legend.className = "stacked-bar__legend";
  segments.forEach((seg) => {
    if (seg.value <= 0) return;
    const item = document.createElement("span");
    item.className = "stacked-bar__legend-item";

    const dot = document.createElement("span");
    dot.className = "stacked-bar__legend-dot";
    dot.style.background = seg.color;

    const text = document.createElement("span");
    text.textContent = `${seg.label}: ${seg.value}`;

    item.appendChild(dot);
    item.appendChild(text);
    legend.appendChild(item);
  });

  wrapper.appendChild(legend);
  return wrapper;
}

/**
 * Create a single stat row for the health page
 */
export function createStatRow(label, value, tone) {
  const row = document.createElement("div");
  row.className = "health-stat-row";

  const labelEl = document.createElement("span");
  labelEl.className = "health-stat-row__label";
  labelEl.textContent = label;

  const valueEl = document.createElement("span");
  valueEl.className = `health-stat-row__value${tone ? ` health-stat-row__value--${tone}` : ""}`;
  valueEl.textContent = value;

  row.appendChild(labelEl);
  row.appendChild(valueEl);
  return row;
}
