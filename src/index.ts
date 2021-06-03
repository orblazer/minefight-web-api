import './initialize'
import httpServer from './http/server'
import httpRouter from './http/routes'
import orchestrator from './orchestrator'
import * as mongodb from './mongodb'
import redis from './redis'
import redisPubSub from './redis/subscribes'
import initMetrics from './metrics'
import discord from './discord'

// Bind exception
process.on('uncaughtException', (err) => {
  if (typeof global.log.fatal === 'function') {
    global.log.fatal(err)
  } else {
    console.error(err)
  }
  process.exit(1)
})

// Boot
;(async () => {
  // Initialize fastify
  const fastify = httpServer()

  // Initialize orchestrator
  if (
    typeof process.env.ORCHESTRATOR_SERVERS_IMAGE === 'string' &&
    typeof process.env.ORCHESTRATOR_SERVER_HOST === 'string' &&
    typeof process.env.ORCHESTRATOR_SERVER_SERVICE_NAME === 'string' &&
    typeof process.env.ORCHESTRATOR_SERVER_DNS === 'string'
  ) {
    await orchestrator
      .initialize()
      .then(() => global.log.debug({ msg: 'Orchestrator is now initialized', module: 'orchestrator' }))
      .catch((err) => fatal(err, 'orchestrator', 'Could not initialize orchestrator'))
  } else {
    fatal(
      new ReferenceError(
        'Could not initialize orchestrator, please fill env `ORCHESTRATOR_SERVERS_IMAGE`, ' +
          '`ORCHESTRATOR_SERVER_HOST`, `ORCHESTRATOR_SERVER_SERVICE_NAME` and `ORCHESTRATOR_SERVER_DNS`'
      ),
      'orchestrator',
      'Could not initialize orchestrator'
    )
    return
  }

  // Initialize mongoDB
  await mongodb
    .connect()
    .then(() => global.log.info({ msg: 'MongoDB is now connected', module: 'mongodb' }))
    .catch((err) => fatal(err, 'mongodb', 'Could not initialize MongoDB'))

  // Initialize redis
  await redis.connect().catch((err) => fatal(err, 'redis', 'Could not initialize redis'))
  await redisPubSub.connect().catch((err) => fatal(err, 'redis', 'Could not initialize redis pub/sub'))

  // Initialize discord (async)
  if (typeof process.env.DISCORD_TOKEN === 'string') {
    discord
      .login(process.env.DISCORD_TOKEN)
      .catch((err) => fatal(err, 'discord', 'Could not connect to discord', false))
  }

  // Initialize metrics
  initMetrics()
  global.log.debug({ msg: 'Metrics is now initialized', module: 'metrics' })

  // Initialize routes
  httpRouter(fastify)

  // Start fastify
  const port = Number(process.env.PORT) || 3000
  fastify
    .listen(port, '0.0.0.0')
    .then(() => {
      if (global.log.pretty) {
        global.log.debug({ msg: 'Registered routes :\n' + fastify.printRoutes(), module: 'fastify' })
      }

      // Notify ready
      if (typeof process.send === 'function') {
        process.send('ready')
      }
    })
    .catch((err) => fatal(err, 'fastify', 'Could not start fastify'))
})()

function fatal(error: Error, module: string, message?: string, exit = true): void {
  if (exit) {
    global.log.fatal(Object.assign(error, { module }), message)
    process.exit(1)
  } else {
    global.log.error(Object.assign(error, { module }), message)
  }
}
