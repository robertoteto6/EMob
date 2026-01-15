type IconShape = "circle" | "rounded";

interface MonogramOptions {
  name: string;
  label?: string | null;
  size?: number;
  shape?: IconShape;
  maxLen?: number;
}

const GRADIENTS = [
  { from: "#00FF80", to: "#0080FF" },
  { from: "#FFB800", to: "#FF5C00" },
  { from: "#22C55E", to: "#14B8A6" },
  { from: "#38BDF8", to: "#2563EB" },
  { from: "#A855F7", to: "#6366F1" },
  { from: "#E11D48", to: "#F97316" },
  { from: "#F472B6", to: "#EC4899" },
  { from: "#0EA5E9", to: "#10B981" },
];

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function deriveLabel(name: string, maxLen: number) {
  const trimmed = name.trim();
  if (!trimmed) return "NA";

  const parts = trimmed.split(/[\s_-]+/).filter(Boolean);
  if (parts.length >= 2) {
    const initials = parts.map((part) => part[0]).join("");
    return initials.slice(0, maxLen).toUpperCase();
  }

  const cleaned = trimmed.replace(/[^a-zA-Z0-9]/g, "");
  if (cleaned) {
    return cleaned.slice(0, maxLen).toUpperCase();
  }

  return trimmed.slice(0, maxLen).toUpperCase();
}

export function buildMonogramSvg({
  name,
  label,
  size = 128,
  shape = "circle",
  maxLen = 4,
}: MonogramOptions) {
  const baseLabel = label?.trim() ? label.trim() : deriveLabel(name, maxLen);
  const safeLabel = escapeXml(baseLabel.slice(0, maxLen));
  const safeName = escapeXml(name);
  const palette = GRADIENTS[hashString(name) % GRADIENTS.length];
  const radius = shape === "circle" ? size / 2 : Math.round(size * 0.2);
  const fontSize =
    safeLabel.length <= 2
      ? Math.round(size * 0.42)
      : safeLabel.length === 3
        ? Math.round(size * 0.36)
        : Math.round(size * 0.3);
  const textY = Math.round(size * 0.58);

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${safeName}">
      <title>${safeName}</title>
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette.from}" />
          <stop offset="100%" stop-color="${palette.to}" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${radius}" fill="url(#grad)" />
      <text x="50%" y="${textY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="#FFFFFF">
        ${safeLabel}
      </text>
    </svg>
  `;
}
