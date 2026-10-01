import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/useAuth'
import { PresenceContext, type PresenceStatus } from '../lib/usePresence'

type PresencePayload = { status: Exclude<PresenceStatus, 'offline'> }

// Shares "online" while the app tab is visible and "away" while it's hidden
export default function PresenceProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const userId = session?.user.id
  const [map, setMap] = useState<Record<string, PresenceStatus>>({})

  useEffect(() => {
    if (!userId) return
    const channel = supabase.channel('presence:team', { config: { presence: { key: userId } } })

    const currentStatus = (): PresencePayload => ({
      status: document.visibilityState === 'visible' ? 'online' : 'away',
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresencePayload>()
        const next: Record<string, PresenceStatus> = {}
        for (const [id, metas] of Object.entries(state)) {
          // Online on any device wins over away
          next[id] = metas.some((m) => m.status === 'online') ? 'online' : 'away'
        }
        setMap(next)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') channel.track(currentStatus())
      })

    const onVisibility = () => channel.track(currentStatus())
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      supabase.removeChannel(channel)
    }
  }, [userId])

  return <PresenceContext.Provider value={map}>{children}</PresenceContext.Provider>
}
