import { MinecraftMetrics as MetricsType, GameType } from '@/data/enum'
import * as MinecraftMetrics from '@/metrics/minecraft'
import GameMetrics from '@/metrics/game'
import GameProvider from '@/provider/GameProvider'
import ServerProvider from '@/provider/ServerProvider'
import GameRequest from './GameRequest'

export interface MetricsData {
  metric: MetricsType
  value: unknown
}

interface GameMetric {
  id: string
  type: GameType
  server: string
  value: number
}

export default ({ metric, value }: MetricsData): void => {
  switch (metric) {
    case MetricsType.NEW_ACCOUNT:
      MinecraftMetrics.uniqueAccounts.inc()
      break

    case MetricsType.GAME_CREATE:
      if (isGameMetric(value)) {
        GameMetrics(value.type, value.server).count.inc()

        GameRequest.send({
          serverName: value.server,
          type: value.type,
          status: 'CREATED',
          id: value.id
        })
      }
      break
    case MetricsType.GAME_START:
      if (isGameMetric(value)) {
        GameMetrics(value.type, value.server).startGame(value.id)
        createGame(value.server, value.type)
      }
      break
    case MetricsType.GAME_STOP:
      if (isGameMetric(value)) {
        GameMetrics(value.type, value.server).stopGame(value.id)
      }
      break
    case MetricsType.GAME_PLAYERS:
      if (isGameMetric(value)) {
        GameMetrics(value.type, value.server).players(value.id).set(value.value)

        // Recreate game if that is full
        GameProvider.getGame(value.id).then((game) => {
          if (game != null && game.full) {
            createGame(value.server, value.type)
          }
        })
      }
      break
  }
}

function isGameMetric(metric: unknown): metric is GameMetric {
  return typeof (metric as GameMetric).id !== 'undefined'
}

function createGame(server: string, type: GameType) {
  GameProvider.createGame(server)
    .then(async (created) => {
      if (!created) {
        await ServerProvider.createServer(type)
      }
    })
    .catch((err) => {
      GameRequest.send({
        serverName: server,
        type,
        status: 'FAIl_CREATE'
      })

      global.log.fatal(err, `Could not create an game (server: ${server}, type: ${type})`)
    })
}
