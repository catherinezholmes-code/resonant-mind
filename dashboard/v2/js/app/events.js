export function bindShellEvents({ auth, router, shell, store }) {
  shell.menuButton.addEventListener("click", () => {
    store.setState({
      ...store.getState(),
      navOpen: !store.getState().navOpen
    });
  });

  shell.overlay.addEventListener("click", () => {
    store.setState({
      ...store.getState(),
      navOpen: false
    });
  });

  shell.refreshButton.addEventListener("click", async () => {
    await router.refresh();
  });

  shell.authButton.addEventListener("click", async () => {
    auth.clearToken();
    await auth.requestToken({
      force: true,
      reason: "Enter a valid API key to keep using Dashboard V2."
    });
    await router.refresh();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      store.setState({
        ...store.getState(),
        navOpen: false
      });
    }
  });

  store.subscribe((state) => {
    shell.setNavOpen(Boolean(state.navOpen));
  });

  auth.subscribe((token) => {
    shell.setAuthState(Boolean(token));
  });
}
