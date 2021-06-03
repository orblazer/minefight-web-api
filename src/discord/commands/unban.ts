import { Message, PermissionResolvable, MessageEmbed, User, Guild, PartialUser } from 'discord.js'
import { richDiscordSanction } from '../utils'
import Command from './BaseCommand'

export default class UnbanCommand extends Command {
  public readonly permission: PermissionResolvable = 'BAN_MEMBERS'
  public readonly usage = '<user> <reason>'

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

    const reason = args.join(' ')
    await message.guild?.members
      .unban(mention, reason)
      .then((user) => {
        message.react('✅')
        user.send(`Vous avez été débanni par **${message.author.username}** du server https://minefight.fr/discord`)
        message.reply(`<@${user.id}> a bien été débanni`)
      })
      .catch(() => {
        message.reply(':x: Impossible de débannir ce membre.')
      })
  }

  public static async notify(guild: Guild, user: User | PartialUser): Promise<MessageEmbed | null> {
    const fetchedLogs = await guild.fetchAuditLogs({
      limit: 1,
      type: 'MEMBER_BAN_REMOVE'
    })
    // Since we only have 1 audit log entry in this collection, we can simply grab the first one
    const unbanLog = fetchedLogs.entries.first()
    // Let's perform a sanity check here and make sure we got *something*
    if (!unbanLog) {
      return null
    }

    // We now grab the user object of the person who unbanned our member
    // Let us also grab the target of this action to double check things
    const { executor, target, reason, createdTimestamp } = unbanLog
    // And now we can update our output with a bit more information
    // We will also run a check to make sure the log we got was for the same unbanned member
    if ((target as User).id === user.id) {
      return richDiscordSanction(executor, user, 'UNBAN', reason || undefined, undefined, createdTimestamp)
    }

    return null
  }
}
