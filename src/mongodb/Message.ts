import { prop, modelOptions, getModelForClass, ReturnModelType, DocumentType, plugin } from '@typegoose/typegoose'
import { DocumentQuery } from 'mongoose'
import { BasePropOptions } from '@typegoose/typegoose/lib/types'
import { Lang } from '@/data/enum'
import PaginatePlugin, { Paginable } from './utils/PaginatePlugin'

const messagePropOption: BasePropOptions = {
  set(val: Map<Lang, string>) {
    val.forEach((msg, key) => {
      val.set(key, msg.replace(/(\r\n|\r|\n)/g, '{n}'))
    })

    return val
  },
  get(val: Map<Lang, string>) {
    val.forEach((msg, key) => {
      val.set(key, msg.replace(/\{n\}/g, '\n'))
    })

    return val
  }
}

@modelOptions({ schemaOptions: { collection: 'messages' } })
@plugin(PaginatePlugin)
export class Message extends Paginable {
  @prop({ required: true })
  public path!: string

  @prop({ required: true, type: String, ...messagePropOption })
  public messages!: Map<Lang, string>

  public static findByPath(
    this: ReturnModelType<typeof Message>,
    path: string
  ): DocumentQuery<DocumentType<Message> | null, DocumentType<Message>> {
    return this.findOne({ path })
  }
}

export const MessageModel = getModelForClass(Message)
