/* eslint-disable @typescript-eslint/no-explicit-any */
import redis, { RedisConstant, isConnected } from '@/redis'
import { javaToJS } from '@/redis/utils/fixType'
import Game from '@/data/game'
import { GameType } from '@/data/enum'
import GameRequest from '@/redis/pubsub/GameRequest'
import ServerProvider from './ServerProvider'

export default {
  async gameExist(id: string): Promise<boolean> {
    // Skip if redis is not connected
    if (!isConnected(redis)) {
      return false
    }

    const key = await redis.exists(RedisConstant.GAME_KEY + id)
    return key > 0
  },
  async getGame(id: string): Promise<Game | null> {
    // Skip if redis is not connected
    if (!isConnected(redis)) {
      return null
    }

    // Get from redis
    const rawRedisGame = await redis.get(RedisConstant.GAME_KEY + id)
    if (rawRedisGame === null) {
      return null
    }
    const redisGame: Game = JSON.parse(rawRedisGame)
    javaToJS(redisGame)

    return new Game(
      redisGame.id,
      redisGame.serverName,
      redisGame.type,
      redisGame.state,
      redisGame.canSpectate,
      redisGame.playersWaitReconnect,
      redisGame.full,
      redisGame.online,
      redisGame.maxPlayers,
      redisGame.data
    )
  },
  async findGameByType(type: string): Promise<Game[]> {
    // Skip if redis is not connected
    if (!isConnected(redis)) {
      return []
    }

    const games: Game[] = []
    type = type.toUpperCase()
    if (type !== '*' && !(type in GameType)) {
      throw new RangeError(`The type "${type}" is not valid`)
    }

    // Get all redis servers
    const redisKeys = await redis.keys(RedisConstant.GAME_KEY + '*')
    const redisGames =
      redisKeys.length > 0
        ? (await redis.mget(...redisKeys))
            .filter((game) => game !== null)
            .map((rawGame): Game => JSON.parse(rawGame as string))
            .filter((game): boolean => type === '*' || game.type === type)
        : []
    redisGames.forEach((redisGame): void => {
      javaToJS(redisGame)

      games.push(
        new Game(
          redisGame.id,
          redisGame.serverName,
          redisGame.type,
          redisGame.state,
          redisGame.canSpectate,
          redisGame.playersWaitReconnect,
          redisGame.full,
          redisGame.online,
          redisGame.maxPlayers,
          redisGame.data
        )
      )
    })

    return games
  },
  async findGameByServer(server: string): Promise<Game[]> {
    // Skip if redis is not connected
    if (!isConnected(redis)) {
      return []
    }

    const games: Game[] = []

    // Get all redis servers
    const redisKeys = await redis.keys(RedisConstant.GAME_KEY + '*')
    const redisGames =
      redisKeys.length > 0
        ? (await redis.mget(...redisKeys))
            .filter((game) => game !== null)
            .map((rawGame): Game => JSON.parse(rawGame as string))
            .filter((game): boolean => server === '*' || game.serverName === server)
        : []
    redisGames.forEach((redisGame): void => {
      javaToJS(redisGame)

      games.push(
        new Game(
          redisGame.id,
          redisGame.serverName,
          redisGame.type,
          redisGame.state,
          redisGame.canSpectate,
          redisGame.playersWaitReconnect,
          redisGame.full,
          redisGame.online,
          redisGame.maxPlayers,
          redisGame.data
        )
      )
    })

    return games
  },

  // Game management
  async createGame(serverName: string): Promise<boolean> {
    // Skip if redis is not connected
    if (!isConnected(redis)) {
      throw new ReferenceError('The redis is not connected, could not create server')
    }

    // Retrieve server
    const server = await ServerProvider.getServer(serverName)
    if (server == null) {
      throw new ReferenceError(`The server ${serverName} couldn't be found`)
    }
    if (server.type in GameType) {
      throw new RangeError(`The type "${server.type}" is not valid`)
    }

    const gamesOnServer = await this.findGameByServer(serverName).then((games) => games.length)
    if (gamesOnServer === server.maxGames) {
      return false
    }

    // Notify bungee
    GameRequest.send({
      serverName,
      type: server.type as GameType,
      status: 'CREATE'
    })

    return true
  },
  async deleteGame(id: string): Promise<Game> {
    const game = await this.getGame(id)
    if (game == null) {
      throw new ReferenceError(`The game ${id} couldn't be found`)
    }

    // Notify bungee
    GameRequest.send({
      serverName: game.serverName,
      type: game.type,
      status: 'DELETE',
      id: game.id
    })

    return game
  },
  async deleteGamesByServer(server: string): Promise<void> {
    const keys: string[] = []
    ;(await this.findGameByServer(server)).forEach((game) => {
      keys.push(RedisConstant.GAME_KEY + game.id)
    })

    if (keys.length > 0) {
      await redis.del(keys)
    }
  }
}
