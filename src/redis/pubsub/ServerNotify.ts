import ServerProvider from '@/provider/ServerProvider'
import javaClass from '@/data/javaClass'
import { ServerType } from '@/data/enum'
import ServerMetrics from '@/metrics/server'
import redis, { RedisConstant } from '..'

export interface ServerNotifyData {
  name: string
  status: 'REGISTER' | 'REQUEST_DELETE' | 'DELETE' | 'FAIL_CREATE'
  type: ServerType
}

export default {
  /**
   * Listen server notify
   * @param message The message received
   */
  async listen(message: ServerNotifyData): Promise<void> {
    // Manage metrics
    if (message.status.toUpperCase() === 'REGISTER') {
      // Increment server number
      ServerMetrics(message.type).count.inc()
      ServerMetrics(message.type).active.inc()
    } else if (message.status.toUpperCase() === 'DELETE') {
      // Decrement active server
      ServerMetrics(message.type).active.dec()
    } else if (message.status.toUpperCase() === 'REQUEST_DELETE') {
      if (message.type === ServerType.FALLBACK) {
        return
      }

      await ServerProvider.deleteServer(message.name).catch((err) => {
        global.log.fatal(err, `Could not delete server (name ${message.name})`)
      })
    }
  },
  /**
   * Listen server request
   * @param serverType The server type
   */
  listenRequest(serverType: ServerType): void {
    ServerProvider.createServer(serverType).catch((err) => {
      // Notify bungee
      this.send({
        name: '',
        status: 'FAIL_CREATE',
        type: serverType
      })

      global.log.fatal(err, `Could not create an server (type: ${serverType})`)
    })
  },
  send(message: ServerNotifyData): void {
    redis.publish(
      RedisConstant.SERVER_NOTIFY,
      JSON.stringify({
        '@class': javaClass.pubSub.serverNotify,
        ...message
      })
    )
  }
}
