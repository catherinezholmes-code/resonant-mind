import { clear, el } from "../app/dom.js";
import { formatRelativeTime, truncate } from "../app/format.js";
import {
  createBadge,
  createButton,
  createEmptyState,
  createSectionHeader,
  createStackCard
} from "../components/ui.js";

export async function renderOrphansPage({ api, modal, refresh }) {
  const orphans = await api.listOrphans();
  const root = el("div", {
    className: "page-shell fade-in"
  });
  const listNode = el("div", {
    className: "stack-list"
  });

  function renderList() {
    clear(listNode);

    if (!orphans.length) {
      listNode.appendChild(
        createEmptyState(
          "No orphaned observations",
          "Everything is still surfacing inside the active memory flow."
        )
      );
      return;
    }

    orphans.forEach((orphan) => {
      listNode.appendChild(
        createStackCard({
          title: orphan.entity_name || "Observation",
          body: truncate(orphan.content, 180),
          meta: [
            { text: `${orphan.days_old} days old` },
            { text: orphan.weight || "medium", className: "pill pill--soft" },
            orphan.emotion ? { text: orphan.emotion, className: "pill pill--soft" } : null
          ].filter(Boolean),
          actions: [
            createButton("Surface", {
              className: "button",
              on: {
                click: async () => {
                  await api.surfaceOrphan(orphan.observation_id);
                  await refresh();
                }
              }
            }),
            createButton("Archive", {
              on: {
                click: async () => {
                  const confirmed = await modal.confirm({
                    title: "Archive orphan",
                    description: "This moves the orphaned observation into the deep archive.",
                    confirmLabel: "Archive observation",
                    tone: "soft"
                  });

                  if (!confirmed) return;
                  await api.archiveOrphan(orphan.observation_id);
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
          eyebrow: "Processing",
          title: "Orphans",
          body: "Observations that have not resurfaced recently and may need rescue or archiving."
        }),
        listNode
      ]
    })
  );

  renderList();
  return root;
}
