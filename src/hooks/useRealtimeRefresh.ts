import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export type RealtimeSource = { table: string; filter?: string }

// Calls onChange (debounced) whenever any of the given tables change.
// The permission rules still apply, so you only hear about rows you can see.
export function useRealtimeRefresh(channel: string, sources: RealtimeSource[], onChange: () => void, enabled = true) {
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  })

  // Stable key so a new array literal each render doesn't resubscribe
  const key = JSON.stringify(sources)

  useEffect(() => {
    if (!enabled) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const fire = () => {
      clearTimeout(timer)
      timer = setTimeout(() => onChangeRef.current(), 250)
    }

    const ch = supabase.channel(`${channel}:${Math.random().toString(36).slice(2)}`)
    for (const s of JSON.parse(key) as RealtimeSource[]) {
      ch.on('postgres_changes', { event: '*', schema: 'public', table: s.table, filter: s.filter }, fire)
    }
    ch.subscribe()

    return () => {
      clearTimeout(timer)
      supabase.removeChannel(ch)
    }
  }, [channel, key, enabled])
}
