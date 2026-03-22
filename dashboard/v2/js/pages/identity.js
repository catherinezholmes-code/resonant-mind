import { clear, el } from "../app/dom.js";
import { formatRelativeTime } from "../app/format.js";
import {
  createBadge,
  createButton,
  createEmptyState,
  createSectionHeader,
  createStackCard
} from "../components/ui.js";

export async function renderIdentityPage({ api, modal, refresh }) {
  const data = await api.listIdentity();
  const entries = data.entries || [];
  const state = {
    selected: entries[0]?.section || null
  };

  const root = el("div", {
    className: "page-shell fade-in"
  });
  const listNode = el("div", {
    className: "stack-list"
  });
  const detailNode = el("div", {
    className: "detail-panel"
  });

  function renderList() {
    clear(listNode);

    if (!entries.length) {
      listNode.appendChild(
        createEmptyState(
          "Identity is empty",
          "Create a section to start shaping the identity graph in V2."
        )
      );
      return;
    }

    entries.forEach((entry) => {
      listNode.appendChild(
        createStackCard({
          title: entry.section,
          body: entry.content ? entry.content.slice(0, 140) : "No content",
          selected: state.selected === entry.section,
          onClick: () => {
            state.selected = entry.section;
            renderList();
            renderDetail();
          },
          meta: [
            { text: `Weight ${entry.weight || 1}` },
            {
              text: entry.timestamp ? formatRelativeTime(entry.timestamp) : "No timestamp",
              className: "pill pill--soft"
            }
          ]
        })
      );
    });
  }

  function renderDetail() {
    clear(detailNode);

    const entry = entries.find((item) => item.section === state.selected);
    if (!entry) {
      detailNode.appendChild(
        createEmptyState(
          "Choose a section",
          "Select an identity section to inspect or edit it."
        )
      );
      return;
    }

    detailNode.appendChild(
      el("section", {
        className: "detail-card",
        children: [
          createSectionHeader({
            eyebrow: "Identity detail",
            title: entry.section,
            body: "Identity sections use dot notation so related concepts can cluster naturally."
          }),
          el("div", {
            className: "detail-card__meta",
            children: [
              createBadge(`Weight ${entry.weight || 1}`),
              entry.connections
                ? createBadge(entry.connections, "pill pill--soft")
                : null
            ]
          }),
          el("p", {
            className: "mono-block",
            text: entry.content || "No content"
          }),
          el("div", {
            className: "detail-actions",
            children: [
              createButton("Edit", {
                on: {
                  click: async () => {
                    const result = await modal.openForm({
                      title: "Edit identity section",
                      submitLabel: "Save section",
                      values: {
                        content: entry.content || "",
                        weight: String(entry.weight || 1),
                        connections: entry.connections || ""
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
                          type: "number",
                          step: "0.1"
                        },
                        {
                          id: "connections",
                          label: "Connections"
                        }
                      ]
                    });

                    if (!result) return;
                    await api.updateIdentity(entry.section, {
                      content: result.content,
                      weight: Number(result.weight || 1),
                      connections: result.connections || null
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
                      title: "Delete identity section",
                      description: "This permanently removes the selected identity section.",
                      confirmLabel: "Delete section"
                    });

                    if (!confirmed) return;
                    await api.deleteIdentity(entry.section);
                    await refresh();
                  }
                }
              })
            ]
          })
        ]
      })
    );
  }

  root.appendChild(
    el("section", {
      className: "panel",
      children: [
        createSectionHeader({
          eyebrow: "Memory",
          title: "Identity",
          body: "Editable identity sections with explicit weight and connection metadata."
        }),
        el("div", {
          className: "page-toolbar",
          children: [
            el("div", {
              className: "panel-actions",
              children: [createBadge(`${entries.length} sections`, "pill pill--soft")]
            }),
            createButton("New section", {
              className: "button",
              on: {
                click: async () => {
                  const result = await modal.openForm({
                    title: "Create identity section",
                    submitLabel: "Create section",
                    values: {
                      weight: "1"
                    },
                    fields: [
                      {
                        id: "section",
                        label: "Section",
                        required: true,
                        hint: "Use dot notation, for example core.values.honesty"
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
                        type: "number",
                        step: "0.1"
                      },
                      {
                        id: "connections",
                        label: "Connections"
                      }
                    ]
                  });

                  if (!result) return;
                  await api.createIdentity({
                    section: result.section,
                    content: result.content,
                    weight: Number(result.weight || 1),
                    connections: result.connections || null
                  });
                  await refresh();
                }
              }
            })
          ]
        }),
        el("div", {
          className: "split-layout",
          children: [listNode, detailNode]
        })
      ]
    })
  );

  renderList();
  renderDetail();
  return root;
}
