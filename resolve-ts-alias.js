/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const replace = require('replace-in-file')
const {
  compilerOptions: { paths, outDir }
} = require('./tsconfig.json')

// Remove wildcard
const aliases = {}
for (const alias in paths) {
  let resolved = alias
  if (alias.endsWith('/*')) {
    resolved = alias.replace('/*', '/')
  }

  aliases[resolved] = paths[alias]
}

replace({
  files: path.join(path.resolve(outDir), '**/*.js'),
  from: /require\("(@.*?)"\)/g,
  to (match, value, _size, _content, filePath) {
    let resolved = ''
    for (const alias in aliases) {
      if (value.startsWith(alias)) {
        const choices = aliases[alias]

        if (choices !== undefined) {
          resolved = choices[0]
          // Remove wildcard
          if (resolved.endsWith('/*')) {
            resolved = resolved.replace('/*', '/')
          }

          // Replace the start of path with resolved
          // FIXME: replace hard "src" replace by something more generic
          resolved = value.replace(alias, resolved).replace('src', outDir)
          break
        }
      }
    }

    if (resolved.length < 1) {
      return match
    }

    // Find relative path from the current file
    let relative = path.relative(path.dirname(filePath), resolved)
    relative = path.relative(path.dirname(filePath), path.resolve(path.dirname(filePath), relative))
    relative = relative.replace(/\\/g, '/')
    if (relative.length === 0 || !relative.startsWith('.')) {
      relative = './' + relative
    }

    return `require("${relative}")`
  }
})
