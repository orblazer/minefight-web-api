/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import _ from 'lodash'

export const inetSocketAddressRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9]):(6553[0-5]|655[0-2][0-9]\d|65[0-4](\d){2}|6[0-4]\d{3}|[1-5]\d{4}|[1-9]\d{0,3})$/

/**
 * Convert java types to JS (convert date and array)
 * @param obj The object want converted
 */
export function javaToJS(obj: any): void {
  _.forIn(obj, function (value, key): void {
    if (key === '@class') {
      delete obj[key]
    } else if (Array.isArray(value) && typeof value[0] === 'string') {
      if (value[0].endsWith('java.util.Date')) {
        obj[key] = new Date(value[1])
      } else if (value[0].endsWith('java.util.ArrayList') || value[0].endsWith('java.net.InetSocketAddress')) {
        obj[key] = value[1]
      }
    } else if (_.isObject(value)) {
      javaToJS(value)
    }
  })
}

/**
 * Convert js types to java (convert date and array)
 *
 * **\/!\ This not re add `@class`**
 *
 * @param obj The object want converted
 */
export function jsToJava(obj: any): void {
  // If object contains `@class` this not need fix type
  if (typeof _.findKey(obj, '@class') !== 'undefined') {
    return
  }

  _.forIn(obj, function (value, key): void {
    if (value instanceof Date) {
      obj[key] = ['java.util.Date', value.getTime()]
    } else if (Array.isArray(value)) {
      obj[key] = ['java.util.ArrayList', value]
    } else if (typeof value === 'string' && inetSocketAddressRegex.test(value)) {
      obj[key] = ['java.net.InetSocketAddress', value]
    } else if (_.isObject(value)) {
      jsToJava(value)
    }
  })
}
