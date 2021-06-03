import { FastifyPluginCallback } from 'fastify'
import { DocumentType } from '@typegoose/typegoose'
import { AccountModel, Account } from '@/mongodb/Account'
import HTTPError from '../errors/HTTPError'
import { paginateJsonSchema, Paginate } from '.'

module.exports = ((fastify, _opts, done) => {
  // Get global accounts
  fastify.route<Paginate>({
    method: 'GET',
    url: '/',
    schema: {
      querystring: paginateJsonSchema
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('page')) {
        throw new HTTPError('The page could not be less then 1', 400)
      }
      if (req.isValidationError('limit')) {
        throw new HTTPError('The limit could not be less then 1', 400)
      }

      reply.send(
        await AccountModel.paginate<DocumentType<Account>>(
          {},
          {
            page: req.query?.page || 0,
            limit: req.query?.limit || 20,
            sort: { date: 'desc' }
          }
        )
      )
    }
  })

  // Get list of accounts username and id
  fastify.route({
    method: 'GET',
    url: '/list',
    async handler(_req, reply) {
      reply.send(
        await AccountModel.find({}, { username: 1 })
      )
    }
  })

  done()
}) as FastifyPluginCallback
