import { FastifyPluginCallback, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'

declare module 'fastify' {
  interface FastifyRequest {
    isValidationError(field: string): boolean
  }
}

export function isValidationError(
  property: string,
  error?: Error & { validation: any; validationContext: string }
): boolean {
  if (error && error.validation) {
    return (
      typeof error.validation.find(
        (validation) => validation.dataPath === '.' + property || validation.params.missingProperty === property
      ) !== 'undefined'
    )
  }
  return false
}

export default fp(
  ((fastify, _opts, done) => {
    fastify.decorateRequest('isValidationError', function (this: FastifyRequest, property: string) {
      return isValidationError(property, this.validationError)
    })
    done()
  }) as FastifyPluginCallback,
  {
    fastify: '>= 3.x',
    name: 'fastify-validationError'
  }
)
