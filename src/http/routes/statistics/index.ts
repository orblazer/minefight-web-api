import { FastifyPluginCallback } from 'fastify'
import { sumBy } from 'lodash'
import { AccountModel } from '@/mongodb/Account'
import ServerProvider from '@/provider/ServerProvider'
import { ServerType } from '@/data/enum'

module.exports = ((fastify, _opts, done) => {
  // Get global statistics
  fastify.route({
    method: 'GET',
    url: '/',
    async handler(_req, reply) {
      reply.send({
        accounts: await AccountModel.countDocuments(),
        balances: await AccountModel.getTotalBalance(),
        online: await ServerProvider.findServerByType(ServerType.BUNGEECORD).then((server) => {
          return sumBy(server, (server) => server.players.length)
        })
      })
    }
  })

  // TODO: create route /statistics/servers/:type
  // TODO: create route /statistics/server/:name
  done()
}) as FastifyPluginCallback
