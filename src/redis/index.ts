import Redis from 'ioredis'
import ServerProvider from '@/provider/ServerProvider'

const [host, port] = (process.env.REDIS_HOST || 'localhost').split(':')
const db = Number(process.env.REDIS_DB || 0)

export enum RedisConstant {
  // Data key
  ACCOUNT_SANCTION_KEY = 'mf:accSanc:',
  SERVER_KEY = 'mf:serv:',
  GAME_KEY = 'mf:game:',
  GAME_PROFILE_KEY = 'mfw:gprof:',

  // Publish / Subscribe
  METRICS = 'mf:metrics',
  ACCOUNT_SANCTION_NOTIFY = 'mf:accSNot',
  ACCOUNT_LINK_STATUS = 'mf:accLNot',
  ACCOUNT_SUBSCRIPTION = 'mf:accSub',
  SERVER_REQUEST = 'mf:servReq',
  SERVER_NOTIFY = 'mf:servNot',
  GAME_REQUEST = 'mf:gameReq'
}
export const expireKeyEvent = `__keyevent@${db}__:expired`

export function initClient(connectionName: string): Redis.Redis {
  const client = new Redis({
    host,
    port: Number(port || 6379),
    db,
    password: process.env.REDIS_PASS,
    connectionName,
    lazyConnect: true
  })

  // Handle events
  client.on('ready', () => {
    global.log.info({ msg: `Redis (${connectionName}) is now connected`, module: 'redis' })
  })
  if (global.log.level === 'debug') {
    client.on('reconnecting', () => {
      global.log.debug({ msg: `Try reconnect to redis (${connectionName})`, module: 'redis' })
    })
  }
  client.on('error', (error) => {
    if (error.code === 'ETIMEDOUT') {
      global.log.error(error, `Could not connect to redis (${connectionName})`)
    } else {
      global.log.error(error)
    }
  })

  return client
}

const client = initClient('Web API')
client.on('ready', () => {
  ServerProvider.clearWrongServers()
})

export default client

/**
 * Check if redis is connected
 * @param redis Instance of redis
 */
export function isConnected(redis: Redis.Redis): boolean {
  return redis.status === 'ready'
}
