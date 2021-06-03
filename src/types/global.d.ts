/* eslint-disable no-var */
import { LevelWithSilent, Logger } from 'pino'

declare global {
  var isProduction: boolean
  var log: {
    level: LevelWithSilent
    pretty: boolean
  } & Logger
  var metricsPrefix: string
}
