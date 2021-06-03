import { Gauge, Counter } from 'prom-client'
import { ServerType } from '@/data/enum'
import ServerProvider from '@/provider/ServerProvider'

// Create metrics
const metrics = {
  // General metrics
  count: new Counter({
    name: `${global.metricsPrefix}_server_created_total`,
    help: 'Number of created server',
    labelNames: ['type']
  }),
  active: new Gauge({
    name: `${global.metricsPrefix}_server_active`,
    help: 'Number of active server',
    labelNames: ['type']
  }),
  players: new Gauge({
    name: `${global.metricsPrefix}_server_players`,
    help: 'Number of players connected',
    labelNames: ['type', 'name']
  })
}

export interface ServerMetrics {
  /**
   * Manage number of number of created server
   */
  count: Counter.Internal
  /**
   * Manage number of current started server
   */
  active: Gauge.Internal<string>
  /**
   * Manage number of player on server
   * @param server The server name
   */
  players(server: string): Gauge.Internal<string>
}

/**
 * Access to server metrics
 * @param type The server type
 */
export default function server(type: ServerType): ServerMetrics {
  return {
    count: metrics.count.labels(type),
    active: metrics.active.labels(type),
    players(server: string): Gauge.Internal<string> {
      return metrics.players.labels(type, server)
    }
  }
}

// Initialize stats
export function initialize(): void {
  for (const type in ServerType) {
    if (type !== ServerType.UNKNOWN) {
      ServerProvider.findServerByType(type).then((servers) => {
        const metrics = server(ServerType[type])

        metrics.count.inc(0)
        metrics.active.set(servers.length)
        servers.forEach((server) => {
          metrics.players(server.name).set(server.players.length)
        })
      })
    }
  }
}
