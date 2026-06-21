import {
  readAdminDensity,
  subscribeAdminDensity,
  writeAdminDensity,
  type AdminLayoutDensity,
} from '@/lib/admin-layout-preference'
import { cn } from '@/lib/utils'
import { LayoutGrid, Rows3 } from 'lucide-react'
import { useSyncExternalStore } from 'react'

const MODES: { id: AdminLayoutDensity; label: string; title: string; icon: typeof LayoutGrid }[] = [
  { id: 'cozy', label: 'สบาย', title: 'Cozy — padding มาตรฐาน', icon: LayoutGrid },
  { id: 'compact', label: 'กระชับ', title: 'Compact — padding และ KPI เล็กลง', icon: Rows3 },
]

export function AdminDensityToggle({ className }: { className?: string }) {
  const density = useSyncExternalStore(subscribeAdminDensity, readAdminDensity, () => 'cozy' as AdminLayoutDensity)

  return (
    <div
      className={cn('admin-density-toggle', className)}
      role="group"
      aria-label="ความหนาแน่นของเลย์เอาต์ Admin"
    >
      {MODES.map(({ id, label, title, icon: Icon }) => {
        const active = density === id
        return (
          <button
            key={id}
            type="button"
            title={title}
            className={cn('admin-density-toggle__btn', active && 'admin-density-toggle__btn--active')}
            aria-pressed={active}
            onClick={() => writeAdminDensity(id)}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden />
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
