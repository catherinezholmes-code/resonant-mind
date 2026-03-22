function appendChild(parent, child) {
  if (child === null || child === undefined || child === false) {
    return;
  }

  if (Array.isArray(child)) {
    child.forEach((item) => appendChild(parent, item));
    return;
  }

  if (child instanceof Node) {
    parent.appendChild(child);
    return;
  }

  parent.appendChild(document.createTextNode(String(child)));
}

export function el(tagName, options = {}) {
  const {
    className,
    text,
    attrs,
    dataset,
    on,
    children
  } = options;

  const node = document.createElement(tagName);

  if (className) {
    node.className = className;
  }

  if (text !== undefined) {
    node.textContent = String(text);
  }

  if (attrs) {
    Object.entries(attrs).forEach(([key, value]) => {
      if (value === null || value === undefined || value === false) {
        return;
      }

      if (value === true) {
        node.setAttribute(key, "");
        return;
      }

      node.setAttribute(key, String(value));
    });
  }

  if (dataset) {
    Object.entries(dataset).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        node.dataset[key] = String(value);
      }
    });
  }

  if (on) {
    Object.entries(on).forEach(([eventName, handler]) => {
      node.addEventListener(eventName, handler);
    });
  }

  if (children) {
    appendChild(node, children);
  }

  return node;
}

export function clear(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }

  return node;
}
