import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // If user is not authenticated, redirect to login
  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  if (adminEmails.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
          <h1 className="text-xl font-semibold text-zinc-100">
            Admin Access Not Configured
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            No admin emails are configured. Please set ADMIN_EMAILS in your
            environment variables.
          </p>
        </div>
      </div>
    )
  }

  const userEmailLower = user.email?.toLowerCase()
  const isAdmin = userEmailLower && adminEmails.includes(userEmailLower)

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center">
          <h1 className="text-xl font-semibold text-zinc-100">
            Access Denied
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            You don't have permission to access the admin panel.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">{children}</div>
      </main>
    </div>
  )
}
