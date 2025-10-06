import express from 'express'
import { peopleController } from '../controllers/people.controller'

const router = express.Router()

router.get('/', peopleController.getLists)

router.post('/create', peopleController.createData)

router.put('/:id/edit', peopleController.updateData)

router.delete('/:id/delete', peopleController.removeData)

export default router
