import { prop, modelOptions, ReturnModelType, DocumentType, getModelForClass } from '@typegoose/typegoose'
import { DocumentQuery, SchemaTypes } from 'mongoose'
import uuid from '@/utils/uuid'

@modelOptions({ schemaOptions: { collection: 'account_beta' } })
export class AccountBeta {
  @prop({
    required: true,
    unique: true,
    type: SchemaTypes.Buffer,
    subtype: 3,
    get: (val: Buffer): string => uuid.fromBuffer(val),
    set: (val: string | Buffer): Buffer => (val instanceof Buffer ? val : uuid.toBuffer(val))
  })
  public readonly uniqueId!: string

  @prop({ required: true })
  public username!: string

  @prop({ required: true })
  public date!: Date

  public static findByUniqueId(
    this: ReturnModelType<typeof AccountBeta>,
    uniqueId: string
  ): DocumentQuery<DocumentType<AccountBeta> | null, DocumentType<AccountBeta>> {
    return this.findOne({ uniqueId })
  }
}

export const AccountBetaModel = getModelForClass(AccountBeta)
