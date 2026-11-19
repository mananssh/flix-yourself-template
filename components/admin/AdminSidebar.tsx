'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Film,
  FolderOpen,
  Upload,
  Home,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Media', href: '/admin/media', icon: Film },
  { name: 'Collections', href: '/admin/collections', icon: FolderOpen },
  { name: 'Uploads', href: '/admin/uploads', icon: Upload },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-64 flex-col border-r border-zinc-800 bg-zinc-900">
      {/* Header */}
      <div className="flex h-16 items-center border-b border-zinc-800 px-6">
        <Link href="/" className="flex items-center gap-2 text-zinc-100">
          <Home className="h-5 w-5" />
          <span className="font-semibold">Flix Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                transition-all duration-200
                ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                }
              `}
            >
              <Icon
                className={`h-5 w-5 ${
                  isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'
                }`}
              />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-800 p-4">
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <p className="text-xs font-medium text-zinc-300">Admin Panel</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Manage your streaming platform
          </p>
        </div>
      </div>
    </aside>
  )
}
