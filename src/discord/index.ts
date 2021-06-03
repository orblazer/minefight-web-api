import { join } from 'path'
import DiscordJS from 'discord.js'
import { FullSanctionType } from '@/data/enum'
import Command, { CommandConstructor } from './commands/BaseCommand'
import { MinecraftUser, richMinecraftSanction } from './utils'
import KickCommand from './commands/kick'
import BanCommand from './commands/ban'
import UnbanCommand from './commands/unban'

export interface Options {
  prefix: string
  commands: string[]
  channels: {
    moderation: string | null
  }
}

export class Discord {
  private readonly client: DiscordJS.Client
  private readonly options: Options
  readonly commands: DiscordJS.Collection<string, Command>
  readonly commandsCooldown: DiscordJS.Collection<string, Set<string>>

  constructor(options?: Partial<Options>) {
    // Initialize variables
    this.client = new DiscordJS.Client()
    this.options = {
      prefix: '!',
      commands: [],
      channels: {
        moderation: null
      },
      ...(options || {})
    }

    // Load commands
    this.commands = new DiscordJS.Collection()
    this.commandsCooldown = new DiscordJS.Collection()
    this.options.commands.forEach(async (command) => {
      const Command: CommandConstructor = (await import(`./commands/${command}`)).default
      this.commands.set(command, new Command(this.client, command))
      global.log.debug({ msg: `Load command '${command}'`, module: 'discord' })
    })

    // Listen new message
    this.client.on('message', this.onMessage.bind(this))

    // Listen some other event
    this.client.on('guildMemberRemove', async (member) => {
      const message = await KickCommand.notify(member)
      message && (await this.sendModerationMessage(message))
    })
    this.client.on('guildBanAdd', async (guild, user) => {
      const message = await BanCommand.notify(guild, user)
      message && (await this.sendModerationMessage(message))
    })
    this.client.on('guildBanRemove', async (guild, user) => {
      const message = await UnbanCommand.notify(guild, user)
      message && (await this.sendModerationMessage(message))
    })
  }

  /**
   * Login the client
   * @param token The token of client
   */
  public async login(token: string): Promise<void> {
    await this.client.login(token)
    if (!this.client.user) {
      return
    }

    this.client.user.verified = true
    this.client.user.setPresence({
      status: 'online',
      activity: {
        name: ':minefight: Travaille sur Minefight',
        type: 'CUSTOM_STATUS',
        url: 'https://www.minefight.fr/'
      }
    })
  }

  /**
   * Destroy the discord client
   */
  public destroy(): void {
    return this.client.destroy()
  }

  /**
   * Handle message
   * @param message Message received
   */
  private async onMessage(message: DiscordJS.Message): Promise<void> {
    // Ignore messages that aren't from a guild
    if (!message.guild || !message.member) {
      return
    }
    const commandPrefix = this.options.prefix

    // Handle commands
    if (!message.content.startsWith(commandPrefix) || message.author.bot) {
      return
    }
    global.log.debug({
      msg: `Receive command '${message.content}' by ${message.author.username}`,
      module: 'discord'
    })
    message.react('👀')

    const args = message.content.slice(commandPrefix.length).split(/ +/)
    const commandName = (args.shift() as string).toLowerCase()
    const command =
      this.commands.get(commandName) || this.commands.find((command) => command.aliases.includes(commandName))
    // Notify if command could not be found
    if (typeof command === 'undefined' || command === null) {
      message.react('❌')
      message.reply(`:x: La commande \`${commandPrefix}${commandName}\` n'existe pas`)
      return
    }
    // Notify if member doesn't have permission for that command
    if (
      command.permission !== 0 &&
      !message.member.hasPermission(command.permission, { checkAdmin: true, checkOwner: true })
    ) {
      message.react('❌')
      message.reply(":x: Vous n'avez pas accès a cette commande.")
      return
    }
    // Manage the cooldown of the command
    if (command.cooldown !== -1) {
      if (this.commandsCooldown.has(commandName)) {
        this.commandsCooldown.set(commandName, new Set())
      }
      const commandCooldown = this.commandsCooldown.get(commandName) as Set<string>
      if (commandCooldown.has(message.author.id)) {
        return
      }
      commandCooldown.add(message.author.id)
      this.client.setTimeout(() => commandCooldown.delete(message.author.id), command.cooldown)
    }

    try {
      const result = command.execute(message, args)
      if (result instanceof Promise) {
        await result
      }
    } catch (error) {
      global.log.error(error, 'Discord throw error:')

      message.react('‼️')
      message.reply(":x: Une erreur c'est produite durant l'éxécution de la commande")
    }
  }

  /**
   * Send an message to an specific channel
   * @param message The message want send
   * @param channelId The channel id
   */
  public async sendToChannel(
    message: string | DiscordJS.MessageEmbed | DiscordJS.MessageAttachment,
    channelId: string,
    options?: DiscordJS.MessageOptions
  ): Promise<void | DiscordJS.Message | DiscordJS.Message[]> {
    if (!this.client.user) {
      return Promise.resolve()
    }

    const channel = this.client.guilds?.cache.first()?.channels.cache.get(channelId)
    if (!channel || !(channel instanceof DiscordJS.TextChannel)) {
      const error = new Error(`The channel <#${channelId}> is not found or is not text channel`)
      global.log.error(error, 'Discord throw error:')

      throw error
    }
    try {
      if (typeof options !== 'undefined') {
        return await channel.send(message, options || {})
      } else {
        return await channel.send(message)
      }
    } catch (err) {
      global.log.error(err, 'Discord throw error:')
    }
  }

  /**
   * Send an minecraft sanction
   * @param id The sanction id
   * @param author The author of sanction
   * @param target The target of sanction
   * @param type The type of sanction
   * @param reason The reason of sanction
   * @param expire The expire of sanction
   */
  public sendMinecraftSanction(
    id: string,
    author: MinecraftUser,
    target: MinecraftUser,
    type: FullSanctionType,
    reason: string | null,
    expire: number
  ): Promise<void | DiscordJS.Message | DiscordJS.Message[]> {
    return this.sendModerationMessage(richMinecraftSanction(id, author, target, type, reason, expire))
  }

  /**
   * Send an message in moderation
   * @param message The message want send
   */
  public sendModerationMessage(
    message: DiscordJS.MessageEmbed | DiscordJS.MessageAttachment
  ): Promise<void | DiscordJS.Message | DiscordJS.Message[]> {
    if (this.options.channels.moderation === null) {
      return Promise.resolve()
    }

    return this.sendToChannel(message, this.options.channels.moderation)
  }
}

export default new Discord(require(join(process.cwd(), 'discord-config.json')))
