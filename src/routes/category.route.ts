import express from 'express'
import { categoryController } from '../controllers/category.controller'

const router = express.Router()

router.get('/', categoryController.getLists)

router.get('/:id', categoryController.getDetail)

router.post('/', categoryController.createCategory)

router.put('/:id', categoryController.updateCategory)

router.delete('/:id', categoryController.deleteCategory)

export default router
