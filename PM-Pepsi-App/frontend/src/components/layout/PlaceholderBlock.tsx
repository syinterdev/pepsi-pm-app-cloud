import type { ReactNode } from 'react'

export function PlaceholderBlock({
  title,
  children,
}: {
  title: string
  children?: ReactNode
}) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="rounded-card border border-dashed border-app bg-app-subtle p-6 text-caption">
        <p className="font-medium text-app">{title}</p>
        <div className="mt-2">{children}</div>
      </div>
    </div>
  )
}
