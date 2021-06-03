import { FastifyPluginCallback } from 'fastify'
import HTTPError from '@/http/errors/HTTPError'
import ServerProvider from '@/provider/ServerProvider'

module.exports = ((fastify, _opts, done) => {
  type Params = { Params: { name: string } }
  const paramsJsonSchema = {
    type: 'object',
    properties: {
      name: { type: 'string' }
    },
    required: ['name']
  }

  // Get server information from name
  fastify.route<Params>({
    method: 'GET',
    url: '/:name',
    schema: {
      params: paramsJsonSchema
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('name')) {
        throw new HTTPError('The name of server is required', 400)
      }

      const server = await ServerProvider.getServer(req.params.name)
      if (server === null) {
        throw new HTTPError('The server not found', 404)
      }
      reply.send(server)
    }
  })

  // Delete server from name
  fastify.route<Params>({
    method: 'DELETE',
    url: '/:name',
    schema: {
      params: paramsJsonSchema
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('name')) {
        throw new HTTPError('The name of server is required', 400)
      }
      if (!(await ServerProvider.serverExist(req.params.name))) {
        throw new HTTPError('The server not found', 404)
      }

      await ServerProvider.deleteServer(req.params.name)
      reply.send({ status: 'ok' })
    }
  })

  done()
}) as FastifyPluginCallback
