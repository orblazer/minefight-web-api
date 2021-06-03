/* eslint-disable camelcase */
import { prop, Ref, DocumentType, ReturnModelType, getModelForClass, modelOptions, plugin } from '@typegoose/typegoose'
import { DocumentQuery, SchemaTypes } from 'mongoose'
import { ObjectId } from 'bson'
import { SanctionType } from '@/data/enum'
import { Account, AccountRefConvert } from './Account'
import PaginatePlugin, { Paginable } from './utils/PaginatePlugin'

export interface JsonAccountSanction {
  id: string
  account_id: string
  date: Date
  type: SanctionType
  owner: string
  reason: string
  end_date?: Date
  end_reason?: string
  end_owner?: string
  isActive: boolean
}

@modelOptions({ schemaOptions: { collection: 'account_sanctions' } })
@plugin(PaginatePlugin)
export class AccountSanction extends Paginable {
  @prop({ required: true, immutable: true, ref: Account, ...AccountRefConvert })
  public account_id!: Ref<Account, string>

  @prop({ required: true, immutable: true })
  public date!: Date

  @prop({ required: true, immutable: true, enum: SanctionType })
  public type!: SanctionType

  @prop({ required: true, immutable: true, ref: Account, ...AccountRefConvert })
  public owner!: Ref<Account, string>

  @prop({ required: true, immutable: true })
  public reason!: string

  @prop({ type: SchemaTypes.Date })
  public end_date?: Date

  @prop()
  public end_reason?: string

  @prop({ ref: Account, ...AccountRefConvert })
  public end_owner?: Ref<Account>

  public get isActive(): boolean {
    if (
      (this.type === SanctionType.MUTE || this.type === SanctionType.BAN) &&
      (typeof this.end_date === 'undefined' || this.end_date.getTime() > Date.now()) &&
      typeof this.end_owner === 'undefined'
    ) {
      return true
    }

    return false
  }

  public toJSON(this: DocumentType<AccountSanction>): JsonAccountSanction {
    return {
      id: (this._id as ObjectId).toHexString(),
      account_id: this.account_id.toString(),
      date: this.date as Date,
      type: this.type,
      owner: this.owner.toString(),
      reason: this.reason,
      end_date: this.end_date,
      end_reason: this.end_reason,
      end_owner: typeof this.end_owner !== 'undefined' ? this.end_owner.toString() : undefined,
      isActive: this.isActive
    }
  }

  public end(
    this: DocumentType<AccountSanction>,
    date: Date,
    reason: string,
    ownerId: string
  ): Promise<DocumentType<AccountSanction>> {
    this.end_date = date
    this.end_reason = reason
    this.end_owner = ownerId
    return this.save()
  }

  public static async countActives(
    this: ReturnModelType<typeof AccountSanction>
  ): Promise<{ [SanctionType.MUTE]: number; [SanctionType.BAN]: number }> {
    return {
      [SanctionType.MUTE]: await this.countDocuments({
        type: SanctionType.MUTE,
        $or: [{ end_date: undefined }, { end_date: { $gt: new Date() } }],
        end_owner: undefined
      }),
      [SanctionType.BAN]: await this.countDocuments({
        type: SanctionType.BAN,
        $or: [{ end_date: undefined }, { end_date: { $gt: new Date() } }],
        end_owner: undefined
      })
    }
  }

  public static findActives(
    this: ReturnModelType<typeof AccountSanction>,
    accountId: string
  ): DocumentQuery<DocumentType<AccountSanction>[], DocumentType<AccountSanction>> {
    return this.find({
      account_id: accountId,
      type: { $in: [SanctionType.MUTE, SanctionType.BAN] },
      $or: [{ end_date: undefined }, { end_date: { $gt: new Date() } }],
      end_owner: undefined
    })
  }

  public static findActiveBan(
    this: ReturnModelType<typeof AccountSanction>,
    accountId: string
  ): DocumentQuery<DocumentType<AccountSanction> | null, DocumentType<AccountSanction>> {
    return this.findOne({
      account_id: accountId,
      type: SanctionType.BAN,
      $or: [{ end_date: undefined }, { end_date: { $gt: new Date() } }],
      end_owner: undefined
    })
  }
}

export const AccountSanctionModel = getModelForClass(AccountSanction)
