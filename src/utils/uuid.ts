import { v4 as uuidV4 } from 'uuid'

export const UUIDRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
export const trimmedUUIDRegex = /^[0-9a-fA-F]{12}4[0-9a-fA-F]{3}[89abAB][0-9a-fA-F]{15}$/
export const EMPTY_UUID = '00000000-0000-0000-0000-000000000000'

function toBuffer(uuid: string): Buffer {
  if (uuid !== EMPTY_UUID && !UUIDRegex.test(uuid)) {
    throw new TypeError('The uuid is not valid UUID v4')
  }
  return Buffer.from(uuid.replace(/-/g, ''), 'hex')
}

export default {
  emptyUUID: toBuffer(EMPTY_UUID),

  fromBuffer(buffer: Buffer): string {
    if (buffer.length !== 16) {
      throw new TypeError('Expected length to be 16, not ' + buffer.length)
    }
    if (this.emptyUUID.equals(buffer)) {
      return EMPTY_UUID
    }
    return uuidV4({ random: buffer })
  },
  toBuffer,

  fromTrimmed(uuid: string): string {
    return (
      uuid.substring(0, 8) +
      '-' +
      uuid.substring(8, 12) +
      '-' +
      uuid.substring(12, 16) +
      '-' +
      uuid.substring(16, 20) +
      '-' +
      uuid.substring(20, 32)
    ).toUpperCase()
  }
}
