import { ServerType, ServerStatus } from './enum'
import { ArrayList, InetSocketAddress } from './javaClass'

export interface RedisServer {
  '@class': 'fr.minefight.common.ServerInfo'
  name: string
  host: string
  address: InetSocketAddress
  type: ServerType
  status: ServerStatus
  players: ArrayList<string>
  full: boolean
  constant: boolean
  maxGames: number
}

export default class Server {
  public readonly name!: string
  public readonly host!: string
  public readonly address!: string
  public readonly type!: ServerType
  public readonly status!: ServerStatus
  public readonly players!: string[]
  public readonly full!: boolean
  public readonly constant!: boolean
  public readonly maxGames!: number

  /**
   * Create an new server
   * @param name The name of server
   * @param host The host of server (public ip)
   * @param address The address of server (internal ip)
   * @param type The type of server
   * @param status The server status
   * @param players The list of server player
   * @param full The server is full or not
   * @param constant The server is constant or not
   * @param maxGames the maximum of number that server can be own
   */
  public constructor(
    name: string,
    host: string,
    address: string,
    type: ServerType,
    status: ServerStatus,
    players: string[],
    full: boolean,
    constant: boolean,
    maxGames: number
  ) {
    this.name = name
    this.host = host
    this.address = address
    this.type = type
    this.status = status
    this.players = players
    this.full = full
    this.constant = constant
    this.maxGames = maxGames
  }

  public toRedis(): RedisServer {
    return {
      '@class': 'fr.minefight.common.ServerInfo',
      name: this.name,
      host: this.host,
      address: ['java.net.InetSocketAddress', this.address],
      type: this.type,
      status: this.status,
      players: ['java.util.ArrayList', this.players],
      full: this.full,
      constant: this.constant,
      maxGames: this.maxGames
    }
  }
}
