/**
 * Admin CRUD ของ `tbworkcenter`
 * - ตารางผู้ใช้ทั้งหมด (search) + ปุ่ม Import Excel + ปุ่มเพิ่มข้อมูล
 * - Modal create/edit แบบ 2 แท็บ (ข้อมูลส่วนตัว / ข้อมูลงาน) — แท็บ 3 (รหัสผ่าน) รวมในฟอร์มเดียว
 * - Upload `imgmember`: รับภาพอะไรก็ได้ → backend แปลงเป็น **WebP** (resize 600px) เก็บลง `imgmember_data` BYTEA
 *   ใช้ `<img src=/api/v1/personnel/:idwkctr/image>` (ส่ง cookie auth อัตโนมัติ)
 * - Excel import: skip 2 rows แรก (`$n > 2`) + แสดงผลทีละแถว
 */
import { hintsFromT } from '@/lib/i18n-hints'
import { arrayLength } from '@/lib/coerce-array'
import {
  AdminPageSection,
  AdminPageSectionCard,
  AdminPageShell,
} from '@/components/admin/AdminPageShell'
import { PersonnelAdminPhotoGoLiveBanner } from '@/features/admin/users/PersonnelAdminPhotoGoLiveBanner'
import { ConfirmPhraseDialog } from '@/components/admin/ConfirmPhraseDialog'
import { TelegramInviteDialog } from '@/components/telegram/TelegramInviteDialog'
import { PersonnelAvatar } from '@/components/personnel/PersonnelAvatar'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
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
import { QueryLoadErrorState } from '@/components/ui/query-load-error'
import { TableSkeletonRows } from '@/components/ui/table-skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  applyImpersonationSession,
  getStoredAuthUser,
  refreshAuthSession,
} from '@/features/auth/login-api'
import {
  bulkAdminUserrole,
  fetchAdminMembersList,
  fetchAdminUsersList,
  impersonateAdminUser,
  lockAdminUser,
  resetAdminUserPassword,
  unlockAdminUser,
} from '@/lib/admin-users-api'
import { useAnyPermission, usePermission } from '@/lib/use-permission'
import type {
  AdminMemberItem,
  PersonnelAdminItem,
  PersonnelImportResponse,
  PersonnelRole,
  TelegramLinkTokenResponse,
} from '@/api/schemas'
import {
  deletePersonnelAdmin as apiDeletePersonnel,
  deletePersonnelAdminImage,
  fetchPersonnelAdminList,
  fetchPersonnelLookups,
  fetchPersonnelWorkstatusOptions,
  postPersonnelAdminImage,
  postPersonnelAdminImport,
  upsertPersonnelAdmin,
  type PersonnelLookupOption,
} from '@/lib/api-public'
import {
  createAdminTelegramLinkToken,
  unlinkAdminTelegram,
} from '@/lib/telegram-link-api'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Filter,
  ImageIcon,
  KeyRound,
  Loader2,
  Link2Off,
  Lock,
  LogIn,
  MessageSquare,
  Pencil,
  RefreshCcw,
  Table2,
  Trash2,
  Unlock,
  Upload,
  UserPlus,
  Users,
} from 'lucide-react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { isMissingEngWkctrCode, normalizeWkctrCode, resolveWorkCntr } from '@/lib/wkctr-code'
import {
  normalizePrimaryRolePair,
  userroleToUserst,
  type PrimaryUserrole,
} from '@/lib/primary-roles'

function unixToInputDate(sec: number | null | undefined): string {
  if (!sec || sec <= 0) return ''
  const d = new Date(sec * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

type FormState = {
  isEdit: boolean
  hasMemberImage: boolean
  idwkctr: string
  titlewkctr: string
  namewkctr: string
  surnamewkctr: string
  titlewkctreng: string
  namewkctreng: string
  surnamewkctreng: string
  startwork: string
  wkctrdate: string
  iddepartment: string
  idposition: string
  wkctr: string
  plnt: string
  cat: string
  resp: string
  idwkctrgroup: string
  idwkctrtype: string
  idwklevel: string
  wkctrtel: string
  wkctrmail: string
  labourcost: string
  userst: 'A' | 'U' | 'W'
  userrole: PrimaryUserrole
  workstatus: string
  pass: string
}

const emptyForm: FormState = {
  isEdit: false,
  hasMemberImage: false,
  idwkctr: '',
  titlewkctr: '',
  namewkctr: '',
  surnamewkctr: '',
  titlewkctreng: '',
  namewkctreng: '',
  surnamewkctreng: '',
  startwork: '',
  wkctrdate: '',
  iddepartment: '',
  idposition: '',
  wkctr: '',
  plnt: '',
  cat: '',
  resp: '',
  idwkctrgroup: '',
  idwkctrtype: '',
  idwklevel: '',
  wkctrtel: '',
  wkctrmail: '',
  labourcost: '0',
  userst: 'U',
  userrole: 'planner',
  workstatus: '',
  pass: '',
}

function useUserroleOptions() {
  const { t } = useTranslation('personnel')
  return useMemo(
    (): Array<{ value: PrimaryUserrole; label: string }> => [
      { value: 'admin', label: t('admin.userrole.admin') },
      { value: 'planner', label: t('admin.userrole.planner') },
      { value: 'technician', label: t('admin.userrole.technician') },
    ],
    [t],
  )
}

function fromItem(it: PersonnelAdminItem): FormState {
  const rolePair = normalizePrimaryRolePair({ userst: it.userst, userrole: it.userrole })
  return {
    isEdit: true,
    hasMemberImage: Boolean(it.hasImage),
    idwkctr: it.idwkctr,
    titlewkctr: it.titlewkctr ?? '',
    namewkctr: it.namewkctr ?? '',
    surnamewkctr: it.surnamewkctr ?? '',
    titlewkctreng: it.titlewkctreng ?? '',
    namewkctreng: it.namewkctreng ?? '',
    surnamewkctreng: it.surnamewkctreng ?? '',
    startwork: unixToInputDate(it.startwork),
    wkctrdate: unixToInputDate(it.wkctrdate),
    iddepartment: it.iddepartment ?? '',
    idposition: it.idposition ?? '',
    wkctr: resolveWorkCntr(it) || it.wkctr,
    plnt: it.plnt ?? '',
    cat: it.cat ?? '',
    resp: it.resp ?? '',
    idwkctrgroup: it.idwkctrgroup ?? '',
    idwkctrtype: it.idwkctrtype ?? '',
    idwklevel: it.idwklevel ?? '',
    wkctrtel: it.wkctrtel ?? '',
    wkctrmail: it.wkctrmail ?? '',
    labourcost: String(it.labourcost ?? 0),
    userst: rolePair.userst,
    userrole: rolePair.userrole,
    workstatus: it.workstatus ?? '',
    pass: '',
  }
}

export type PersonnelAdminPageProps = {
  /** `admin` = /admin/users (RBAC admin.users.*); `personnel` = legacy /personnel/admin */
  variant?: 'personnel' | 'admin'
}

type AdminDestructiveConfirm = {
  phrase: string
  title: string
  description: string
  run: () => void | Promise<void>
}

type NativeAlertConfirm = {
  title: string
  description: string
  actionLabel: string
  destructive?: boolean
  run: () => void | Promise<void>
}

export function PersonnelAdminPage({ variant = 'personnel' }: PersonnelAdminPageProps) {
  const { t } = useTranslation('personnel')
  const { t: tc } = useTranslation('common')
  const userroleOptions = useUserroleOptions()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const qc = useQueryClient()
  const authUser = getStoredAuthUser()
  const isLegacyAdmin = authUser?.userst === 'A'
  const canReadUsers = useAnyPermission([
    'admin.users.read',
    'admin.users.write',
    'personnel.write',
  ])
  const canWriteUsers = useAnyPermission(['admin.users.write', 'personnel.write'])
  const canImpersonate = usePermission('admin.users.impersonate')
  const isAdmin = variant === 'admin' ? canReadUsers : isLegacyAdmin
  const showAdminActions = variant === 'admin' && canWriteUsers
  const [accountTab, setAccountTab] = useState<'workcenter' | 'member'>('workcenter')
  const [adminConfirm, setAdminConfirm] = useState<AdminDestructiveConfirm | null>(null)
  const [adminConfirmLoading, setAdminConfirmLoading] = useState(false)
  const [nativeConfirm, setNativeConfirm] = useState<NativeAlertConfirm | null>(null)
  const [nativeConfirmLoading, setNativeConfirmLoading] = useState(false)
  const [telegramInviteOpen, setTelegramInviteOpen] = useState(false)
  const [telegramInviteData, setTelegramInviteData] = useState<TelegramLinkTokenResponse | null>(
    null,
  )

  useEffect(() => {
    if (!isAdmin) {
      toast.error(
        variant === 'admin' ? t('admin.accessDeniedUsers') : t('admin.accessDeniedAdmin'),
      )
      navigate(variant === 'admin' ? '/' : '/personnel', { replace: true })
    }
  }, [isAdmin, navigate, variant])

  useEffect(() => {
    const initialQ = searchParams.get('q')?.trim()
    if (initialQ) {
      setQ(initialQ)
      setQInput(initialQ)
    }
    if (searchParams.get('photo') === 'missing') {
      setPhotoFilter('missing')
    }
  }, [searchParams])

  const [q, setQ] = useState('')
  const [qInput, setQInput] = useState('')
  /**
   * Filter "สถานะใช้งาน"
 * - `active` (default) = ทำงานปกติ + แถวเก่าที่ยังไม่กำหนด workstatus (กันคนหาย)
   * - `inactive` = ลาออก / เกษียณ / พ้นสภาพ
   * - `all` = ทุกคน
   * - `<code>` = match แม่นยำ เช่น `RESIGNED`
   */
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [roleFilter, setRoleFilter] = useState<PrimaryUserrole | ''>('')
  const [photoFilter, setPhotoFilter] = useState<'all' | 'missing'>('all')
  const [codeFilter, setCodeFilter] = useState<'all' | 'missing'>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [bulkRole, setBulkRole] = useState<PrimaryUserrole>('planner')
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false)

  const listQ = useQuery({
    queryKey: ['personnel', 'admin', 'list', variant, q, statusFilter, roleFilter],
    queryFn: () => {
      const params = {
        q: q || undefined,
        status: statusFilter,
        limit: 500,
        ...(variant === 'admin' && roleFilter ? { userrole: roleFilter } : {}),
      }
      return variant === 'admin'
        ? fetchAdminUsersList(params)
        : fetchPersonnelAdminList(params)
    },
    enabled: isAdmin && accountTab === 'workcenter',
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  })

  const membersQ = useQuery({
    queryKey: ['admin', 'users', 'members'],
    queryFn: fetchAdminMembersList,
    enabled: isAdmin && variant === 'admin' && accountTab === 'member',
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })

 // Lookup สำหรับ select ในฟอร์ม
  const lookupsQ = useQuery({
    queryKey: ['personnel', 'admin', 'lookups'],
    queryFn: fetchPersonnelLookups,
    enabled: isAdmin,
    staleTime: 5 * 60_000,
  })
  const lookups = lookupsQ.data

 // Lookup workstatus
  const workstatusOptionsQ = useQuery({
    queryKey: ['personnel', 'admin', 'workstatus-options'],
    queryFn: fetchPersonnelWorkstatusOptions,
    enabled: isAdmin,
    staleTime: 10 * 60_000,
  })
  const workstatusOptions = useMemo(
    () => workstatusOptionsQ.data ?? [],
    [workstatusOptionsQ.data],
  )
  /** options พร้อมแสดงในฟอร์ม (label = `code — desc`) */
  const workstatusFormOptions = useMemo<PersonnelLookupOption[]>(
    () =>
      workstatusOptions.map((o) => ({
        value: o.workstatus,
        label: `${o.workstatus} — ${o.wkstatusdes}`,
      })),
    [workstatusOptions],
  )
  /** map code → option (สำหรับ badge สีในตาราง) */
  const workstatusMap = useMemo(() => {
    const m = new Map<string, (typeof workstatusOptions)[number]>()
    for (const o of workstatusOptions) m.set(o.workstatus, o)
    return m
  }, [workstatusOptions])

  const [open, setOpen] = useState(false)
  const [formTab, setFormTab] = useState('t1')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [imageVersion, setImageVersion] = useState<Record<string, number>>({})
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<PersonnelImportResponse | null>(
    null,
  )
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const imageInputRef = useRef<HTMLInputElement | null>(null)

  const apiItems = listQ.data?.items ?? []
  const items = useMemo(() => {
    let raw = apiItems
    if (photoFilter === 'missing') raw = raw.filter((it) => !it.hasImage)
    if (codeFilter === 'missing')
      raw = raw.filter((it) => isMissingEngWkctrCode(it.wkctr, it))
    return raw
  }, [apiItems, photoFilter, codeFilter])
  const totalRows = listQ.data?.totalRows ?? 0
  const filteredOutCount =
    apiItems.length > 0 && items.length === 0 ? apiItems.length : 0
  const selectedCount = selectedIds.size
  const allOnPageSelected =
    items.length > 0 && items.every((it) => selectedIds.has(it.idwkctr))

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set(items.map((it) => it.idwkctr)))
  }

  const toggleSelectRow = (idwkctr: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(idwkctr)) next.delete(idwkctr)
      else next.add(idwkctr)
      return next
    })
  }

  const bumpImageVer = (idwkctr: string) =>
    setImageVersion((m) => ({ ...m, [idwkctr]: (m[idwkctr] ?? 0) + 1 }))

  const upsertMut = useMutation({
    mutationFn: (state: FormState) =>
      upsertPersonnelAdmin({
        idwkctr: state.idwkctr.trim(),
        titlewkctr: state.titlewkctr || null,
        namewkctr: state.namewkctr || null,
        surnamewkctr: state.surnamewkctr || null,
        titlewkctreng: state.titlewkctreng || null,
        namewkctreng: state.namewkctreng || null,
        surnamewkctreng: state.surnamewkctreng || null,
        startwork: state.startwork || null,
        wkctrdate: state.wkctrdate || null,
        iddepartment: state.iddepartment || null,
        idposition: state.idposition || null,
        wkctr: normalizeWkctrCode(state.wkctr),
        plnt: state.plnt || null,
        cat: state.cat || null,
        resp: state.resp || null,
        idwkctrgroup: state.idwkctrgroup || null,
        idwkctrtype: state.idwkctrtype || null,
        idwklevel: state.idwklevel || null,
        wkctrtel: state.wkctrtel || null,
        wkctrmail: state.wkctrmail || null,
        labourcost: state.labourcost === '' ? 0 : Number(state.labourcost),
        userst: userroleToUserst(state.userrole),
        userrole: state.userrole,
        workstatus: state.workstatus || null,
        pass: state.pass || undefined,
      }),
    onSuccess: (_d, vars) => {
      toast.success(
        vars.isEdit
          ? t('admin.toast.saved', { id: vars.idwkctr })
          : t('admin.toast.added', { id: vars.idwkctr }),
      )
      setOpen(false)
      qc.invalidateQueries({ queryKey: ['personnel', 'admin', 'list'] })
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('WKCTR_CONFLICT') || msg.includes('409')) {
        toast.error(t('admin.toast.wkctrConflict'))
        return
      }
      toast.error(`${t('admin.toast.saveFailed')}: ${msg}`)
    },
  })

  const deleteMut = useMutation({
    mutationFn: (idwkctr: string) => apiDeletePersonnel(idwkctr),
    onSuccess: (_d, idwkctr) => {
      setNativeConfirm(null)
      toast.success(t('admin.toast.deleted', { id: idwkctr }))
      qc.invalidateQueries({ queryKey: ['personnel', 'admin', 'list'] })
    },
    onError: (err: unknown) => {
      toast.error(`${t('admin.toast.deleteFailed')}: ${err instanceof Error ? err.message : String(err)}`)
    },
  })

  const imageMut = useMutation({
    mutationFn: ({ idwkctr, file }: { idwkctr: string; file: File }) =>
      postPersonnelAdminImage(idwkctr, file),
    onSuccess: (res, vars) => {
      toast.success(
        t('admin.toast.uploadWebp', {
          width: res.width,
          height: res.height,
          kb: Math.round(res.bytes / 1024),
        }),
      )
      bumpImageVer(vars.idwkctr)
      setForm((s) =>
        s.idwkctr === vars.idwkctr ? { ...s, hasMemberImage: true } : s,
      )
      qc.invalidateQueries({ queryKey: ['personnel', 'admin', 'list'] })
    },
    onError: (err: unknown) => {
      toast.error(`${t('admin.toast.uploadFailed')}: ${err instanceof Error ? err.message : String(err)}`)
    },
  })

  const deleteImageMut = useMutation({
    mutationFn: (idwkctr: string) => deletePersonnelAdminImage(idwkctr),
    onSuccess: (_d, idwkctr) => {
      setNativeConfirm(null)
      toast.message(t('admin.toast.imageRemoved', { id: idwkctr }))
      bumpImageVer(idwkctr)
      setForm((s) =>
        s.idwkctr === idwkctr ? { ...s, hasMemberImage: false } : s,
      )
      qc.invalidateQueries({ queryKey: ['personnel', 'admin', 'list'] })
    },
  })

  const telegramInviteMut = useMutation({
    mutationFn: (idwkctr: string) => createAdminTelegramLinkToken(idwkctr),
    onSuccess: (data) => {
      setTelegramInviteData(data)
      setTelegramInviteOpen(true)
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : tc('settings.telegram.inviteFailed'))
    },
  })

  const telegramUnlinkMut = useMutation({
    mutationFn: (idwkctr: string) => unlinkAdminTelegram(idwkctr),
    onSuccess: (_d, idwkctr) => {
      toast.success(t('admin.toast.telegramUnlinked', { id: idwkctr }))
      qc.invalidateQueries({ queryKey: ['personnel', 'admin', 'list'] })
    },
    onError: (err: unknown) => {
      toast.error(
        err instanceof Error ? err.message : t('admin.toast.telegramUnlinkFailed'),
      )
    },
  })

  function openCreate() {
    setForm({ ...emptyForm, isEdit: false })
    setFormTab('t1')
    setOpen(true)
  }

  function openEdit(it: PersonnelAdminItem, tab = 't1') {
    setForm(fromItem(it))
    setFormTab(tab)
    setOpen(true)
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!form.idwkctr.trim()) {
      toast.error(t('admin.toast.hrRequired'))
      return
    }
    if (!form.wkctr.trim()) {
      toast.error(t('admin.toast.workCntrRequired'))
      return
    }
    upsertMut.mutate(form)
  }

  function onPickImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!form.idwkctr) {
      toast.error(t('admin.toast.saveBeforePhoto'))
      return
    }
    imageMut.mutate({ idwkctr: form.idwkctr, file })
  }

  function onPickImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImporting(true)
    setImportResult(null)
    postPersonnelAdminImport(file)
      .then((res) => {
        setImportResult(res)
        toast.success(
          t('admin.toast.importSummary', {
            inserted: res.inserted,
            updated: res.updated,
            errors: res.errors,
          }),
        )
        qc.invalidateQueries({ queryKey: ['personnel', 'admin', 'list'] })
      })
      .catch((err: unknown) => {
        toast.error(`${t('admin.toast.importFailed')}: ${err instanceof Error ? err.message : String(err)}`)
      })
      .finally(() => setImporting(false))
  }

  if (!isAdmin) {
    return (
      <div className="px-6 py-8 text-caption">
        {t('admin.redirecting')}
      </div>
    )
  }

  const headerActions = (
    <>
      <Badge variant="secondary">{t('admin.badgeTotal', { count: totalRows })}</Badge>
      {variant === 'admin' ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="admin-toolbar-btn"
          onClick={() => {
            if (accountTab === 'member') void membersQ.refetch()
            else void listQ.refetch()
          }}
          disabled={accountTab === 'member' ? membersQ.isFetching : listQ.isFetching}
        >
          <RefreshCcw
            className={`mr-1 size-3.5 ${(accountTab === 'member' ? membersQ.isFetching : listQ.isFetching) ? 'animate-spin' : ''}`}
            aria-hidden
          />
          {t('admin.refresh')}
        </Button>
      ) : null}
      {variant === 'admin' ? (
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/settings">{t('admin.systemSettings')}</Link>
        </Button>
      ) : (
        <Button asChild variant="outline" size="sm">
          <Link to="/personnel">{t('admin.backDashboard')}</Link>
        </Button>
      )}
      <Button asChild variant="outline" size="sm">
        <Link to="/confirmation">{t('admin.personnelConfirmation')}</Link>
      </Button>
      <input
        ref={importInputRef}
        type="file"
        accept=".xls,.xlsx,.csv"
        className="hidden"
        onChange={onPickImportFile}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={importing}
        onClick={() => importInputRef.current?.click()}
      >
        <Upload className="mr-1 size-4" />
        {importing ? t('admin.importing') : t('admin.importExcel')}
      </Button>
      <Button type="button" size="sm" onClick={openCreate}>
        <UserPlus className="mr-1 size-4" />
        {t('admin.addPersonnel')}
      </Button>
    </>
  )

  const accountTabs =
    variant === 'admin' ? (
      <Tabs
        value={accountTab}
        onValueChange={(v) => setAccountTab(v as 'workcenter' | 'member')}
      >
        <TabsList>
          <TabsTrigger value="workcenter">{t('admin.tabWorkcenter')}</TabsTrigger>
          <TabsTrigger value="member">{t('admin.tabMember')}</TabsTrigger>
        </TabsList>
      </Tabs>
    ) : null

  const wrapAdminWorkcenterSection = (
    index: number,
    card: {
      icon: LucideIcon
      title: string
      description: string
      bodyClassName?: string
    },
    content: ReactNode,
  ) => {
    if (variant !== 'admin' || accountTab !== 'workcenter') return content
    return (
      <AdminPageSection index={index}>
        <AdminPageSectionCard
          icon={card.icon}
          title={card.title}
          description={card.description}
          bodyClassName={card.bodyClassName}
        >
          {content}
        </AdminPageSectionCard>
      </AdminPageSection>
    )
  }

  const body = (
      <>
        {variant === 'admin' ? (
          <AdminPageSection index={0}>
            <AdminPageSectionCard
              icon={Users}
              title={t('admin.sections.accountTitle')}
              description={t('admin.sections.accountDesc')}
            >
              {accountTabs}
            </AdminPageSectionCard>
          </AdminPageSection>
        ) : null}

        {(variant !== 'admin' || accountTab === 'workcenter') && (
        <>
        {variant === 'admin' && accountTab === 'workcenter' ? (
          <PersonnelAdminPhotoGoLiveBanner
            canWrite={showAdminActions}
            onShowMissingPhotos={() => {
              setStatusFilter('active')
              setPhotoFilter('missing')
            }}
            onShowMissingCodes={() => {
              setStatusFilter('active')
              setCodeFilter('missing')
            }}
          />
        ) : null}
        {wrapAdminWorkcenterSection(
          1,
          {
            icon: Filter,
            title: t('admin.sections.filtersTitle'),
            description: t('admin.sections.filtersDesc'),
          },
          <>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder={t('admin.searchPlaceholder')}
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setQ(qInput.trim())
            }}
            className="max-w-md"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setQ(qInput.trim())}
          >
            {tc('actions.search')}
          </Button>
          {q ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setQ('')
                setQInput('')
              }}
            >
              {t('admin.clear')}
            </Button>
          ) : null}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Label className="text-xs text-app-muted">{t('admin.filterUsageStatus')}</Label>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { value: 'active', label: t('admin.filterActive'), tone: 'emerald' },
                  { value: 'inactive', label: t('admin.filterInactive'), tone: 'neutral' },
                  { value: 'all', label: t('admin.filterAll'), tone: 'blue' },
                ] as const
              ).map((opt) => (
                <Button
                  key={opt.value}
                  type="button"
                  size="sm"
                  variant={statusFilter === opt.value ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
              <Button
                type="button"
                size="sm"
                variant={photoFilter === 'missing' ? 'default' : 'outline'}
                onClick={() => setPhotoFilter((p) => (p === 'missing' ? 'all' : 'missing'))}
              >
                {t('admin.filterNoPhoto')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={codeFilter === 'missing' ? 'default' : 'outline'}
                onClick={() => setCodeFilter((p) => (p === 'missing' ? 'all' : 'missing'))}
              >
                {t('admin.filterNoWorkCntr')}
              </Button>
            </div>
            {/* Dropdown สถานะรายตัว (ACTIVE/INACTIVE/LEAVE/RESIGNED/RETIRED/TERMINATED) */}
            <select
              value={
                statusFilter === 'active' ||
                statusFilter === 'inactive' ||
                statusFilter === 'all'
                  ? ''
                  : statusFilter
              }
              disabled={workstatusOptionsQ.isLoading}
              onChange={(e) => {
                const v = e.target.value
                setStatusFilter(v || 'all')
              }}
              className="h-9 rounded-button border border-app bg-[var(--app-surface)] px-2 text-body-sm focus-app-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              title={t('admin.filterStatusTitle')}
            >
              <option value="">{t('admin.filterStatusSpecific')}</option>
              {workstatusOptions.map((o) => (
                <option key={o.workstatus} value={o.workstatus}>
                  {o.workstatus} — {o.wkstatusdes}
                </option>
              ))}
            </select>
            {variant === 'admin' ? (
              <>
                <Label className="text-xs text-app-muted">{t('admin.filterRole')}</Label>
                <select
                  value={roleFilter}
                  onChange={(e) =>
                    setRoleFilter((e.target.value || '') as PrimaryUserrole | '')
                  }
                  className="h-9 rounded-button border border-app bg-[var(--app-surface)] px-2 text-body-sm"
                  title={t('admin.filterRoleTitle')}
                >
                  <option value="">{t('admin.filterAllRoles')}</option>
                  {userroleOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
          </div>
        </div>

        {variant === 'admin' && showAdminActions && selectedCount > 0 ? (
          <div className="flex flex-wrap items-center gap-2 rounded-card border border-[var(--admin-primary)]/25 bg-[var(--admin-surface)] px-3 py-2">
            <span className="text-body-sm font-medium text-[var(--admin-text)]">
              {t('admin.bulkSelected', { count: selectedCount })}
            </span>
            <select
              value={bulkRole}
              onChange={(e) => setBulkRole(e.target.value as PrimaryUserrole)}
              className="h-9 rounded-button border border-app bg-[var(--app-surface)] px-2 text-body-sm"
            >
              {userroleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Button type="button" size="sm" onClick={() => setBulkConfirmOpen(true)}>
              {t('admin.bulkChangeRole')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds(new Set())}
            >
              {t('admin.bulkClearSelection')}
            </Button>
          </div>
        ) : null}

        {importResult ? (
          <ImportResultBlock data={importResult} />
        ) : null}

        {filteredOutCount > 0 ? (
          <div className="app-tone-info rounded-card border px-4 py-3 text-body-sm">
            {t('admin.filterHiddenBanner', { count: filteredOutCount })}
          </div>
        ) : null}
          </>,
        )}

        {wrapAdminWorkcenterSection(
          2,
          {
            icon: Table2,
            title: t('admin.sections.workcenterTableTitle'),
            description: t('admin.sections.workcenterTableDesc'),
            bodyClassName: '!p-0',
          },
          <div className="overflow-hidden app-table-shell">
          {listQ.isError && !listQ.data ? (
            <QueryLoadErrorState
              className="m-4"
              title={t('admin.table.loadFailed')}
              error={listQ.error}
              action={{ label: tc('actions.retry'), onClick: () => void listQ.refetch() }}
            />
          ) : (
            <Table embedded={variant === 'admin'} stickyHeader={variant === 'admin'} zebra={variant === 'admin'}>
              <TableHeader>
                <TableRow>
                  {variant === 'admin' && showAdminActions ? (
                    <TableHead className="w-10">
                      <input
                        type="checkbox"
                        aria-label={t('admin.table.selectAllPage')}
                        checked={allOnPageSelected}
                        onChange={toggleSelectAll}
                        disabled={listQ.isLoading && !listQ.data}
                        className="size-4 rounded border-app"
                      />
                    </TableHead>
                  ) : null}
                  <TableHead className="w-[4.5rem]">{t('admin.table.photo')}</TableHead>
                  <TableHead>{t('admin.table.workCntr')}</TableHead>
                  <TableHead>{t('admin.table.name')}</TableHead>
                  <TableHead>{t('admin.table.hrLogin')}</TableHead>
                  <TableHead>{t('admin.table.position')}</TableHead>
                  <TableHead>{t('admin.table.department')}</TableHead>
                  <TableHead>{t('admin.table.role')}</TableHead>
                  <TableHead>{t('admin.table.usageStatus')}</TableHead>
                  <TableHead className="text-right">{t('admin.table.action')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listQ.isLoading && !listQ.data ? (
                  <TableSkeletonRows
                    rows={10}
                    columns={variant === 'admin' && showAdminActions ? 10 : 9}
                    narrowFirstColumn
                  />
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={variant === 'admin' && showAdminActions ? 10 : 9}
                      className="py-8 text-center text-caption"
                    >
                      {filteredOutCount > 0
                        ? t('admin.table.emptyFilters')
                        : totalRows === 0
                          ? t('admin.table.emptyNoData')
                          : t('admin.table.emptyNoMatch')}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((it) => (
                    <PersonnelRow
                      key={it.idwkctr}
                      it={it}
                      ver={imageVersion[it.idwkctr]}
                      workstatusInfo={
                        it.workstatus ? workstatusMap.get(it.workstatus) : undefined
                      }
                      showBulkSelect={variant === 'admin' && showAdminActions}
                      photoSize={variant === 'admin' ? 'md' : 'sm'}
                      selected={selectedIds.has(it.idwkctr)}
                      onToggleSelect={() => toggleSelectRow(it.idwkctr)}
                      showAdminActions={showAdminActions}
                      canImpersonate={canImpersonate}
                      onEdit={() => openEdit(it)}
                      onEditPhoto={() => openEdit(it, 'img')}
                      onDelete={() => {
                        if (showAdminActions) {
                          setAdminConfirm({
                            phrase: it.idwkctr,
                            title: t('admin.confirm.deleteTitle', { id: it.idwkctr }),
                            description: t('admin.confirm.deleteDesc', {
                              workCntr: it.wkctr,
                            }),
                            run: () => deleteMut.mutate(it.idwkctr),
                          })
                          return
                        }
                        setNativeConfirm({
                          title: t('admin.confirm.deleteTitle', { id: it.idwkctr }),
                          description: t('admin.confirm.deleteNative', { id: it.idwkctr }),
                          actionLabel: t('admin.table.delete'),
                          destructive: true,
                          run: () => deleteMut.mutate(it.idwkctr),
                        })
                      }}
                      onResetPassword={() => {
                        const run = async () => {
                          const res = await resetAdminUserPassword(it.idwkctr, 'workcenter')
                          toast.success(t('admin.toast.tempPassword', { password: res.temporaryPassword }), {
                            duration: 20_000,
                          })
                        }
                        if (showAdminActions) {
                          setAdminConfirm({
                            phrase: it.idwkctr,
                            title: t('admin.confirm.resetPasswordTitle'),
                            description: `${it.idwkctr} (${it.wkctr})`,
                            run,
                          })
                          return
                        }
                        setNativeConfirm({
                          title: t('admin.confirm.resetPasswordTitle'),
                          description: t('admin.confirm.resetPasswordNative', { id: it.idwkctr }),
                          actionLabel: t('admin.table.resetPassword'),
                          run,
                        })
                      }}
                      onLock={() => {
                        const run = async () => {
                          await lockAdminUser(it.idwkctr, 'workcenter')
                          toast.success(t('admin.toast.locked', { id: it.idwkctr }))
                          void listQ.refetch()
                        }
                        if (showAdminActions) {
                          setAdminConfirm({
                            phrase: it.idwkctr,
                            title: t('admin.confirm.lockTitle', { id: it.idwkctr }),
                            description: t('admin.confirm.lockDesc'),
                            run,
                          })
                          return
                        }
                        void run().catch((e: unknown) =>
                          toast.error(e instanceof Error ? e.message : t('admin.toast.lockFailed')),
                        )
                      }}
                      onUnlock={async () => {
                        try {
                          await unlockAdminUser(it.idwkctr, 'workcenter')
                          toast.success(t('admin.toast.unlocked', { id: it.idwkctr }))
                          void listQ.refetch()
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : t('admin.toast.unlockFailed'))
                        }
                      }}
                      onImpersonate={() => {
                        const run = async () => {
                          const res = await impersonateAdminUser(it.idwkctr, 'workcenter')
                          applyImpersonationSession(res)
                          await refreshAuthSession()
                          toast.success(t('admin.toast.impersonating', { username: res.user.username }))
                          navigate('/')
                        }
                        if (showAdminActions) {
                          setAdminConfirm({
                            phrase: it.idwkctr,
                            title: t('admin.confirm.impersonateTitle'),
                            description: t('admin.confirm.impersonateDesc', {
                              id: it.idwkctr,
                              workCntr: it.wkctr,
                            }),
                            run,
                          })
                          return
                        }
                        setNativeConfirm({
                          title: t('admin.confirm.impersonateTitle'),
                          description: t('admin.confirm.impersonateNative', {
                            id: it.idwkctr,
                            workCntr: it.wkctr,
                          }),
                          actionLabel: t('admin.table.impersonate'),
                          run,
                        })
                      }}
                      onTelegramInvite={
                        showAdminActions
                          ? () => telegramInviteMut.mutate(it.idwkctr)
                          : undefined
                      }
                      onTelegramUnlink={
                        showAdminActions && it.telegramChatId
                          ? () => {
                              const run = async () => {
                                await telegramUnlinkMut.mutateAsync(it.idwkctr)
                              }
                              setAdminConfirm({
                                phrase: it.idwkctr,
                                title: t('admin.confirm.telegramUnlinkTitle', { id: it.idwkctr }),
                                description: t('admin.confirm.telegramUnlinkDesc', {
                                  workCntr: it.wkctr,
                                }),
                                run,
                              })
                            }
                          : undefined
                      }
                      telegramInvitePending={
                        telegramInviteMut.isPending &&
                        telegramInviteMut.variables === it.idwkctr
                      }
                    />
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>,
        )}
        </>
        )}

        {variant === 'admin' && accountTab === 'member' ? (
          <AdminPageSection index={1}>
            <AdminPageSectionCard
              icon={Table2}
              title={t('admin.sections.membersTableTitle')}
              description={t('admin.sections.membersTableDesc')}
              bodyClassName="!p-0"
            >
          <div className="overflow-hidden app-table-shell">
            {membersQ.isError && !membersQ.data ? (
              <QueryLoadErrorState
                className="m-4"
                title={t('admin.members.loadFailed')}
                error={membersQ.error}
                action={{ label: tc('actions.retry'), onClick: () => void membersQ.refetch() }}
              />
            ) : (
              <Table embedded stickyHeader zebra>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.members.colId')}</TableHead>
                    <TableHead>{t('admin.members.colUsername')}</TableHead>
                    <TableHead>{t('admin.members.colName')}</TableHead>
                    <TableHead>{t('admin.members.colStatus')}</TableHead>
                    <TableHead className="text-right">{t('admin.table.action')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membersQ.isLoading && !membersQ.data ? (
                    <TableSkeletonRows rows={8} columns={5} narrowFirstColumn />
                  ) : (membersQ.data ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-caption">
                        {t('admin.members.empty')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    (membersQ.data ?? []).map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-mono text-xs">{m.id}</TableCell>
                        <TableCell>{m.username}</TableCell>
                        <TableCell>{m.fullname ?? '—'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1">
                            <span>{m.status ?? '—'}</span>
                            {m.passMustChange ? (
                              <Badge variant="outline" className="app-tone-warning-badge">
                                {t('admin.table.mustChangePassword')}
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {showAdminActions ? (
                            <MemberAdminActions
                              member={m}
                              canImpersonate={canImpersonate}
                              onDone={() => void membersQ.refetch()}
                              onImpersonate={() => navigate('/')}
                              onRequestConfirm={setAdminConfirm}
                              onRequestNativeConfirm={setNativeConfirm}
                            />
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
            </AdminPageSectionCard>
          </AdminPageSection>
        ) : null}

      <AlertDialog
        open={nativeConfirm != null}
        onOpenChange={(open) => {
          if (
            !open &&
            !nativeConfirmLoading &&
            !deleteMut.isPending &&
            !deleteImageMut.isPending
          ) {
            setNativeConfirm(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{nativeConfirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{nativeConfirm?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={
                nativeConfirmLoading || deleteMut.isPending || deleteImageMut.isPending
              }
            >
              {tc('actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant={nativeConfirm?.destructive ? 'destructive' : 'default'}
              disabled={
                !nativeConfirm ||
                nativeConfirmLoading ||
                deleteMut.isPending ||
                deleteImageMut.isPending
              }
              onClick={(e) => {
                e.preventDefault()
                if (!nativeConfirm) return
                void (async () => {
                  setNativeConfirmLoading(true)
                  try {
                    await nativeConfirm.run()
                    if (!deleteMut.isPending && !deleteImageMut.isPending) {
                      setNativeConfirm(null)
                    }
                  } catch (err) {
                    toast.error(
                      err instanceof Error ? err.message : t('admin.toast.actionFailed'),
                    )
                  } finally {
                    setNativeConfirmLoading(false)
                  }
                })()
              }}
            >
              {nativeConfirmLoading || deleteMut.isPending || deleteImageMut.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              ) : null}
              {nativeConfirm?.actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {adminConfirm ? (
        <ConfirmPhraseDialog
          open
          onOpenChange={(open) => !open && setAdminConfirm(null)}
          tone="danger"
          title={adminConfirm.title}
          description={adminConfirm.description}
          phrase={adminConfirm.phrase}
          loading={adminConfirmLoading}
          onConfirm={async () => {
            setAdminConfirmLoading(true)
            try {
              await adminConfirm.run()
              setAdminConfirm(null)
            } catch (e) {
              toast.error(e instanceof Error ? e.message : t('admin.toast.actionFailed'))
            } finally {
              setAdminConfirmLoading(false)
            }
          }}
        />
      ) : null}

      <TelegramInviteDialog
        open={telegramInviteOpen}
        onOpenChange={setTelegramInviteOpen}
        data={telegramInviteData}
        loading={telegramInviteMut.isPending && !telegramInviteData}
      />

      {bulkConfirmOpen ? (
        <ConfirmPhraseDialog
          open
          onOpenChange={(open) => !open && setBulkConfirmOpen(false)}
          title={t('admin.bulk.confirmTitle')}
          description={t('admin.bulk.confirmDesc', { role: bulkRole, count: selectedCount })}
          phrase={String(selectedCount)}
          phraseLabel={t('admin.bulk.phraseLabel')}
          confirmLabel={t('admin.bulk.confirmButton')}
          loading={adminConfirmLoading}
          onConfirm={async () => {
            setAdminConfirmLoading(true)
            try {
              const res = await bulkAdminUserrole([...selectedIds], bulkRole)
              toast.success(t('admin.bulk.success', { count: res.updated }))
              setSelectedIds(new Set())
              setBulkConfirmOpen(false)
              void listQ.refetch()
            } catch (e) {
              toast.error(e instanceof Error ? e.message : t('admin.bulk.failed'))
            } finally {
              setAdminConfirmLoading(false)
            }
          }}
        />
      ) : null}

      <Dialog open={open} onOpenChange={(v) => !upsertMut.isPending && setOpen(v)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {form.isEdit
                ? t('admin.dialog.editTitle', { id: form.idwkctr })
                : t('admin.dialog.addTitle')}
            </DialogTitle>
            <DialogDescription>{t('admin.dialog.description')}</DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            <Tabs value={formTab} onValueChange={setFormTab}>
              <TabsList>
                <TabsTrigger value="t1">{t('admin.form.tabPersonal')}</TabsTrigger>
                <TabsTrigger value="t2">{t('admin.form.tabWork')}</TabsTrigger>
                <TabsTrigger value="t3">{t('admin.form.tabAccount')}</TabsTrigger>
                <TabsTrigger value="img">{t('admin.form.tabPhoto')}</TabsTrigger>
              </TabsList>

              <TabsContent value="t1" className="space-y-3 pt-2">
                <FormGrid>
                  <Field label={t('admin.form.hrLogin')} required>
                    <Input
                      value={form.idwkctr}
                      disabled={form.isEdit}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, idwkctr: e.target.value }))
                      }
                    />
                    <p className="mt-1 text-xs text-app-muted">{t('admin.form.hrLoginHint')}</p>
                  </Field>
                  <Field label={t('admin.form.prefix')}>
                    <Input
                      value={form.titlewkctr}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, titlewkctr: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label={t('admin.form.firstName')}>
                    <Input
                      value={form.namewkctr}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, namewkctr: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label={t('admin.form.lastName')}>
                    <Input
                      value={form.surnamewkctr}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, surnamewkctr: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label={t('admin.form.titleEng')}>
                    <Input
                      value={form.titlewkctreng}
                      onChange={(e) =>
                        setForm((s) => ({
                          ...s,
                          titlewkctreng: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label={t('admin.form.nameEng')}>
                    <Input
                      value={form.namewkctreng}
                      onChange={(e) =>
                        setForm((s) => ({
                          ...s,
                          namewkctreng: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label={t('admin.form.surnameEng')}>
                    <Input
                      value={form.surnamewkctreng}
                      onChange={(e) =>
                        setForm((s) => ({
                          ...s,
                          surnamewkctreng: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label={t('admin.form.birthDate')}>
                    <Input
                      type="date"
                      value={form.wkctrdate}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, wkctrdate: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label={t('admin.form.phone')}>
                    <Input
                      value={form.wkctrtel}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, wkctrtel: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label={t('admin.form.email')}>
                    <Input
                      type="email"
                      value={form.wkctrmail}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, wkctrmail: e.target.value }))
                      }
                    />
                  </Field>
                </FormGrid>
              </TabsContent>

              <TabsContent value="t2" className="space-y-3 pt-2">
                <FormGrid>
                  <Field label={t('admin.form.workCntr')} required>
                    <Input
                      value={form.wkctr}
                      placeholder={t('admin.form.workCntrPlaceholder')}
                      onChange={(e) =>
                        setForm((s) => ({
                          ...s,
                          wkctr: normalizeWkctrCode(e.target.value),
                        }))
                      }
                    />
                    <p className="mt-1 text-xs text-app-muted">{t('admin.form.workCntrHint')}</p>
                  </Field>
                  <Field label={t('admin.form.plant')}>
                    <Input
                      value={form.plnt}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, plnt: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label={t('admin.form.startDate')}>
                    <Input
                      type="date"
                      value={form.startwork}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, startwork: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label={t('admin.form.department')}>
                    <LookupSelect
                      value={form.iddepartment}
                      options={lookups?.departments}
                      loading={lookupsQ.isLoading}
                      onChange={(next) =>
                        setForm((s) => ({ ...s, iddepartment: next }))
                      }
                    />
                  </Field>
                  <Field label={t('admin.form.position')}>
                    <LookupSelect
                      value={form.idposition}
                      options={lookups?.positions}
                      loading={lookupsQ.isLoading}
                      onChange={(next) =>
                        setForm((s) => ({ ...s, idposition: next }))
                      }
                    />
                  </Field>
                  <Field label={t('admin.form.wcGroup')}>
                    <LookupSelect
                      value={form.idwkctrgroup}
                      options={lookups?.groups}
                      loading={lookupsQ.isLoading}
                      onChange={(next) =>
                        setForm((s) => ({ ...s, idwkctrgroup: next }))
                      }
                    />
                    <p className="mt-1 text-[11px] leading-snug text-app-muted">
                      {t('admin.form.wcGroupHint')}
                    </p>
                  </Field>
                  <Field label={t('admin.form.techType')}>
                    <LookupSelect
                      value={form.idwkctrtype}
                      options={lookups?.workTypes}
                      loading={lookupsQ.isLoading}
                      onChange={(next) =>
                        setForm((s) => ({ ...s, idwkctrtype: next }))
                      }
                    />
                  </Field>
                  <Field label={t('admin.form.level')}>
                    <LookupSelect
                      value={form.idwklevel}
                      options={lookups?.levels}
                      loading={lookupsQ.isLoading}
                      onChange={(next) =>
                        setForm((s) => ({ ...s, idwklevel: next }))
                      }
                    />
                  </Field>
                  <Field label={t('admin.form.cat')}>
                    <Input
                      value={form.cat}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, cat: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label={t('admin.form.resp')}>
                    <Input
                      value={form.resp}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, resp: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label={t('admin.form.labourCost')}>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.labourcost}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, labourcost: e.target.value }))
                      }
                    />
                  </Field>
                  <Field label={t('admin.form.workstatus')}>
                    <LookupSelect
                      value={form.workstatus}
                      options={workstatusFormOptions}
                      loading={workstatusOptionsQ.isLoading}
                      onChange={(next) =>
                        setForm((s) => ({ ...s, workstatus: next }))
                      }
                      placeholder={t('admin.form.selectStatus')}
                    />
                  </Field>
                </FormGrid>
              </TabsContent>

              <TabsContent value="t3" className="space-y-3 pt-2">
                <FormGrid>
                  <Field label={t('admin.form.userrole')}>
                    <select
                      className="flex h-9 w-full rounded-button border border-app bg-[var(--app-surface)] px-3 py-1 text-body-sm shadow-sm"
                      value={form.userrole}
                      onChange={(e) => {
                        const userrole = e.target.value as PrimaryUserrole
                        setForm((s) => ({
                          ...s,
                          userrole,
                          userst: userroleToUserst(userrole),
                        }))
                      }}
                    >
                      {userroleOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-app-muted">{t('admin.form.userroleHint')}</p>
                  </Field>
                  <Field
                    label={form.isEdit ? t('admin.form.passwordNew') : t('admin.form.password')}
                  >
                    <Input
                      type="text"
                      value={form.pass}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, pass: e.target.value }))
                      }
                      placeholder={form.isEdit ? t('admin.form.passwordNoChange') : ''}
                    />
                  </Field>
                </FormGrid>
              </TabsContent>

              <TabsContent value="img" className="space-y-3 pt-2">
                <ImagePanel
                  idwkctr={form.idwkctr}
                  isEdit={form.isEdit}
                  hasImage={form.hasMemberImage || Boolean(imageVersion[form.idwkctr])}
                  ver={imageVersion[form.idwkctr]}
                  pickRef={imageInputRef}
                  onPick={onPickImage}
                  uploading={imageMut.isPending}
                  onClear={() => {
                    setNativeConfirm({
                      title: t('admin.photo.remove'),
                      description: t('admin.photo.confirmDelete', { id: form.idwkctr }),
                      actionLabel: t('admin.photo.remove'),
                      destructive: true,
                      run: () => deleteImageMut.mutate(form.idwkctr),
                    })
                  }}
                  clearing={deleteImageMut.isPending}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={upsertMut.isPending}
              >
                {tc('actions.cancel')}
              </Button>
              <Button type="submit" disabled={upsertMut.isPending}>
                {upsertMut.isPending
                  ? t('admin.form.saving')
                  : form.isEdit
                    ? t('admin.form.saveEdit')
                    : t('admin.form.saveAdd')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </>
  )

  if (variant === 'admin') {
    return (
      <AdminPageShell
        tourTarget="admin-users"
        title={t('admin.shell.title')}
        description={t('admin.shell.description')}
        hints={hintsFromT(t, 'admin.shell.hints')}
        headerActions={headerActions}
      >
        {body}
      </AdminPageShell>
    )
  }

  return (
    <div>
      <PageHeader
        title={t('admin.page.title')}
        description={t('admin.page.description')}
      >
        {headerActions}
      </PageHeader>
      <div className="app-page-content space-y-4">{body}</div>
    </div>
  )
}

function UserroleBadge({ role }: { role: PersonnelRole }) {
  const userroleOptions = useUserroleOptions()
  const normalized = normalizePrimaryRolePair({ userrole: role }).userrole
  const opt = userroleOptions.find((o) => o.value === normalized)
  const tone =
    normalized === 'admin'
      ? 'app-tone-pill-danger-ring'
      : normalized === 'technician'
        ? 'app-tone-pill-success-ring'
        : 'app-tone-pill-info-ring'
  return (
    <span className={`inline-flex w-fit rounded-full px-2 py-1 text-xs font-medium ring-1 ${tone}`}>
      {opt?.label.split(' — ')[0] ?? normalized}
    </span>
  )
}

function MemberAdminActions({
  member,
  canImpersonate,
  onDone,
  onImpersonate,
  onRequestConfirm,
  onRequestNativeConfirm,
}: {
  member: AdminMemberItem
  canImpersonate: boolean
  onDone: () => void
  onImpersonate: () => void
  onRequestConfirm?: (req: AdminDestructiveConfirm) => void
  onRequestNativeConfirm?: (req: NativeAlertConfirm) => void
}) {
  const { t } = useTranslation('personnel')
  const id = String(member.id)
  const phrase = member.username
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        title={t('admin.table.resetPassword')}
        onClick={() => {
          const run = async () => {
            const res = await resetAdminUserPassword(id, 'member')
            toast.success(t('admin.toast.tempPassword', { password: res.temporaryPassword }), {
              duration: 20_000,
            })
          }
          if (onRequestConfirm) {
            onRequestConfirm({
              phrase,
              title: t('admin.confirm.resetPasswordTitle'),
              description: member.username,
              run,
            })
            return
          }
          onRequestNativeConfirm?.({
            title: t('admin.confirm.resetPasswordTitle'),
            description: t('admin.confirm.resetPasswordNative', { id: member.username }),
            actionLabel: t('admin.table.resetPassword'),
            run,
          })
        }}
      >
        <KeyRound className="size-3.5" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          const run = async () => {
            await lockAdminUser(id, 'member')
            toast.success(t('admin.members.locked'))
            onDone()
          }
          if (onRequestConfirm) {
            onRequestConfirm({
              phrase,
              title: t('admin.members.lockTitle', { username: member.username }),
              description: t('admin.members.lockDesc'),
              run,
            })
            return
          }
          void run().catch((e: unknown) =>
            toast.error(e instanceof Error ? e.message : t('admin.toast.lockFailed')),
          )
        }}
      >
        <Lock className="size-3.5" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={async () => {
          try {
            await unlockAdminUser(id, 'member')
            toast.success(t('admin.members.unlocked'))
            onDone()
          } catch (e) {
            toast.error(e instanceof Error ? e.message : t('admin.toast.unlockFailed'))
          }
        }}
      >
        <Unlock className="size-3.5" />
      </Button>
      {canImpersonate ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            const run = async () => {
              const res = await impersonateAdminUser(id, 'member')
              applyImpersonationSession(res)
              await refreshAuthSession()
              toast.success(t('admin.toast.impersonating', { username: res.user.username }))
              onImpersonate()
            }
            if (onRequestConfirm) {
              onRequestConfirm({
                phrase,
                title: t('admin.members.impersonateTitle'),
                description: t('admin.members.impersonateDesc', { username: member.username }),
                run,
              })
              return
            }
            onRequestNativeConfirm?.({
              title: t('admin.members.impersonateTitle'),
              description: t('admin.members.impersonateDesc', { username: member.username }),
              actionLabel: t('admin.table.impersonate'),
              run,
            })
          }}
        >
          <LogIn className="size-3.5" />
        </Button>
      ) : null}
    </div>
  )
}

function PersonnelRow({
  it,
  ver,
  workstatusInfo,
  showBulkSelect,
  photoSize = 'sm',
  selected,
  onToggleSelect,
  showAdminActions,
  canImpersonate,
  onEdit,
  onEditPhoto,
  onDelete,
  onResetPassword,
  onLock,
  onUnlock,
  onImpersonate,
  onTelegramInvite,
  onTelegramUnlink,
  telegramInvitePending,
}: {
  it: PersonnelAdminItem
  ver?: number
  workstatusInfo?: {
    workstatus: string
    wkstatusdes: string
    wkstcolor: string | null
    isActive: boolean
  }
  showBulkSelect?: boolean
  photoSize?: 'sm' | 'md'
  selected?: boolean
  onToggleSelect?: () => void
  showAdminActions?: boolean
  canImpersonate?: boolean
  onEdit: () => void
  onEditPhoto?: () => void
  onDelete: () => void
  onResetPassword?: () => void
  onLock?: () => void
  onUnlock?: () => void
  onImpersonate?: () => void
  onTelegramInvite?: () => void
  onTelegramUnlink?: () => void
  telegramInvitePending?: boolean
}) {
  const { t } = useTranslation('personnel')
  const fullName = useMemo(() => {
    const parts = [it.titlewkctr ?? '', it.namewkctr ?? '', it.surnamewkctr ?? '']
      .map((p) => p.trim())
      .filter(Boolean)
    return parts.join(' ').trim() || '—'
  }, [it])
  const workCntr = resolveWorkCntr(it)
  return (
    <TableRow>
      {showBulkSelect ? (
        <TableCell>
          <input
            type="checkbox"
            aria-label={t('admin.table.selectRow', { id: it.idwkctr })}
            checked={selected}
            onChange={onToggleSelect}
            className="size-4 rounded border-app"
          />
        </TableCell>
      ) : null}
      <TableCell>
        <PersonnelAvatar
          idwkctr={it.idwkctr}
          displayName={fullName !== '—' ? fullName : it.idwkctr}
          hasImage={it.hasImage}
          ver={ver}
          size={photoSize === 'md' ? 'md' : 'sm'}
        />
      </TableCell>
      <TableCell className="tabular-nums">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-xs font-semibold">{workCntr || '—'}</span>
          {isMissingEngWkctrCode(it.wkctr, it) ? (
            <Badge variant="outline" className="app-tone-info-outline-badge w-fit">
              {t('admin.table.noWorkCntr')}
            </Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell>{fullName}</TableCell>
      <TableCell className="font-mono text-xs text-app-muted">{it.idwkctr}</TableCell>
      <TableCell className="text-body-sm">{it.position ?? '—'}</TableCell>
      <TableCell className="text-body-sm">{it.department ?? '—'}</TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <UserroleBadge role={it.userrole} />
          <span className="text-caption">{t('admin.table.userSt', { code: it.userst })}</span>
          {it.passMustChange ? (
            <Badge variant="outline" className="app-tone-warning-badge w-fit">
              {t('admin.table.mustChangePassword')}
            </Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <WorkstatusBadge code={it.workstatus} info={workstatusInfo} />
          {it.telegramChatId ? (
            <Badge className="app-tone-success-fill w-fit text-badge" title={it.telegramUsername ?? undefined}>
              {t('admin.table.telegramLinked')}
            </Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex flex-wrap justify-end gap-1">
          {showAdminActions ? (
            <>
              {onTelegramInvite ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  title={t('admin.table.telegramInvite')}
                  disabled={telegramInvitePending}
                  onClick={onTelegramInvite}
                >
                  <MessageSquare className="size-3.5" />
                </Button>
              ) : null}
              {onTelegramUnlink ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  title={t('admin.table.telegramUnlink')}
                  onClick={onTelegramUnlink}
                >
                  <Link2Off className="size-3.5" />
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="outline"
                title={t('admin.table.resetPassword')}
                onClick={onResetPassword}
              >
                <KeyRound className="size-3.5" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                title={t('admin.table.lock')}
                onClick={onLock}
              >
                <Lock className="size-3.5" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                title={t('admin.table.unlock')}
                onClick={onUnlock}
              >
                <Unlock className="size-3.5" />
              </Button>
              {canImpersonate ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  title={t('admin.table.impersonate')}
                  onClick={onImpersonate}
                >
                  <LogIn className="size-3.5" />
                </Button>
              ) : null}
            </>
          ) : null}
          <Button type="button" size="sm" variant="outline" onClick={onEdit}>
            <Pencil className="mr-1 size-3.5" /> {t('admin.table.edit')}
          </Button>
          {onEditPhoto ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              title={t('admin.table.managePhoto')}
              onClick={onEditPhoto}
            >
              <ImageIcon className="size-3.5" />
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 className="mr-1 size-3.5" /> {t('admin.table.delete')}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

/**
 * Badge สีของ workstatus — ใช้สีจาก tbwkctrstatus.wkstcolor (tbwkstatus.wkstcolor)
 * - ถ้า workstatus ของ row ไม่อยู่ใน lookup (data เก่าก่อน 039) แสดงเป็น outline สีเทา
 * - ถ้า workstatus เป็น null/ว่าง แสดง "—" + tooltip
 */
function WorkstatusBadge({
  code,
  info,
}: {
  code: string | null
  info?: {
    workstatus: string
    wkstatusdes: string
    wkstcolor: string | null
    isActive: boolean
  }
}) {
  const { t } = useTranslation('personnel')
  if (!code) {
    return (
      <span className="text-xs text-app-muted" title={t('admin.workstatus.notSet')}>
        —
      </span>
    )
  }
  if (!info) {
    return (
      <Badge variant="outline" className="font-mono text-badge" title={t('admin.workstatus.unknownCode')}>
        {code}
      </Badge>
    )
  }
  const color = info.wkstcolor ?? 'var(--app-text-muted)'
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-medium"
      style={{
        backgroundColor: `${color}1a`, /* 10% alpha */
        color,
        boxShadow: `inset 0 0 0 1px ${color}66`,
      }}
      title={`${info.workstatus} — ${info.wkstatusdes}${info.isActive ? '' : t('admin.workstatus.inactiveSuffix')}`}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {info.wkstatusdes}
    </span>
  )
}

function ImagePanel({
  idwkctr,
  isEdit,
  hasImage,
  ver,
  pickRef,
  onPick,
  uploading,
  onClear,
  clearing,
}: {
  idwkctr: string
  isEdit: boolean
  hasImage: boolean
  ver?: number
  pickRef: React.RefObject<HTMLInputElement | null>
  onPick: (e: ChangeEvent<HTMLInputElement>) => void
  uploading: boolean
  onClear: () => void
  clearing: boolean
}) {
  const { t } = useTranslation('personnel')
  return (
    <div className="rounded-card border border-app bg-app-subtle p-4">
      <div className="text-body-sm font-medium text-app">{t('admin.photo.title')}</div>
      <p className="mt-1 text-xs text-app-muted">{t('admin.photo.hint')}</p>
      <div className="mt-3 flex items-start gap-4">
        {idwkctr ? (
          <PersonnelAvatar
            idwkctr={idwkctr}
            displayName={idwkctr}
            hasImage={hasImage}
            ver={ver}
            size="lg"
            className="rounded-button"
          />
        ) : (
          <div className="flex size-24 items-center justify-center rounded-button bg-app-muted text-app-muted">
            <ImageIcon className="size-8" aria-hidden />
          </div>
        )}
        <div className="flex-1 space-y-2">
          {!isEdit ? (
            <div className="app-tone-warning-callout rounded border p-3 text-xs">
              {t('admin.photo.saveFirst')}
            </div>
          ) : null}
          <input
            ref={pickRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPick}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!isEdit || uploading}
              onClick={() => pickRef.current?.click()}
            >
              <Upload className="mr-1 size-4" />
              {uploading ? t('admin.photo.uploading') : t('admin.photo.change')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={!isEdit || clearing}
              onClick={onClear}
            >
              <Trash2 className="mr-1 size-4" /> {t('admin.photo.remove')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ImportResultBlock({ data }: { data: PersonnelImportResponse }) {
  const { t } = useTranslation('personnel')
  return (
    <div className="app-card app-card-pad-compact">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-body-sm font-medium text-app">
          {t('admin.import.title', { fileName: data.fileName })}
        </div>
        <Badge variant="outline">{t('admin.import.total', { n: data.totalRows })}</Badge>
        <Badge variant="secondary">{t('admin.import.inserted', { n: data.inserted })}</Badge>
        <Badge variant="secondary">{t('admin.import.updated', { n: data.updated })}</Badge>
        <Badge variant={data.skipped > 0 ? 'destructive' : 'outline'}>
          {t('admin.import.skipped', { n: data.skipped })}
        </Badge>
        <Badge variant={data.errors > 0 ? 'destructive' : 'outline'}>
          {t('admin.import.errors', { n: data.errors })}
        </Badge>
      </div>
      {arrayLength(data.rows) > 0 ? (
        <div className="mt-3 app-table-shell overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">{t('admin.import.colRow')}</TableHead>
                <TableHead className="w-28">{t('admin.import.colStatus')}</TableHead>
                <TableHead>idwkctr</TableHead>
                <TableHead>{t('admin.import.colMessage')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((r) => (
                <TableRow key={`${r.rowNo}-${r.idwkctr}`}>
                  <TableCell className="text-center tabular-nums">
                    {r.rowNo}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.action === 'inserted' || r.action === 'updated'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {r.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.idwkctr}</TableCell>
                  <TableCell className="text-xs text-app-muted">
                    {r.message ?? ''}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  )
}

function FormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>
}

function Field({
  label,
  required,
  children,
}: {
  label: React.ReactNode
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-app-muted">
        {label}
        {required ? <span className="ml-1 text-form-error">*</span> : null}
      </Label>
      {children}
    </div>
  )
}

/**
 * Native <select> ดึงรายชื่อจาก master data
 * - แสดง placeholder "—" เมื่อยังไม่เลือก
 * - ถ้า value ปัจจุบันไม่ match กับ options (เช่น import เข้ามาด้วย id เก่า) จะ insert option fallback
 *   เพื่อไม่ทำให้ค่าหายตอน edit
 */
function LookupSelect({
  value,
  options,
  loading,
  onChange,
  placeholder,
}: {
  value: string
  options: PersonnelLookupOption[] | undefined
  loading: boolean
  onChange: (next: string) => void
  placeholder?: string
}) {
  const { t } = useTranslation('personnel')
  const ph = placeholder ?? t('admin.lookup.placeholder')
  const list = options ?? []
  const hasCurrent = value === '' || list.some((o) => o.value === value)
  return (
    <select
      value={value}
      disabled={loading}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-10 w-full rounded-button border border-app bg-[var(--app-surface)] px-3 py-2 text-body-sm text-app focus-app-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="">{loading ? t('admin.lookup.loading') : ph}</option>
      {!hasCurrent ? (
        <option value={value}>{t('admin.lookup.notInMaster', { value })}</option>
      ) : null}
      {list.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
