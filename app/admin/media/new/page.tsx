'use client'

import { useState } from 'react'
import { UploadWizard } from '@/components/admin/upload/UploadWizard'

export default function NewMediaPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
          Add New Media
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Upload a movie, series, or clip to your platform
        </p>
      </div>

      {/* Upload Wizard */}
      <UploadWizard />
    </div>
  )
}
