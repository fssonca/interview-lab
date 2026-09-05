import { useCallback, useEffect, useRef, useState } from 'react'
import { expireSession } from '../domain/quiz'
import { loadSession, saveSession } from '../domain/storage'
import type { QuizSession } from '../domain/types'

function restore() {
  try {
    return loadSession(window.localStorage)
  } catch {
    return {
      session: null,
      warning: 'Browser storage is unavailable. Your progress cannot be saved across refreshes.',
    }
  }
}

export function useQuizSession() {
  const [initial] = useState(restore)
  const [session, setSession] = useState(initial.session)
  const [warning, setWarning] = useState(initial.warning)
  const current = useRef(session)
  const [now, setNow] = useState(() => Date.now())

  const updateSession = useCallback(
    (update: QuizSession | null | ((previous: QuizSession | null) => QuizSession | null)) => {
      const next = typeof update === 'function' ? update(current.current) : update
      if (next === current.current) return
      current.current = next
      try {
        setWarning(saveSession(window.localStorage, next))
      } catch {
        setWarning(
          'Browser storage is unavailable. Your progress cannot be saved across refreshes.',
        )
      }
      setSession(next)
      setNow(Date.now())
    },
    [],
  )

  const deadline = session?.deadline
  const finishedAt = session?.finishedAt

  useEffect(() => {
    if (deadline == null || finishedAt !== null) return
    const tick = () => {
      const time = Date.now()
      setNow(time)
      updateSession((previous) => (previous ? expireSession(previous, time) : null))
    }
    const timer = window.setInterval(tick, 250)
    window.addEventListener('focus', tick)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', tick)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [updateSession, deadline, finishedAt])

  return { session, updateSession, warning, now }
}
