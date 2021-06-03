import { Gauge, Counter, Histogram, LabelValues, linearBuckets } from 'prom-client'
import { GameType } from '@/data/enum'

// Create metrics
const metrics = {
  // General metrics
  count: new Counter({
    name: `${global.metricsPrefix}_game_created_total`,
    help: 'Number of created game',
    labelNames: ['type', 'server']
  }),
  started: new Counter({
    name: `${global.metricsPrefix}_game_started_total`,
    help: 'Number of started game',
    labelNames: ['type', 'server']
  }),
  active: new Gauge({
    name: `${global.metricsPrefix}_game_active`,
    help: 'Number of active game',
    labelNames: ['type', 'server']
  }),
  players: new Gauge({
    name: `${global.metricsPrefix}_game_players`,
    help: 'Number of players in game',
    labelNames: ['type', 'server', 'game']
  }),
  duration: new Histogram({
    name: `${global.metricsPrefix}_game_duration_seconds`,
    help: 'The duration of game duration',
    labelNames: ['type', 'server', 'game'],
    buckets: linearBuckets(0, 60, 60)
  })
}

export interface GameMetrics {
  /**
   * Manage number of number of created game
   */
  count: Counter.Internal
  /**
   * Manage number of number of created game
   */
  started: Counter.Internal
  /**
   * Manage number of current started game
   */
  active: Gauge.Internal<string>
  /**
   * Manage number of player on game
   * @param id The game id
   */
  players(id: string): Gauge.Internal<string>
  /**
   * Manage duration of game
   * @param id The game id
   */
  duration(id: string): Histogram.Internal<string>
  /**
   * Start the game (increment count, active and start track duration)
   * @param id The game id
   */
  startGame(id: string): void
  /**
   * Stop the game (decrement active and collect duration)
   * @param id The game id
   */
  stopGame(id: string): void
}

type MetricsCallback<T extends string = string> = (labels?: LabelValues<T>) => void
const tracked: Map<string, MetricsCallback> = new Map()

/**
 * Access to game metrics
 * @param type The game type
 * @param server The server name
 */
export default function game(type: GameType, server: string): GameMetrics {
  return {
    count: metrics.count.labels(type, server),
    started: metrics.started.labels(type, server),
    active: metrics.active.labels(type, server),
    players(id) {
      return metrics.players.labels(type, server, id)
    },
    duration(id) {
      return metrics.duration.labels(type, server, id)
    },
    startGame(id): void {
      if (tracked.has(id)) {
        return
      }

      this.started.inc() // Increment started game
      this.active.inc() // Increment active game
      tracked.set(id, this.duration(id).startTimer())
    },
    stopGame(id): void {
      const tacker = tracked.get(id)
      if (typeof tacker === 'undefined') {
        return
      }

      this.active.dec() // Decrement active game
      tacker() // Collect game duration
      tracked.delete(id)
    }
  }
}
