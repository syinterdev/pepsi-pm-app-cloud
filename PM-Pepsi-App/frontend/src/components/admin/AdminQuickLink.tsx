import type { LocalizedAdminSection } from '@/lib/admin-sections'

import { usePermission } from '@/lib/use-permission'

import { cn } from '@/lib/utils'

import { motion } from 'framer-motion'

import { Link } from 'react-router-dom'



export function AdminQuickLink({ section }: { section: LocalizedAdminSection }) {

  const allowed = usePermission(section.permission)

  if (!allowed) return null



  const Icon = section.icon



  return (

    <motion.div

      whileHover={{ scale: 1.01, y: -2 }}

      whileTap={{ scale: 0.99 }}

      transition={{ type: 'spring', stiffness: 400, damping: 30 }}

    >

      <Link

        to={section.to}

        data-tour={section.tourTarget}

        className={cn(

          'admin-quick-link flex items-start gap-3 p-4',

          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-pepsi-blue)] focus-visible:ring-offset-2',

        )}

      >

        <span

          className="admin-quick-link-icon mt-1 flex size-10 shrink-0 items-center justify-center rounded-card"

          aria-hidden

        >

          <Icon className="size-5" />

        </span>

        <span className="min-w-0">

          <span className="block text-body font-semibold text-[var(--admin-text)]">
            {section.label}
          </span>

          <span className="mt-1 block text-body-sm leading-relaxed text-[var(--admin-text-muted)]">

            {section.description}

          </span>

        </span>

      </Link>

    </motion.div>

  )

}


