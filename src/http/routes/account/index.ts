import { FastifyPluginCallback } from 'fastify'
import { DocumentType } from '@typegoose/typegoose'
import { getProfile } from '@/utils/mojang-profile'
import HTTPError from '@/http/errors/HTTPError'
import { accountParamsJsonSchema, accountNotFound, AccountParams, getAccount } from '@/http/utils/account'
import { AccountSanctionModel } from '@/mongodb/AccountSanction'
import { AccountLoginHistoryModel, AccountLoginHistory } from '@/mongodb/AccountLoginHistory'
import { Paginate, paginateJsonSchema } from '..'
import { AccountModel } from '@/mongodb/Account'
import { Types } from 'mongoose'

module.exports = ((fastify, _opts, done) => {
  // Route for check if account exist
  fastify.route<AccountParams>({
    method: 'HEAD',
    url: '/:id',
    schema: {
      params: accountParamsJsonSchema
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('id')) {
        throw new HTTPError('The account id is not valid', 400)
      }

      if (await AccountModel.existsById(req.params.id)) {
        reply.send({ status: 'ok' })
      } else {
        reply.code(404).send({ status: 'not ok' })
      }
    }
  })
  // Route for retrieve account
  fastify.route<AccountParams>({
    method: 'GET',
    url: '/:id',
    schema: {
      params: accountParamsJsonSchema
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('id')) {
        throw new HTTPError('The account id is not valid', 400)
      }

      reply.send(
        await getAccount(req.params.id).then(async (account) => {
          const groupId = (account.data?.group as Types.ObjectId)?.toHexString()
          let websiteRole = 'PLAYER'
          console.log(process.env.WEBSITE_STAFF_ROLES, process.env.WEBSITE_ADMIN_ROLES)
          if ((process.env.WEBSITE_STAFF_ROLES ?? '').split(',').includes(groupId)) {
            websiteRole = 'STAFF'
          } else if ((process.env.WEBSITE_ADMIN_ROLES ?? '').split(',').includes(groupId)) {
            websiteRole = 'ADMIN'
          }

          return {
            ...account.toJSON(),
            websiteRole,
            activeBan: await AccountSanctionModel.findActiveBan(account._id)
              .exec()
              .then((sanction) => (sanction !== null ? sanction.toJSON() : null)),
            // eslint-disable-next-line camelcase
            lastLogin: await AccountLoginHistoryModel.findOne({ account_id: account._id }).sort({ date: 'desc' }).exec()
          }
        })
      )
    }
  })
  // Route for retrieve account login history
  fastify.route<AccountParams & Paginate>({
    method: 'GET',
    url: '/:id/login-history',
    schema: {
      params: accountParamsJsonSchema,
      querystring: paginateJsonSchema
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('id')) {
        throw new HTTPError('The account id is not valid', 400)
      }
      if (req.isValidationError('page')) {
        throw new HTTPError('The page could not be less then 1', 400)
      }
      if (req.isValidationError('limit')) {
        throw new HTTPError('The limit could not be less then 1', 400)
      }

      reply.send(
        await AccountLoginHistoryModel.paginate<DocumentType<AccountLoginHistory>>(
          // eslint-disable-next-line camelcase
          { account_id: req.params.id },
          {
            page: req.query?.page || 0,
            limit: req.query?.limit || 20,
            sort: { date: 'desc' }
          }
        )
      )
    }
  })

  // Retrieve mojang account from username
  fastify.route<{ Params: { username: string } }>({
    method: 'GET',
    url: '/mojang-profile/:username',
    schema: {
      params: {
        username: {
          type: 'string',
          pattern: '^[a-zA-Z0-9_]{3,16}$'
        }
      }
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('username')) {
        throw new HTTPError('The account username is invalid', 400)
      }
      const profile = await getProfile(req.params.username)
      if (profile === null) {
        throw accountNotFound
      }
      reply.send(profile)
    }
  })

  done()
}) as FastifyPluginCallback
