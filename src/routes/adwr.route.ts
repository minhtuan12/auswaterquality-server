import express from 'express'
import { adwrController } from '../controllers/adwr.controller'

const router = express.Router()

router.get('/gis-map', adwrController.gisMap)

router.get('/gis-tree-map', adwrController.gisTreeMap)

router.get('/scatter-chart', adwrController.scatterChart)

router.get('/dot-light-quality-chart', adwrController.dotLightQualityChart)

router.get('/parameter-bar-chart', adwrController.parameterBarChart)

router.get('/parameter-failed-bar-chart', adwrController.parameterFailedBarChart)

router.get('/exceedances-tree-map', adwrController.exceedancesTreeMap)

router.get('/percentage-water-quality-chart', adwrController.percentageWaterQualityChart)

router.get('/quality-time-range-bar-chart', adwrController.qualityTimeRangeBarChart)

router.get('/get-range-of-year', adwrController.getRangeOfYear)

router.get('/get-line-chart', adwrController.getLineChart)

export default router
