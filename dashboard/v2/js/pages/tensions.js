import { clear, el } from "../app/dom.js";
import { formatRelativeTime, truncate } from "../app/format.js";
import {
  createBadge,
  createButton,
  createEmptyState,
  createSectionHeader,
  createStackCard,
  createSubnav
} from "../components/ui.js";

export async function renderTensionsPage({ api, modal, refresh }) {
  const data = await api.listTensions();
  const state = {
    activeTab: "active"
  };

  const root = el("div", {
    className: "page-shell fade-in"
  });
  const listNode = el("div", {
    className: "stack-list"
  });
  const tabsNode = el("div");

  function currentList() {
    return state.activeTab === "active" ? data.active || [] : data.resolved || [];
  }

  function renderList() {
    clear(listNode);
    const items = currentList();

    if (!items.length) {
      listNode.appendChild(
        createEmptyState(
          `No ${state.activeTab} tensions`,
          "Tensions will appear here once the system starts tracking active contradictions."
        )
      );
      return;
    }

    items.forEach((tension) => {
      listNode.appendChild(
        createStackCard({
          title: `${tension.pole_a} <-> ${tension.pole_b}`,
          body: truncate(
            tension.resolution || tension.context || "Productive contradiction",
            180
          ),
          meta: [
            { text: `${tension.visits || 0} sits` },
            {
              text: state.activeTab === "active"
                ? formatRelativeTime(tension.created_at)
                : formatRelativeTime(tension.resolved_at),
              className: "pill pill--soft"
            }
          ],
          actions: state.activeTab === "active"
            ? [
                createButton("Sit with it", {
                  on: {
                    click: async () => {
                      await api.visitTension(tension.id);
                      await refresh();
                    }
                  }
                }),
                createButton("Resolve", {
                  className: "button",
                  on: {
                    click: async () => {
                      const result = await modal.openForm({
                        title: "Resolve tension",
                        submitLabel: "Resolve tension",
                        fields: [
                          {
                            id: "resolution",
                            label: "Resolution",
                            type: "textarea",
                            required: true
                          }
                        ]
                      });

                      if (!result) return;
                      await api.resolveTension(tension.id, result);
                      await refresh();
                    }
                  }
                }),
                createButton("Delete", {
                  on: {
                    click: async () => {
                      const confirmed = await modal.confirm({
                        title: "Delete tension",
                        description: "This removes the tension record completely.",
                        confirmLabel: "Delete tension"
                      });

                      if (!confirmed) return;
                      await api.deleteTension(tension.id);
                      await refresh();
                    }
                  }
                })
              ]
            : [createBadge("Resolved", "pill pill--soft")]
        })
      );
    });
  }

  function renderTabs() {
    clear(tabsNode);
    tabsNode.appendChild(
      createSubnav(
        [
          { id: "active", label: `Active (${data.active_count || 0})` },
          { id: "resolved", label: `Resolved (${data.resolved_count || 0})` }
        ],
        state.activeTab,
        (tab) => {
          state.activeTab = tab;
          renderTabs();
          renderList();
        }
      )
    );
  }

  root.appendChild(
    el("section", {
      className: "panel",
      children: [
        createSectionHeader({
          eyebrow: "Processing",
          title: "Tensions",
          body: "Productive contradictions that deserve to be held instead of collapsed too early."
        }),
        el("div", {
          className: "page-toolbar",
          children: [
            tabsNode,
            createButton("New tension", {
              className: "button",
              on: {
                click: async () => {
                  const result = await modal.openForm({
                    title: "Create tension",
                    submitLabel: "Create tension",
                    fields: [
                      { id: "pole_a", label: "Pole A", required: true },
                      { id: "pole_b", label: "Pole B", required: true },
                      {
                        id: "context",
                        label: "Context",
                        type: "textarea"
                      }
                    ]
                  });

                  if (!result) return;
                  await api.createTension({
                    ...result,
                    context: result.context || null
                  });
                  await refresh();
                }
              }
            })
          ]
        }),
        listNode
      ]
    })
  );

  renderTabs();
  renderList();
  return root;
}
