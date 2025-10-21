import express from 'express'
import { configurationController } from '../controllers/configuration.controller'

const router = express.Router()

router.get('/', configurationController.getDetails)

router.post('/edit', configurationController.updateData)

export default router
