import javaClass from '@/data/javaClass'
import { GameType } from '@/data/enum'
import redis, { RedisConstant } from '..'

export interface GameRequestData {
  serverName: string
  type: GameType
  status: 'CREATE' | 'DELETE' | 'CREATED' | 'FAIl_CREATE'
  id?: string
}

export default {
  send(message: GameRequestData): void {
    redis.publish(
      RedisConstant.GAME_REQUEST,
      JSON.stringify({
        '@class': javaClass.pubSub.gameRequest,
        ...message
      })
    )
  }
}
