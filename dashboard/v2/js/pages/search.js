import { clear, el } from "../app/dom.js";
import { formatScore, truncate } from "../app/format.js";
import {
  createBadge,
  createButton,
  createEmptyState,
  createSectionHeader,
  createStackCard
} from "../components/ui.js";

export async function renderSearchPage({ api }) {
  const root = el("div", {
    className: "page-shell fade-in"
  });
  const resultNode = el("div", {
    className: "stack-list"
  });
  const summaryNode = el("p", {
    className: "meta-copy",
    text: "Search the semantic memory layer."
  });
  const input = el("input", {
    className: "field",
    attrs: {
      type: "search",
      placeholder: "Search semantic memory"
    }
  });

  async function runSearch() {
    const query = input.value.trim();
    if (!query) {
      clear(resultNode);
      resultNode.appendChild(
        createEmptyState(
          "Enter a query",
          "Search is backed by semantic retrieval, so natural language works well here."
        )
      );
      return;
    }

    const results = await api.search(query);
    summaryNode.textContent = `Mood tint: ${results.mood || "none"} | ${results.results.length} results`;
    clear(resultNode);

    if (!results.results.length) {
      resultNode.appendChild(
        createEmptyState(
          "No search results",
          "Try a broader phrase or a more emotionally loaded query."
        )
      );
      return;
    }

    results.results.forEach((item) => {
      resultNode.appendChild(
        createStackCard({
          title: item.entity || item.source || item.id,
          body: truncate(item.content || item.id, 220),
          meta: [
            { text: formatScore(item.score) },
            item.weight ? { text: item.weight, className: "pill pill--soft" } : null,
            item.added_at ? { text: item.added_at, className: "pill pill--soft" } : null
          ].filter(Boolean),
          actions: [
            item.context ? createBadge(item.context, "pill pill--soft") : null
          ].filter(Boolean)
        })
      );
    });
  }

  input.addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
      await runSearch();
    }
  });

  root.appendChild(
    el("section", {
      className: "panel",
      children: [
        createSectionHeader({
          eyebrow: "Search",
          title: "Semantic search",
          body: "Search the vector memory layer with mood-aware retrieval."
        }),
        el("div", {
          className: "page-toolbar",
          children: [
            input,
            createButton("Search", {
              className: "button",
              on: {
                click: async () => {
                  await runSearch();
                }
              }
            })
          ]
        }),
        summaryNode,
        resultNode
      ]
    })
  );

  return root;
}
