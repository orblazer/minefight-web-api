import { ServerType } from '@/data/enum'
import SanctionNotify from './pubsub/SanctionNotify'
import ServerNotify from './pubsub/ServerNotify'
import Metrics from './pubsub/Metrics'
import { initClient, RedisConstant, expireKeyEvent } from '.'

const pubSubClient = initClient('Web API - PubSub')

// Handle events
pubSubClient.once('ready', () => {
  pubSubClient.subscribe(RedisConstant.ACCOUNT_SANCTION_NOTIFY)
  pubSubClient.subscribe(RedisConstant.SERVER_REQUEST)
  pubSubClient.subscribe(RedisConstant.SERVER_NOTIFY)
  pubSubClient.subscribe(expireKeyEvent)
})

pubSubClient.on('message', (channel: RedisConstant | string, message: string) => {
  switch (channel) {
    case RedisConstant.ACCOUNT_SANCTION_NOTIFY:
      SanctionNotify(JSON.parse(message))
      break

    case RedisConstant.SERVER_REQUEST:
      // Fix content from enum
      if (message.startsWith('"')) {
        message = message.replace(/"/g, '')
      }

      ServerNotify.listenRequest(message.toUpperCase() as ServerType)
      break
    case RedisConstant.SERVER_NOTIFY:
      ServerNotify.listen(JSON.parse(message))
      break

    case RedisConstant.METRICS:
      Metrics(JSON.parse(message))
      break

    case expireKeyEvent:
      if (message.startsWith(RedisConstant.SERVER_KEY)) {
        import('@/provider/GameProvider').then(({ default: provider }) =>
          provider.deleteGamesByServer(message.replace(RedisConstant.SERVER_KEY, ''))
        )
      }
      break
  }
})

export default pubSubClient
