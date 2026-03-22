import { el } from "../app/dom.js";

export function renderPlaceholderPage(meta) {
  return el("div", {
    className: "page-shell fade-in",
    children: [
      el("section", {
        className: "placeholder-card",
        children: [
          el("div", {
            className: "section-header",
            children: [
              el("p", {
                className: "section-header__eyebrow",
                text: meta.eyebrow
              }),
              el("h2", {
                className: "section-header__title",
                text: meta.title
              }),
              el("p", {
                className: "panel-header__body",
                text: meta.description
              })
            ]
          }),
          el("div", {
            className: "empty-state",
            children: [
              el("h3", {
                className: "empty-state__title",
                text: "This section is intentionally held back."
              }),
              el("p", {
                className: "empty-state__body",
                text: "Arrive is the first live slice of the V2 rebuild. The remaining sections will follow once the shell, API client, and shared interaction patterns settle."
              })
            ]
          })
        ]
      })
    ]
  });
}
