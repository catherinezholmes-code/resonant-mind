import { clear, el } from "../app/dom.js";
import { formatRelativeTime, truncate, toTitleCase } from "../app/format.js";
import {
  createBadge,
  createButton,
  createEmptyState,
  createSectionHeader
} from "../components/ui.js";

export async function renderObservationsPage({ api, modal, refresh }) {
  const [observations, entities] = await Promise.all([
    api.listObservations("?limit=100"),
    api.listEntities()
  ]);

  const state = {
    observations,
    selected: new Set(),
    weight: "",
    charge: ""
  };

  const root = el("div", {
    className: "page-shell fade-in"
  });
  const listNode = el("div", {
    className: "stack-list"
  });
  const bulkLabel = el("span", {
    className: "meta-copy",
    text: "0 selected"
  });
  const bulkBar = el("div", {
    className: "panel-actions",
    attrs: { hidden: true }
  });

  function filtered() {
    return state.observations.filter((observation) => {
      const matchesWeight = !state.weight || observation.weight === state.weight;
      const matchesCharge = !state.charge || (observation.charge || "fresh") === state.charge;
      return matchesWeight && matchesCharge;
    });
  }

  function updateBulkBar() {
    bulkBar.hidden = state.selected.size === 0;
    bulkLabel.textContent = `${state.selected.size} selected`;
  }

  async function reloadFiltered() {
    const params = new URLSearchParams();
    params.set("limit", "100");
    if (state.weight) params.set("weight", state.weight);
    if (state.charge) params.set("charge", state.charge);
    state.observations = await api.listObservations(`?${params.toString()}`);
    state.selected.clear();
    updateBulkBar();
    renderList();
  }

  function renderList() {
    clear(listNode);
    const rows = filtered();

    if (!rows.length) {
      listNode.appendChild(
        createEmptyState(
          "No observations match these filters",
          "Adjust the current weight or charge filters to reveal more traces."
        )
      );
      return;
    }

    rows.forEach((observation) => {
      const checkbox = el("input", {
        attrs: {
          type: "checkbox",
          checked: state.selected.has(observation.id) ? true : null
        },
        on: {
          click: (event) => event.stopPropagation(),
          change: (event) => {
            if (event.target.checked) {
              state.selected.add(observation.id);
            } else {
              state.selected.delete(observation.id);
            }

            updateBulkBar();
          }
        }
      });

      listNode.appendChild(
        el("article", {
          className: "stack-card",
          children: [
            el("div", {
              className: "stack-card__header",
              children: [
                el("div", {
                  className: "panel-actions",
                  children: [
                    checkbox,
                    el("h3", {
                      className: "stack-card__title",
                      text: observation.entity_name || "Observation"
                    })
                  ]
                }),
                el("div", {
                  className: "stack-card__meta",
                  children: [
                    createBadge(observation.weight || "medium"),
                    observation.emotion
                      ? createBadge(observation.emotion, "pill pill--soft")
                      : null,
                    createBadge(observation.charge || "fresh", "pill pill--soft")
                  ]
                })
              ]
            }),
            el("p", {
              className: "stack-card__body",
              text: truncate(observation.content, 220)
            }),
            el("div", {
              className: "stack-card__meta",
              children: [createBadge(formatRelativeTime(observation.added_at), "pill pill--soft")]
            }),
            el("div", {
              className: "stack-card__actions",
              children: [
                createButton("Edit", {
                  on: {
                    click: async () => {
                      const fullObservation = await api.getObservation(observation.id);
                      const result = await modal.openForm({
                        title: "Edit observation",
                        submitLabel: "Save observation",
                        values: {
                          content: fullObservation.content,
                          weight: fullObservation.weight || "medium",
                          emotion: fullObservation.emotion || ""
                        },
                        fields: [
                          {
                            id: "content",
                            label: "Content",
                            type: "textarea",
                            required: true
                          },
                          {
                            id: "weight",
                            label: "Weight",
                            type: "select",
                            options: ["light", "medium", "heavy"].map((value) => ({
                              value,
                              label: toTitleCase(value)
                            }))
                          },
                          {
                            id: "emotion",
                            label: "Emotion"
                          }
                        ]
                      });

                      if (!result) return;
                      await api.updateObservation(observation.id, {
                        ...result,
                        emotion: result.emotion || null
                      });
                      await refresh();
                    }
                  }
                }),
                createButton("Sit", {
                  on: {
                    click: async () => {
                      const result = await modal.openForm({
                        title: "Sit with observation",
                        description: "Record what surfaces while staying with this trace.",
                        submitLabel: "Save note",
                        fields: [
                          {
                            id: "sit_note",
                            label: "What comes up?",
                            type: "textarea",
                            required: true
                          }
                        ]
                      });

                      if (!result) return;
                      await api.sitObservation(observation.id, result);
                      await refresh();
                    }
                  }
                }),
                createButton("Resolve", {
                  on: {
                    click: async () => {
                      const result = await modal.openForm({
                        title: "Resolve observation",
                        submitLabel: "Resolve",
                        fields: [
                          {
                            id: "resolution_note",
                            label: "Resolution note",
                            type: "textarea",
                            required: true
                          }
                        ]
                      });

                      if (!result) return;
                      await api.resolveObservation(observation.id, result);
                      await refresh();
                    }
                  }
                }),
                createButton("Delete", {
                  className: "button",
                  on: {
                    click: async () => {
                      const confirmed = await modal.confirm({
                        title: "Delete observation",
                        description: "This permanently removes the observation and its sit history.",
                        confirmLabel: "Delete observation"
                      });

                      if (!confirmed) return;
                      await api.deleteObservation(observation.id);
                      await refresh();
                    }
                  }
                })
              ]
            })
          ]
        })
      );
    });
  }

  bulkBar.append(
    bulkLabel,
    createButton("Change weight", {
      on: {
        click: async () => {
          const result = await modal.openForm({
            title: "Change observation weight",
            submitLabel: "Apply weight",
            fields: [
              {
                id: "weight",
                label: "New weight",
                type: "select",
                options: ["light", "medium", "heavy"].map((value) => ({
                  value,
                  label: toTitleCase(value)
                }))
              }
            ]
          });

          if (!result) return;
          await api.bulkObservations({
            action: "weight",
            ids: [...state.selected],
            data: { weight: result.weight }
          });
          await refresh();
        }
      }
    }),
    createButton("Resolve all", {
      on: {
        click: async () => {
          const confirmed = await modal.confirm({
            title: "Resolve selected observations",
            description: `Mark ${state.selected.size} observations as metabolized.`,
            confirmLabel: "Resolve observations",
            tone: "soft"
          });

          if (!confirmed) return;
          await api.bulkObservations({
            action: "resolve",
            ids: [...state.selected]
          });
          await refresh();
        }
      }
    }),
    createButton("Delete", {
      className: "button",
      on: {
        click: async () => {
          const confirmed = await modal.confirm({
            title: "Delete selected observations",
            description: `Delete ${state.selected.size} observations.`,
            confirmLabel: "Delete observations"
          });

          if (!confirmed) return;
          await api.bulkObservations({
            action: "delete",
            ids: [...state.selected]
          });
          await refresh();
        }
      }
    })
  );

  const weightFilter = el("select", {
    className: "field",
    on: {
      change: async (event) => {
        state.weight = event.target.value;
        await reloadFiltered();
      }
    },
    children: [
      el("option", { attrs: { value: "" }, text: "All weights" }),
      ...["light", "medium", "heavy"].map((value) =>
        el("option", {
          attrs: { value },
          text: toTitleCase(value)
        })
      )
    ]
  });

  const chargeFilter = el("select", {
    className: "field",
    on: {
      change: async (event) => {
        state.charge = event.target.value;
        await reloadFiltered();
      }
    },
    children: [
      el("option", { attrs: { value: "" }, text: "All charges" }),
      ...["fresh", "active", "processing", "metabolized"].map((value) =>
        el("option", {
          attrs: { value },
          text: toTitleCase(value)
        })
      )
    ]
  });

  root.appendChild(
    el("section", {
      className: "panel",
      children: [
        createSectionHeader({
          eyebrow: "Memory",
          title: "Observations",
          body: "Recent traces with bulk maintenance, editing, sitting, and resolution flows."
        }),
        el("div", {
          className: "page-toolbar",
          children: [
            el("div", {
              className: "filter-group",
              children: [weightFilter, chargeFilter]
            }),
            createButton("New observation", {
              className: "button",
              on: {
                click: async () => {
                  const result = await modal.openForm({
                    title: "Create observation",
                    submitLabel: "Create observation",
                    values: {
                      weight: "medium"
                    },
                    fields: [
                      {
                        id: "entity_id",
                        label: "Entity",
                        type: "select",
                        options: entities.map((entity) => ({
                          value: String(entity.id),
                          label: `${entity.name} (${entity.entity_type})`
                        }))
                      },
                      {
                        id: "content",
                        label: "Content",
                        type: "textarea",
                        required: true
                      },
                      {
                        id: "weight",
                        label: "Weight",
                        type: "select",
                        options: ["light", "medium", "heavy"].map((value) => ({
                          value,
                          label: toTitleCase(value)
                        }))
                      },
                      {
                        id: "emotion",
                        label: "Emotion"
                      }
                    ]
                  });

                  if (!result) return;
                  await api.createObservation({
                    ...result,
                    entity_id: Number(result.entity_id),
                    emotion: result.emotion || null
                  });
                  await refresh();
                }
              }
            })
          ]
        }),
        bulkBar,
        listNode
      ]
    })
  );

  renderList();
  updateBulkBar();
  return root;
}
