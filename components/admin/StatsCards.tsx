'use client'

import { Film, Tv, Upload, HardDrive } from 'lucide-react'

type Stats = {
  totalMedia: number
  totalEpisodes: number
  totalUploads: number
  totalStorage: number
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export function StatsCards({ stats }: { stats: Stats }) {
  const cards = [
    {
      name: 'Total Media',
      value: stats.totalMedia,
      icon: Film,
      color: 'rose',
      bgColor: 'bg-rose-500/10',
      textColor: 'text-rose-400',
    },
    {
      name: 'Episodes',
      value: stats.totalEpisodes,
      icon: Tv,
      color: 'blue',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-400',
    },
    {
      name: 'Uploads',
      value: stats.totalUploads,
      icon: Upload,
      color: 'green',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-400',
    },
    {
      name: 'Storage Used',
      value: formatBytes(stats.totalStorage),
      icon: HardDrive,
      color: 'purple',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-400',
    },
  ]

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.name}
            className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-all duration-300 hover:border-zinc-700 hover:shadow-lg hover:shadow-zinc-900/50"
          >
            {/* Background Gradient */}
            <div
              className={`absolute right-0 top-0 h-24 w-24 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-20 ${card.bgColor}`}
            />

            {/* Content */}
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className={`rounded-lg ${card.bgColor} p-2.5`}>
                  <Icon className={`h-5 w-5 ${card.textColor}`} />
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium text-zinc-400">{card.name}</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-100">
                  {card.value}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
