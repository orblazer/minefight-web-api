import { FastifyPluginCallback } from 'fastify'
import redis, { RedisConstant, isConnected } from '@/redis'
import HTTPError from '@/http/errors/HTTPError'
import { failUpdateError, accountParamsJsonSchema, accountNotFound, AccountParams, getAccount } from '@/http/utils/account'
import javaClass from '@/data/javaClass'

module.exports = ((fastify, _opts, done) => {
  type Body = { Body: { status: 'SUCCESS' | 'FAILED' } }
  const bodyJsonSchema = {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['SUCCESS', 'FAILED']
      }
    },
    required: ['status']
  }

  // Route for link account to website
  fastify.route<AccountParams & Body>({
    method: ['POST', 'DELETE'],
    url: '/:id/link',
    schema: {
      body: bodyJsonSchema,
      params: accountParamsJsonSchema
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('id')) {
        throw new HTTPError('The account id is not valid', 400)
      }
      if (req.isValidationError('status')) {
        throw new HTTPError('The status property is not valid, possible value: SUCCESS, FAILED', 400)
      }
      const link = req.method === 'POST'

      // Retrieve account
      const account = await getAccount(req.params.id)
      if (!account?.data) {
        throw accountNotFound
      }

      // Update account
      account.data.websiteLinked = link
      if (!(await account.save())) {
        throw failUpdateError
      }

      // Notify minecraft
      if (isConnected(redis)) {
        await redis.publish(
          RedisConstant.ACCOUNT_LINK_STATUS,
          JSON.stringify({
            '@class': javaClass.pubSub.accountLink,
            accountId: req.params.id,
            status: req.body.status,
            unlink: !link
          })
        )
      }

      reply.send({ status: 'ok' })
    }
  })

  done()
}) as FastifyPluginCallback
