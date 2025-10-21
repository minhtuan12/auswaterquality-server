import express from 'express'
import { excelController } from '../controllers/excel.controller'

const router = express.Router()

router.get('/get-access-data', excelController.getAccessData)

export default router
