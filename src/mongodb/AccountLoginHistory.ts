import { prop, Ref, modelOptions, getModelForClass, plugin } from '@typegoose/typegoose'
import { Account, AccountRefConvert } from './Account'
import PaginatePlugin, { Paginable } from './utils/PaginatePlugin'

@modelOptions({ schemaOptions: { collection: 'account_login_history' } })
@plugin(PaginatePlugin)
export class AccountLoginHistory extends Paginable {
  @prop({ required: true, immutable: true, ref: Account, ...AccountRefConvert })
  // eslint-disable-next-line camelcase
  public readonly account_id!: Ref<Account, string>

  @prop({ required: true, immutable: true })
  public readonly date!: Date

  @prop({ required: true, immutable: true })
  public readonly ip!: string

  @prop({ required: true, immutable: true })
  public readonly username!: string
}

export const AccountLoginHistoryModel = getModelForClass(AccountLoginHistory)
