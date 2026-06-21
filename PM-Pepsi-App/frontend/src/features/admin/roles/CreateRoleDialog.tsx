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
import { createAdminRole } from '@/lib/admin-roles-api'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

export function CreateRoleDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: () => void
}) {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const [roleCode, setRoleCode] = useState('')
  const [roleNameTh, setRoleNameTh] = useState('')
  const [roleNameEn, setRoleNameEn] = useState('')
  const [roleColor, setRoleColor] = useState('#4DA6FF')
  const [description, setDescription] = useState('')

  const createMut = useMutation({
    mutationFn: () =>
      createAdminRole({
        roleCode: roleCode.trim().toUpperCase(),
        roleName: roleNameTh.trim(),
        roleNameEn: roleNameEn.trim(),
        roleColor,
        description: description.trim() || null,
      }),
    onSuccess: () => {
      toast.success(t('roles.created'))
      setRoleCode('')
      setRoleNameTh('')
      setRoleNameEn('')
      setDescription('')
      onOpenChange(false)
      onCreated()
    },
    onError: (e: Error) => {
      toast.error(e.message || t('roles.createFailed'))
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('roles.createDialogTitleNew')}</DialogTitle>
          <DialogDescription>{t('roles.createDialogDesc')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="roleCode">{t('roles.roleCodeField')}</Label>
            <Input
              id="roleCode"
              value={roleCode}
              onChange={(e) => setRoleCode(e.target.value.toUpperCase())}
              placeholder="OPS"
              maxLength={16}
            />
          </div>
          <div>
            <Label htmlFor="roleNameTh">{t('roles.roleNameTh')}</Label>
            <Input
              id="roleNameTh"
              value={roleNameTh}
              onChange={(e) => setRoleNameTh(e.target.value)}
              placeholder={t('roles.roleNameThPlaceholder')}
            />
          </div>
          <div>
            <Label htmlFor="roleNameEn">{t('roles.roleNameEn')}</Label>
            <Input
              id="roleNameEn"
              value={roleNameEn}
              onChange={(e) => setRoleNameEn(e.target.value)}
              placeholder={t('roles.roleNameEnPlaceholder')}
            />
          </div>
          <div>
            <Label htmlFor="roleColor">{t('roles.roleColor')}</Label>
            <div className="flex gap-2">
              <Input
                id="roleColor"
                type="color"
                value={roleColor}
                onChange={(e) => setRoleColor(e.target.value)}
                className="h-10 w-14 p-1"
              />
              <Input value={roleColor} onChange={(e) => setRoleColor(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="roleDesc">{t('roles.roleFieldDescription')}</Label>
            <Input
              id="roleDesc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {tc('actions.cancel')}
          </Button>
          <Button
            type="button"
            disabled={
              !roleCode.trim() ||
              !roleNameTh.trim() ||
              !roleNameEn.trim() ||
              createMut.isPending
            }
            onClick={() => createMut.mutate()}
          >
            {createMut.isPending ? <Loader2 className="size-4 animate-spin" /> : t('roles.createBtn')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
