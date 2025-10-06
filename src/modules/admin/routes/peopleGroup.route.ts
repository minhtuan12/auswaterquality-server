import express from 'express'
import { peopleController } from '../controllers/people.controller'

const router = express.Router()

router.get('/', peopleController.getListsGroup)

router.post('/create', peopleController.createGroupData)

router.put('/:id/edit', peopleController.updateGroupData)

export default router
