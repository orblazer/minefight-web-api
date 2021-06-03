/* eslint-disable @typescript-eslint/no-var-requires */
import prom from 'prom-client'
import { FastifyInstance } from 'fastify'
import { RouteGenericInterface } from 'fastify/types/route'
import FastifyBearerAuth from 'fastify-bearer-auth'
import { AccountSanctionModel } from '@/mongodb/AccountSanction'
import sanctionsMetrics from '@/metrics/sanctions'
import { balance as balanceMetrics } from '@/metrics/minecraft'
import { SanctionType } from '@/data/enum'
import { AccountModel } from '@/mongodb/Account'

export interface Paginate extends RouteGenericInterface {
  Querystring?: {
    page?: number
    limit?: number
  }
}

export const paginateJsonSchema = {
  page: {
    type: 'number',
    minimum: 1
  },
  limit: {
    type: 'number',
    minimum: 1
  }
}

export default (fastify: FastifyInstance): void => {
  // Healthz routes
  fastify.route({
    method: 'HEAD',
    url: '/',
    logLevel: 'warn',
    handler(_req, reply) {
      reply.send('ok')
    }
  })
  fastify.route({
    method: 'GET',
    url: '/healthz',
    logLevel: 'warn',
    handler(_req, reply) {
      reply.send('ok')
    }
  })

  fastify.register((instance, _opts, done) => {
    // Require auth
    if (typeof process.env.API_KEY !== 'undefined') {
      instance.register(FastifyBearerAuth, {
        keys: new Set([process.env.API_KEY]),
        errorResponse(): { error: string } {
          return { error: 'API key is not valid' }
        }
      })
    } else {
      global.log.warn('Running without authorization, this is not safe.')
    }

    // Collect metrics
    instance.route({
      method: 'GET',
      url: '/metrics',
      logLevel: 'warn',
      async handler(_req, reply) {
        // Retrieve active sanctions
        const sanctions = await AccountSanctionModel.countActives()
        sanctionsMetrics(SanctionType.MUTE).active.set(sanctions.MUTE)
        sanctionsMetrics(SanctionType.BAN).active.set(sanctions.BAN)

        // Retrieve account balance
        const balance = await AccountModel.getTotalBalance()
        balanceMetrics.set(balance)

        // Return metrics
        reply.type(prom.register.contentType).send(prom.register.metrics())
      }
    })

    // Account routes
    instance.register(require('./accounts'), { prefix: '/accounts' })
    instance.register(require('./account'), { prefix: '/account' })
    instance.register(require('./account/beta'), { prefix: '/account/beta' })
    instance.register(require('./account/link'), { prefix: '/account' })
    instance.register(require('./account/subscription'), { prefix: '/account' })

    // Statistics routes
    instance.register(require('./statistics'), { prefix: '/statistics' })
    instance.register(require('./statistics/account'), { prefix: '/statistics/account' })

    // Server routes
    instance.register(require('./server'), { prefix: '/server' })

    // Servers routes
    instance.register(require('./servers'), { prefix: '/servers' })

    // Sanctions routes
    instance.register(require('./sanctions'), { prefix: '/sanctions' })

    // Messages routes
    instance.register(require('./messages'), { prefix: '/messages' })

    done()
  })
}
