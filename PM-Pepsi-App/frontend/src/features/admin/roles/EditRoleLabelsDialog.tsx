import type { AdminRole } from '@/api/schemas'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateAdminRole } from '@/lib/admin-roles-api'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

export function EditRoleLabelsDialog({
  role,
  open,
  onOpenChange,
  onSaved,
}: {
  role: AdminRole | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved: () => void
}) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const [roleNameTh, setRoleNameTh] = useState('')
  const [roleNameEn, setRoleNameEn] = useState('')

  useEffect(() => {
    if (!role || !open) return
    setRoleNameTh(role.roleName)
    setRoleNameEn(role.roleNameEn)
  }, [role, open])

  const saveMut = useMutation({
    mutationFn: () =>
      updateAdminRole(role!.roleCode, {
        roleName: roleNameTh.trim(),
        roleNameEn: roleNameEn.trim(),
      }),
    onSuccess: () => {
      toast.success(t('roles.labelsSaved'))
      onOpenChange(false)
      onSaved()
    },
    onError: (e: Error) => {
      toast.error(e.message || t('roles.labelsSaveFailed'))
    },
  })

  if (!role) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('roles.editLabelsTitle', { code: role.roleCode })}</DialogTitle>
          <DialogDescription>{t('roles.editLabelsDesc')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="editRoleNameTh">{t('roles.roleNameTh')}</Label>
            <Input
              id="editRoleNameTh"
              value={roleNameTh}
              onChange={(e) => setRoleNameTh(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="editRoleNameEn">{t('roles.roleNameEn')}</Label>
            <Input
              id="editRoleNameEn"
              value={roleNameEn}
              onChange={(e) => setRoleNameEn(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tc('actions.cancel')}
          </Button>
          <Button
            type="button"
            disabled={!roleNameTh.trim() || !roleNameEn.trim() || saveMut.isPending}
            onClick={() => saveMut.mutate()}
          >
            {saveMut.isPending ? <Loader2 className="size-4 animate-spin" /> : tc('actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
