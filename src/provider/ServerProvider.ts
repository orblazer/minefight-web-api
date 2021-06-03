/* eslint-disable @typescript-eslint/no-explicit-any */
import redis, { RedisConstant, isConnected } from '@/redis'
import { javaToJS } from '@/redis/utils/fixType'
import ServerNotify from '@/redis/pubsub/ServerNotify'
import Server from '@/data/server'
import { ServerType, ServerStatus, GameType } from '@/data/enum'
import orchestrator from '@/orchestrator'
import GameProvider from './GameProvider'

export default {
  async serverExist(name: string): Promise<boolean> {
    // Skip if redis is not connected
    if (!isConnected(redis)) {
      return false
    }

    const key = await redis.exists(RedisConstant.SERVER_KEY + name)
    return key > 0
  },
  async getServer(name: string): Promise<Server | null> {
    // Skip if redis is not connected
    if (!isConnected(redis)) {
      return null
    }

    // Get from redis
    const rawRedisServer = await redis.get(RedisConstant.SERVER_KEY + name)
    if (rawRedisServer === null) {
      return null
    }
    const redisServer: Server = JSON.parse(rawRedisServer)
    javaToJS(redisServer)

    return new Server(
      redisServer.name,
      redisServer.host,
      redisServer.address,
      redisServer.type,
      redisServer.status,
      redisServer.players,
      redisServer.full,
      redisServer.constant,
      redisServer.maxGames
    )
  },
  async findServerByType(type: string): Promise<Server[]> {
    // Skip if redis is not connected
    if (!isConnected(redis)) {
      return []
    }

    const servers: Server[] = []
    type = type.toUpperCase()
    if (type !== '*' && !(type in ServerType)) {
      throw new RangeError(`The type "${type}" is not valid`)
    }

    // Get all redis servers
    const redisKeys = await redis.keys(RedisConstant.SERVER_KEY + '*')
    const redisServers =
      redisKeys.length > 0
        ? (await redis.mget(...redisKeys))
            .filter((server) => server !== null)
            .map((rawServer): Server => JSON.parse(rawServer as string))
            .filter((server): boolean => type === '*' || server.type === type)
        : []
    redisServers.forEach((redisServer): void => {
      javaToJS(redisServer)

      servers.push(
        new Server(
          redisServer.name,
          redisServer.host,
          redisServer.address,
          redisServer.type,
          redisServer.status,
          redisServer.players,
          redisServer.full,
          redisServer.constant,
          redisServer.maxGames
        )
      )
    })

    return servers
  },
  async createInRedis(server: Server): Promise<boolean | null> {
    // Skip if redis is not connected
    if (!isConnected(redis)) {
      return null
    }

    return (await redis.set(RedisConstant.SERVER_KEY + server.name, JSON.stringify(server.toRedis()))) === 'OK'
  },

  // Server management
  async createServer(type: ServerType): Promise<Server> {
    // Skip if redis is not connected
    if (!isConnected(redis)) {
      throw new ReferenceError('The redis is not connected, could not create server')
    }

    const server = await orchestrator.createServer(type)
    const serverClass = new Server(
      server.name,
      server.host,
      server.address,
      type,
      ServerStatus.OFFLINE,
      [],
      false,
      false,
      0
    )

    return this.createInRedis(serverClass)
      .then(async (status) => {
        if (status) {
          return serverClass
        } else {
          await orchestrator.deleteServer(server.name)
          throw new Error('Could not store server in redis')
        }
      })
      .catch(async (e) => {
        await orchestrator.deleteServer(server.name)
        throw e
      })
  },
  async deleteServer(name: string): Promise<Server> {
    const server = await this.getServer(name)
    if (server == null) {
      throw new ReferenceError(`The server ${name} couldn't be found`)
    }

    await orchestrator.deleteServer(server.name)
    await GameProvider.deleteGamesByServer(server.name)

    // Notify bungee
    ServerNotify.send({
      name,
      type: server.type,
      status: 'DELETE'
    })

    return server
  },
  async clearWrongServers(): Promise<void> {
    // Skip if redis is not connected
    if (!isConnected(redis)) {
      return
    }

    // Get all redis servers
    const redisKeys = await redis.keys(RedisConstant.SERVER_KEY + '*')
    const redisServers =
      redisKeys.length > 0
        ? (await redis.mget(...redisKeys))
            .filter((server) => server !== null)
            .map((rawServer): Server => JSON.parse(rawServer as string))
        : []

    redisServers.forEach(async (server) => {
      if (server.type !== ServerType.FALLBACK && !(await orchestrator.serverExist(server.name))) {
        if (server.type === ServerType.BUNGEECORD) {
          await redis.del(RedisConstant.SERVER_KEY + server.name)
        } else {
          ServerNotify.send({
            name: server.name,
            type: server.type,
            status: 'DELETE'
          })
        }

        if (server.type in GameType) {
          await GameProvider.deleteGamesByServer(server.name)
        }
        global.log.debug({
          msg: `Delete server '${server.name}' for reason : pod not exist`,
          module: 'server-provider'
        })
      }
    })
  }
}
