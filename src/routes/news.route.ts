import path from 'path'
import multer, { FileFilterCallback } from 'multer'
import express from 'express'
import { newsController } from '../controllers/news.controller'

const storage = multer.memoryStorage()

const ALLOWED_TYPES = ['.jpg', '.jpeg', '.png']

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase()
  if (!ALLOWED_TYPES.includes(ext)) {
    return cb(new Error('Only .jpg, .jpeg, .png files are allowed'))
  }
  cb(null, true)
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // max 1MB globally
  },
})

const router = express.Router()

router.get('/', newsController.getAdminLists)
router.get('/get-list', newsController.getLists)
router.get('/get-highlight-list', newsController.getHighlightLists)

router.get('/detail/:slug', newsController.getDetail)
router.get('/:id', newsController.getAdminDetail)

router.post(
  '/',
  upload.fields([
    { name: 'title' },
    { name: 'shortDesc' },
    { name: 'category' },
    { name: 'content' },
    { name: 'thumbnailImage' },
    { name: 'coverImage' },
  ]),
  newsController.createNews,
)

router.put(
  '/:id',
  upload.fields([
    { name: 'title' },
    { name: 'shortDesc' },
    { name: 'category' },
    { name: 'content' },
    { name: 'thumbnailImage' },
    { name: 'coverImage' },
  ]),
  newsController.updateNews,
)

router.post('/upload', upload.fields([{ name: 'file' }]), newsController.fileUpload)

router.delete('/:id', newsController.deleteNews)

router.put('/publish/:id', newsController.publishNews)

router.put('/unpublish/:id', newsController.unpublishNews)

router.put('/request-publish/:id', newsController.requestPublishNews)

export default router
