import { AccountModel, CONSOLE_ID } from '@/mongodb/Account'
import { MinecraftUser } from '@/discord/utils'
import { FullSanctionType, SanctionType } from '@/data/enum'
import SanctionMetrics from '@/metrics/sanctions'
import discord from '@/discord'

export interface SanctionNotifyData {
  id: string
  player: string
  owner: string
  type: FullSanctionType
  reason: string
  duration: number
}

export default async (message: SanctionNotifyData): Promise<void> => {
  const players = (
    await AccountModel.find({
      _id: { $in: [message.player, message.owner] }
    })
  ).map((account) => ({
    id: account._id,
    username: account.username
  }))
  const fallbackPlayer = (username: string): MinecraftUser => ({
    id: CONSOLE_ID,
    username
  })

  // Increment the metric
  if (message.type in SanctionType) {
    SanctionMetrics(SanctionType[message.type]).count.inc()
  }

  const sanctioned = players.find((player) => player.id === message.player) || fallbackPlayer(message.player)
  const owner = players.find((player) => player.id === message.owner) || fallbackPlayer(message.owner)

  discord.sendMinecraftSanction(message.id, owner, sanctioned, message.type, message.reason, message.duration)
}
