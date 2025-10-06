import { v2 as cloudinary } from 'cloudinary'
import { EnvironmentHelper } from './environment.helper'

cloudinary.config({
  cloud_name: EnvironmentHelper.getCloudinaryName(),
  api_key: EnvironmentHelper.getCloudinaryApiKey(),
  api_secret: EnvironmentHelper.getCloudinaryApiSecret(),
})

export const CloudinaryHelper = {
  getPublicIdFromUrl: (url: string) => {
    const parts = url.split('/')
    const fileName = parts[parts.length - 1].split('.')[0]
    const folder = parts[parts.length - 2]
    return `${folder}/${fileName}`
  },
  upload: async (fileBuffer: Buffer, filename: string) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'news',
            resource_type: 'image',
            public_id: filename.split('.')[0],
          },
          (error, result) => {
            if (error) return reject(error)
            resolve(result)
          },
        )
        .end(fileBuffer)
    })
  },
  delete: async (publicId: string) => {
    try {
      const result = await cloudinary.uploader.destroy(publicId)
      console.log('Deleted from Cloudinary:', result)
      return result
    } catch (error) {
      console.error('Cloudinary deletion error:', error)
      throw error
    }
  },
}
