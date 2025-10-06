import express from 'express'
import { peopleController } from '../controllers/people.controller'

const router = express.Router()

router.get('/', peopleController.getLists)

export default router
