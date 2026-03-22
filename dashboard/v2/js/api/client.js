async function parseResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function createHeaders(token, options, hasBody) {
  const headers = new Headers(options.headers || {});

  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

export function createApiClient(auth) {
  async function request(endpoint, options = {}) {
    const hasBody = Object.prototype.hasOwnProperty.call(options, "body");

    const send = async (forcePrompt) => {
      const token = await auth.requestToken({
        force: forcePrompt,
        reason: forcePrompt ? "The last API key was rejected. Enter a valid key." : ""
      });

      return fetch(`/api/${endpoint}`, {
        ...options,
        headers: createHeaders(token, options, hasBody),
        body: hasBody ? JSON.stringify(options.body) : undefined
      });
    };

    let response = await send(false);

    if (response.status === 401) {
      auth.clearToken();
      response = await send(true);
    }

    const payload = await parseResponse(response);

    if (!response.ok) {
      const message =
        payload &&
        typeof payload === "object" &&
        (payload.error || payload.message);

      throw new Error(message || `Request failed with status ${response.status}`);
    }

    return payload;
  }

  return {
    get(endpoint) {
      return request(endpoint);
    },
    post(endpoint, body) {
      return request(endpoint, { method: "POST", body });
    },
    request
  };
}
