import express from 'express'
import { userController } from '../controllers/user.controller'
import { Permission } from '../../../enums/permission.enum'
import { filterMiddleware } from '../../../middlewares/filter.middleware'

const router = express.Router()

router.get('/get-my-profile', userController.getMyProfile)

router.get('/lists', userController.getListUser)

router.post('/create', filterMiddleware(Permission.USER_CREATE), userController.createUser)

export default router
