import type { Express, Request, Response } from 'express'
import type { Pool } from 'pg'
import { auditMasterDataMutations } from '../middleware/audit-master-data.js'
import { createRequirePermission } from '../middleware/require-permission.js'
import {
  activityTypeBodySchema,
  activityTypeImportBodySchema,
  activityTypeImportResultSchema,
  activityTypePatchSchema,
  activityTypeItemSchema,
  departmentBodySchema,
  departmentItemSchema,
  departmentPatchSchema,
  equipmentBodySchema,
  equipmentImportBodySchema,
  equipmentImportResultSchema,
  equipmentItemSchema,
  equipmentPatchSchema,
  functionalBodySchema,
  functionalImportBodySchema,
  functionalImportResultSchema,
  functionalItemSchema,
  functionalPatchSchema,
  reasonBodySchema,
  reasonItemSchema,
  reasonPatchSchema,
  workStatusBodySchema,
  workStatusItemSchema,
  workStatusPatchSchema,
  workTypeBodySchema,
  workTypeItemSchema,
  workTypePatchSchema,
  zbBodySchema,
  zbItemSchema,
  zbPatchSchema,
  lineProductBodySchema,
  lineProductItemSchema,
  lineProductPatchSchema,
  lineProductImportBodySchema,
  lineProductImportResultSchema,
  zoneBodySchema,
  zoneImportBodySchema,
  zoneImportResultSchema,
  zoneItemSchema,
  zonePatchSchema,
  machineBodySchema,
  machineItemSchema,
  machinePatchSchema,
  machineImportBodySchema,
  machineImportResultSchema,
  materialBodySchema,
  materialItemSchema,
  materialPatchSchema,
  materialImportBodySchema,
  materialImportResultSchema,
  levelBodySchema,
  levelItemSchema,
  levelPatchSchema,
  positionBodySchema,
  positionItemSchema,
  positionPatchSchema,
  groupBodySchema,
  groupItemSchema,
  groupPatchSchema,
  tasklistBodySchema,
  tasklistItemSchema,
  tasklistPatchSchema,
  tasklistImportBodySchema,
  tasklistImportResultSchema,
  lineSchdulBodySchema,
  lineSchdulItemSchema,
  lineSchdulPatchSchema,
  lineSchdulImportBodySchema,
  lineSchdulImportResultSchema,
  isSupportedMasterEntity,
  masterDataResponseSchema,
  masterDataMetaResponseSchema,
} from '../schemas/master-data.js'
import {
  createActivityType,
  deleteActivityType,
  importActivityTypes,
  listActivityTypes,
  createDepartment,
  deleteDepartment,
  listDepartments,
  createEquipment,
  deleteEquipment,
  importEquipments,
  listEquipments,
  updateEquipment,
  createFunctional,
  deleteFunctional,
  importFunctionals,
  listFunctionals,
  updateFunctional,
  createReason,
  deleteReason,
  listReasons,
  updateReason,
  createWorkStatus,
  deleteWorkStatus,
  listWorkStatuses,
  updateWorkStatus,
  createWorkType,
  deleteWorkType,
  listWorkTypes,
  updateWorkType,
  createZb,
  deleteZb,
  listZbs,
  updateZb,
  createLineProduct,
  deleteLineProduct,
  importLineProducts,
  listLineProducts,
  updateLineProduct,
  createZone,
  deleteZone,
  importZones,
  listZones,
  updateZone,
  createMachine,
  deleteMachine,
  importMachines,
  listMachines,
  updateMachine,
  createMaterial,
  deleteMaterial,
  importMaterials,
  listMaterials,
  updateMaterial,
  createLevel,
  deleteLevel,
  listLevels,
  updateLevel,
  createPosition,
  deletePosition,
  listPositions,
  updatePosition,
  createGroup,
  deleteGroup,
  listGroups,
  updateGroup,
  createTasklist,
  deleteTasklist,
  importTasklists,
  listTasklists,
  updateTasklist,
  createLineSchdul,
  deleteLineSchdul,
  importLineSchduls,
  listLineSchduls,
  updateLineSchdul,
  updateDepartment,
  updateActivityType,
  getMasterDataMeta,
} from '../services/master-data.js'

export function registerMasterDataRoutes(
  app: Express,
  pool: Pool,
  sessionSecret: string,
) {
  const perm = createRequirePermission(pool, sessionSecret)
  const requireRead = perm('master-data.read')
  const requireWrite = perm('master-data.write')
  const requireDelete = perm('master-data.delete')
  const requireImport = perm('master-data.import')

  app.use('/api/v1/master-data', auditMasterDataMutations(pool))

  app.get(
    '/api/v1/master-data/:entity/meta',
    ...requireRead,
    async (req: Request, res: Response) => {
      const entity = String(req.params.entity ?? '').toLowerCase()

      if (!isSupportedMasterEntity(entity)) {
        res.status(501).json({
          error: 'NOT_IMPLEMENTED',
          message: `Master entity "${entity}" ยังไม่มีตารางใน PostgreSQL — รองรับ: activitytype, department, equipment, functional, reason, workstatus, worktype, zb, lineproduct, zone, machine, material, level, position, group, tasklist, lineschdul`,
        })
        return
      }

      const meta = await getMasterDataMeta(pool, entity)
      res.json(masterDataMetaResponseSchema.parse(meta))
    },
  )

  app.get('/api/v1/master-data/:entity', ...requireRead, async (req: Request, res: Response) => {
    const entity = String(req.params.entity ?? '').toLowerCase()

    if (!isSupportedMasterEntity(entity)) {
      res.status(501).json({
        error: 'NOT_IMPLEMENTED',
        message: `Master entity "${entity}" ยังไม่มีตารางใน PostgreSQL — รองรับ: activitytype, department, equipment, functional, reason, workstatus, worktype, zb, lineproduct, zone, machine, material, level, position, group, tasklist, lineschdul`,
      })
      return
    }

    const items = entity === 'activitytype'
      ? await listActivityTypes(pool)
      : entity === 'department'
        ? await listDepartments(pool)
        : entity === 'equipment'
          ? await listEquipments(pool)
          : entity === 'functional'
            ? await listFunctionals(pool)
            : entity === 'reason'
              ? await listReasons(pool)
              : entity === 'workstatus'
                ? await listWorkStatuses(pool)
                : entity === 'worktype'
                  ? await listWorkTypes(pool)
                  : entity === 'zb'
                    ? await listZbs(pool)
                  : entity === 'lineproduct'
                    ? await listLineProducts(pool)
                    : entity === 'zone'
                      ? await listZones(pool)
                      : entity === 'machine'
                        ? await listMachines(pool)
                        : entity === 'material'
                          ? await listMaterials(pool)
                          : entity === 'level'
                            ? await listLevels(pool)
                            : entity === 'position'
                              ? await listPositions(pool)
                              : entity === 'group'
                                ? await listGroups(pool)
                                : entity === 'tasklist'
                                  ? await listTasklists(pool)
                                  : entity === 'lineschdul'
                                    ? await listLineSchduls(pool)
        : []

    res.json(masterDataResponseSchema.parse({ entity, items }))
  })

  app.post(
    '/api/v1/master-data/activitytype',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const parsed = activityTypeBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      try {
        const item = await createActivityType(pool, parsed.data)
        res.status(201).json({ item: activityTypeItemSchema.parse(item) })
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        if (message.includes('duplicate key') || message.includes('unique')) {
          res.status(409).json({ error: 'CONFLICT', message: 'mat already exists' })
          return
        }
        throw err
      }
    },
  )

  app.put(
    '/api/v1/master-data/activitytype/:mat',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const mat = String(req.params.mat ?? '')
      const parsed = activityTypePatchSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const item = await updateActivityType(pool, mat, parsed.data)
      if (!item) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.json({ item: activityTypeItemSchema.parse(item) })
    },
  )

  app.delete(
    '/api/v1/master-data/activitytype/:mat',
    ...requireDelete,
    async (req: Request, res: Response) => {
      const mat = String(req.params.mat ?? '')
      const ok = await deleteActivityType(pool, mat)
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.status(204).send()
    },
  )

  app.post(
    '/api/v1/master-data/activitytype/import',
    ...requireImport,
    async (req: Request, res: Response) => {
      const parsed = activityTypeImportBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const result = await importActivityTypes(pool, parsed.data.rows)
      res.json(activityTypeImportResultSchema.parse(result))
    },
  )

  app.post(
    '/api/v1/master-data/department',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const parsed = departmentBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      try {
        const item = await createDepartment(pool, parsed.data)
        res.status(201).json({ item: departmentItemSchema.parse(item) })
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        if (message.includes('duplicate key') || message.includes('unique')) {
          res.status(409).json({ error: 'CONFLICT', message: 'iddepartment already exists' })
          return
        }
        throw err
      }
    },
  )

  app.put(
    '/api/v1/master-data/department/:iddepartment',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const iddepartment = String(req.params.iddepartment ?? '')
      const parsed = departmentPatchSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const item = await updateDepartment(pool, iddepartment, parsed.data)
      if (!item) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.json({ item: departmentItemSchema.parse(item) })
    },
  )

  app.delete(
    '/api/v1/master-data/department/:iddepartment',
    ...requireDelete,
    async (req: Request, res: Response) => {
      const iddepartment = String(req.params.iddepartment ?? '')
      const ok = await deleteDepartment(pool, iddepartment)
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.status(204).send()
    },
  )

  app.post(
    '/api/v1/master-data/equipment',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const parsed = equipmentBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      try {
        const item = await createEquipment(pool, parsed.data)
        res.status(201).json({ item: equipmentItemSchema.parse(item) })
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        if (message.includes('duplicate key') || message.includes('unique')) {
          res.status(409).json({ error: 'CONFLICT', message: 'equipment already exists' })
          return
        }
        throw err
      }
    },
  )

  app.put(
    '/api/v1/master-data/equipment/:equipment',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const equipment = String(req.params.equipment ?? '')
      const parsed = equipmentPatchSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const item = await updateEquipment(pool, equipment, parsed.data)
      if (!item) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.json({ item: equipmentItemSchema.parse(item) })
    },
  )

  app.delete(
    '/api/v1/master-data/equipment/:equipment',
    ...requireDelete,
    async (req: Request, res: Response) => {
      const equipment = String(req.params.equipment ?? '')
      const ok = await deleteEquipment(pool, equipment)
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.status(204).send()
    },
  )

  app.post(
    '/api/v1/master-data/equipment/import',
    ...requireImport,
    async (req: Request, res: Response) => {
      const parsed = equipmentImportBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const result = await importEquipments(pool, parsed.data.rows)
      res.json(equipmentImportResultSchema.parse(result))
    },
  )

  app.post(
    '/api/v1/master-data/functional',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const parsed = functionalBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      try {
        const item = await createFunctional(pool, parsed.data)
        res.status(201).json({ item: functionalItemSchema.parse(item) })
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        if (message.includes('duplicate key') || message.includes('unique')) {
          res.status(409).json({ error: 'CONFLICT', message: 'functionalloc already exists' })
          return
        }
        throw err
      }
    },
  )

  app.put(
    '/api/v1/master-data/functional/:functionalloc',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const functionalloc = String(req.params.functionalloc ?? '')
      const parsed = functionalPatchSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const item = await updateFunctional(pool, functionalloc, parsed.data)
      if (!item) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.json({ item: functionalItemSchema.parse(item) })
    },
  )

  app.delete(
    '/api/v1/master-data/functional/:functionalloc',
    ...requireDelete,
    async (req: Request, res: Response) => {
      const functionalloc = String(req.params.functionalloc ?? '')
      const ok = await deleteFunctional(pool, functionalloc)
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.status(204).send()
    },
  )

  app.post(
    '/api/v1/master-data/functional/import',
    ...requireImport,
    async (req: Request, res: Response) => {
      const parsed = functionalImportBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const result = await importFunctionals(pool, parsed.data.rows)
      res.json(functionalImportResultSchema.parse(result))
    },
  )

  app.post(
    '/api/v1/master-data/reason',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const parsed = reasonBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      try {
        const item = await createReason(pool, parsed.data)
        res.status(201).json({ item: reasonItemSchema.parse(item) })
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        if (message.includes('duplicate key') || message.includes('unique')) {
          res.status(409).json({ error: 'CONFLICT', message: 'reasoncode already exists' })
          return
        }
        throw err
      }
    },
  )

  app.put(
    '/api/v1/master-data/reason/:reasoncode',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const reasoncode = String(req.params.reasoncode ?? '')
      const parsed = reasonPatchSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const item = await updateReason(pool, reasoncode, parsed.data)
      if (!item) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.json({ item: reasonItemSchema.parse(item) })
    },
  )

  app.delete(
    '/api/v1/master-data/reason/:reasoncode',
    ...requireDelete,
    async (req: Request, res: Response) => {
      const reasoncode = String(req.params.reasoncode ?? '')
      const ok = await deleteReason(pool, reasoncode)
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.status(204).send()
    },
  )

  app.post(
    '/api/v1/master-data/workstatus',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const parsed = workStatusBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      try {
        const item = await createWorkStatus(pool, parsed.data)
        res.status(201).json({ item: workStatusItemSchema.parse(item) })
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        if (message.includes('duplicate key') || message.includes('unique')) {
          res.status(409).json({ error: 'CONFLICT', message: 'syst already exists' })
          return
        }
        throw err
      }
    },
  )

  app.put(
    '/api/v1/master-data/workstatus/:syst',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const syst = String(req.params.syst ?? '')
      const parsed = workStatusPatchSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const item = await updateWorkStatus(pool, syst, parsed.data)
      if (!item) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.json({ item: workStatusItemSchema.parse(item) })
    },
  )

  app.delete(
    '/api/v1/master-data/workstatus/:syst',
    ...requireDelete,
    async (req: Request, res: Response) => {
      const syst = String(req.params.syst ?? '')
      const ok = await deleteWorkStatus(pool, syst)
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.status(204).send()
    },
  )

  app.post(
    '/api/v1/master-data/worktype',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const parsed = workTypeBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      try {
        const item = await createWorkType(pool, parsed.data)
        res.status(201).json({ item: workTypeItemSchema.parse(item) })
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        if (message.includes('duplicate key') || message.includes('unique')) {
          res.status(409).json({ error: 'CONFLICT', message: 'idwkctrtype already exists' })
          return
        }
        throw err
      }
    },
  )

  app.put(
    '/api/v1/master-data/worktype/:idwkctrtype',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const idwkctrtype = String(req.params.idwkctrtype ?? '')
      const parsed = workTypePatchSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const item = await updateWorkType(pool, idwkctrtype, parsed.data)
      if (!item) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.json({ item: workTypeItemSchema.parse(item) })
    },
  )

  app.delete(
    '/api/v1/master-data/worktype/:idwkctrtype',
    ...requireDelete,
    async (req: Request, res: Response) => {
      const idwkctrtype = String(req.params.idwkctrtype ?? '')
      const ok = await deleteWorkType(pool, idwkctrtype)
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.status(204).send()
    },
  )

  app.post(
    '/api/v1/master-data/zb',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const parsed = zbBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      try {
        const item = await createZb(pool, parsed.data)
        res.status(201).json({ item: zbItemSchema.parse(item) })
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        if (message.includes('duplicate key') || message.includes('unique')) {
          res.status(409).json({ error: 'CONFLICT', message: 'wkzb already exists' })
          return
        }
        throw err
      }
    },
  )

  app.put(
    '/api/v1/master-data/zb/:wkzb',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const wkzb = String(req.params.wkzb ?? '')
      const parsed = zbPatchSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const item = await updateZb(pool, wkzb, parsed.data)
      if (!item) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.json({ item: zbItemSchema.parse(item) })
    },
  )

  app.delete(
    '/api/v1/master-data/zb/:wkzb',
    ...requireDelete,
    async (req: Request, res: Response) => {
      const wkzb = String(req.params.wkzb ?? '')
      const ok = await deleteZb(pool, wkzb)
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.status(204).send()
    },
  )

  app.post(
    '/api/v1/master-data/lineproduct',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const parsed = lineProductBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      try {
        const item = await createLineProduct(pool, parsed.data)
        res.status(201).json({ item: lineProductItemSchema.parse(item) })
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        if (message.includes('duplicate key') || message.includes('unique')) {
          res.status(409).json({ error: 'CONFLICT', message: 'productline already exists' })
          return
        }
        throw err
      }
    },
  )

  app.put(
    '/api/v1/master-data/lineproduct/:productline',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const productline = String(req.params.productline ?? '')
      const parsed = lineProductPatchSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const item = await updateLineProduct(pool, productline, parsed.data)
      if (!item) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.json({ item: lineProductItemSchema.parse(item) })
    },
  )

  app.delete(
    '/api/v1/master-data/lineproduct/:productline',
    ...requireDelete,
    async (req: Request, res: Response) => {
      const productline = String(req.params.productline ?? '')
      const ok = await deleteLineProduct(pool, productline)
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.status(204).send()
    },
  )

  app.post(
    '/api/v1/master-data/lineproduct/import',
    ...requireImport,
    async (req: Request, res: Response) => {
      const parsed = lineProductImportBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const result = await importLineProducts(pool, parsed.data.rows)
      res.json(lineProductImportResultSchema.parse(result))
    },
  )

  app.post(
    '/api/v1/master-data/zone',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const parsed = zoneBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      try {
        const item = await createZone(pool, parsed.data)
        res.status(201).json({ item: zoneItemSchema.parse(item) })
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        if (message.includes('duplicate key') || message.includes('unique')) {
          res.status(409).json({ error: 'CONFLICT', message: 'idzone already exists' })
          return
        }
        throw err
      }
    },
  )

  app.put(
    '/api/v1/master-data/zone/:idzone',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const idzone = String(req.params.idzone ?? '')
      const parsed = zonePatchSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const item = await updateZone(pool, idzone, parsed.data)
      if (!item) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.json({ item: zoneItemSchema.parse(item) })
    },
  )

  app.delete(
    '/api/v1/master-data/zone/:idzone',
    ...requireDelete,
    async (req: Request, res: Response) => {
      const idzone = String(req.params.idzone ?? '')
      const ok = await deleteZone(pool, idzone)
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.status(204).send()
    },
  )

  app.post(
    '/api/v1/master-data/zone/import',
    ...requireImport,
    async (req: Request, res: Response) => {
      const parsed = zoneImportBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const result = await importZones(pool, parsed.data.rows)
      res.json(zoneImportResultSchema.parse(result))
    },
  )

  app.post(
    '/api/v1/master-data/machine',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const parsed = machineBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      try {
        const item = await createMachine(pool, parsed.data)
        res.status(201).json({ item: machineItemSchema.parse(item) })
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        if (message.includes('duplicate key') || message.includes('unique')) {
          res.status(409).json({ error: 'CONFLICT', message: 'machine already exists' })
          return
        }
        throw err
      }
    },
  )

  app.put(
    '/api/v1/master-data/machine/:machine',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const machine = String(req.params.machine ?? '')
      const parsed = machinePatchSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const item = await updateMachine(pool, machine, parsed.data)
      if (!item) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.json({ item: machineItemSchema.parse(item) })
    },
  )

  app.delete(
    '/api/v1/master-data/machine/:machine',
    ...requireDelete,
    async (req: Request, res: Response) => {
      const machine = String(req.params.machine ?? '')
      const ok = await deleteMachine(pool, machine)
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.status(204).send()
    },
  )

  app.post(
    '/api/v1/master-data/machine/import',
    ...requireImport,
    async (req: Request, res: Response) => {
      const parsed = machineImportBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const result = await importMachines(pool, parsed.data.rows)
      res.json(machineImportResultSchema.parse(result))
    },
  )

  app.post(
    '/api/v1/master-data/material',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const parsed = materialBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const item = await createMaterial(pool, parsed.data)
      res.status(201).json({ item: materialItemSchema.parse(item) })
    },
  )

  app.put(
    '/api/v1/master-data/material/:idmaterial',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const idmaterial = Number(req.params.idmaterial)
      if (!Number.isFinite(idmaterial)) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'idmaterial must be a number' })
        return
      }
      const parsed = materialPatchSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const item = await updateMaterial(pool, idmaterial, parsed.data)
      if (!item) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.json({ item: materialItemSchema.parse(item) })
    },
  )

  app.delete(
    '/api/v1/master-data/material/:idmaterial',
    ...requireDelete,
    async (req: Request, res: Response) => {
      const idmaterial = Number(req.params.idmaterial)
      if (!Number.isFinite(idmaterial)) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'idmaterial must be a number' })
        return
      }
      const ok = await deleteMaterial(pool, idmaterial)
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.status(204).send()
    },
  )

  app.post(
    '/api/v1/master-data/material/import',
    ...requireImport,
    async (req: Request, res: Response) => {
      const parsed = materialImportBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const result = await importMaterials(pool, parsed.data.rows)
      res.json(materialImportResultSchema.parse(result))
    },
  )

  app.post(
    '/api/v1/master-data/level',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const parsed = levelBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      try {
        const item = await createLevel(pool, parsed.data)
        res.status(201).json({ item: levelItemSchema.parse(item) })
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        if (message.includes('duplicate key') || message.includes('unique')) {
          res.status(409).json({ error: 'CONFLICT', message: 'idwklevel already exists' })
          return
        }
        throw err
      }
    },
  )

  app.put(
    '/api/v1/master-data/level/:idwklevel',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const idwklevel = String(req.params.idwklevel ?? '')
      const parsed = levelPatchSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const item = await updateLevel(pool, idwklevel, parsed.data)
      if (!item) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.json({ item: levelItemSchema.parse(item) })
    },
  )

  app.delete(
    '/api/v1/master-data/level/:idwklevel',
    ...requireDelete,
    async (req: Request, res: Response) => {
      const idwklevel = String(req.params.idwklevel ?? '')
      const ok = await deleteLevel(pool, idwklevel)
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.status(204).send()
    },
  )

  app.post(
    '/api/v1/master-data/position',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const parsed = positionBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      try {
        const item = await createPosition(pool, parsed.data)
        res.status(201).json({ item: positionItemSchema.parse(item) })
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        if (message.includes('duplicate key') || message.includes('unique')) {
          res.status(409).json({ error: 'CONFLICT', message: 'idposition already exists' })
          return
        }
        throw err
      }
    },
  )

  app.put(
    '/api/v1/master-data/position/:idposition',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const idposition = String(req.params.idposition ?? '')
      const parsed = positionPatchSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const item = await updatePosition(pool, idposition, parsed.data)
      if (!item) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.json({ item: positionItemSchema.parse(item) })
    },
  )

  app.delete(
    '/api/v1/master-data/position/:idposition',
    ...requireDelete,
    async (req: Request, res: Response) => {
      const idposition = String(req.params.idposition ?? '')
      const ok = await deletePosition(pool, idposition)
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.status(204).send()
    },
  )

  app.post(
    '/api/v1/master-data/group',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const parsed = groupBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      try {
        const item = await createGroup(pool, parsed.data)
        res.status(201).json({ item: groupItemSchema.parse(item) })
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        if (message.includes('duplicate key') || message.includes('unique')) {
          res.status(409).json({ error: 'CONFLICT', message: 'wkctrgroup already exists' })
          return
        }
        throw err
      }
    },
  )

  app.put(
    '/api/v1/master-data/group/:idwkctrgroup',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const idwkctrgroup = Number(req.params.idwkctrgroup)
      if (!Number.isFinite(idwkctrgroup)) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'idwkctrgroup must be a number' })
        return
      }
      const parsed = groupPatchSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const item = await updateGroup(pool, idwkctrgroup, parsed.data)
      if (!item) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.json({ item: groupItemSchema.parse(item) })
    },
  )

  app.delete(
    '/api/v1/master-data/group/:idwkctrgroup',
    ...requireDelete,
    async (req: Request, res: Response) => {
      const idwkctrgroup = Number(req.params.idwkctrgroup)
      if (!Number.isFinite(idwkctrgroup)) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'idwkctrgroup must be a number' })
        return
      }
      const ok = await deleteGroup(pool, idwkctrgroup)
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.status(204).send()
    },
  )

  app.post(
    '/api/v1/master-data/tasklist',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const parsed = tasklistBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      try {
        const item = await createTasklist(pool, parsed.data)
        res.status(201).json({ item: tasklistItemSchema.parse(item) })
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        if (message.includes('duplicate key') || message.includes('unique')) {
          res.status(409).json({ error: 'CONFLICT', message: 'tasklist already exists' })
          return
        }
        throw err
      }
    },
  )

  app.put(
    '/api/v1/master-data/tasklist/:idtasklist',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const idtasklist = Number(req.params.idtasklist)
      if (!Number.isFinite(idtasklist)) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'idtasklist must be a number' })
        return
      }
      const parsed = tasklistPatchSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const item = await updateTasklist(pool, idtasklist, parsed.data)
      if (!item) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.json({ item: tasklistItemSchema.parse(item) })
    },
  )

  app.delete(
    '/api/v1/master-data/tasklist/:idtasklist',
    ...requireDelete,
    async (req: Request, res: Response) => {
      const idtasklist = Number(req.params.idtasklist)
      if (!Number.isFinite(idtasklist)) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'idtasklist must be a number' })
        return
      }
      const ok = await deleteTasklist(pool, idtasklist)
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.status(204).send()
    },
  )

  app.post(
    '/api/v1/master-data/tasklist/import',
    ...requireImport,
    async (req: Request, res: Response) => {
      const parsed = tasklistImportBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const result = await importTasklists(pool, parsed.data.rows)
      res.json(tasklistImportResultSchema.parse(result))
    },
  )

  app.post(
    '/api/v1/master-data/lineschdul',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const parsed = lineSchdulBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      try {
        const item = await createLineSchdul(pool, parsed.data)
        res.status(201).json({ item: lineSchdulItemSchema.parse(item) })
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        if (message.includes('duplicate key') || message.includes('unique')) {
          res.status(409).json({ error: 'CONFLICT', message: 'lineschdul already exists' })
          return
        }
        throw err
      }
    },
  )

  app.put(
    '/api/v1/master-data/lineschdul/:idline',
    ...requireWrite,
    async (req: Request, res: Response) => {
      const idline = Number(req.params.idline)
      if (!Number.isFinite(idline)) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'idline must be a number' })
        return
      }
      const parsed = lineSchdulPatchSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      try {
        const item = await updateLineSchdul(pool, idline, parsed.data)
        if (!item) {
          res.status(404).json({ error: 'NOT_FOUND' })
          return
        }
        res.json({ item: lineSchdulItemSchema.parse(item) })
      } catch (err) {
        const message = err instanceof Error ? err.message : ''
        if (message.includes('duplicate key') || message.includes('unique')) {
          res.status(409).json({ error: 'CONFLICT', message: 'lineschdul already exists' })
          return
        }
        throw err
      }
    },
  )

  app.delete(
    '/api/v1/master-data/lineschdul/:idline',
    ...requireDelete,
    async (req: Request, res: Response) => {
      const idline = Number(req.params.idline)
      if (!Number.isFinite(idline)) {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'idline must be a number' })
        return
      }
      const ok = await deleteLineSchdul(pool, idline)
      if (!ok) {
        res.status(404).json({ error: 'NOT_FOUND' })
        return
      }
      res.status(204).send()
    },
  )

  app.post(
    '/api/v1/master-data/lineschdul/import',
    ...requireImport,
    async (req: Request, res: Response) => {
      const parsed = lineSchdulImportBodySchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(400).json({ error: 'VALIDATION_ERROR', issues: parsed.error.issues })
        return
      }
      const result = await importLineSchduls(pool, parsed.data.rows)
      res.json(lineSchdulImportResultSchema.parse(result))
    },
  )
}
