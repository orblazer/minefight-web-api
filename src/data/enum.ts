/* eslint-disable no-redeclare */
import { omit } from 'lodash'

export type Lang = 'fr' | 'en'
export const Lang: Lang[] = ['fr', 'en']

export enum SubscriptionType {
  BRONZE = 'BRONZE',
  EMERALD = 'EMERALD',
  DIAMOND = 'DIAMOND'
}
export enum SubscriptionGroup {
  BRONZE = 'default',
  EMERALD = 'sub_emerald',
  DIAMOND = 'sub_diamond'
}

export type FullSanctionType = 'MUTE' | 'BAN' | 'KICK' | 'REPORT' | 'UNMUTE' | 'UNBAN'

export enum SanctionType {
  MUTE = 'MUTE',
  BAN = 'BAN',
  KICK = 'KICK',
  REPORT = 'REPORT'
}

export enum ServerType {
  UNKNOWN = 'UNKNOWN',
  FALLBACK = 'FALLBACK',
  BUNGEECORD = 'BUNGEECORD',
  LOBBY = 'LOBBY',
  FFA = 'FFA',
  INVASION = 'INVASION',
  PUNCH_IT = 'PUNCH_IT',
  RUSH = 'RUSH',
  DUEL = 'DUEL'
}

export enum ServerStatus {
  OFFLINE = 'OFFLINE',
  STARTING = 'STARTING',
  ONLINE = 'ONLINE'
}

export const GameType: Omit<typeof ServerType, 'BUNGEECORD' | 'LOBBY' | 'FALLBACK'> = omit(ServerType, [
  ServerType.BUNGEECORD,
  ServerType.FALLBACK,
  ServerType.LOBBY
])
export type GameType = Exclude<ServerType, ServerType.BUNGEECORD | ServerType.LOBBY | ServerType.FALLBACK>

export enum MinecraftMetrics {
  UPDATE_BALANCE = 'UPDATE_BALANCE',
  NEW_ACCOUNT = 'NEW_ACCOUNT',
  // Game
  GAME_CREATE = 'GAME_CREATE',
  GAME_DELETE = 'GAME_DELETE',
  GAME_START = 'GAME_START',
  GAME_STOP = 'GAME_STOP',
  GAME_PLAYERS = 'GAME_PLAYERS'
}
