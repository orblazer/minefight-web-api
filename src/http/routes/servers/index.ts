import { FastifyPluginCallback } from 'fastify'
import ServerProvider from '@/provider/ServerProvider'
import HTTPError from '@/http/errors/HTTPError'
import { ServerType } from '@/data/enum'

module.exports = ((fastify, _opts, done) => {
  // Get all servers with specified type
  fastify.route<{ Params: { type: ServerType } }>({
    method: 'GET',
    url: '/:type',
    schema: {
      params: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: Object.values(ServerType)
          }
        },
        required: ['type']
      }
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('type')) {
        throw new HTTPError('The server type is required', 400)
      }

      reply.send(await ServerProvider.findServerByType(req.params.type))
    }
  })

  // Create an new server
  fastify.route<{ Body: { type: ServerType } }>({
    method: 'POST',
    url: '/create',
    schema: {
      body: {
        type: 'object',
        properties: {
          type: { type: 'string' }
        },
        required: ['type']
      }
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('type')) {
        throw new HTTPError('The server type is required', 400)
      }

      reply.send(await ServerProvider.createServer(req.body.type))
    }
  })

  done()
}) as FastifyPluginCallback
