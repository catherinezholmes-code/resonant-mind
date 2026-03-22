export function truncate(text, limit = 120) {
  if (!text) {
    return "";
  }

  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit - 3).trim()}...`;
}

export function formatRelativeTime(value) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export function formatDate(value) {
  if (!value) {
    return "Unknown";
  }

  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export function toTitleCase(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatScore(score) {
  return `${Math.round(Number(score || 0) * 100)}%`;
}
