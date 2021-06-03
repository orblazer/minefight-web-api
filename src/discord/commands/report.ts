import { Message } from 'discord.js'
import { richDiscordSanction } from '../utils'
import discord from '..'
import Command from './BaseCommand'

export default class KickCommand extends Command {
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

      message.react('✅')
      message.reply(`<@${member.id}> a bien été reporter`)
      discord.sendModerationMessage(richDiscordSanction(message.author, member.user, 'REPORT', reason))
    } else {
      // Otherwise, if no user was mentioned
      this.sendUsage(message)
    }
  }
}
