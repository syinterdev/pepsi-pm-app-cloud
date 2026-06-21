import { useCallback, useEffect, useRef, useState } from 'react'

/** Single pulse duration — PRE-UAT U4c (not infinite loop) */
export const PLANNING_ACK_PULSE_MS = 1200

type AckRow = { id: string; ackStatus?: string }

export function usePlanningAckPulseOnce(rows: AckRow[], ready = true, resetKey?: string) {
  const [pulsingIds, setPulsingIds] = useState<Set<string>>(() => new Set())
  const prevAckRef = useRef<Map<string, string | undefined>>(new Map())
  const initialSnapshotRef = useRef(true)
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    initialSnapshotRef.current = true
    prevAckRef.current = new Map()
  }, [resetKey])

  const clearPulseTimer = useCallback((id: string) => {
    const t = timersRef.current.get(id)
    if (t) {
      clearTimeout(t)
      timersRef.current.delete(id)
    }
  }, [])

  const startPulse = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return
      setPulsingIds((prev) => {
        const next = new Set(prev)
        for (const id of ids) next.add(id)
        return next
      })
      for (const id of ids) {
        clearPulseTimer(id)
        timersRef.current.set(
          id,
          setTimeout(() => {
            setPulsingIds((prev) => {
              if (!prev.has(id)) return prev
              const next = new Set(prev)
              next.delete(id)
              return next
            })
            timersRef.current.delete(id)
          }, PLANNING_ACK_PULSE_MS),
        )
      }
    },
    [clearPulseTimer],
  )

  const pulseRow = useCallback(
    (id: string | number) => {
      startPulse([String(id)])
    },
    [startPulse],
  )

  useEffect(() => {
    if (!ready) return

    const nextAck = new Map<string, string | undefined>()
    for (const row of rows) {
      nextAck.set(String(row.id), row.ackStatus)
    }

    if (initialSnapshotRef.current) {
      prevAckRef.current = nextAck
      initialSnapshotRef.current = false
      return
    }

    const newlyPending: string[] = []
    for (const [id, ack] of nextAck) {
      const prev = prevAckRef.current.get(id)
      if (ack === 'pending' && prev !== 'pending') {
        newlyPending.push(id)
      }
    }

    prevAckRef.current = nextAck
    startPulse(newlyPending)
  }, [rows, ready, startPulse])

  useEffect(
    () => () => {
      for (const t of timersRef.current.values()) clearTimeout(t)
      timersRef.current.clear()
    },
    [],
  )

  const isPulsing = useCallback(
    (id: string | number) => pulsingIds.has(String(id)),
    [pulsingIds],
  )

  return { isPulsing, pulseRow }
}
