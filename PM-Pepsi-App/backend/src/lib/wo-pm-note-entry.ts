export type WoPmNoteEntry = {
  identry: number
  note: string
  wkctr: string
  createdBy: string
  createdAt: string
}

export function deriveLatestPmNote(notes: WoPmNoteEntry[]): {
  note: string
  noteUpdatedAt: string | null
  noteWkctr: string
} {
  if (notes.length === 0) {
    return { note: '', noteUpdatedAt: null, noteWkctr: '' }
  }
  const latest = notes[notes.length - 1]!
  return {
    note: latest.note,
    noteUpdatedAt: latest.createdAt,
    noteWkctr: latest.wkctr,
  }
}
