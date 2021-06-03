import { isValid, parseISO } from 'date-fns'
import { FastifyPluginCallback } from 'fastify'
import HTTPError from '@/http/errors/HTTPError'
import { accountNotFound, accountParamsJsonSchema, failUpdateError, AccountParams, getAccount } from '@/http/utils/account'
import redis, { RedisConstant, isConnected } from '@/redis'
import { SubscriptionGroup, SubscriptionType } from '@/data/enum'
import javaClass from '@/data/javaClass'
import { PermissionGroupModel } from '@/mongodb/PermissionGroup'

module.exports = ((fastify, _opts, done) => {
  // Route for subscribe player
  fastify.route<AccountParams & { Body: { subscription: 'EMERALD' | 'DIAMOND' } }>({
    method: 'PUT',
    url: '/:id/subscription',
    schema: {
      params: accountParamsJsonSchema,
      body: {
        type: 'object',
        properties: {
          subscription: {
            type: 'string',
            enum: ['EMERALD', 'DIAMOND']
          }
        },
        required: ['subscription']
      }
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('id')) {
        throw new HTTPError('The account id is not valid', 400)
      }
      if (req.isValidationError('subscription')) {
        throw new HTTPError('The subscription is not valid, the possible value : EMERALD, DIAMOND', 400)
      }

      // Retrieve account
      const account = await getAccount(req.params.id)
      if (!account?.data) {
        throw accountNotFound
      }
      // Retrieve account
      const groupName = SubscriptionGroup[req.body.subscription]
      const group = await PermissionGroupModel.findOne({ name: groupName }).exec()
      if(group == null) {
        throw new HTTPError(`The group '${groupName}' could not be found`, 404)
      }

      // Update account
      if (account.data.subscription === req.body.subscription) {
        throw new HTTPError('The player already have that subscription', 403)
      }

      account.data.group = group._id
      account.data.subscription = SubscriptionType[req.body.subscription]
      account.data.subscriptionEndDate = undefined
      if (!(await account.save())) {
        throw failUpdateError
      }

      // Notify minecraft
      if (isConnected(redis)) {
        await redis.publish(
          RedisConstant.ACCOUNT_SUBSCRIPTION,
          JSON.stringify({
            '@class': javaClass.pubSub.accountSubscription,
            accountId: req.params.id,
            status: 'UPDATE',
            subscription: req.body.subscription.toUpperCase()
          })
        )
      }

      reply.send({ status: 'ok' })
    }
  })

  // Route for unsubscribe player
  fastify.route<AccountParams & { Body: { endDate: string } }>({
    method: 'DELETE',
    url: '/:id/subscription',
    schema: {
      params: accountParamsJsonSchema,
      body: {
        type: 'object',
        properties: {
          endDate: {
            type: 'string'
          }
        },
        required: ['endDate']
      }
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('id')) {
        throw new HTTPError('The account id is not valid', 400)
      }
      const endDate = parseISO(req.body.endDate)
      if (req.isValidationError('endDate') && isValid(endDate)) {
        throw new HTTPError('The endDate is not valid', 400)
      }

      // Retrieve account
      const account = await getAccount(req.params.id)
      if (!account?.data) {
        throw accountNotFound
      }

      // Update account
      if (account.data.subscription === SubscriptionType.BRONZE) {
        throw new HTTPError("The player doesn't have subscription", 403)
      }

      account.data.subscriptionEndDate = endDate
      if (!(await account.save())) {
        throw failUpdateError
      }

      // Notify minecraft
      if (isConnected(redis)) {
        await redis.publish(
          RedisConstant.ACCOUNT_SUBSCRIPTION,
          JSON.stringify({
            '@class': javaClass.pubSub.accountSubscription,
            accountId: req.params.id,
            status: 'DELETE',
            endDate
          })
        )
      }

      reply.send({ status: 'ok' })
    }
  })

  done()
}) as FastifyPluginCallback
