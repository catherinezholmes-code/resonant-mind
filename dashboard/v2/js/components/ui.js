import { el } from "../app/dom.js";

export function createEmptyState(title, body) {
  return el("div", {
    className: "empty-state",
    children: [
      el("h3", {
        className: "empty-state__title",
        text: title
      }),
      el("p", {
        className: "empty-state__body",
        text: body
      })
    ]
  });
}

export function createSectionHeader({ eyebrow, title, body }) {
  return el("div", {
    className: "panel-header",
    children: [
      eyebrow
        ? el("p", {
            className: "panel-header__eyebrow",
            text: eyebrow
          })
        : null,
      el("h2", {
        className: "panel-header__title",
        text: title
      }),
      body
        ? el("p", {
            className: "panel-header__body",
            text: body
          })
        : null
    ]
  });
}

export function createBadge(text, className = "badge") {
  return el("span", {
    className,
    text
  });
}

export function createKeyValueList(items) {
  return el("div", {
    className: "key-value-list",
    children: items.map((item) =>
      el("div", {
        className: "key-value",
        children: [
          el("span", {
            className: "key-value__label",
            text: item.label
          }),
          el("p", {
            className: "key-value__value",
            text: item.value
          })
        ]
      })
    )
  });
}

export function createStackCard({
  title,
  body,
  meta = [],
  actions = [],
  selected = false,
  onClick
}) {
  return el("article", {
    className: `stack-card${selected ? " is-selected" : ""}`,
    on: onClick
      ? {
          click: onClick
        }
      : undefined,
    children: [
      el("div", {
        className: "stack-card__header",
        children: [
          el("h3", {
            className: "stack-card__title",
            text: title
          }),
          meta.length
            ? el("div", {
                className: "stack-card__meta",
                children: meta.map((item) => createBadge(item.text, item.className))
              })
            : null
        ]
      }),
      body
        ? el("p", {
            className: "stack-card__body",
            text: body
          })
        : null,
      actions.length
        ? el("div", {
            className: "stack-card__actions",
            children: actions
          })
        : null
    ]
  });
}

export function createButton(text, options = {}) {
  return el("button", {
    className: options.className || "button button--ghost",
    attrs: {
      type: options.type || "button",
      disabled: options.disabled || null
    },
    text,
    on: options.on
  });
}

export function createSubnav(items, activeId, onSelect) {
  return el("div", {
    className: "subnav",
    children: items.map((item) =>
      el("button", {
        className: `subnav__item${item.id === activeId ? " is-active" : ""}`,
        attrs: { type: "button" },
        text: item.label,
        on: {
          click: () => onSelect(item.id)
        }
      })
    )
  });
}
