import { clear, el } from "../app/dom.js";
import { formatRelativeTime, toTitleCase, truncate } from "../app/format.js";
import {
  createBadge,
  createButton,
  createEmptyState,
  createKeyValueList,
  createSectionHeader,
  createStackCard
} from "../components/ui.js";

export async function renderEntitiesPage({ api, modal, refresh }) {
  const entities = await api.listEntities();
  const state = {
    entities,
    selectedId: entities[0]?.id || null,
    type: "",
    salience: ""
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

  const typeOptions = [...new Set(entities.map((entity) => entity.entity_type).filter(Boolean))].sort();
  const salienceOptions = ["foundational", "active", "background", "archive"];

  function filteredEntities() {
    return entities.filter((entity) => {
      const matchesType = !state.type || entity.entity_type === state.type;
      const matchesSalience =
        !state.salience || (entity.salience || "active") === state.salience;
      return matchesType && matchesSalience;
    });
  }

  async function renderDetail(entityId) {
    clear(detailNode);

    if (!entityId) {
      detailNode.appendChild(
        createEmptyState(
          "Choose an entity",
          "Select something from the list to inspect its observations, relations, and maintenance actions."
        )
      );
      return;
    }

    const entity = await api.getEntity(entityId);
    const others = entities.filter((item) => item.id !== entity.id);

    detailNode.appendChild(
      el("section", {
        className: "detail-card",
        children: [
          createSectionHeader({
            eyebrow: "Entity detail",
            title: entity.name,
            body: `${toTitleCase(entity.entity_type)} in ${entity.primary_context || "default"}`
          }),
          el("div", {
            className: "detail-card__meta",
            children: [
              createBadge(`${entity.observations?.length || 0} observations`),
              createBadge(`Salience: ${entity.salience || "active"}`, "pill pill--soft"),
              createBadge(`Updated ${formatRelativeTime(entity.updated_at || entity.created_at)}`)
            ]
          }),
          el("div", {
            className: "detail-actions",
            children: [
              createButton("Set salience", {
                on: {
                  click: async () => {
                    const result = await modal.openForm({
                      title: "Set entity salience",
                      description: "Change how present this entity should be in the active system.",
                      submitLabel: "Save salience",
                      values: {
                        salience: entity.salience || "active"
                      },
                      fields: [
                        {
                          id: "salience",
                          label: "Salience",
                          type: "select",
                          options: salienceOptions.map((option) => ({
                            value: option,
                            label: toTitleCase(option)
                          }))
                        }
                      ]
                    });

                    if (!result) return;
                    await api.updateEntity(entity.id, { salience: result.salience });
                    await refresh();
                  }
                }
              }),
              createButton("Edit", {
                on: {
                  click: async () => {
                    const result = await modal.openForm({
                      title: "Edit entity",
                      submitLabel: "Save entity",
                      values: {
                        name: entity.name,
                        entity_type: entity.entity_type,
                        context: entity.primary_context || "default"
                      },
                      fields: [
                        { id: "name", label: "Name", required: true },
                        { id: "entity_type", label: "Type", required: true },
                        { id: "context", label: "Primary context", required: true }
                      ]
                    });

                    if (!result) return;
                    await api.updateEntity(entity.id, result);
                    await refresh();
                  }
                }
              }),
              others.length
                ? createButton("Merge", {
                    on: {
                      click: async () => {
                        const result = await modal.openForm({
                          title: "Merge entity",
                          description: "Move another entity into this one and delete the source entity.",
                          submitLabel: "Merge entity",
                          fields: [
                            {
                              id: "merge_from_id",
                              label: "Merge from",
                              type: "select",
                              options: others.map((item) => ({
                                value: String(item.id),
                                label: `${item.name} (${item.entity_type})`
                              }))
                            }
                          ]
                        });

                        if (!result) return;
                        await api.mergeEntity({
                          merge_into_id: entity.id,
                          merge_from_id: Number(result.merge_from_id)
                        });
                        await refresh();
                      }
                    }
                  })
                : null,
              createButton("Delete", {
                className: "button",
                on: {
                  click: async () => {
                    const confirmed = await modal.confirm({
                      title: "Delete entity",
                      description: "This removes the entity and all of its observations.",
                      confirmLabel: "Delete entity"
                    });

                    if (!confirmed) return;
                    await api.deleteEntity(entity.id);
                    await refresh();
                  }
                }
              })
            ]
          }),
          createKeyValueList([
            { label: "Type", value: entity.entity_type || "Unknown" },
            { label: "Primary context", value: entity.primary_context || "default" },
            { label: "Created", value: formatRelativeTime(entity.created_at) }
          ])
        ]
      })
    );

    detailNode.appendChild(
      el("section", {
        className: "panel",
        children: [
          createSectionHeader({
            eyebrow: "Observations",
            title: `${entity.observations?.length || 0} traces`,
            body: "Recent observations tied to this entity."
          }),
          entity.observations?.length
            ? el("div", {
                className: "stack-list",
                children: entity.observations.slice(0, 12).map((observation) =>
                  createStackCard({
                    title: truncate(observation.content, 84),
                    body: observation.emotion || observation.charge || "Observation",
                    meta: [
                      { text: observation.weight || "medium" },
                      {
                        text: formatRelativeTime(observation.added_at),
                        className: "pill pill--soft"
                      }
                    ]
                  })
                )
              })
            : createEmptyState("No observations", "This entity does not have linked observations yet.")
        ]
      })
    );

    detailNode.appendChild(
      el("section", {
        className: "panel",
        children: [
          createSectionHeader({
            eyebrow: "Relations",
            title: `${entity.relations?.length || 0} links`,
            body: "Current relation edges touching this entity."
          }),
          entity.relations?.length
            ? el("div", {
                className: "stack-list",
                children: entity.relations.slice(0, 12).map((relation) =>
                  createStackCard({
                    title: `${relation.from_entity} -> ${relation.to_entity}`,
                    body: relation.relation_type,
                    meta: [
                      { text: relation.store_in || "default" },
                      {
                        text: formatRelativeTime(relation.created_at),
                        className: "pill pill--soft"
                      }
                    ]
                  })
                )
              })
            : createEmptyState("No relations", "No relation edges reference this entity yet.")
        ]
      })
    );
  }

  function renderList() {
    clear(listNode);
    const items = filteredEntities();

    if (!items.length) {
      listNode.appendChild(
        createEmptyState(
          "No entities match these filters",
          "Try clearing the type or salience filters."
        )
      );
      return;
    }

    if (!items.find((item) => item.id === state.selectedId)) {
      state.selectedId = items[0]?.id || null;
    }

    items.forEach((entity) => {
      listNode.appendChild(
        createStackCard({
          title: entity.name,
          body: `${toTitleCase(entity.entity_type)} in ${entity.primary_context || "default"}`,
          selected: state.selectedId === entity.id,
          onClick: async () => {
            state.selectedId = entity.id;
            renderList();
            await renderDetail(entity.id);
          },
          meta: [
            { text: `${entity.observation_count || 0} obs` },
            {
              text: entity.salience || "active",
              className: "pill pill--soft"
            }
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
        renderList();
        await renderDetail(state.selectedId);
      }
    },
    children: [
      el("option", { attrs: { value: "" }, text: "All types" }),
      ...typeOptions.map((type) =>
        el("option", {
          attrs: { value: type },
          text: toTitleCase(type)
        })
      )
    ]
  });

  const salienceFilter = el("select", {
    className: "field",
    on: {
      change: async (event) => {
        state.salience = event.target.value;
        renderList();
        await renderDetail(state.selectedId);
      }
    },
    children: [
      el("option", { attrs: { value: "" }, text: "All salience" }),
      ...salienceOptions.map((option) =>
        el("option", {
          attrs: { value: option },
          text: toTitleCase(option)
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
          title: "Entities",
          body: "Core nodes in the memory graph, with direct access to their observations and relations."
        }),
        el("div", {
          className: "page-toolbar",
          children: [
            el("div", {
              className: "filter-group",
              children: [typeFilter, salienceFilter]
            }),
            createButton("New entity", {
              className: "button",
              on: {
                click: async () => {
                  const result = await modal.openForm({
                    title: "Create entity",
                    submitLabel: "Create entity",
                    values: {
                      entity_type: "concept",
                      context: "default"
                    },
                    fields: [
                      { id: "name", label: "Name", required: true },
                      { id: "entity_type", label: "Type", required: true },
                      { id: "context", label: "Primary context", required: true }
                    ]
                  });

                  if (!result) return;
                  await api.createEntity(result);
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
  await renderDetail(state.selectedId);
  return root;
}
