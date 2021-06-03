import { Message, PermissionResolvable, GuildMember, User, MessageEmbed, PartialGuildMember } from 'discord.js'
import { richDiscordSanction } from '../utils'
import Command from './BaseCommand'

export default class KickCommand extends Command {
  public readonly permission: PermissionResolvable = 'KICK_MEMBERS'
  public readonly usage = '<user> <reason>'

  public async execute(message: Message, args: string[]): Promise<void> {
    if (args.length < 2) {
      this.sendUsage(message)
      return
    }
    const mention = this.getUserFromMention(args.shift() as string)
    if (mention === null) {
      this.sendUsage(message)
      return
    }

    // If we have a member mentioned
    const member = await message.guild?.members.fetch(mention)
    if (member) {
      const reason = args.join(' ')
      member
        .kick(reason)
        .then(() => {
          message.react('✅')
          member.send(
            `Vous avez été kick par **${message.author.username}** du server https://minefight.fr/discord\n__Pour la raison__ : ${reason}`
          )
          message.reply(`<@${member.id}> a bien été kick`)
        })
        .catch(() => {
          message.react('❌')
          message.reply(':x: Impossible de kick ce membre.')
        })
    } else {
      // Otherwise, if no user was mentioned
      this.sendUsage(message)
    }
  }

  public static async notify(member: GuildMember | PartialGuildMember): Promise<MessageEmbed | null> {
    const fetchedLogs = await member.guild.fetchAuditLogs({
      limit: 1,
      type: 'MEMBER_KICK'
    })
    // Since we only have 1 audit log entry in this collection, we can simply grab the first one
    const kickLog = fetchedLogs.entries.first()
    // Let's perform a sanity check here and make sure we got *something*
    if (!kickLog || !member.user) {
      return null
    }

    // We now grab the user object of the person who kicked our member
    // Let us also grab the target of this action to double check things
    const { executor, target, reason, createdTimestamp } = kickLog
    // And now we can update our output with a bit more information
    // We will also run a check to make sure the log we got was for the same kicked member
    if ((target as User).id === member.id) {
      return richDiscordSanction(executor, member.user, 'KICK', reason || undefined, undefined, createdTimestamp)
    }

    return null
  }
}
