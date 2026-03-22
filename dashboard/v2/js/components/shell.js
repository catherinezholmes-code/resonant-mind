import { clear, el } from "../app/dom.js";

function createNavSection(section) {
  return el("section", {
    className: "nav-section",
    children: [
      el("p", {
        className: "nav-section__label",
        text: section.label
      }),
      el("div", {
        className: "nav-list",
        children: section.items.map((item) =>
          el("a", {
            className: "nav-item",
            attrs: {
              href: item.href,
              "data-route-id": item.id
            },
            children: [
              el("div", {
                className: "nav-item__meta",
                children: [
                  el("span", {
                    className: "nav-item__title",
                    text: item.title
                  }),
                  el("span", {
                    className: "nav-item__hint",
                    text: item.hint
                  })
                ]
              }),
              el("span", {
                className: "nav-item__marker",
                attrs: { "aria-hidden": "true" }
              })
            ]
          })
        )
      })
    ]
  });
}

function createModeStrip(navigation) {
  return el("nav", {
    className: "mode-strip",
    attrs: { "aria-label": "Primary dashboard sections" },
    children: navigation.map((section) =>
      el("a", {
        className: "mode-tab",
        attrs: {
          href: section.items[0]?.href || "#/arrive",
          "data-section-id": section.id
        },
        children: [
          el("span", {
            className: "mode-tab__label",
            text: section.label
          }),
          el("span", {
            className: "mode-tab__hint",
            text: section.items[0]?.hint || "Section"
          })
        ]
      })
    )
  });
}

export function createShell({ navigation, target }) {
  const statusLabel = el("span", {
    text: "API key required"
  });

  const status = el("div", {
    className: "shell-status",
    attrs: { "data-auth": "locked" },
    children: [
      el("span", {
        className: "shell-status__dot",
        attrs: { "aria-hidden": "true" }
      }),
      statusLabel
    ]
  });

  const pageEyebrow = el("p", {
    className: "page-intro__eyebrow",
    text: "Preview build"
  });

  const pageTitle = el("h1", {
    className: "page-intro__title",
    text: "Arrive"
  });

  const pageDescription = el("p", {
    className: "page-intro__body",
    text: "The next dashboard is built here first."
  });

  const menuButton = el("button", {
    className: "button button--ghost menu-button",
    attrs: { type: "button", "aria-label": "Open navigation" },
    text: "Menu"
  });

  const refreshButton = el("button", {
    className: "button button--ghost",
    attrs: { type: "button" },
    text: "Refresh"
  });

  const authButton = el("button", {
    className: "button button--soft",
    attrs: { type: "button" },
    text: "Unlock"
  });

  const content = el("main", {
    className: "shell__content",
    attrs: { id: "page-root" }
  });

  const modeStrip = createModeStrip(navigation);

  const overlay = el("div", {
    className: "shell-overlay",
    attrs: { "aria-hidden": "true" }
  });

  const shell = el("div", {
    className: "shell",
    attrs: { "data-nav-open": "false", "data-theme": "default" },
    children: [
      overlay,
      el("aside", {
        className: "shell__sidebar fade-in",
        children: [
          el("div", {
            className: "brand-block",
            children: [
              el("div", {
                className: "shell-actions",
                children: [
                  el("span", {
                    className: "shell-badge",
                    text: "Dashboard V2"
                  }),
                  el("span", {
                    className: "shell-badge shell-badge--soft",
                    text: "Parallel rebuild"
                  })
                ]
              }),
              el("p", {
                className: "brand-block__eyebrow",
                text: "Resonant Mind"
              }),
              el("h1", {
                className: "brand-block__title",
                text: "A calmer place to arrive."
              }),
              el("p", {
                className: "brand-block__body",
                text: "V2 is the controlled rebuild: safer rendering, clearer navigation, and room for the Worker to stay stable while the interface changes."
              }),
              status
            ]
          }),
          ...navigation.map((section) => createNavSection(section)),
          el("div", {
            className: "callout panel",
            children: [
              el("div", {
                className: "panel-header",
                children: [
                  el("p", {
                    className: "panel-header__eyebrow",
                    text: "Fallback"
                  }),
                  el("h2", {
                    className: "panel-header__title",
                    text: "Legacy stays available."
                  }),
                  el("p", {
                    className: "panel-header__body",
                    text: "The current dashboard remains the default until V2 covers the essential flows."
                  })
                ]
              }),
              el("a", {
                className: "button button--ghost",
                attrs: { href: "/" },
                text: "Open legacy dashboard"
              })
            ]
          })
        ]
      }),
      el("section", {
        className: "shell__frame",
        children: [
          el("header", {
            className: "shell__topbar fade-in",
            children: [
              el("div", {
                className: "shell__topbar-main",
                children: [
                  menuButton,
                  el("div", {
                    className: "page-intro",
                    children: [pageEyebrow, pageTitle, pageDescription]
                  })
                ]
              }),
              modeStrip,
              el("div", {
                className: "topbar-actions",
                children: [refreshButton, authButton]
              })
            ]
          }),
          content
        ]
      })
    ]
  });

  target.appendChild(shell);

  return {
    authButton,
    content,
    menuButton,
    overlay,
    refreshButton,
    setActiveRoute(routeId) {
      shell.dataset.routeId = routeId;
      shell.querySelectorAll("[data-route-id]").forEach((link) => {
        link.classList.toggle("is-active", link.dataset.routeId === routeId);
      });
    },
    setActiveSection(sectionId) {
      shell.querySelectorAll("[data-section-id]").forEach((link) => {
        link.classList.toggle("is-active", link.dataset.sectionId === sectionId);
      });
    },
    setTheme(theme) {
      shell.dataset.theme = theme;
      document.body.dataset.theme = theme;
    },
    setAuthState(isReady) {
      status.dataset.auth = isReady ? "ready" : "locked";
      statusLabel.textContent = isReady ? "API key ready" : "API key required";
      authButton.textContent = isReady ? "Reset key" : "Unlock";
    },
    setBusy(isBusy) {
      refreshButton.disabled = isBusy;
      refreshButton.textContent = isBusy ? "Refreshing..." : "Refresh";
    },
    setNavOpen(isOpen) {
      shell.dataset.navOpen = isOpen ? "true" : "false";
    },
    setPageMeta(meta) {
      pageEyebrow.textContent = meta.eyebrow;
      pageTitle.textContent = meta.title;
      pageDescription.textContent = meta.description;
    },
    mount(view) {
      clear(content);
      content.appendChild(view);
    }
  };
}
