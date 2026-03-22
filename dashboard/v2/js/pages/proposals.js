import { clear, el } from "../app/dom.js";
import { formatRelativeTime, formatScore, truncate } from "../app/format.js";
import {
  createBadge,
  createButton,
  createEmptyState,
  createSectionHeader,
  createStackCard
} from "../components/ui.js";

export async function renderProposalsPage({ api, modal, refresh }) {
  const state = {
    status: "pending",
    proposals: await api.listProposals("pending")
  };

  const root = el("div", {
    className: "page-shell fade-in"
  });
  const listNode = el("div", {
    className: "stack-list"
  });

  async function load() {
    state.proposals = await api.listProposals(state.status);
    renderList();
  }

  function renderList() {
    clear(listNode);

    if (!state.proposals.length) {
      listNode.appendChild(
        createEmptyState(
          "No proposals for this status",
          "When the daemon detects new resonances they will appear here."
        )
      );
      return;
    }

    state.proposals.forEach((proposal) => {
      listNode.appendChild(
        createStackCard({
          title: proposal.proposal_type === "resonance"
            ? proposal.from_entity_name || "Internal resonance"
            : `${proposal.from_entity_name || "Unknown"} -> ${proposal.to_entity_name || "Unknown"}`,
          body: `${truncate(proposal.from_content || "", 90)} ${proposal.to_content ? ` / ${truncate(proposal.to_content, 90)}` : ""}`.trim(),
          meta: [
            { text: `${proposal.co_count || 0}x co-surfaced` },
            { text: formatScore(proposal.confidence || 0.5), className: "pill pill--soft" },
            { text: proposal.status, className: "pill pill--soft" }
          ],
          actions: proposal.status === "pending"
            ? [
                createButton("Accept", {
                  className: "button",
                  on: {
                    click: async () => {
                      const result = await modal.openForm({
                        title: "Accept proposal",
                        description: "Choose the relation type to create if you accept this proposal.",
                        submitLabel: "Create relation",
                        values: {
                          relation_type: "related_to"
                        },
                        fields: [
                          {
                            id: "relation_type",
                            label: "Relation type",
                            type: "select",
                            options: [
                              "related_to",
                              "resonates_with",
                              "contrasts_with",
                              "influences",
                              "supports"
                            ].map((value) => ({
                              value,
                              label: value
                            }))
                          }
                        ]
                      });

                      if (!result) return;
                      await api.acceptProposal(proposal.id, result);
                      await refresh();
                    }
                  }
                }),
                createButton("Reject", {
                  on: {
                    click: async () => {
                      const confirmed = await modal.confirm({
                        title: "Reject proposal",
                        description: "This will dismiss the proposed connection.",
                        confirmLabel: "Reject proposal",
                        tone: "soft"
                      });

                      if (!confirmed) return;
                      await api.rejectProposal(proposal.id);
                      await refresh();
                    }
                  }
                })
              ]
            : [createBadge(`Resolved ${formatRelativeTime(proposal.resolved_at || proposal.proposed_at)}`, "pill pill--soft")]
        })
      );
    });
  }

  const filter = el("select", {
    className: "field",
    on: {
      change: async (event) => {
        state.status = event.target.value;
        await load();
      }
    },
    children: ["pending", "accepted", "rejected", "all"].map((status) =>
      el("option", {
        attrs: { value: status },
        text: status
      })
    )
  });

  root.appendChild(
    el("section", {
      className: "panel",
      children: [
        createSectionHeader({
          eyebrow: "Processing",
          title: "Proposals",
          body: "Daemon-detected resonances waiting for a human decision."
        }),
        el("div", {
          className: "filter-group",
          children: [filter]
        }),
        listNode
      ]
    })
  );

  renderList();
  return root;
}
