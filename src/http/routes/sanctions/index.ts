/* eslint-disable camelcase */
import { FastifyPluginCallback, FastifyRequest } from 'fastify'
import { DocumentType } from '@typegoose/typegoose'
import HTTPError from '@/http/errors/HTTPError'
import { AccountSanctionModel, AccountSanction, JsonAccountSanction } from '@/mongodb/AccountSanction'
import { PaginateResult } from '@/mongodb/utils/PaginatePlugin'
import { AccountParams, accountParamsJsonSchema, getAccount } from '@/http/utils/account'
import { ObjectIdRegex } from '@/mongodb'
import redis, { RedisConstant, isConnected } from '@/redis'
import javaClass from '@/data/javaClass'
import { SanctionType } from '@/data/enum'
import { Paginate, paginateJsonSchema } from '..'
import { UUIDRegex } from '@/utils/uuid'

async function getSanctions(
  request: FastifyRequest<Paginate>,
  filter: Record<string, unknown>
): Promise<PaginateResult<JsonAccountSanction>> {
  if (request.isValidationError('page')) {
    throw new HTTPError('The page could not be less then 1', 400)
  }
  if (request.isValidationError('limit')) {
    throw new HTTPError('The limit could not be less then 1', 400)
  }

  const result = await AccountSanctionModel.paginate<DocumentType<AccountSanction>>(filter, {
    page: request.query?.page || 0,
    limit: request.query?.limit || 20,
    sort: { date: 'desc' }
  })
  return {
    docs: result.docs.map((doc) => doc.toJSON() as JsonAccountSanction),
    meta: result.meta
  }
}

module.exports = ((fastify, _opts, done) => {
  type SanctionIdParams = { Params: { sanctionId: string } }
  type SanctionBody = { Body: { player: string; type: SanctionType; reason: string; owner: string; end_date?: string } }
  const sanctionIdParamsJsonSchema = {
    type: 'object',
    properties: {
      sanctionId: {
        type: 'string',
        pattern: ObjectIdRegex.source
      }
    },
    required: ['sanctionId']
  }

  // Get global sanctions
  fastify.route<Paginate>({
    method: 'GET',
    url: '/',
    schema: {
      querystring: paginateJsonSchema
    },
    attachValidation: true,
    async handler(req, reply) {
      reply.send(await getSanctions(req, {}))
    }
  })
  // Create sanction
  fastify.route<SanctionBody>({
    method: 'POST',
    url: '/create',
    schema: {
      body: {
        type: 'object',
        properties: {
          player: {
            type: 'string',
            pattern: UUIDRegex.source
          },
          type: {
            type: 'string',
            enum: ['MUTE', 'BAN', 'KICK', 'REPORT']
          },
          reason: { type: 'string' },
          owner: {
            type: 'string',
            pattern: UUIDRegex.source
          },
          end_date: { type: 'string' }
        },
        required: ['player', 'type', 'reason', 'owner']
      }
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('player')) {
        throw new HTTPError('The player is not valid', 400)
      }
      if (req.isValidationError('type')) {
        throw new HTTPError('The type is not valid, the possible value : MUTE, BAN, KICK, REPORT', 400)
      }
      if (req.isValidationError('reason')) {
        throw new HTTPError('The reason is not valid', 400)
      }
      if (req.isValidationError('owner')) {
        throw new HTTPError('The owner is not valid', 400)
      }

      const type = req.body.type
      const end_date = typeof req.body.end_date === 'undefined' ? undefined : new Date(req.body.end_date)
      if (end_date instanceof Date && isNaN(end_date.getTime())) {
        throw new HTTPError('The end date is not valid', 400)
      }

      const sanction = await AccountSanctionModel.create({
        account_id: req.body.player,
        type,
        owner: req.body.owner,
        reason: req.body.reason,
        date: new Date(),
        ...(type === SanctionType.MUTE || type === SanctionType.BAN ? { end_date } : {})
      })

      // Notify Servers
      const account = await getAccount(req.body.player)
      const owner = await getAccount(req.body.owner)
      if (isConnected(redis)) {
        await redis.publish(
          RedisConstant.ACCOUNT_SANCTION_NOTIFY,
          JSON.stringify({
            '@class': javaClass.pubSub.accountSanctionNotify,
            id: sanction._id,
            player: account._id,
            owner: owner._id,
            type: sanction.type,
            reason: sanction.reason,
            duration: typeof end_date === 'undefined' ? -1 : end_date.getTime() - Date.now()
          })
        )
      }

      reply.send({ status: 'ok' })
    }
  })

  // Get sanction
  fastify.route<SanctionIdParams>({
    method: 'GET',
    url: '/:sanctionId',
    schema: {
      params: sanctionIdParamsJsonSchema
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('sanctionId')) {
        throw new HTTPError('The sanction id is not valid', 400)
      }

      const sanction = await AccountSanctionModel.findById(req.params.sanctionId)
      if (sanction === null) {
        throw new HTTPError('The sanction not found', 404)
      }

      reply.send(sanction.toJSON())
    }
  })
  // End sanction
  fastify.route<SanctionIdParams & { Body: { reason: string; owner: string } }>({
    method: 'POST',
    url: '/:sanctionId',
    schema: {
      params: sanctionIdParamsJsonSchema,
      body: {
        type: 'object',
        properties: {
          reason: { type: 'string' },
          owner: {
            type: 'string',
            pattern: UUIDRegex.source
          }
        },
        required: ['reason', 'owner']
      }
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('sanctionId')) {
        throw new HTTPError('The sanction id is not valid', 400)
      }
      if (req.isValidationError('reason')) {
        throw new HTTPError('The reason is not valid', 400)
      }
      if (req.isValidationError('owner')) {
        throw new HTTPError('The owner is not valid', 400)
      }

      const sanction = await AccountSanctionModel.findById(req.params.sanctionId)
      if (sanction === null) {
        throw new HTTPError('The sanction not found', 404)
      }

      // Delete sanction in DB
      await sanction.end(new Date(), req.body.reason, req.body.owner)

      if (isConnected(redis)) {
        // Delete sanction in redis
        await redis.del(RedisConstant.ACCOUNT_SANCTION_KEY + sanction._id)

        // Notify Servers
        const account = await getAccount(sanction.account_id)
        const owner = await getAccount(req.body.owner)
        if (isConnected(redis)) {
          await redis.publish(
            RedisConstant.ACCOUNT_SANCTION_NOTIFY,
            JSON.stringify({
              '@class': javaClass.pubSub.accountSanctionNotify,
              id: sanction._id,
              playerName: account.username,
              ownerName: owner.username,
              type: sanction.type === SanctionType.BAN ? 'UNBAN' : 'UNMUTE',
              reason: req.body.reason,
              duration: -1
            })
          )
        }
      }

      reply.send({ status: 'ok' })
    }
  })

  // Get user sanctions
  fastify.route<AccountParams & Paginate>({
    method: 'GET',
    url: '/account/:id',
    schema: {
      querystring: paginateJsonSchema,
      params: accountParamsJsonSchema
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('id')) {
        throw new HTTPError('The account id is not valid', 400)
      }

      reply.send(
        await getSanctions(req, {
          // eslint-disable-next-line camelcase
          account_id: req.params.id
        })
      )
    }
  })
  // Get user active sanctions
  fastify.route<AccountParams>({
    method: 'GET',
    url: '/account/:id/active',
    schema: {
      params: accountParamsJsonSchema
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('id')) {
        throw new HTTPError('The account id is not valid', 400)
      }

      reply.send(
        await getSanctions(req, {
          // eslint-disable-next-line camelcase
          account_id: req.params.id,
          type: { $in: [SanctionType.MUTE, SanctionType.BAN] },
          $or: [{ end_date: null }, { end_date: { $gt: new Date() } }],
          end_owner: null
        })
      )
    }
  })

  // Get user sanctions
  fastify.route<Paginate & { Params: { type: SanctionType } }>({
    method: 'GET',
    url: '/type/:type',
    schema: {
      querystring: paginateJsonSchema,
      params: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['MUTE', 'BAN', 'KICK', 'REPORT']
          }
        },
        required: ['type']
      }
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('type')) {
        throw new HTTPError('The type is not valid, the possible value : MUTE, BAN, KICK, REPORT', 400)
      }

      reply.send(
        await getSanctions(req, {
          type: (req.params.type as string).toUpperCase()
        })
      )
    }
  })

  done()
}) as FastifyPluginCallback
