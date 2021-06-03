import { GameType } from './enum'

export type GameState = 'WAITING' | 'LAUNCHING' | 'IN_GAME' | 'END_GAME' | 'OPEN'

export default class Game {
  public readonly id!: string
  public readonly serverName!: string
  public readonly type!: GameType
  public readonly state!: GameState
  public readonly canSpectate!: boolean
  public readonly playersWaitReconnect!: string[]
  public readonly full!: boolean
  public readonly online!: number
  public readonly maxPlayers!: number
  public readonly data!: Record<string, unknown>

  /**
   * Create an new game
   * @param id The game id
   * @param serverName The server own the game
   * @param type The type of the game
   * @param state The state of the game
   * @param canSpectate The game allow spectator
   * @param playersWaitReconnect The players wait reconnect to the server
   * @param full The game is full or not
   * @param online The number of online players
   * @param maxPlayers The maximum of players in the game
   * @param data The game data
   */
  public constructor(
    id: string,
    serverName: string,
    type: GameType,
    state: GameState,
    canSpectate: boolean,
    playersWaitReconnect: string[],
    full: boolean,
    online: number,
    maxPlayers: number,
    data: Record<string, unknown>
  ) {
    this.id = id
    this.serverName = serverName
    this.type = type
    this.state = state
    this.canSpectate = canSpectate
    this.playersWaitReconnect = playersWaitReconnect
    this.full = full
    this.online = online
    this.maxPlayers = maxPlayers
    this.data = data
  }
}
