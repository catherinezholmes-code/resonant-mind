import { createApiClient } from "./api/client.js";
import { createMindApi } from "./api/endpoints.js";
import { createAuthManager } from "./app/auth.js";
import { bindShellEvents } from "./app/events.js";
import { createRouter, NAVIGATION } from "./app/router.js";
import { createStore } from "./app/state.js";
import { createModalManager } from "./components/modal.js";
import { createShell } from "./components/shell.js";

const store = createStore({
  navOpen: false,
  routeId: "arrive"
});

const auth = createAuthManager();
const apiClient = createApiClient(auth);
const api = createMindApi(apiClient);
const modal = createModalManager();
const shell = createShell({
  navigation: NAVIGATION,
  target: document.getElementById("app")
});
const router = createRouter({
  services: { api, modal },
  shell,
  store
});

bindShellEvents({
  auth,
  router,
  shell,
  store
});

router.start();
