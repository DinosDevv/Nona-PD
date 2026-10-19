// Display-only name helpers until profiles have real names

// "george@nona.gr" -> "GE", "Tony Prezakis" -> "TP"
export function initials(name: string) {
  const base = name.split('@')[0]
  const parts = base.split(/[\s._-]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return base.slice(0, 2).toUpperCase()
}

// "george@nona.gr" -> "george"
export function shortName(name: string) {
  return name.split('@')[0]
}

// "Konstantinos Bourdakos" -> "Konstantinos"; emails -> local part
export function firstName(name: string) {
  return shortName(name).split(/\s+/)[0]
}

const PALETTE = ['#3b6cf6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#22c55e', '#0ea5e9', '#f97316']

// Stable color per id/name, so the same person or project always gets the same color
export function colorFor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0
  return PALETTE[Math.abs(hash) % PALETTE.length]
}
