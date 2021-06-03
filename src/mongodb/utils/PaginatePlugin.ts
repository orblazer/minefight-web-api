import { Schema, Document, Model } from 'mongoose'

export interface PaginateOptions {
  page?: number
  limit?: number
  sort?: Record<string, unknown>
}

export interface PaginateResult<T> {
  docs: T[]
  meta: {
    totalDocs: number
    totalPages: number
    page: number
    limit: number
    pagingCounter: number
    hasPrevPage: boolean
    hasNextPage: boolean
    prevPage: number | null
    nextPage: number | null
  }
}

export default function (schema: Schema): void {
  schema.statics.paginate = async function paginate(
    this: Model<Document>,
    query: Record<string, unknown>,
    options?: PaginateOptions
  ): Promise<PaginateResult<Document>> {
    options = Object.assign({}, { page: 1, limit: 1 }, options)
    if (options.limit && options.limit < 1) {
      throw new RangeError('The limit could not be less then 1')
    }

    const page = options.page || 1
    const limit = options.limit || 1
    const skip = (page - 1) * limit

    // Count documents
    const count = await this.countDocuments(query)

    // Find documents
    const docs = await this.find(query).sort(options.sort).skip(skip).limit(limit)

    // Create meta data
    const pages = Math.ceil(count / limit)
    return {
      docs,
      meta: {
        totalDocs: count,
        totalPages: pages,
        page,
        limit,
        pagingCounter: skip + 1,
        hasPrevPage: page > 1,
        hasNextPage: page < pages,
        prevPage: page > 1 ? page - 1 : null,
        nextPage: page < pages ? page + 1 : null
      }
    }
  }
}

export abstract class Paginable {
  public static paginate: <T extends Paginable>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this: new (...a: any[]) => T,
    query: Record<string, unknown>,
    options?: PaginateOptions
  ) => Promise<PaginateResult<T>>
}
