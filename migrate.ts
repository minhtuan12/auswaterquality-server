import dotenv from 'dotenv'
dotenv.config()

export default {
  uri: process.env.MONGO_URI,
  collection: 'migrations',
  migrationsPath: './src/migrations',
  templatePath: './migrations/template.ts',
  autosync: false,
}
