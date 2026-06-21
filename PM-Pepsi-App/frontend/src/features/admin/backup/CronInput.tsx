import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type CronInputProps = {
  id?: string
  value: string
  disabled?: boolean
  onChange: (value: string) => void
  hint?: string
}

export function CronInput({
  id = 'backup-cron',
  value,
  disabled,
  onChange,
  hint,
}: CronInputProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>Cron</Label>
      <Input
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0 2 * * *"
      />
      {hint ? <p className="text-xs text-app-muted">{hint}</p> : null}
    </div>
  )
}
