export function createStore(initialState) {
  let state = { ...initialState };
  const listeners = new Set();

  function notify() {
    listeners.forEach((listener) => listener(state));
  }

  return {
    getState() {
      return state;
    },
    setState(update) {
      const nextState =
        typeof update === "function" ? update(state) : { ...state, ...update };

      state = nextState;
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(state);

      return () => {
        listeners.delete(listener);
      };
    }
  };
}
