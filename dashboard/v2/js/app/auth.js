import { el } from "./dom.js";

const TOKEN_STORAGE_KEY = "resonant-mind-api-key-v2";

export function createAuthManager() {
  const listeners = new Set();
  let overlay;
  let messageNode;
  let inputNode;
  let pendingPromise = null;
  let pendingResolve = null;

  function notify() {
    const token = getToken();
    listeners.forEach((listener) => listener(token));
  }

  function getToken() {
    const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    return token ? token.trim() : "";
  }

  function setToken(token) {
    const normalized = (token || "").trim();

    if (normalized) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, normalized);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }

    notify();
  }

  function clearToken() {
    setToken("");
  }

  function hideOverlay() {
    if (!overlay) {
      return;
    }

    overlay.hidden = true;
  }

  function ensureOverlay() {
    if (overlay) {
      return;
    }

    messageNode = el("p", {
      className: "auth-message",
      text: ""
    });

    inputNode = el("input", {
      className: "auth-input",
      attrs: {
        type: "password",
        name: "api-key",
        placeholder: "Enter MIND_API_KEY",
        autocomplete: "off",
        spellcheck: "false"
      }
    });

    const form = el("form", {
      className: "auth-form",
      on: {
        submit: (event) => {
          event.preventDefault();
          const token = inputNode.value.trim();

          if (!token) {
            messageNode.textContent = "API key is required.";
            inputNode.focus();
            return;
          }

          setToken(token);
          hideOverlay();

          if (pendingResolve) {
            pendingResolve(token);
          }

          pendingResolve = null;
          pendingPromise = null;
        }
      },
      children: [
        inputNode,
        messageNode,
        el("button", {
          className: "button",
          attrs: { type: "submit" },
          text: "Unlock dashboard"
        })
      ]
    });

    overlay = el("div", {
      className: "auth-gate",
      attrs: { hidden: true },
      children: el("section", {
        className: "auth-card fade-in",
        attrs: { "aria-labelledby": "auth-title" },
        children: [
          el("div", {
            className: "pill-row",
            children: el("span", {
              className: "shell-badge shell-badge--soft",
              text: "Private preview"
            })
          }),
          el("h1", {
            className: "auth-card__title",
            attrs: { id: "auth-title" },
            text: "Unlock Dashboard"
          }),
          el("p", {
            className: "auth-card__body",
            text: "Dashboard V2 uses the same protected /api surface as the legacy UI. Enter the Worker API key to continue."
          }),
          form,
          el("p", {
            className: "auth-card__hint",
            text: "The key stays local to this browser profile. Reset it anytime from the top bar."
          })
        ]
      })
    });

    document.body.appendChild(overlay);
  }

  function showOverlay(reason) {
    ensureOverlay();
    messageNode.textContent = reason || "";
    inputNode.value = "";
    overlay.hidden = false;
    window.requestAnimationFrame(() => {
      inputNode.focus();
    });
  }

  async function requestToken(options = {}) {
    const { force = false, reason = "" } = options;
    const existing = !force ? getToken() : "";

    if (existing) {
      return existing;
    }

    if (!pendingPromise) {
      showOverlay(reason);
      pendingPromise = new Promise((resolve) => {
        pendingResolve = resolve;
      });
    } else {
      showOverlay(reason);
    }

    return pendingPromise;
  }

  return {
    getToken,
    setToken,
    clearToken,
    requestToken,
    subscribe(listener) {
      listeners.add(listener);
      listener(getToken());

      return () => {
        listeners.delete(listener);
      };
    }
  };
}
