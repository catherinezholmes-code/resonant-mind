import { clear, el } from "../app/dom.js";
import { formatRelativeTime, truncate } from "../app/format.js";
import {
  createBadge,
  createButton,
  createEmptyState,
  createSectionHeader,
  createStackCard
} from "../components/ui.js";

export async function renderArchivePage({ api, modal, refresh }) {
  const archive = await api.getArchive("?limit=50");
  const state = {
    query: "",
    results: archive.observations || [],
    total: archive.total || 0
  };

  const root = el("div", {
    className: "page-shell fade-in"
  });
  const listNode = el("div", {
    className: "stack-list"
  });
  const searchInput = el("input", {
    className: "field",
    attrs: {
      type: "search",
      placeholder: "Search within archive"
    }
  });

  function renderList() {
    clear(listNode);

    if (!state.results.length) {
      listNode.appendChild(
        createEmptyState(
          state.query ? "No archive matches" : "Archive is empty",
          state.query
            ? "No archived memories match the current search."
            : "Archived memories will show up here once observations begin to fade."
        )
      );
      return;
    }

    state.results.forEach((item) => {
      listNode.appendChild(
        createStackCard({
          title: item.entity_name || "Archived observation",
          body: truncate(item.content, 180),
          meta: [
            { text: item.weight || "medium" },
            item.emotion ? { text: item.emotion, className: "pill pill--soft" } : null,
            {
              text: formatRelativeTime(item.archived_at),
              className: "pill pill--soft"
            }
          ].filter(Boolean),
          actions: [
            createButton("Rescue", {
              className: "button",
              on: {
                click: async () => {
                  await api.rescueArchive(item.id);
                  await refresh();
                }
              }
            })
          ]
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
          title: "Archive",
          body: `Deep archive access across ${state.total} stored observations.`
        }),
        el("div", {
          className: "page-toolbar",
          children: [
            searchInput,
            createButton("Search archive", {
              className: "button",
              on: {
                click: async () => {
                  state.query = searchInput.value.trim();
                  state.results = state.query
                    ? await api.searchArchive(state.query)
                    : archive.observations || [];
                  renderList();
                }
              }
            }),
            createButton("Clear", {
              on: {
                click: () => {
                  state.query = "";
                  searchInput.value = "";
                  state.results = archive.observations || [];
                  renderList();
                }
              }
            })
          ]
        }),
        listNode
      ]
    })
  );

  renderList();
  return root;
}
