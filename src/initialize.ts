import sourceMap from 'source-map-support'
import { readFileSync } from 'fs'
import { LevelWithSilent } from 'pino'

sourceMap.install()

// Load docker secrets
for (const key in process.env) {
  if (typeof process.env[key] === 'string' && process.env[key]?.startsWith('/run/secrets/')) {
    process.env[key] = readFileSync(process.env[key] as string, 'utf8').trim()
  }
}

// Fix log and env variables
global.isProduction = process.env.NODE_ENV === 'production'
let logLevel: LevelWithSilent = global.isProduction ? 'info' : 'debug'
if (
  typeof process.env.LOG_LEVEL === 'string' &&
  ~['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'].includes(process.env.LOG_LEVEL.toLowerCase())
) {
  logLevel = process.env.LOG_LEVEL.toLowerCase() as LevelWithSilent
}
global.log = {
  level: logLevel,
  pretty:
    typeof process.env.LOG_PRETTY === 'string' ? process.env.LOG_PRETTY.toLowerCase() === 'true' : !global.isProduction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any

// Set prefix for metrics
global.metricsPrefix = 'minefight'
