import express, { Request, Response } from 'express'
import fs from 'fs'
import http from 'http'
import https from 'https'
import mongoose from 'mongoose'
import cors from 'cors'
import 'dotenv/config'
import authRoutes from './routes/auth.route'
import newsRoutes from './routes/news.route'
import adwrRoutes from './routes/adwr.route'
import excelRoutes from './routes/excel.route'
import categoryRoutes from './routes/category.route'
import peopleRoutes from './modules/main/routes/people.route'
import userManagementRoutes from './modules/admin/routes/user.route'
import roleManagementRoutes from './modules/admin/routes/role.route'
import peopleManagementRoutes from './modules/admin/routes/people.route'
import peopleGroupManagementRoutes from './modules/admin/routes/peopleGroup.route'
import configurationRoutes from './routes/configuration.route'
import { authMiddleware } from './middlewares/auth.middleware'
import ResponseHelper from './utils/response.helper'
import { HttpStatusCode } from './enums/httpCode.enum'
import { NodeMailerHelper } from './utils/nodemailer.helper'
import { ADWRModel, NewsModel } from './models'
import ParameterModel from './models/parameter.model'

const app = express()
const LOCAL_PORT = process.env.LOCAL_PORT
const PORT = process.env.PORT
const mongoURI = process.env.MONGO_URI ?? ''

mongoose
  .connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err))

const corsOptions = {
  origin: true,
  credentials: true,
  methods: 'GET,PUT,POST,OPTIONS,PATCH,DELETE',
}

if (LOCAL_PORT) {
  http.createServer(app).listen(LOCAL_PORT, () => {
    console.log(`Server is running on local port ${LOCAL_PORT}`)
  })
}

if (PORT) {
  const options = {
    key: fs.readFileSync('./certs/fdatapro-net-key.pem'),
    cert: fs.readFileSync('./certs/fdatapro-net-crt.pem'),
  }

  https.createServer(options, app).listen(PORT, () => {
    console.log(`Server is running on remote port ${PORT}`)
  })
}

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
app.use(express.json())
app.get('/check-health', (req: Request, res: Response) => {
  res.json('Oke')
})
app.use('/api/auth', authRoutes)
app.use('/api/news', newsRoutes)
app.use('/api/category', categoryRoutes)
app.use('/api/configuration', configurationRoutes)
app.use('/api/adwr', adwrRoutes)
app.use('/api/people', peopleRoutes)

app.use('/api/user-managements', authMiddleware, userManagementRoutes)
app.use('/api/role-managements', authMiddleware, roleManagementRoutes)
app.use('/api/people-managements', authMiddleware, peopleManagementRoutes)
app.use('/api/people-group-managements', authMiddleware, peopleGroupManagementRoutes)

app.get('/api/parameters', async (req: any, res: any) => {
  let { state = null } = req.query
  const stateValue = (state && state !== 'All') ? state : null;
  try {
    const matchStage: any = {};

    if (stateValue) {
      matchStage["stateInfo.code"] = stateValue;
    }
    let result: any;
    if (stateValue) {
      result = await ParameterModel.aggregate([
        {
          $facet: {
            health: [
              { $match: { type: "health" } },
              {
                $lookup: {
                  from: "adwrs",
                  let: { paramName: "$name" },
                  pipeline: [
                    // Join với community và state để lọc
                    {
                      $lookup: {
                        from: "communities",
                        localField: "community",
                        foreignField: "_id",
                        as: "communityInfo",
                        pipeline: [{ $project: { name: 1, state: 1 } }],
                      },
                    },
                    {
                      $lookup: {
                        from: "states",
                        localField: "communityInfo.state",
                        foreignField: "_id",
                        as: "stateInfo",
                        pipeline: [{ $project: { code: 1 } }],
                      },
                    },
                    { $unwind: "$communityInfo" },
                    ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),

                    // Chỉ giữ bản ghi có chứa key tương ứng trong healthParameters
                    {
                      $match: {
                        $expr: {
                          $in: [
                            "$$paramName",
                            {
                              $map: {
                                input: { $objectToArray: { $ifNull: ["$healthParameters", {}] } },
                                as: "h",
                                in: "$$h.k",
                              },
                            },
                          ],
                        },
                      },
                    },
                    { $limit: 1 }, // chỉ cần biết có xuất hiện, không cần toàn bộ
                  ],
                  as: "matched",
                },
              },
              {
                $project: {
                  _id: 0,
                  name: 1,
                  displayName: 1,
                  matched: { $gt: [{ $size: "$matched" }, 0] },
                },
              },
              { $match: { matched: true } },
              { $project: { matched: 0 } },
            ],

            aesthetic: [
              { $match: { type: "aesthetic" } },
              {
                $lookup: {
                  from: "adwrs",
                  let: { paramName: "$name" },
                  pipeline: [
                    {
                      $lookup: {
                        from: "communities",
                        localField: "community",
                        foreignField: "_id",
                        as: "communityInfo",
                        pipeline: [{ $project: { name: 1, state: 1 } }],
                      },
                    },
                    {
                      $lookup: {
                        from: "states",
                        localField: "communityInfo.state",
                        foreignField: "_id",
                        as: "stateInfo",
                        pipeline: [{ $project: { code: 1 } }],
                      },
                    },
                    { $unwind: "$communityInfo" },
                    ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),

                    // Chỉ giữ bản ghi có chứa key tương ứng trong aestheticParameters
                    {
                      $match: {
                        $expr: {
                          $in: [
                            "$$paramName",
                            {
                              $map: {
                                input: { $objectToArray: { $ifNull: ["$aestheticParameters", {}] } },
                                as: "a",
                                in: "$$a.k",
                              },
                            },
                          ],
                        },
                      },
                    },
                    { $limit: 1 },
                  ],
                  as: "matched",
                },
              },
              {
                $project: {
                  _id: 0,
                  name: 1,
                  displayName: 1,
                  matched: { $gt: [{ $size: "$matched" }, 0] },
                },
              },
              { $match: { matched: true } },
              { $project: { matched: 0 } },
            ],

            others: [
              { $match: { type: { $nin: ["health", "aesthetic"] } } },
            ],
          },
        },
      ]);
    } else {
      result = await ParameterModel.aggregate([
        {
          $facet: {
            health: [
              { $match: { type: "health" } },
              {
                $project: {
                  _id: 0,
                  name: 1,
                  displayName: 1,
                },
              },
            ],

            aesthetic: [
              { $match: { type: "aesthetic" } },
              {
                $project: {
                  _id: 0,
                  name: 1,
                  displayName: 1,
                },
              },
            ],

            others: [
              { $match: { type: { $nin: ["health", "aesthetic"] } } },
            ],
          },
        },
      ]);
    }

    return ResponseHelper.success(res, result?.[0] || { health: [], aesthetic: [] })
  } catch (error: any) {
    const err = error as { message: string; status?: number }
    const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
    return ResponseHelper.error(res, err.message, status)
  }
})

app.post('/api/contact-us', async (req: any, res: any) => {
  const { name, email, message } = req.body
  try {
    if (!name || !email) {
      throw new ResponseHelper('Invalid input', HttpStatusCode.BAD_REQUEST)
    }
    await NodeMailerHelper.contactUs({ name, email, message })
    return ResponseHelper.success(res, 'Ok', 'Mail send retrieved successfully')
  } catch (error: any) {
    const err = error as { message: string; status?: number }
    const status = err.status ?? HttpStatusCode.INTERNAL_SERVER_ERROR
    return ResponseHelper.error(res, err.message, status)
  }
})
app.use('/api/excel', excelRoutes)

app.use('*', (req: Request, res: Response) => {
  res.json('Not Found')
})

