import { el } from "../app/dom.js";
import { createGaugeCard, createStackedBar, createStatRow } from "../components/gauge.js";

function healthTone(score) {
  if (score >= 70) return "cool";
  if (score >= 40) return "warm";
  return "critical";
}

function createOverallRing(score) {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const s = (tag, attrs = {}, children = []) => {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (v !== null && v !== undefined) node.setAttribute(k, String(v));
    });
    children.forEach((c) => c && node.appendChild(c));
    return node;
  };

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * Math.min(score, 100)) / 100;

  const color = score >= 70
    ? "rgba(76, 207, 255, 0.9)"
    : score >= 40
      ? "rgba(255, 163, 74, 0.9)"
      : "rgba(255, 71, 92, 0.9)";

  const glow = score >= 70
    ? "rgba(76, 207, 255, 0.3)"
    : score >= 40
      ? "rgba(255, 163, 74, 0.25)"
      : "rgba(255, 71, 92, 0.25)";

  const filterId = "overall-glow";

  const scoreText = s("text", {
    x: cx, y: cy - 4,
    "text-anchor": "middle",
    "dominant-baseline": "middle",
    fill: color,
    "font-size": "32",
    "font-weight": "800",
    "font-family": "Manrope, sans-serif"
  });
  scoreText.textContent = `${score}`;

  const pctText = s("text", {
    x: cx, y: cy + 18,
    "text-anchor": "middle",
    "dominant-baseline": "middle",
    fill: "rgba(217, 237, 244, 0.4)",
    "font-size": "10",
    "font-weight": "600",
    "letter-spacing": "0.15em",
    "font-family": "Manrope, sans-serif"
  });
  pctText.textContent = "OVERALL";

  return s("svg", {
    class: "overall-ring",
    width: size,
    height: size,
    viewBox: `0 0 ${size} ${size}`,
    "aria-label": `Overall health: ${score}%`
  }, [
    s("defs", {}, [
      s("filter", { id: filterId, x: "-30%", y: "-30%", width: "160%", height: "160%" }, [
        s("feGaussianBlur", { in: "SourceGraphic", stdDeviation: "3", result: "blur" }),
        s("feMerge", {}, [
          s("feMergeNode", { in: "blur" }),
          s("feMergeNode", { in: "SourceGraphic" })
        ])
      ])
    ]),
    // Track
    s("circle", {
      cx, cy, r: radius,
      fill: "none",
      stroke: "rgba(76, 207, 255, 0.06)",
      "stroke-width": "4"
    }),
    // Value ring
    s("circle", {
      cx, cy, r: radius,
      fill: "none",
      stroke: color,
      "stroke-width": "4",
      "stroke-linecap": "round",
      "stroke-dasharray": circumference,
      "stroke-dashoffset": offset,
      transform: `rotate(-90 ${cx} ${cy})`,
      filter: `url(#${filterId})`,
      class: "overall-ring__arc"
    }),
    // Inner glow
    s("circle", {
      cx, cy, r: radius - 12,
      fill: "none",
      stroke: glow,
      "stroke-width": "1"
    }),
    scoreText,
    pctText
  ]);
}

function createPanel(title, children) {
  const panel = el("div", {
    className: "health-panel",
    children: [
      el("div", {
        className: "health-panel__header",
        children: [
          el("h3", { className: "health-panel__title", text: title })
        ]
      }),
      el("div", {
        className: "health-panel__body",
        children
      })
    ]
  });
  return panel;
}

export async function renderHealthPage({ api }) {
  const [healthScores, patterns, stats, heat] = await Promise.all([
    api.getHealthScores().catch(() => ({})),
    api.getPatterns().catch(() => ({})),
    api.getStats().catch(() => ({})),
    api.getHeat().catch(() => ({ entities: [] }))
  ]);

  const hs = healthScores || {};
  const counts = stats.counts || {};
  const daemon = stats.daemon || {};
  const livingSurface = daemon.living_surface || {};

  // Subsystem gauges
  const subsystems = [
    { label: "Database", score: hs.db_score ?? 0, detail: `${counts.entities || 0} entities, ${counts.observations || 0} observations` },
    { label: "Threads", score: hs.thread_score ?? 0, detail: `Active continuity threads` },
    { label: "Journals", score: hs.journal_score ?? 0, detail: `${counts.journals || 0} total entries` },
    { label: "Identity", score: hs.identity_score ?? 0, detail: `Self-model coverage` },
    { label: "Activity", score: hs.activity_score ?? 0, detail: `7-day observation rate` },
    { label: "Daemon", score: hs.subconscious_score ?? 0, detail: hs.mood ? `Mood: ${hs.mood}` : "Subconscious processing" }
  ];

  // Charge distribution from patterns
  const charges = (patterns.charges || []).reduce((acc, row) => {
    acc[row.charge || "null"] = row.count;
    return acc;
  }, {});

  const chargeBar = createStackedBar([
    { label: "Fresh", value: charges.fresh || 0, color: "rgba(76, 207, 255, 0.8)" },
    { label: "Active", value: charges.active || 0, color: "rgba(76, 207, 255, 0.5)" },
    { label: "Processing", value: charges.processing || 0, color: "rgba(255, 163, 74, 0.7)" },
    { label: "Metabolized", value: charges.metabolized || 0, color: "rgba(255, 71, 92, 0.6)" },
    { label: "Unset", value: charges.null || 0, color: "rgba(217, 237, 244, 0.15)" }
  ]);

  // Weight distribution from patterns
  const weights = (patterns.weights || []).reduce((acc, row) => {
    acc[row.weight || "null"] = row.count;
    return acc;
  }, {});

  const weightBar = createStackedBar([
    { label: "Heavy", value: weights.heavy || 0, color: "rgba(255, 71, 92, 0.75)" },
    { label: "Medium", value: weights.medium || 0, color: "rgba(255, 163, 74, 0.7)" },
    { label: "Light", value: weights.light || 0, color: "rgba(76, 207, 255, 0.6)" },
    { label: "Unset", value: weights.null || 0, color: "rgba(217, 237, 244, 0.15)" }
  ]);

  // Salience distribution from patterns
  const salience = (patterns.salience || []).reduce((acc, row) => {
    acc[row.salience || "null"] = row.count;
    return acc;
  }, {});

  const salienceBar = createStackedBar([
    { label: "Foundational", value: salience.foundational || 0, color: "rgba(255, 71, 92, 0.8)" },
    { label: "Active", value: salience.active || 0, color: "rgba(76, 207, 255, 0.7)" },
    { label: "Background", value: salience.background || 0, color: "rgba(217, 237, 244, 0.3)" },
    { label: "Archive", value: salience.archive || 0, color: "rgba(217, 237, 244, 0.12)" },
    { label: "Unset", value: salience.null || 0, color: "rgba(217, 237, 244, 0.08)" }
  ]);

  // Heat map entities
  const heatEntities = (heat.entities || []).slice(0, 10);
  const maxHeat = heatEntities[0]?.heat || 1;

  const heatRows = heatEntities.map((entity) => {
    const row = document.createElement("div");
    row.className = "heat-bar-row";

    const label = document.createElement("span");
    label.className = "heat-bar-row__label";
    label.textContent = entity.name;

    const barWrap = document.createElement("div");
    barWrap.className = "heat-bar-row__track";

    const fill = document.createElement("div");
    fill.className = "heat-bar-row__fill";
    fill.style.width = `${(entity.heat / maxHeat) * 100}%`;

    const count = document.createElement("span");
    count.className = "heat-bar-row__count";
    count.textContent = entity.count;

    barWrap.appendChild(fill);
    row.appendChild(label);
    row.appendChild(barWrap);
    row.appendChild(count);
    return row;
  });

  // Living surface stats
  const surfaceStats = [
    createStatRow("Pending Proposals", String(livingSurface.pending_proposals || 0),
      (livingSurface.pending_proposals || 0) > 5 ? "critical" : "cool"),
    createStatRow("Orphan Count", String(livingSurface.orphan_count || 0),
      (livingSurface.orphan_count || 0) > 10 ? "critical" : "cool"),
    createStatRow("Unprocessed", String(counts.unprocessed || 0),
      (counts.unprocessed || 0) > 20 ? "warm" : "cool"),
    createStatRow("Avg Novelty", livingSurface.avg_novelty != null
      ? Number(livingSurface.avg_novelty).toFixed(2)
      : "n/a")
  ];

  return el("div", {
    className: "page-shell fade-in health-page",
    children: [
      // Overall ring + subsystem gauges
      el("section", {
        className: "health-top",
        children: [
          el("div", {
            className: "health-top__overall",
            children: [
              el("div", {
                className: "health-top__ring-wrap",
                children: [createOverallRing(hs.overall ?? 0)]
              }),
              el("p", {
                className: "health-top__mood",
                text: hs.mood ? `Dominant mood: ${hs.mood}` : "No mood detected"
              })
            ]
          }),
          el("div", {
            className: "health-top__gauges",
            children: subsystems.map((s) => createGaugeCard(s))
          })
        ]
      }),

      // Distribution panels
      el("section", {
        className: "health-distributions",
        children: [
          createPanel("CHARGE DISTRIBUTION", [chargeBar]),
          createPanel("EMOTIONAL WEIGHT", [weightBar]),
          createPanel("OBSERVATION SALIENCE", [salienceBar])
        ]
      }),

      // Lower section: heat map + living surface
      el("section", {
        className: "health-lower",
        children: [
          createPanel("ENTITY HEAT (7D)", heatRows.length > 0
            ? heatRows
            : [el("p", { className: "health-empty", text: "No recent activity" })]
          ),
          createPanel("LIVING SURFACE", surfaceStats)
        ]
      })
    ]
  });
}
