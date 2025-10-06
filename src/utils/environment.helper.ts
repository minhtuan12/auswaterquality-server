import 'dotenv/config'

export const EnvironmentHelper = {
  getJWTSecret: () => {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables.')
    }
    return jwtSecret
  },
  getAllowedKey: () => {
    const allowedKey = process.env.ALLOWED_KEY
    if (!allowedKey) {
      throw new Error('ALLOWED_KEY is not defined in environment variables')
    }
    return allowedKey
  },
  getCloudinaryName: () => {
    const cloudinaryName = process.env.CLOUDINARY_NAME
    if (!cloudinaryName) {
      throw new Error('CLOUDINARY_NAME is not defined in environment variables')
    }
    return cloudinaryName
  },
  getCloudinaryApiKey: () => {
    const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY
    if (!cloudinaryApiKey) {
      throw new Error('CLOUDINARY_API_KEY is not defined in environment variables')
    }
    return cloudinaryApiKey
  },
  getCloudinaryApiSecret: () => {
    const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET
    if (!cloudinaryApiSecret) {
      throw new Error('CLOUDINARY_API_SECRET is not defined in environment variables')
    }
    return cloudinaryApiSecret
  },
  getEmailHost: () => {
    const emailHost = process.env.EMAIL_HOST
    if (!emailHost) {
      throw new Error('EMAIL_HOST is not defined in environment variables')
    }
    return emailHost
  },
  getEmailPort: () => {
    const emailPort = process.env.EMAIL_PORT
    if (!emailPort) {
      throw new Error('EMAIL_PORT is not defined in environment variables')
    }
    return emailPort
  },
  getEmailUser: () => {
    const emailUser = process.env.EMAIL_USER
    if (!emailUser) {
      throw new Error('EMAIL_USER is not defined in environment variables')
    }
    return emailUser
  },
  getEmailPass: () => {
    const emailPass = process.env.EMAIL_PASS
    if (!emailPass) {
      throw new Error('EMAIL_PASS is not defined in environment variables')
    }
    return emailPass
  },
  getEmailTo: () => {
    const emailTo = process.env.EMAIL_TO
    if (!emailTo) {
      throw new Error('EMAIL_TO is not defined in environment variables')
    }
    return emailTo
  },
}
