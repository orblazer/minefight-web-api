import mongoose from 'mongoose'
import { setGlobalOptions } from '@typegoose/typegoose'
mongoose.Promise = global.Promise

export const globalSchemaOptions: mongoose.SchemaOptions = {
  versionKey: false,
  id: false,
  toJSON: {
    getters: true,
    virtuals: false,
    minimize: false, // FIXME: wait for an fix
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
    transform(_doc: any, ret: any): void {
      if (typeof ret._id !== 'undefined') {
        ret.id = ret._id.toString()
        delete ret._id
      }
    }
  }
}
setGlobalOptions({
  schemaOptions: globalSchemaOptions,
  globalOptions: { useNewEnum: true }
})
export const ObjectIdRegex = /^[0-9a-fA-F]{24}$/

export function connect(): Promise<mongoose.Mongoose> {
  // Connect to mongo DB
  let auth = ''
  if (
    typeof process.env.MONGO_USER !== 'undefined' &&
    process.env.MONGO_USER !== '' &&
    typeof process.env.MONGO_PASS !== 'undefined' &&
    process.env.MONGO_PASS !== ''
  ) {
    auth = `${process.env.MONGO_USER}:${process.env.MONGO_PASS}@`
  }

  const [host, port] = (process.env.MONGO_HOST || 'localhost').split(':')
  return mongoose.connect(`mongodb://${auth}${host}:${Number(port || 27017)}/${process.env.MONGO_DB}`, {
    authSource: process.env.MONGO_AUTH_DB,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  })
}

export function disconnect(): Promise<void> {
  return mongoose.disconnect()
}
