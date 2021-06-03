import { V1Status } from '@kubernetes/client-node'

export default class K8sError extends Error {
  public status: V1Status

  constructor(status: V1Status) {
    super(status.message)
    this.name = 'K8sError'
    this.status = status
  }
}
