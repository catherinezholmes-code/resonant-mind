import { clear, el } from "../app/dom.js";
import { formatRelativeTime, toTitleCase } from "../app/format.js";
import {
  createBadge,
  createEmptyState,
  createSectionHeader
} from "../components/ui.js";

export async function renderImagesPage({ api }) {
  const [images, entities] = await Promise.all([
    api.listImages(),
    api.listEntities()
  ]);

  const state = {
    images,
    entityId: "",
    weight: ""
  };

  const root = el("div", {
    className: "page-shell fade-in"
  });
  const gridNode = el("div", {
    className: "image-grid"
  });

  function filtered() {
    return state.images.filter((image) => {
      const matchesEntity = !state.entityId || String(image.entity_id || "") === state.entityId;
      const matchesWeight = !state.weight || image.weight === state.weight;
      return matchesEntity && matchesWeight;
    });
  }

  function renderGrid() {
    clear(gridNode);
    const rows = filtered();

    if (!rows.length) {
      gridNode.appendChild(
        createEmptyState(
          "No images match these filters",
          "Clear the current filters or add more image memories through the Worker."
        )
      );
      return;
    }

    rows.forEach((image) => {
      const preview = el("div", {
        className: "image-card__preview"
      });

      if (image.path) {
        preview.style.backgroundImage = `url("${image.path}")`;
      }

      gridNode.appendChild(
        el("article", {
          className: "image-card",
          children: [
            image.path
              ? el("a", {
                  attrs: {
                    href: image.path,
                    target: "_blank",
                    rel: "noreferrer"
                  },
                  children: preview
                })
              : preview,
            el("h3", {
              className: "stack-card__title",
              text: image.description || "Untitled image memory"
            }),
            el("div", {
              className: "inline-meta",
              children: [
                image.entity_name ? createBadge(image.entity_name) : null,
                image.weight ? createBadge(image.weight, "pill pill--soft") : null,
                image.emotion ? createBadge(image.emotion, "pill pill--soft") : null
              ]
            }),
            el("p", {
              className: "detail-copy",
              text: image.context || "No context recorded."
            }),
            el("p", {
              className: "meta-copy",
              text: `Created ${formatRelativeTime(image.created_at)}`
            })
          ]
        })
      );
    });
  }

  const entityFilter = el("select", {
    className: "field",
    on: {
      change: (event) => {
        state.entityId = event.target.value;
        renderGrid();
      }
    },
    children: [
      el("option", { attrs: { value: "" }, text: "All entities" }),
      ...entities.map((entity) =>
        el("option", {
          attrs: { value: String(entity.id) },
          text: entity.name
        })
      )
    ]
  });

  const weightFilter = el("select", {
    className: "field",
    on: {
      change: (event) => {
        state.weight = event.target.value;
        renderGrid();
      }
    },
    children: [
      el("option", { attrs: { value: "" }, text: "All weights" }),
      ...["light", "medium", "heavy"].map((weight) =>
        el("option", {
          attrs: { value: weight },
          text: toTitleCase(weight)
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
          title: "Images",
          body: "Visual memories stored in the Worker, filterable by entity and weight."
        }),
        el("div", {
          className: "filter-group",
          children: [entityFilter, weightFilter]
        }),
        gridNode
      ]
    })
  );

  renderGrid();
  return root;
}
