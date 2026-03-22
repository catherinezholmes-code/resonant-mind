import { clear, el } from "../app/dom.js";

function createField(field, values) {
  const value = values?.[field.id] ?? field.value ?? "";
  let control;

  if (field.type === "textarea") {
    control = el("textarea", {
      className: "modal-form__control modal-form__textarea",
      attrs: {
        name: field.id,
        rows: field.rows || 5,
        placeholder: field.placeholder || "",
        required: field.required || null,
        readonly: field.readonly || null
      },
      text: value
    });
  } else if (field.type === "select") {
    control = el("select", {
      className: "modal-form__control",
      attrs: {
        name: field.id,
        required: field.required || null,
        disabled: field.disabled || null
      },
      children: (field.options || []).map((option) =>
        el("option", {
          attrs: {
            value: option.value,
            selected: option.value === value ? true : null
          },
          text: option.label
        })
      )
    });
  } else {
    control = el("input", {
      className: "modal-form__control",
      attrs: {
        type: field.type || "text",
        name: field.id,
        value,
        placeholder: field.placeholder || "",
        required: field.required || null,
        readonly: field.readonly || null,
        step: field.step || null,
        min: field.min ?? null,
        max: field.max ?? null
      }
    });
  }

  return el("label", {
    className: "modal-form__field",
    children: [
      el("span", {
        className: "modal-form__label",
        text: field.label
      }),
      control,
      field.hint
        ? el("span", {
            className: "modal-form__hint",
            text: field.hint
          })
        : null
    ]
  });
}

export function createModalManager() {
  const overlay = el("div", {
    className: "modal-gate",
    attrs: { hidden: true }
  });
  const sheet = el("section", {
    className: "modal-sheet"
  });
  overlay.appendChild(sheet);
  document.body.appendChild(overlay);

  let activeResolver = null;

  function close(result) {
    overlay.hidden = true;
    clear(sheet);

    if (activeResolver) {
      activeResolver(result);
      activeResolver = null;
    }
  }

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      close(null);
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !overlay.hidden) {
      close(null);
    }
  });

  return {
    openForm({ title, description, fields, submitLabel = "Save", values = {} }) {
      return new Promise((resolve) => {
        activeResolver = resolve;

        const form = el("form", {
          className: "modal-form",
          on: {
            submit: (event) => {
              event.preventDefault();
              const formData = new FormData(form);
              const result = {};

              fields.forEach((field) => {
                result[field.id] = formData.get(field.id);
              });

              close(result);
            }
          },
          children: [
            el("div", {
              className: "section-header",
              children: [
                el("p", {
                  className: "section-header__eyebrow",
                  text: "Action"
                }),
                el("h2", {
                  className: "section-header__title",
                  text: title
                }),
                description
                  ? el("p", {
                      className: "panel-header__body",
                      text: description
                    })
                  : null
              ]
            }),
            el("div", {
              className: "modal-form__grid",
              children: fields.map((field) => createField(field, values))
            }),
            el("div", {
              className: "modal-form__actions",
              children: [
                el("button", {
                  className: "button button--ghost",
                  attrs: { type: "button" },
                  text: "Cancel",
                  on: {
                    click: () => close(null)
                  }
                }),
                el("button", {
                  className: "button",
                  attrs: { type: "submit" },
                  text: submitLabel
                })
              ]
            })
          ]
        });

        clear(sheet);
        sheet.appendChild(form);
        overlay.hidden = false;
      });
    },
    confirm({ title, description, confirmLabel = "Confirm", tone = "danger" }) {
      return new Promise((resolve) => {
        activeResolver = resolve;

        const confirmButtonClass = tone === "danger" ? "button" : "button button--soft";
        const content = el("div", {
          className: "modal-form",
          children: [
            el("div", {
              className: "section-header",
              children: [
                el("p", {
                  className: "section-header__eyebrow",
                  text: "Confirm"
                }),
                el("h2", {
                  className: "section-header__title",
                  text: title
                }),
                description
                  ? el("p", {
                      className: "panel-header__body",
                      text: description
                    })
                  : null
              ]
            }),
            el("div", {
              className: "modal-form__actions",
              children: [
                el("button", {
                  className: "button button--ghost",
                  attrs: { type: "button" },
                  text: "Cancel",
                  on: {
                    click: () => close(false)
                  }
                }),
                el("button", {
                  className: confirmButtonClass,
                  attrs: { type: "button" },
                  text: confirmLabel,
                  on: {
                    click: () => close(true)
                  }
                })
              ]
            })
          ]
        });

        clear(sheet);
        sheet.appendChild(content);
        overlay.hidden = false;
      });
    }
  };
}
