'use client'

import { useState, useRef } from 'react'
import { Image as ImageIcon, X } from 'lucide-react'
import type { MediaFormData } from '../UploadWizard'

type Props = {
  formData: MediaFormData
  updateFormData: (data: Partial<MediaFormData>) => void
}

type ImageType = 'poster' | 'backdrop'

export function ImagesUploadStep({ formData, updateFormData }: Props) {
  const posterInputRef = useRef<HTMLInputElement | null>(null)
  const backdropInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileSelect = (type: ImageType, file: File | null) => {
    if (type === 'poster') {
      updateFormData({ posterFile: file })
    } else {
      updateFormData({ backdropFile: file })
    }
  }

  const ImageUpload = ({
    type,
    title,
    description,
    aspectRatio,
    file,
    inputRef,
  }: {
    type: ImageType
    title: string
    description: string
    aspectRatio: string
    file: File | null
    inputRef: React.RefObject<HTMLInputElement>
  }) => {
    const [preview, setPreview] = useState<string | null>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        handleFileSelect(type, selectedFile)
        const reader = new FileReader()
        reader.onloadend = () => setPreview(reader.result as string)
        reader.readAsDataURL(selectedFile)
      }
    }

    const handleRemove = () => {
      handleFileSelect(type, null)
      setPreview(null)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }

    return (
      <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-6">
        <div className="mb-4">
          <h3 className="font-medium text-zinc-100">{title}</h3>
          <p className="mt-1 text-sm text-zinc-400">{description}</p>
        </div>

        {!file && !preview ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="group relative w-full overflow-hidden rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-900 transition-colors hover:border-zinc-600"
            style={{ aspectRatio }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="hidden"
            />

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <ImageIcon className="h-8 w-8 text-zinc-500 transition-colors group-hover:text-zinc-400" />
              <p className="mt-2 text-sm text-zinc-500">Click to upload</p>
            </div>
          </button>
        ) : (
          <div className="relative">
            <div
              className="relative overflow-hidden rounded-lg"
              style={{ aspectRatio }}
            >
              <img
                src={preview || ''}
                alt={title}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-zinc-400 truncate">
                {file?.name}
              </p>
              <button
                type="button"
                onClick={handleRemove}
                className="rounded-lg bg-zinc-700 p-2 text-zinc-400 transition-colors hover:bg-zinc-600 hover:text-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-100">Upload Images</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Add poster and backdrop images for your media
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ImageUpload
          type="poster"
          title="Poster Image"
          description="2:3 aspect ratio (e.g., 400×600px)"
          aspectRatio="2/3"
          file={formData.posterFile}
          inputRef={posterInputRef}
        />

        <ImageUpload
          type="backdrop"
          title="Backdrop Image"
          description="16:9 aspect ratio (e.g., 1920×1080px)"
          aspectRatio="16/9"
          file={formData.backdropFile}
          inputRef={backdropInputRef}
        />
      </div>
    </div>
  )
}
