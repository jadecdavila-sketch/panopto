const PREFIX = 'pla.notes.v3'

export type NoteLevel = 'folio' | 'studyset' | 'material' | 'kt'

export function getNoteKey(level: NoteLevel, id: string): string {
  return `${PREFIX}.${level}.${id}`
}

export function getNote(level: NoteLevel, id: string): string {
  return localStorage.getItem(getNoteKey(level, id)) ?? ''
}

export function saveNote(level: NoteLevel, id: string, text: string): void {
  if (text.trim() === '') {
    localStorage.removeItem(getNoteKey(level, id))
  } else {
    localStorage.setItem(getNoteKey(level, id), text)
  }
}

export function hasNote(level: NoteLevel, id: string): boolean {
  const val = localStorage.getItem(getNoteKey(level, id))
  return val !== null && val.trim() !== ''
}
