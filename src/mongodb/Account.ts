import { prop, modelOptions, getModelForClass, ReturnModelType, plugin, Ref } from '@typegoose/typegoose'
import { BasePropOptions } from '@typegoose/typegoose/lib/types'
import { SchemaTypes } from 'mongoose'
import { Binary } from 'bson'
import uuid, { EMPTY_UUID } from '@/utils/uuid'
import { SubscriptionType } from '@/data/enum'
import PaginatePlugin, { Paginable } from './utils/PaginatePlugin'
import { globalSchemaOptions } from '.'
import { PermissionGroup } from './PermissionGroup'

export const CONSOLE_ID = EMPTY_UUID

export const AccountRefConvert: BasePropOptions = {
  type: SchemaTypes.Buffer,
  subtype: Binary.SUBTYPE_UUID,
  get: (val?: Buffer): string | undefined => (val instanceof Buffer ? uuid.fromBuffer(val) : val),
  set: (val: string | Buffer): Buffer => (val instanceof Buffer ? val : uuid.toBuffer(val))
}

export class AccountData {
  @prop({ required: true })
  public locale!: string

  @prop({ required: true })
  public balance!: number

  @prop({ required: true, ref: PermissionGroup })
  public group!: Ref<PermissionGroup>

  @prop({ required: true })
  public websiteLinked!: boolean

  @prop({ required: true, enum: SubscriptionType })
  public subscription!: SubscriptionType

  @prop()
  public subscriptionEndDate?: Date

  @prop({ type: Map })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public serverData!: Map<string, Map<string, any>>
}

@modelOptions({ schemaOptions: { _id: false } })
export class AccountStatistic {
  @prop({ required: true })
  public played!: number

  @prop({ type: SchemaTypes.Mixed })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public data!: Map<string, any>
}

@modelOptions({ schemaOptions: { collection: 'accounts', ...globalSchemaOptions } })
@plugin(PaginatePlugin)
export class Account extends Paginable {
  @prop({
    required: true,
    ...AccountRefConvert
  })
  public readonly _id!: string

  @prop({ required: true, immutable: true, unique: true, trim: true })
  public readonly username!: string

  @prop({ required: true, immutable: true })
  public readonly createdAt!: Date

  @prop({ required: true, immutable: true })
  public readonly createdIp!: string

  @prop({ _id: false })
  public data?: AccountData

  @prop({ type: AccountStatistic })
  public statistics!: Map<string, AccountStatistic>

  /**
   * Check if the account exist
   * @param id The account id
   */
  public static async existsById(this: ReturnModelType<typeof Account>, id: string): Promise<boolean> {
    return this.exists({ _id: id })
  }

  /**
   * Get the total balance
   */
  public static async getTotalBalance(this: ReturnModelType<typeof Account>): Promise<number> {
    const totalBalance = await this.aggregate([{ $group: { _id: null, total: { $sum: '$data.balance' } } }])[0]
    if (typeof totalBalance === 'undefined') {
      return 0
    }
    return totalBalance.total
  }
}

export const AccountModel = getModelForClass(Account)
