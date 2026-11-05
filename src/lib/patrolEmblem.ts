const PATROL_EMOJI_STORAGE_KEY = "chevaliers58_patrol_emojis";

export function getCustomPatrolEmojis(): Record<string, string> {
  try {
    const raw = localStorage.getItem(PATROL_EMOJI_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setCustomPatrolEmoji(patrolIdOrName: string, emoji: string) {
  try {
    const map = getCustomPatrolEmojis();
    map[patrolIdOrName.toLowerCase().trim()] = emoji.trim();
    localStorage.setItem(PATROL_EMOJI_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore storage errors for optional visual preferences.
  }
}

export function getPatrolEmblem(patrolName?: string | null, patrolId?: string | null): string {
  if (!patrolName) return "⚜️";

  const customMap = getCustomPatrolEmojis();
  if (patrolId && customMap[patrolId.toLowerCase().trim()]) {
    return customMap[patrolId.toLowerCase().trim()];
  }

  const nameKey = patrolName.toLowerCase().trim();
  if (customMap[nameKey]) return customMap[nameKey];

  const emojiPrefixMatch = patrolName.match(
    /^([\p{Emoji_Presentation}\p{Extended_Pictographic}])/u,
  );
  if (emojiPrefixMatch) return emojiPrefixMatch[1];

  const n = nameKey;
  if (n.includes("baladin") || n.includes("castor") || n.includes("nuton")) return "🧸";
  if (
    n.includes("louvet") ||
    n.includes("seeonee") ||
    n.includes("waingunga") ||
    n.includes("loup") ||
    n.includes("meute")
  ) {
    return "🐺";
  }
  if (n.includes("lynx")) return "🐱";
  if (n.includes("gazelle")) return "🦌";
  if (n.includes("girafe")) return "🦒";
  if (n.includes("marmotte")) return "🦫";
  if (n.includes("cougar") || n.includes("panthère")) return "🐆";
  if (n.includes("condor") || n.includes("aigle")) return "🦅";
  if (n.includes("jaguar") || n.includes("tigre")) return "🐅";
  if (n.includes("bison") || n.includes("buffle")) return "🦬";
  if (n.includes("faucon") || n.includes("épervier")) return "🦅";
  if (n.includes("pimiento") || n.includes("piment")) return "🌶️";
  if (n.includes("empire")) return "🏛️";
  if (n.includes("cerf") || n.includes("chevreuil") || n.includes("élan")) return "🦌";
  if (n.includes("renard")) return "🦊";
  if (n.includes("ours")) return "🐻";
  if (n.includes("lion")) return "🦁";
  if (n.includes("écureuil")) return "🐿️";
  if (n.includes("dauphin")) return "🐬";
  if (
    n.includes("staff") ||
    n.includes("chef") ||
    n.includes("maîtrise") ||
    n.includes("routi") ||
    n.includes("clan")
  ) {
    return "👑";
  }
  return "⚜️";
}
