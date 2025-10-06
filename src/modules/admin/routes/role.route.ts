import express from 'express'
import { roleController } from '../controllers/role.controller'

const router = express.Router()

router.get('/', roleController.getLists)

// router.get('/:id', peopleController.getDetail)

router.post('/create', roleController.createData)

router.put('/:id/edit', roleController.updateData)

router.delete('/:id/delete', roleController.removeData)

export default router
