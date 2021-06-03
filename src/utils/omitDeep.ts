import _ from 'lodash'

export default function omitDeep(obj: Record<string, unknown>, omit: string): void {
  _.forIn(obj, function (value, key): void {
    if (_.isObject(value)) {
      omitDeep(value as Record<string, unknown>, omit)
    } else if (key === omit) {
      delete obj[key]
    }
  })
}
