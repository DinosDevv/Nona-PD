import { useCallback, useEffect, useMemo, useState } from 'react'
import { listMySessions, type Session } from '../api/time'
import { updateDailyGoal } from '../api/profiles'
import { buildHistory, dayKey } from '../lib/historyView'
import { msByDay, sessionsOn, streakDays } from '../lib/sessionView'
import { useAuth } from '../lib/useAuth'
import { useToast } from '../lib/useToast'
import { useMyProfile } from './useMyProfile'
import { useNow } from './useNow'
import { useRealtimeRefresh } from './useRealtimeRefresh'

const LOOKBACK_DAYS = 60 // enough history for a streak

// Everything the Today dashboard shows: today's time & sessions, goal, streak, this week
export function useToday() {
  const { session } = useAuth()
  const toast = useToast()
  const userId = session!.user.id
  const { profile } = useMyProfile()
  const [sessions, setSessions] = useState<Session[] | null>(null)
  const [version, setVersion] = useState(0)
  const reload = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    let ignore = false
    const today = new Date()
    const since = new Date(today.getFullYear(), today.getMonth(), today.getDate() - LOOKBACK_DAYS)
    listMySessions(userId, since)
      .then((data) => !ignore && setSessions(data))
      .catch((e: Error) => !ignore && toast.error(e.message))
    return () => {
      ignore = true
    }
  }, [userId, version, toast])

  useRealtimeRefresh('today', [{ table: 'time_entries', filter: `user_id=eq.${userId}` }], reload)

  // Totals keep growing while a session runs
  const now = useNow(sessions?.some((s) => !s.ended_at) ?? false, 30_000)

  const derived = useMemo(() => {
    if (!sessions) return null
    const todayKey = dayKey(new Date(now))
    return {
      todayMs: msByDay(sessions, now).get(todayKey) ?? 0,
      todaySessions: sessionsOn(sessions, todayKey, now),
      week: buildHistory(sessions, 7, now),
      streak: streakDays(sessions, now),
    }
  }, [sessions, now])

  async function setGoal(minutes: number) {
    try {
      await updateDailyGoal(userId, minutes)
      toast.success('Daily goal updated')
      return true
    } catch (e) {
      toast.error((e as Error).message)
      return false
    }
  }

  return {
    today: derived,
    now,
    goalMs: (profile?.daily_goal_minutes ?? 120) * 60_000,
    setGoal,
  }
}
