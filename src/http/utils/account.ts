import { Account, AccountModel } from '@/mongodb/Account'
import { UUIDRegex } from '@/utils/uuid'
import { DocumentType, Ref } from '@typegoose/typegoose'
import HTTPError from '../errors/HTTPError'

export interface AccountParams {
  Params: { id: string }
}

export const accountParamsJsonSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
      pattern: UUIDRegex.source
    }
  },
  required: ['id']
}

export const accountNotFound = new HTTPError('The account not found', 404)
export const failUpdateError = new HTTPError('Could not update account', 500)

export async function getAccount(id: Ref<Account, string>): Promise<DocumentType<Account>> {
  return await AccountModel.findById(id).orFail(() => accountNotFound).exec()
}
