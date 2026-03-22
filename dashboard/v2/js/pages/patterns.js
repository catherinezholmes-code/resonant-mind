import { el } from "../app/dom.js";
import { toTitleCase } from "../app/format.js";
import {
  createBadge,
  createEmptyState,
  createSectionHeader
} from "../components/ui.js";

function createMetricList(items, labelKey, valueKey, formatLabel) {
  if (!items.length) {
    return createEmptyState("No data available", "This pattern set is empty right now.");
  }

  return el("div", {
    className: "stack-list",
    children: items.map((item) =>
      el("article", {
        className: "stack-card",
        children: [
          el("div", {
            className: "stack-card__header",
            children: [
              el("h3", {
                className: "stack-card__title",
                text: formatLabel(item[labelKey])
              }),
              createBadge(String(item[valueKey]))
            ]
          })
        ]
      })
    )
  });
}

export async function renderPatternsPage({ api }) {
  const patterns = await api.getPatterns();

  return el("div", {
    className: "page-shell fade-in",
    children: [
      el("section", {
        className: "panel",
        children: [
          createSectionHeader({
            eyebrow: "Processing",
            title: "Patterns",
            body: `Current pattern view across the last ${patterns.period_days || 7} days.`
          }),
          el("div", {
            className: "page-grid",
            children: [
              el("section", {
                className: "panel span-6",
                children: [
                  createSectionHeader({
                    eyebrow: "Alive",
                    title: "What is active",
                    body: "Entities with the strongest recent observation activity."
                  }),
                  createMetricList(
                    patterns.alive || [],
                    "name",
                    "obs_count",
                    (value) => value
                  )
                ]
              }),
              el("section", {
                className: "panel span-6",
                children: [
                  createSectionHeader({
                    eyebrow: "Weight",
                    title: "Emotional weight",
                    body: "Distribution of light, medium, and heavy observations."
                  }),
                  createMetricList(
                    patterns.weights || [],
                    "weight",
                    "count",
                    (value) => toTitleCase(value || "unset")
                  )
                ]
              }),
              el("section", {
                className: "panel span-6",
                children: [
                  createSectionHeader({
                    eyebrow: "Charge",
                    title: "Processing state",
                    body: "How much of the observation pool is still fresh, active, or metabolized."
                  }),
                  createMetricList(
                    patterns.charges || [],
                    "charge",
                    "count",
                    (value) => toTitleCase(value || "fresh")
                  )
                ]
              }),
              el("section", {
                className: "panel span-6",
                children: [
                  createSectionHeader({
                    eyebrow: "Salience",
                    title: "Salience mix",
                    body: "How the current memory pool is weighted for importance."
                  }),
                  createMetricList(
                    patterns.salience || [],
                    "salience",
                    "count",
                    (value) => toTitleCase(value || "active")
                  )
                ]
              }),
              el("section", {
                className: "panel span-12",
                children: [
                  createSectionHeader({
                    eyebrow: "Foundational",
                    title: "Foundational core",
                    body: "Entities that appear in foundational observations."
                  }),
                  (patterns.foundational || []).length
                    ? el("div", {
                        className: "inline-meta",
                        children: patterns.foundational.map((item) =>
                          createBadge(item.name, "pill pill--soft")
                        )
                      })
                    : createEmptyState(
                        "No foundational entities",
                        "Foundational items will appear here once that salience is used."
                      )
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}
