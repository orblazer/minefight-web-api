import { PermissionResolvable, Message, Client, User } from 'discord.js'

export default abstract class Command {
  protected readonly client: Client
  public readonly name: string
  public readonly description: string | null = null
  public readonly usage: string | null = null
  public readonly permission: PermissionResolvable = 0
  public readonly aliases: string[] = []
  public readonly cooldown: number = -1

  public constructor(client: Client, name: string) {
    this.client = client
    this.name = name
  }

  abstract execute(message: Message, args: string[]): void | Promise<void>

  public sendUsage(message: Message): Promise<Message | Message[]> {
    return message.reply(':grey_question: **Utilisation** : ' + this.usage)
  }

  /**
   * Get the user from mention text
   */
  protected getUserFromMention(mention: string): User | null {
    // The id is the first and only match found by the RegEx.
    const matches = mention.match(/^<@!?(\d+)>$/)
    // If supplied variable was not a mention, matches will be null instead of an array.
    if (!matches) {
      return null
    }

    // However the first element in the matches array will be the entire mention, not just the ID,
    // so use index 1.
    const id = matches[1]
    return this.client.users.cache.get(id) || null
  }
}

export interface CommandConstructor {
  new (client: Client, name: string): Command
}
