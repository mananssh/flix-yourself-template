'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { BasicInfoStep } from './steps/BasicInfoStep'
import { VideoUploadStep } from './steps/VideoUploadStep'
import { ImagesUploadStep } from './steps/ImagesUploadStep'
import { MetadataStep } from './steps/MetadataStep'
import { ReviewStep } from './steps/ReviewStep'

export type MediaFormData = {
  // Basic Info
  title: string
  type: 'MOVIE' | 'SERIES' | 'CLIP'
  releaseYear: number | null
  maturityRating: string | null
  durationSec: number | null

  // Files
  videoFile: File | null
  posterFile: File | null
  backdropFile: File | null

  // Metadata
  description: string
  genres: string[]
  cast: Array<{ name: string; role: 'ACTOR' | 'DIRECTOR' | 'CREATOR' }>
}

const steps = [
  { id: 1, name: 'Basic Info', component: BasicInfoStep },
  { id: 2, name: 'Video Upload', component: VideoUploadStep },
  { id: 3, name: 'Images', component: ImagesUploadStep },
  { id: 4, name: 'Metadata', component: MetadataStep },
  { id: 5, name: 'Review', component: ReviewStep },
]

export function UploadWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<MediaFormData>({
    title: '',
    type: 'MOVIE',
    releaseYear: null,
    maturityRating: null,
    durationSec: null,
    videoFile: null,
    posterFile: null,
    backdropFile: null,
    description: '',
    genres: [],
    cast: [],
  })

  const updateFormData = (data: Partial<MediaFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Create FormData for file upload
      const uploadData = new FormData()
      uploadData.append('title', formData.title)
      uploadData.append('type', formData.type)
      if (formData.releaseYear)
        uploadData.append('releaseYear', formData.releaseYear.toString())
      if (formData.maturityRating)
        uploadData.append('maturityRating', formData.maturityRating)
      if (formData.durationSec)
        uploadData.append('durationSec', formData.durationSec.toString())
      uploadData.append('description', formData.description)
      uploadData.append('genres', JSON.stringify(formData.genres))
      uploadData.append('cast', JSON.stringify(formData.cast))

      if (formData.videoFile) uploadData.append('video', formData.videoFile)
      if (formData.posterFile) uploadData.append('poster', formData.posterFile)
      if (formData.backdropFile)
        uploadData.append('backdrop', formData.backdropFile)

      const response = await fetch('/api/admin/media', {
        method: 'POST',
        body: uploadData,
      })

      if (!response.ok) {
        throw new Error('Failed to create media')
      }

      const result = await response.json()
      router.push(`/admin/media/${result.id}`)
    } catch (error) {
      console.error('Error creating media:', error)
      alert('Failed to create media. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const CurrentStepComponent = steps[currentStep - 1].component

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900">
      {/* Step Indicator */}
      <div className="border-b border-zinc-800 p-6">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-between">
            {steps.map((step, index) => (
              <li
                key={step.id}
                className={`flex items-center ${
                  index !== steps.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all duration-200 ${
                      step.id < currentStep
                        ? 'bg-rose-600 text-white'
                        : step.id === currentStep
                          ? 'bg-rose-600 text-white ring-4 ring-rose-600/20'
                          : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {step.id < currentStep ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      step.id === currentStep
                        ? 'text-zinc-100'
                        : 'text-zinc-500'
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
                {index !== steps.length - 1 && (
                  <div
                    className={`mx-4 h-0.5 flex-1 ${
                      step.id < currentStep ? 'bg-rose-600' : 'bg-zinc-800'
                    }`}
                  />
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Step Content */}
      <div className="p-6">
        <CurrentStepComponent
          formData={formData}
          updateFormData={updateFormData}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-zinc-800 p-6">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Back
        </button>
        <div className="flex gap-3">
          {currentStep < steps.length ? (
            <button
              onClick={handleNext}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-rose-600/20 transition-all duration-200 hover:bg-rose-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-rose-600/20 transition-all duration-200 hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Publishing...' : 'Publish'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
