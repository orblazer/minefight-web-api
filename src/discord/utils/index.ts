import { MessageEmbed, PartialUser, User } from 'discord.js'
import { FullSanctionType } from '@/data/enum'
import MinecraftColor from '@/utils/MinecraftColor'
import { formatDistanceToNow } from 'date-fns'
import { fr as dateFr } from 'date-fns/locale'
import { CONSOLE_ID } from '@/mongodb/Account'
import { avatar } from '@/utils/Crafatar'

export const colors = {
  red: '#C83232',
  green: '#32C832',
  // sanctions
  MUTE: '#57728E',
  BAN: '#C83232',
  KICK: '#FF9400',
  REPORT: '#FFE300',
  UNMUTE: '#32C832',
  UNBAN: '#32C832'
}
export const prefix = {
  reason: ':page_facing_up: **Raison :**',
  // sanctions
  MUTE: ':mute: **Mute :**',
  BAN: ':no_entry: **Ban :**',
  KICK: ':boot: **Kick :**',
  REPORT: ':warning: **Report :**',
  UNMUTE: ':sound: **Un mute :**',
  UNBAN: ':grey_exclamation: **Pardon :**'
}

export interface MinecraftUser {
  id: string
  username: string
}

/**
 * Generate an discord sanction
 * @param author The author of sanction
 * @param target The target of sanction
 * @param type The type of sanction
 * @param reason The reason of sanction
 * @param expire The expire of sanction
 * @return The generated sanction
 */
export function richDiscordSanction(
  author: User,
  target: User | PartialUser,
  type: FullSanctionType,
  reason?: string,
  expire?: number,
  timestamp?: number
): MessageEmbed {
  const result = new MessageEmbed()
    .setAuthor(author.tag, author.displayAvatarURL({ size: 64, dynamic: false }))
    .setColor(colors[type])
    .setThumbnail(target.displayAvatarURL({ size: 64, dynamic: false }))
    .setTitle('Discord sanction')
    .setDescription(`${prefix[type]} ${target.tag}\n` + `${prefix.reason} ${reason || "(Aucune raison n'est passé)"}`)
    .setTimestamp(timestamp)

  if (type === 'BAN' || type === 'MUTE') {
    if (typeof expire !== 'undefined') {
      result.setFooter('Durée : ' + formatDistanceToNow(expire, { locale: dateFr }))
    } else if (type === 'BAN') {
      result.setFooter('Ban permanent')
    } else {
      result.setFooter('Mute permanent')
    }
  }

  return result
}

/**
 * Generate an minecraft sanction
 * @param id The sanction id
 * @param author The author of sanction
 * @param target The target of sanction
 * @param type The type of sanction
 * @param reason The reason of sanction
 * @param expire The expire of sanction
 * @return The generated sanction
 */

export function richMinecraftSanction(
  id: string,
  author: MinecraftUser,
  target: MinecraftUser,
  type: FullSanctionType,
  reason: string | null,
  expire: number
): MessageEmbed {
  const sanctionUrl = (process.env.WEBSITE_SANCTION_URL || '').replace('{id}', id)
  const targetUrl = (process.env.WEBSITE_PLAYER_URL || '').replace('{id}', target.id)

  const message = new MessageEmbed()
    .setColor(colors[type])
    .setThumbnail(avatar(target.id, 64))
    .setTitle('Minecraft sanction')
    .setDescription(
      `${prefix[type]} [${target.username}](${targetUrl})\n` +
        `${prefix.reason} ${reason}\n\n` +
        `[Voir la sanction](${sanctionUrl})`
    )
    .setTimestamp()
  // Fill author
  if (author.id !== CONSOLE_ID) {
    message.setAuthor(
      author.username,
      avatar(author.id, 64),
      (process.env.WEBSITE_PLAYER_URL || '').replace('{id}', author.id)
    )
  } else {
    message.setAuthor(MinecraftColor.clean(author.username))
  }

  if (type === 'BAN' || type === 'MUTE') {
    if (expire >= 0) {
      message.setFooter('Expire dans : ' + formatDistanceToNow(expire, { locale: dateFr }))
    } else {
      message.setFooter('Ban permanent')
    }
  }

  return message
}
