export interface DiscoverBook {
  id: string
  title: string
  author: string
  year: number | null
  source: 'openlibrary'
  coverUrl: string | null
  openLibraryUrl: string
  readUrl: string | null
  description: string | null
}

const STORAGE_KEY = 'bookamaze_saved_books'

export function getSavedBooks(): DiscoverBook[] {
  if (typeof globalThis.window === 'undefined') return []

  try {
    const raw = globalThis.window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as DiscoverBook[]
  } catch {
    return []
  }
}

export function saveBook(book: DiscoverBook): void {
  if (typeof globalThis.window === 'undefined') return

  const current = getSavedBooks()
  if (current.some((item) => item.id === book.id)) return
  globalThis.window.localStorage.setItem(STORAGE_KEY, JSON.stringify([book, ...current]))
}

export function removeSavedBook(bookId: string): void {
  if (typeof globalThis.window === 'undefined') return
  const next = getSavedBooks().filter((book) => book.id !== bookId)
  globalThis.window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}
