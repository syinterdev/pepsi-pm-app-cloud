import { commandPaletteShortcut } from '@/components/command-palette/command-palette-keys'
import { cn } from '@/lib/utils'

export function CommandPaletteShortcutBadge({ className }: { className?: string }) {
  const { modifier, key } = commandPaletteShortcut()
  return (
    <span
      className={cn(
        'command-palette-kbd inline-flex items-center gap-0.5 font-mono text-caption',
        className,
      )}
      aria-hidden
    >
      <kbd className="command-palette-kbd__key">{modifier}</kbd>
      <kbd className="command-palette-kbd__key">{key}</kbd>
    </span>
  )
}
