import { FastifyPluginCallback } from 'fastify'
import { DocumentType } from '@typegoose/typegoose'
import { MessageModel, Message } from '@/mongodb/Message'
import HTTPError from '@/http/errors/HTTPError'
import { escapeSpecialChars } from '@/utils/string'
import { Lang } from '@/data/enum'
import { paginateJsonSchema, Paginate } from '.'

export const messageNotFound = new HTTPError('The message not found', 404)

module.exports = ((fastify, _opts, done) => {
  type Params = { Params: { id: string } }
  const paramsJsonSchema = {
    type: 'object',
    properties: {
      id: {
        type: 'string'
      }
    },
    required: ['id']
  }

  // Get all messages
  fastify.route<Paginate & { Querystring: { missing?: boolean; path?: string } }>({
    method: 'GET',
    url: '/',
    schema: {
      querystring: Object.assign({}, paginateJsonSchema, {
        missing: {
          type: 'boolean'
        },
        path: {
          type: 'string',
          pattern: '[a-zA-Z._-]+'
        }
      })
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('page')) {
        throw new HTTPError('The page could not be less then 1', 400)
      }
      if (req.isValidationError('limit')) {
        throw new HTTPError('The limit could not be less then 1', 400)
      }
      if (req.isValidationError('missing')) {
        throw new HTTPError('The missing is not an boolean', 400)
      }
      if (req.query.path && req.isValidationError('path')) {
        throw new HTTPError('The path is not valid', 400)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let search: any = {}
      if (req.query.missing) {
        search = {
          $or: [{ 'messages.fr': { $in: [null, ''] } }, { 'messages.en': { $in: [null, ''] } }]
        }
      }
      if (req.query.path) {
        search.path = new RegExp('.*' + escapeSpecialChars(req.query.path) + '.*', 'i')
      }

      reply.send(
        await MessageModel.paginate<DocumentType<Message>>(search, {
          page: req.query.page || 0,
          limit: req.query.limit || 20
        }).then((res) => ({
          docs: res.docs.map((message) => {
            message.messages.forEach((msg, lang) => {
              message.messages.set(lang, msg)
            })
            return message
          }),
          meta: res.meta
        }))
      )
    }
  })

  // Get statistics of messages
  fastify.route({
    method: 'GET',
    url: '/stats',
    attachValidation: true,
    async handler(_req, reply) {
      const result = {
        count: 0,
        unLocalized: {
          fr: 0,
          en: 0
        }
      }

      // Find missing message
      ;(await MessageModel.find()).forEach((message) => {
        result.count++
        Lang.forEach((lang) => {
          const msg = message.messages.get(lang)
          if (typeof msg === 'undefined' || msg === '') {
            result.unLocalized[lang]++
          }
        })
      })

      reply.send(result)
    }
  })

  // Check if message exist
  fastify.route<{ Params: { path: string } }>({
    method: 'HEAD',
    url: '/:path',
    schema: {
      params: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            pattern: '[a-zA-Z._-]+'
          }
        },
        required: ['path']
      }
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('path')) {
        throw new HTTPError('The message path is required', 400)
      }

      const exist = await MessageModel.exists({ path: req.params.path })
      if (exist) {
        reply.send({ status: 'ok' })
      } else {
        reply.code(404).send({ status: 'not ok' })
      }
    }
  })

  // Get an message from id
  fastify.route<Params>({
    method: 'GET',
    url: '/:id',
    schema: {
      params: paramsJsonSchema
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('id')) {
        throw new HTTPError('The message id is required', 400)
      }

      const message = await MessageModel.findById(req.params.id).then((message) => {
        if (message !== null) {
          message.messages.forEach((msg, lang) => {
            message.messages.set(lang, msg)
          })
        }
        return message
      })
      if (message === null) {
        throw messageNotFound
      }
      reply.send(message)
    }
  })

  // Create an message
  fastify.route<{ Body: { path: string; messages: string } }>({
    method: 'POST',
    url: '/',
    schema: {
      body: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            pattern: '[a-zA-Z._-]+'
          },
          messages: {
            type: 'string'
          }
        },
        required: ['path', 'messages']
      }
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('path')) {
        throw new HTTPError('The message path is required', 400)
      }
      if (req.isValidationError('messages')) {
        throw new HTTPError('The messages is required', 400)
      }

      let messages: Map<Lang, string>
      try {
        messages = JSON.parse(req.body.messages)
      } catch (err) {
        throw new HTTPError('The messages is not valid json', 400)
      }

      await MessageModel.create({
        path: req.body.path,
        messages
      })
      reply.send({ status: 'ok' })
    }
  })

  // Update an message
  fastify.route<Params & { Body: { messages: string } }>({
    method: 'PATCH',
    url: '/:id',
    schema: {
      params: paramsJsonSchema,
      body: {
        type: 'object',
        properties: {
          messages: {
            type: 'string'
          }
        },
        required: ['messages']
      }
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('id')) {
        throw new HTTPError('The message id is required', 400)
      }
      if (req.isValidationError('messages')) {
        throw new HTTPError('The messages is required', 400)
      }
      try {
        req.body.messages = JSON.parse(req.body.messages)
      } catch (err) {
        throw new HTTPError('The messages is not valid json', 400)
      }

      const message = await MessageModel.findById(req.params.id)
      if (message === null) {
        throw messageNotFound
      }

      Object.assign(message.messages, req.body.messages)
      await message.save()
      reply.send({ status: 'ok' })
    }
  })

  // Delete an message
  fastify.route<Params>({
    method: 'DELETE',
    url: '/:id',
    schema: {
      params: paramsJsonSchema
    },
    attachValidation: true,
    async handler(req, reply) {
      if (req.isValidationError('id')) {
        throw new HTTPError('The message id is required', 400)
      }

      const message = await MessageModel.findById(req.params.id)
      if (message === null) {
        throw messageNotFound
      }

      await message.remove()
      reply.send({ status: 'ok' })
    }
  })

  done()
}) as FastifyPluginCallback
