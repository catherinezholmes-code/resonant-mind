import { clear, el } from "../app/dom.js";
import { formatRelativeTime, toTitleCase } from "../app/format.js";
import {
  createBadge,
  createButton,
  createEmptyState,
  createSectionHeader,
  createStackCard
} from "../components/ui.js";

export async function renderRelationsPage({ api, modal, refresh }) {
  const [relations, entities] = await Promise.all([
    api.listRelations(),
    api.listEntities()
  ]);
  const state = {
    relations,
    type: ""
  };

  const root = el("div", {
    className: "page-shell fade-in"
  });
  const listNode = el("div", {
    className: "stack-list"
  });

  const relationTypes = [...new Set(relations.map((relation) => relation.relation_type).filter(Boolean))].sort();

  async function reload() {
    state.relations = await api.listRelations(
      state.type ? `?type=${encodeURIComponent(state.type)}` : ""
    );
    renderList();
  }

  function renderList() {
    clear(listNode);

    if (!state.relations.length) {
      listNode.appendChild(
        createEmptyState(
          "No relations available",
          "Create a relation to start shaping the memory graph."
        )
      );
      return;
    }

    state.relations.forEach((relation) => {
      listNode.appendChild(
        createStackCard({
          title: `${relation.from_entity} -> ${relation.to_entity}`,
          body: relation.relation_type,
          meta: [
            { text: relation.store_in || "default" },
            { text: formatRelativeTime(relation.created_at), className: "pill pill--soft" }
          ],
          actions: [
            createButton("Edit type", {
              on: {
                click: async () => {
                  const result = await modal.openForm({
                    title: "Edit relation type",
                    submitLabel: "Save relation",
                    values: {
                      relation_type: relation.relation_type
                    },
                    fields: [
                      {
                        id: "relation_type",
                        label: "Relation type",
                        required: true
                      }
                    ]
                  });

                  if (!result) return;
                  await api.updateRelation(relation.id, result);
                  await refresh();
                }
              }
            }),
            createButton("Delete", {
              className: "button",
              on: {
                click: async () => {
                  const confirmed = await modal.confirm({
                    title: "Delete relation",
                    description: "This removes the relation edge from the graph.",
                    confirmLabel: "Delete relation"
                  });

                  if (!confirmed) return;
                  await api.deleteRelation(relation.id);
                  await refresh();
                }
              }
            })
          ]
        })
      );
    });
  }

  const typeFilter = el("select", {
    className: "field",
    on: {
      change: async (event) => {
        state.type = event.target.value;
        await reload();
      }
    },
    children: [
      el("option", { attrs: { value: "" }, text: "All relation types" }),
      ...relationTypes.map((type) =>
        el("option", {
          attrs: { value: type },
          text: toTitleCase(type)
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
          title: "Relations",
          body: "Named edges between entities, with quick filtering and maintenance."
        }),
        el("div", {
          className: "page-toolbar",
          children: [
            el("div", {
              className: "filter-group",
              children: [typeFilter]
            }),
            createButton("New relation", {
              className: "button",
              on: {
                click: async () => {
                  const options = entities.map((entity) => ({
                    value: entity.name,
                    label: `${entity.name} (${entity.entity_type})`
                  }));
                  const result = await modal.openForm({
                    title: "Create relation",
                    submitLabel: "Create relation",
                    values: {
                      from_context: "default",
                      to_context: "default",
                      store_in: "default"
                    },
                    fields: [
                      { id: "from_entity", label: "From entity", type: "select", options },
                      { id: "relation_type", label: "Relation type", required: true },
                      { id: "to_entity", label: "To entity", type: "select", options },
                      { id: "store_in", label: "Store in" }
                    ]
                  });

                  if (!result) return;
                  await api.createRelation(result);
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

  renderList();
  return root;
}
