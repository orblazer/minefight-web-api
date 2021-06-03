import { initialize as serverInit } from './server'
import { initialize as sanctionsInit } from './sanctions'
import { initialize as minecraftInit } from './minecraft'

export default function initialize(): void {
  serverInit()
  sanctionsInit()
  minecraftInit()
}
