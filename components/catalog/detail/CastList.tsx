import type { PersonDTO } from '@/lib/catalog'

/** Display order and labels for credited roles. */
const ROLE_SECTIONS: Array<{ role: PersonDTO['role']; label: string }> = [
  { role: 'DIRECTOR', label: 'Director' },
  { role: 'CREATOR', label: 'Creator' },
  { role: 'ACTOR', label: 'Cast' },
]

/**
 * Credits grouped by role (Director / Creator / Cast). Renders nothing when
 * there are no people, so the detail page can include it unconditionally.
 */
export function CastList({ people }: { people: PersonDTO[] }) {
  if (people.length === 0) return null

  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {ROLE_SECTIONS.map(({ role, label }) => {
        const names = people
          .filter((person) => person.role === role)
          .map((person) => person.name)
        if (names.length === 0) return null

        return (
          <div key={role}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-white/40">
              {label}
            </dt>
            <dd className="mt-1 text-sm text-white/80">{names.join(', ')}</dd>
          </div>
        )
      })}
    </dl>
  )
}
