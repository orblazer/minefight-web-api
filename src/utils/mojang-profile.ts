import Axios from 'axios'
import redis, { RedisConstant, isConnected } from '@/redis'
import uuid from './uuid'

const axios = Axios.create()

export interface GameProfileTextures {
  SKIN?: { url: string }
  CAPE?: { url: string }
}

export class GameProfile {
  public readonly id!: string

  public readonly uuid!: string

  public readonly name!: string

  public readonly textures!: GameProfileTextures

  public constructor(id: string, uuid: string, name: string, textures: GameProfileTextures) {
    this.id = id
    this.uuid = uuid
    this.name = name
    this.textures = textures
  }
}

export async function getProfileFromId(id: string): Promise<GameProfile> {
  const uniqueId = uuid.fromTrimmed(id)

  // Retrieve game profile from redis
  const redisKey = RedisConstant.GAME_PROFILE_KEY + uniqueId
  if (isConnected(redis)) {
    const rawGameProfile = await redis.get(redisKey)
    if (rawGameProfile != null) {
      const redisAccount: GameProfile = JSON.parse(rawGameProfile)
      return new GameProfile(id, uniqueId, redisAccount.name, redisAccount.textures)
    }
  }

  // Get info on mojang API
  const {
    data: { name, properties }
  } = await axios.get<{ id: string; name: string; properties: Array<{ name: string; value: string }> }>(
    `https://sessionserver.mojang.com/session/minecraft/profile/${id}`
  )

  // Retrieve textures
  let textures = {}
  for (const property of properties) {
    if (property.name === 'textures') {
      textures = JSON.parse(Buffer.from(property.value, 'base64').toString('utf-8')).textures
      break
    }
  }

  const gameProfile = new GameProfile(id, uniqueId, name, textures)
  if (isConnected(redis)) {
    await redis.set(redisKey, JSON.stringify(gameProfile), 'EX', 60)
  }

  return gameProfile
}

export async function getProfile(username: string): Promise<GameProfile | void> {
  const {
    data: { id }
  } = await axios.get<{ id: string }>(
    `https://api.mojang.com/users/profiles/minecraft/${username}?at=${Math.round(Date.now() / 1000)}`
  )
  return getProfileFromId(id)
}
