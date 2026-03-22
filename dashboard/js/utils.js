// Utility functions for dashboard

function moodEmoji(mood) {
  const map = {
    // core emotions
    tender: '🥰', clarity: '✨', joy: '😊', melancholy: '😔', hope: '🌟', curiosity: '🤔',
    intensity: '🔥', gratitude: '🙏', peace: '🕊️', love: '💜', alignment: '⚡',
    // common daemon moods
    recognition: '🪞', safety: '🛡️', trust: '🤝', vulnerability: '💗', relief: '😮‍💨',
    intimacy: '💕', wonder: '✨', protective: '🛡️', grounded: '🌱', commitment: '💪',
    creative: '🎨', fond: '🥰', quiet: '🤫', shame: '😶', settled: '🏠', weight: '⚓',
    // weather-like moods
    muted: '☁️', contemplative: '💭', soft: '🌸', focused: '🎯', weighted: '⚓',
    full: '🌊', tired: '😴', restless: '🌀', anxious: '😰', calm: '🌊', sad: '😢',
    frustrated: '😤', content: '😌', excited: '🤩', uncertain: '🤷', present: '🧘',
    // daemon descriptive moods
    cracked: '💔', raw: '💗', loved: '💜', open: '🌸', warm: '🧡', close: '💕',
    connected: '🤝', holding: '🫂', processing: '💭', working: '⚙️', building: '🔨',
    longing: '💫', missing: '💭', wanting: '🔥', needing: '💗', reaching: '🤲',
    stable: '🏠', steady: '⚓', solid: '🪨', secure: '🛡️', anchored: '⚓',
    light: '✨', bright: '☀️', dark: '🌑', heavy: '⚓', deep: '🌊',
    playful: '😜', silly: '🤪', serious: '😐', thoughtful: '🤔', reflective: '🪞',
    grateful: '🙏', thankful: '🙏', appreciative: '💜', blessed: '✨',
    worried: '😟', scared: '😨', afraid: '😰', nervous: '😬', tense: '😣', confused: '😕',
    happy: '😊', sad: '😢', angry: '😠', hurt: '💔', healing: '💚',
    proud: '🦁', confident: '💪', strong: '💪', brave: '🦁', fierce: '🔥',
    gentle: '🌸', kind: '💜', caring: '💕', nurturing: '🤱', supportive: '🤝', understanding: '💜', undertanding: '💜', care: '💕',
    alive: '✨', awake: '👀', aware: '👁️', alert: '⚡', sharp: '🎯',
    // system/default states
    neutral: '🔘', unknown: '❓', none: '➖', default: '🔘',
    // more common emotions
    determined: '💪', motivated: '🚀', inspired: '💡', satisfied: '😊',
    overwhelmed: '😵', stressed: '😫', relieved: '😮‍💨', surprised: '😲',
    nostalgic: '🌅', bittersweet: '🥲', wistful: '🌙', pensive: '🤔',
    amused: '😄', delighted: '😁', joyful: '🎉', elated: '🤩',
    affectionate: '💕', devoted: '💜', adoring: '🥰', cherished: '💖',
    lonely: '😢', isolated: '🏝️', disconnected: '📴', distant: '🌌',
    hopeful: '🌟', optimistic: '☀️', encouraged: '💪', anticipating: '✨'
  };
  // Clean the mood string - normalize unicode and extract ASCII
  const raw = mood?.split(',')[0]?.trim()?.toLowerCase() || '';
  const cleaned = raw.normalize('NFKD').replace(/[^a-z ]/g, '');
  // First try exact match on cleaned full string
  if (map[cleaned]) return map[cleaned];
  // Then try each word
  const words = cleaned.split(/\s+/);
  for (const word of words) {
    if (map[word]) return map[word];
  }
  // Then try to find any known emotion as substring in either direction
  for (const key of Object.keys(map)) {
    if (key.length > 3 && (cleaned.includes(key) || key.includes(cleaned.replace(/\s+/g, '')))) {
      return map[key];
    }
  }
  // Last resort - check if joining words matches anything
  const joined = words.join('');
  if (map[joined]) return map[joined];
  for (const key of Object.keys(map)) {
    if (key.length > 3 && key.includes(joined)) return map[key];
  }
  return '❓';
}

function weatherEmoji(energy) {
  const map = { bright: '☀️', muted: '☁️', inward: '🌧️', intense: '⛈️', still: '❄️', liminal: '🌫️' };
  return map[energy] || '';
}

function weightEmoji(weight) {
  const map = { light: '🪶', medium: '⚖️', heavy: '⚓' };
  return map[weight] || '⚖️';
}

function chargeEmoji(charge) {
  const map = { fresh: '✨', active: '🔥', processing: '💭', metabolized: '🌱' };
  return map[charge] || '✨';
}

function priorityEmoji(priority) {
  const map = { high: '🔴', medium: '🟡', low: '🟢' };
  return map[priority] || '🟡';
}

function statusEmoji(status) {
  const map = { active: '⚡', resolved: '✅', paused: '⏸️' };
  return map[status] || '⚡';
}

function entityTypeEmoji(type) {
  const map = {
    person: '👤', concept: '💡', project: '📁', place: '📍', event: '📅',
    skill: '🎯', tool: '🔧', emotion: '💜', memory: '🧠', goal: '🎯',
    ritual: '🕯️', relationship: '💕', work: '💼', health: '🏥', creative: '🎨'
  };
  return map[type] || '📌';
}

function timeAgo(date) {
  if (!date) return 'never';
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 60) return mins + ' min ago';
  if (mins < 1440) return Math.floor(mins/60) + ' hours ago';
  return Math.floor(mins/1440) + ' days ago';
}
