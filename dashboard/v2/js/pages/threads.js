import { clear, el } from "../app/dom.js";
import { formatRelativeTime, truncate, toTitleCase } from "../app/format.js";
import {
  createBadge,
  createButton,
  createEmptyState,
  createSectionHeader,
  createStackCard,
  createSubnav
} from "../components/ui.js";

export async function renderThreadsPage({ api, modal, refresh }) {
  const threads = await api.listThreads();
  const state = {
    tab: "active"
  };

  const activeThreads = threads.filter((thread) => thread.status === "active");
  const resolvedThreads = threads.filter((thread) => thread.status === "resolved");

  const root = el("div", {
    className: "page-shell fade-in"
  });
  const tabsNode = el("div");
  const listNode = el("div", {
    className: "stack-list"
  });

  function currentItems() {
    return state.tab === "active" ? activeThreads : resolvedThreads;
  }

  function renderTabs() {
    clear(tabsNode);
    tabsNode.appendChild(
      createSubnav(
        [
          { id: "active", label: `Active (${activeThreads.length})` },
          { id: "resolved", label: `Resolved (${resolvedThreads.length})` }
        ],
        state.tab,
        (tab) => {
          state.tab = tab;
          renderTabs();
          renderList();
        }
      )
    );
  }

  function renderList() {
    clear(listNode);
    const items = currentItems();

    if (!items.length) {
      listNode.appendChild(
        createEmptyState(
          `No ${state.tab} threads`,
          "Threads will show up here once continuity work starts accumulating."
        )
      );
      return;
    }

    items.forEach((thread) => {
      listNode.appendChild(
        createStackCard({
          title: truncate(thread.content, 84),
          body: thread.context || thread.notes || "Continuity thread",
          meta: [
            { text: thread.priority || "medium" },
            { text: thread.thread_type || "intention", className: "pill pill--soft" },
            {
              text: formatRelativeTime(thread.resolved_at || thread.updated_at || thread.created_at),
              className: "pill pill--soft"
            }
          ],
          actions: state.tab === "active"
            ? [
                createButton("Edit", {
                  on: {
                    click: async () => {
                      const result = await modal.openForm({
                        title: "Edit thread",
                        submitLabel: "Save thread",
                        values: {
                          content: thread.content,
                          priority: thread.priority || "medium",
                          status: thread.status || "active",
                          notes: thread.notes || ""
                        },
                        fields: [
                          {
                            id: "content",
                            label: "Content",
                            type: "textarea",
                            required: true
                          },
                          {
                            id: "priority",
                            label: "Priority",
                            type: "select",
                            options: ["low", "medium", "high"].map((value) => ({
                              value,
                              label: toTitleCase(value)
                            }))
                          },
                          {
                            id: "status",
                            label: "Status",
                            type: "select",
                            options: ["active", "resolved"].map((value) => ({
                              value,
                              label: toTitleCase(value)
                            }))
                          },
                          {
                            id: "notes",
                            label: "Notes",
                            type: "textarea"
                          }
                        ]
                      });

                      if (!result) return;
                      await api.updateThread(thread.id, {
                        ...result,
                        notes: result.notes || null
                      });
                      await refresh();
                    }
                  }
                }),
                createButton("Resolve", {
                  className: "button",
                  on: {
                    click: async () => {
                      const result = await modal.openForm({
                        title: "Resolve thread",
                        submitLabel: "Resolve thread",
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
                      await api.resolveThread(thread.id, result);
                      await refresh();
                    }
                  }
                }),
                createButton("Delete", {
                  on: {
                    click: async () => {
                      const confirmed = await modal.confirm({
                        title: "Delete thread",
                        description: "This removes the thread from continuity tracking.",
                        confirmLabel: "Delete thread"
                      });

                      if (!confirmed) return;
                      await api.deleteThread(thread.id);
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

  root.appendChild(
    el("section", {
      className: "panel",
      children: [
        createSectionHeader({
          eyebrow: "Continuity",
          title: "Threads",
          body: "Open and resolved threads, with edit and resolve flows in place."
        }),
        el("div", {
          className: "page-toolbar",
          children: [
            tabsNode,
            createButton("New thread", {
              className: "button",
              on: {
                click: async () => {
                  const result = await modal.openForm({
                    title: "Create thread",
                    submitLabel: "Create thread",
                    values: {
                      priority: "medium",
                      thread_type: "intention"
                    },
                    fields: [
                      {
                        id: "content",
                        label: "Content",
                        type: "textarea",
                        required: true
                      },
                      {
                        id: "thread_type",
                        label: "Thread type"
                      },
                      {
                        id: "priority",
                        label: "Priority",
                        type: "select",
                        options: ["low", "medium", "high"].map((value) => ({
                          value,
                          label: toTitleCase(value)
                        }))
                      },
                      {
                        id: "context",
                        label: "Context",
                        type: "textarea"
                      }
                    ]
                  });

                  if (!result) return;
                  await api.createThread({
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
