import { Button } from '@/components/ui/button'
import { useTheme } from '@/providers/ThemeProvider'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type ThemeToggleProps = {
  variant?: 'icon' | 'compact'
  className?: string
}

export function ThemeToggle({ variant = 'icon', className }: ThemeToggleProps) {
  const { t } = useTranslation('common')
  const { resolvedTheme, serverThemeMode, preference, toggleTheme, resetToServerDefault } =
    useTheme()

  const followingServer = preference === null
  const serverLabel = t(`theme.${serverThemeMode}`, { defaultValue: serverThemeMode })
  const modeShort =
    resolvedTheme === 'dark' ? t('theme.darkShort') : t('theme.lightShort')

  if (variant === 'compact') {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={className}
        onClick={toggleTheme}
        title={
          followingServer
            ? t('theme.toggleTitleServer', { mode: serverLabel })
            : t('theme.toggleTitleCustom')
        }
        onContextMenu={(e) => {
          e.preventDefault()
          resetToServerDefault()
        }}
      >
        {resolvedTheme === 'dark' ? (
          <Sun className="mr-2 size-4" aria-hidden />
        ) : (
          <Moon className="mr-2 size-4" aria-hidden />
        )}
        {modeShort}
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      onClick={toggleTheme}
      aria-label={
        resolvedTheme === 'dark' ? t('theme.ariaLight') : t('theme.ariaDark')
      }
      title={
        followingServer
          ? t('theme.iconTitleServer', { mode: modeShort, serverMode: serverLabel })
          : t('theme.iconTitleCustom', { mode: modeShort })
      }
      onContextMenu={(e) => {
        e.preventDefault()
        resetToServerDefault()
      }}
    >
      {followingServer && serverThemeMode === 'system' ? (
        <Monitor className="size-5" aria-hidden />
      ) : resolvedTheme === 'dark' ? (
        <Sun className="size-5" aria-hidden />
      ) : (
        <Moon className="size-5" aria-hidden />
      )}
    </Button>
  )
}
