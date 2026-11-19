'use client'

import { useState, useRef } from 'react'
import { Upload, Film, X } from 'lucide-react'
import type { MediaFormData } from '../UploadWizard'

type Props = {
  formData: MediaFormData
  updateFormData: (data: Partial<MediaFormData>) => void
}

export function VideoUploadStep({ formData, updateFormData }: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const videoFile = files.find((f) => f.type.startsWith('video/'))
    if (videoFile) {
      updateFormData({ videoFile })
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      updateFormData({ videoFile: file })
    }
  }

  const handleRemove = () => {
    updateFormData({ videoFile: null })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-100">Upload Video</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Upload the main video file for this media
        </p>
      </div>

      {!formData.videoFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
            isDragging
              ? 'border-rose-500 bg-rose-500/5'
              : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-700/50">
            <Upload className="h-8 w-8 text-zinc-400" />
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="font-medium text-rose-400 hover:text-rose-300"
            >
              Click to upload
            </button>
            <span className="text-zinc-400"> or drag and drop</span>
          </div>

          <p className="mt-2 text-sm text-zinc-500">
            MP4, MKV, WebM up to 10GB
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-500/10">
              <Film className="h-6 w-6 text-rose-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-100 truncate">
                    {formData.videoFile.name}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {formatBytes(formData.videoFile.size)} •{' '}
                    {formData.videoFile.type}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRemove}
                  className="rounded-lg bg-zinc-700 p-2 text-zinc-400 transition-colors hover:bg-zinc-600 hover:text-zinc-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Progress bar placeholder */}
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-700">
                <div className="h-full w-full bg-rose-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <p className="text-sm text-zinc-400">
          <span className="font-medium text-zinc-300">Note:</span> The video will
          be stored using your configured storage provider. Large files may take
          several minutes to upload.
        </p>
      </div>
    </div>
  )
}
