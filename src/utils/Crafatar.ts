import { isEmpty } from 'lodash'
import { stringify } from 'querystring'

const baseUrl = 'https://crafatar.com'

function buildUrl(
  endpoint: string,
  options: { size?: number; scale?: number; overlay?: boolean; 'default'?: string }
): string {
  if (typeof options.size === 'number') {
    options.size = Math.max(1, Math.min(512, options.size))
  }
  if (typeof options.scale === 'number') {
    options.scale = Math.max(1, Math.min(10, options.scale))
  }
  if(typeof options.default !== 'string') {
    delete options.default
  }

  return baseUrl + endpoint + (isEmpty(options) ? '' : '?' + stringify(options))
}

/**
 * Create url for avatar
 * @param uuid The player unique id
 * @param size The size for avatar in pixels. (1-512)
 * @param overlay Apply the overlay to the avatar
 * @param defaultSkin The fallback to be used when the requested image cannot be served You can use a custom URL, any uuid, or MHF_Steve/MHF_Alex.
 *                        The option defaults to either MHF_Steve or MHF_Alex, depending on Minecraft's default for the requested UUID.
 * @returns The created url
 */
export function avatar(uuid: string, size: number, overlay = true, defaultSkin?: string): string {
  return buildUrl(`/avatars/${uuid}`, { size, overlay, 'default': defaultSkin })
}

/**
 * Create url for 3d head render
 * @param uuid The player unique id
 * @param scale The size for avatar in pixels. (1-10)
 * @param overlay Apply the overlay to the avatar
 * @param defaultSkin The fallback to be used when the requested image cannot be served You can use a custom URL, any uuid, or MHF_Steve/MHF_Alex.
 *                        The option defaults to either MHF_Steve or MHF_Alex, depending on Minecraft's default for the requested UUID.
 * @returns The created url
 */
export function head3D(uuid: string, scale: number, overlay = true, defaultSkin?: string): string {
  return buildUrl(`/renders/head/${uuid}`, { scale, overlay, 'default': defaultSkin })
}

/**
 * Create url for 3d body render
 * @param uuid The player unique id
 * @param scale The size for avatar in pixels. (1-10)
 * @param overlay Apply the overlay to the avatar
 * @param defaultSkin The fallback to be used when the requested image cannot be served You can use a custom URL, any uuid, or MHF_Steve/MHF_Alex.
 *                        The option defaults to either MHF_Steve or MHF_Alex, depending on Minecraft's default for the requested UUID.
 * @returns The created url
 */
export function body3D(uuid: string, scale: number, overlay = true, defaultSkin?: string): string {
  return buildUrl(`/renders/body/${uuid}`, { scale, overlay, 'default': defaultSkin })
}

/**
 * Create url for retrieve skin
 * @param uuid The player unique id
 * @param defaultSkin The fallback to be used when the requested image cannot be served You can use a custom URL, any uuid, or MHF_Steve/MHF_Alex.
 *                        The option defaults to either MHF_Steve or MHF_Alex, depending on Minecraft's default for the requested UUID.
 * @returns The created url
 */
export function skin(uuid: string, defaultSkin?: string): string {
  return buildUrl(`/skins/${uuid}`, { 'default': defaultSkin })
}

/**
 * Create url for retrieve cape
 * @param uuid The player unique id
 * @param defaultSkin The fallback to be used when the requested image cannot be served You can use a custom URL, any uuid, or MHF_Steve/MHF_Alex.
 *                        The option defaults to either MHF_Steve or MHF_Alex, depending on Minecraft's default for the requested UUID.
 * @returns The created url
 */
export function cape(uuid: string, defaultSkin?: string): string {
  return buildUrl(`/capes/${uuid}`, { 'default': defaultSkin })
}
