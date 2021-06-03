import { FastifyPluginCallback } from 'fastify'
import HTTPError from '@/http/errors/HTTPError'
import { AccountBetaModel, AccountBeta } from '@/mongodb/AccountBeta'
import uuid, { trimmedUUIDRegex } from '@/utils/uuid'
import { getProfileFromId } from '@/utils/mojang-profile'
import { accountNotFound } from '@/http/utils/account'

module.exports = ((fastify, _opts, done) => {
  // Route for check if account exist
  fastify.route<{ Params: { uuid: string } }>({
    method: ['POST', 'DELETE'],
    url: '/:uuid',
    schema: {
      params: {
        type: 'object',
        properties: {
          uuid: {
            type: 'string',
            pattern: trimmedUUIDRegex.source
          }
        },
        required: ['uuid']
      }
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('uuid')) {
        throw new HTTPError('The account unique id is not valid trimmed UUID', 400)
      }
      const accountBeta = await AccountBetaModel.findByUniqueId(uuid.fromTrimmed(req.params.uuid))

      if (req.method === 'DELETE') {
        if (accountBeta === null) {
          throw new HTTPError("The account doesn't allowed for beta", 403)
        }

        await accountBeta.remove()

        reply.send({ status: 'ok' })
      } else {
        if (accountBeta !== null) {
          throw new HTTPError('The account is already allowed for beta', 403)
        }
        const profile = await getProfileFromId(req.params.uuid)
        if (profile === null) {
          throw accountNotFound
        }

        await new AccountBetaModel({
          uniqueId: profile.uuid,
          username: profile.name,
          date: new Date()
        } as AccountBeta).save()

        reply.send({ status: 'ok' })
      }
    }
  })

  done()
}) as FastifyPluginCallback
