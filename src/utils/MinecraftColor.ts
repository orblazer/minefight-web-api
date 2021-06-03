import { escape } from 'lodash'

/**
 * This is helper for parse minecraft color
 *
 * Source : https://github.com/Spirit55555/PHP-Minecraft
 */
export default class MinecraftColor {
  private static readonly REGEX = /(?:§|&amp;)([0-9a-fklmnor])/gi
  private static readonly START_TAG_INLINE_STYLED = '<span style="{style}">'
  private static readonly START_TAG_WITH_CLASS = '<span class="{class}">'
  private static readonly CLOSE_TAG = '</span>'
  private static readonly CSS_COLOR = 'color: #'
  private static readonly EMPTY_TAGS = /<[^/>]*>([\s]?)*<\/[^>]*>/
  private static readonly LINE_BREAK = '<br />'

  private static readonly colors = {
    0: '000000', // Black
    1: '0000AA', // Dark Blue
    2: '00AA00', // Dark Green
    3: '00AAAA', // Dark Aqua
    4: 'AA0000', // Dark Red
    5: 'AA00AA', // Dark Purple
    6: 'FFAA00', // Gold
    7: 'AAAAAA', // Gray
    8: '555555', // Dark Gray
    9: '5555FF', // Blue
    a: '55FF55', // Green
    b: '55FFFF', // Aqua
    c: 'FF5555', // Red
    d: 'FF55FF', // Light Purple
    e: 'FFFF55', // Yellow
    f: 'FFFFFF' // White
  }

  private static readonly formatting = {
    k: '', // Obfuscated
    l: 'font-weight: bold;', // Bold
    m: 'text-decoration: line-through;', // Strikethrough
    n: 'text-decoration: underline;', // Underline
    o: 'font-style: italic;', // Italic
    r: '' // Reset
  }

  private static readonly cssClassnames = {
    0: 'black',
    1: 'dark-blue',
    2: 'dark-green',
    3: 'dark-aqua',
    4: 'dark-red',
    5: 'dark-purple',
    6: 'gold',
    7: 'gray',
    8: 'dark-gray',
    9: 'blue',
    a: 'green',
    b: 'aqua',
    c: 'red',
    d: 'light-purple',
    e: 'yellow',
    f: 'white',
    k: 'obfuscated',
    l: 'bold',
    m: 'line-strikethrough',
    n: 'underline',
    o: 'italic'
  }

  /**
   * Clean the color on the text
   * @param text The text want converted
   * @return Cleaned text
   */
  public static clean(text: string): string {
    return escape(text).replace(MinecraftColor.REGEX, '')
  }

  /**
   * Convert minecraft color to html color
   * @param text The text want converted
   * @param lineBreakElement Replace \n with <br /> or not
   * @param cssClasses Use class for colorize
   * @return Converted text
   */
  public static convertToHTML(
    text: string,
    lineBreakElement = false,
    cssClasses = false,
    cssPrefix = 'minecraft-formatted--'
  ): string {
    text = escape(text)

    let openTags = 0
    let match: RegExpExecArray | null
    while ((match = MinecraftColor.REGEX.exec(text)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (match.index === MinecraftColor.REGEX.lastIndex) {
        MinecraftColor.REGEX.lastIndex++
      }

      const color = match[0] // This is what we are going to replace with HTML.
      const colorCode = match[1].toLowerCase() // This is the color numbers/characters only.

      let html = ''
      const isReset = colorCode === 'r'
      const isColor = typeof MinecraftColor.colors[colorCode] !== 'undefined'

      if (isReset || isColor) {
        // New colors or the reset char: reset all other colors and formatting.
        if (openTags !== 0) {
          html = MinecraftColor.CLOSE_TAG.repeat(openTags)
          openTags = 0
        }
      }

      if (cssClasses) {
        if (!isReset) {
          html += MinecraftColor.START_TAG_WITH_CLASS.replace(
            '{class}',
            cssPrefix + MinecraftColor.cssClassnames[colorCode]
          )
          openTags++
        }
      } else if (isColor) {
        html += MinecraftColor.START_TAG_INLINE_STYLED.replace(
          '{style}',
          MinecraftColor.CSS_COLOR + MinecraftColor.colors[colorCode]
        )
        openTags++
      } else if (colorCode === 'k') {
        html = ''
      } else if (!isReset) {
        html += MinecraftColor.START_TAG_INLINE_STYLED.replace('{style}', MinecraftColor.formatting[colorCode])
        openTags++
      }

      // Replace the color with the HTML code.
      text = text.replace(color, html)
    }

    // Still open tags? Close them!
    if (openTags !== 0) {
      text = text + MinecraftColor.CLOSE_TAG.repeat(openTags)
    }

    // Replace \n with <br />
    if (lineBreakElement) {
      text = text.replace(/\n/g, MinecraftColor.LINE_BREAK)
    }

    // Return the text without empty HTML tags. Only to clean up bad color formatting from the user.
    return text.replace(MinecraftColor.EMPTY_TAGS, '')
  }
}
