'use client'

import { useEffect } from 'react'

interface ClearHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isClearing: boolean
}

export function ClearHistoryModal({
  isOpen,
  onClose,
  onConfirm,
  isClearing,
}: ClearHistoryModalProps) {
  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-zinc-900 p-6 shadow-xl ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h2
          id="modal-title"
          className="text-xl font-semibold text-white"
        >
          Clear Watch History?
        </h2>

        {/* Message */}
        <p className="mt-3 text-sm text-zinc-300">
          This will permanently remove all items from your watch history. This
          action cannot be undone.
        </p>

        {/* Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isClearing}
            className="flex-1 rounded-md bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isClearing}
            className="flex-1 rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isClearing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Clearing...
              </span>
            ) : (
              'Clear History'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
