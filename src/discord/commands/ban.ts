import { Message, PermissionResolvable, MessageEmbed, User, Guild, GuildMember } from 'discord.js'
import { richDiscordSanction } from '../utils'
import Command from './BaseCommand'

export default class BanCommand extends Command {
  public readonly permission: PermissionResolvable = 'BAN_MEMBERS'
  public readonly usage = '<user> <days/-1> <reason>'

  public async execute(message: Message, args: string[]): Promise<void> {
    if (args.length < 3) {
      this.sendUsage(message)
      return
    }

    const mention = this.getUserFromMention(args.shift() as string)
    if (mention === null) {
      this.sendUsage(message)
      return
    }

    let days: number | undefined = Number(args.shift() as string)
    if (isNaN(days) || days === -1) {
      days = undefined
    }

    const reason = args.join(' ')
    await message.guild?.members
      .ban(mention, { days, reason })
      .then((user) => {
        if (typeof user === 'string') {
          throw new TypeError('invalid user')
        }
        if ((user as GuildMember).user) {
          user = (user as GuildMember).user
        }

        let time = days + ' jour(s)'
        if (typeof days === 'undefined') {
          time = 'à vie'
        }

        message.react('✅')
        user.send(
          `Vous avez été banni ${time} par **${message.author.username}** du server https://minefight.fr/discord\n__Pour la raison__ : ${reason}`
        )
        message.reply(`<@${user.id}> a bien été banni`)
      })
      .catch(() => {
        message.react('❌')
        message.reply(':x: Impossible de bannir ce membre.')
      })
  }

  public static async notify(guild: Guild, user: User): Promise<MessageEmbed | null> {
    const fetchedLogs = await guild.fetchAuditLogs({
      limit: 1,
      type: 'MEMBER_BAN_ADD'
    })
    // Since we only have 1 audit log entry in this collection, we can simply grab the first one
    const banLog = fetchedLogs.entries.first()
    // Let's perform a sanity check here and make sure we got *something*
    if (!banLog) {
      return null
    }

    // We now grab the user object of the person who banned our member
    // Let us also grab the target of this action to double check things
    const { executor, target, reason, createdTimestamp } = banLog
    // And now we can update our output with a bit more information
    // We will also run a check to make sure the log we got was for the same banned member
    if ((target as User).id === user.id) {
      return richDiscordSanction(executor, user, 'BAN', reason || undefined, undefined, createdTimestamp)
    }

    return null
  }
}
