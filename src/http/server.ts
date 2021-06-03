import { IncomingHttpHeaders, IncomingMessage } from 'http'
import Fastify, { FastifyInstance } from 'fastify'
import FastifyCORS from 'fastify-cors'
import FastifyFormBody from 'fastify-formbody'
import FastifyCompress from 'fastify-compress'
import UnderPressure from 'under-pressure'
import { LoggerOptions } from 'pino'
import IsValidationError from './plugins/validationError'

export default function init(): FastifyInstance {
  // Create fastify instance
  const fastify = Fastify({
    logger: {
      redact: ['req.headers.authorization'],
      prettyPrint: global.log.pretty
        ? {
            translateTime: 'HH:MM:ss'
          }
        : false,
      level: global.log.level,
      serializers: {
        req(
          req: IncomingMessage
        ): {
          method?: string
          url?: string
          headers?: IncomingHttpHeaders
          remoteAddress?: string
          remotePort?: number
        } {
          return {
            method: req.method,
            url: req.url,
            headers: req.headers,
            remoteAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
            remotePort: req.socket.remotePort
          }
        }
      }
    } as LoggerOptions
  })
  global.log = Object.assign(fastify.log, global.log)

  // Customize error handler
  fastify.setErrorHandler(function (error, req, reply) {
    const originalMessage = error.message
    if (typeof error.statusCode === 'undefined') {
      error.statusCode = 500
      error.message = 'Internal Server Error'
    }

    // TODO: Check if is right
    if (error.statusCode >= 500) {
      this.log.error({ req: req.raw, err: error }, error && error.constructor.name + ': ' + originalMessage)
    } else if (error.statusCode >= 400) {
      this.log.error({ rr: error }, error && error.constructor.name + ': ' + originalMessage)
    }

    reply.send(error)
  })

  // Register plugins
  fastify.register(IsValidationError)
  fastify.register(FastifyCORS)
  fastify.register(FastifyFormBody)
  fastify.register(FastifyCompress)
  fastify.register(UnderPressure)

  return fastify
}
