import { describe, expect, it } from 'vitest'
import { TableSkeletonRows } from '@/components/ui/table-skeleton'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { Table, TableBody } from '@/components/ui/table'

describe('TableSkeletonRows', () => {
  it('renders rows × columns skeleton cells', () => {
    const html = renderToStaticMarkup(
      createElement(
        Table,
        null,
        createElement(
          TableBody,
          null,
          createElement(TableSkeletonRows, { rows: 3, columns: 4 }),
        ),
      ),
    )
    expect(html.match(/animate-pulse/g)?.length).toBe(12)
  })
})
