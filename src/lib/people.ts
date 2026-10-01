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
