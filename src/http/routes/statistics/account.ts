import { FastifyPluginCallback } from 'fastify'
import HTTPError from '@/http/errors/HTTPError'
import { getAccount } from '@/http/utils/account'
import { UUIDRegex } from '@/utils/uuid'

module.exports = ((fastify, _opts, done) => {
  type Params = { Params: { accountId: string } }
  const accountParamsJsonSchema = {
    type: 'object',
    properties: {
      accountId: {
        type: 'string',
        pattern: UUIDRegex.source
      }
    },
    required: ['accountId']
  }

  // Get all statistics of account
  fastify.route<Params>({
    method: 'GET',
    url: '/:accountId',
    schema: {
      params: accountParamsJsonSchema
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('accountId')) {
        throw new HTTPError('The account id is not valid', 400)
      }

      reply.send(await getAccount(req.params.accountId).then((account) => account.statistics))
    }
  })
  // Get statistics on specified server of account
  fastify.route<Params & { Params: { serverType: string } }>({
    method: 'GET',
    url: '/:accountId/:serverType',
    schema: {
      params: {
        ...accountParamsJsonSchema,
        serverType: { type: 'string' }
      }
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('accountId')) {
        throw new HTTPError('The account id is not valid', 400)
      }
      if (req.isValidationError('serverType')) {
        throw new HTTPError('The server type is required', 400)
      }
      const statistics = await getAccount(req.params.accountId).then((account) =>
        account.statistics.get(req.params.serverType.toUpperCase())
      )
      if (typeof statistics === 'undefined') {
        throw new HTTPError('The account statistic is not found', 404)
      }

      reply.send(statistics)
    }
  })

  done()
}) as FastifyPluginCallback
