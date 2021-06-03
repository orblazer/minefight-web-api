import { randomBytes } from 'crypto'
import { readFile } from 'fs'
import { join } from 'path'
import { promisify } from 'util'
import { KubeConfig, CoreV1Api, HttpError, V1Pod } from '@kubernetes/client-node'
import { ServerType } from '@/data/enum'
import { cloneDeep } from 'lodash'
import { safeLoad } from 'js-yaml'
import K8sError from './K8sError'

export interface ServerInfo {
  name: string
  address: string
  host: string
}

interface ImageOptions {
  name: string
  memory: number
  pullPolicy: string
  maxInstance: number
}

export class Orchestrator {
  private readonly namespace: string
  private readonly serverHost: string
  private readonly serviceName: string
  private readonly serverDns: string
  private readonly images: { [type: string]: ImageOptions }
  private readonly k8sApi: CoreV1Api
  private serverTemplate?: Required<V1Pod>

  constructor(namespace: string, serversImage: string, serverHost: string, serviceName: string, serverDns: string) {
    this.namespace = namespace
    this.serverHost = serverHost
    this.serviceName = serviceName

    if (!serverDns.includes(':')) {
      serverDns += ':25565'
    }
    this.serverDns = serverDns

    // set images
    const baseImage: ImageOptions = {
      name: serversImage,
      memory: Number(process.env.ORCHESTRATOR_SERVERS_MEMORY ?? 1024),
      pullPolicy: process.env.ORCHESTRATOR_SERVER_PULLPOLICY ?? 'IfNotPresent',
      maxInstance: 1
    }
    this.images = {
      [ServerType.BUNGEECORD]: this.getImage(ServerType.BUNGEECORD, baseImage),
      [ServerType.LOBBY]: this.getImage(ServerType.LOBBY, baseImage),
      [ServerType.FFA]: this.getImage(ServerType.FFA, baseImage),
      [ServerType.INVASION]: this.getImage(ServerType.INVASION, baseImage),
      [ServerType.PUNCH_IT]: this.getImage(ServerType.PUNCH_IT, baseImage),
      [ServerType.RUSH]: this.getImage(ServerType.RUSH, baseImage),
      [ServerType.DUEL]: this.getImage(ServerType.DUEL, baseImage)
    }

    // Create api client
    const kubeConfig = new KubeConfig()
    kubeConfig.loadFromCluster()
    this.k8sApi = kubeConfig.makeApiClient(CoreV1Api)
  }

  /**
   * Retrieve image options for an specified server type
   * @param serverType The type of the server want retrieve image
   * @param baseImage The base image, used if value is not specified for specific server type
   */
  private getImage(serverType: ServerType, baseImage: ImageOptions): ImageOptions {
    return {
      name: process.env[`ORCHESTRATOR_SERVER_${serverType}_IMAGE`] ?? baseImage.name + serverType,
      memory: Number(process.env[`ORCHESTRATOR_SERVER_${serverType}_MEMORY`] ?? baseImage.memory),
      pullPolicy: process.env[`ORCHESTRATOR_SERVER_${serverType}_PULLPOLICY`] ?? baseImage.pullPolicy,
      maxInstance: Number(process.env[`ORCHESTRATOR_SERVER_${serverType}_MAXINSTANCE`] ?? baseImage.maxInstance)
    }
  }

  /**
   * Initialize the orchestrator
   */
  public async initialize(): Promise<void> {
    // Load server pod template
    const filename = join(process.cwd(), 'server-template.yml')
    this.serverTemplate = safeLoad(await promisify(readFile)(filename, 'utf-8'), {
      filename
    }) as Required<V1Pod>
    if (
      typeof this.serverTemplate === 'undefined' ||
      this.serverTemplate.kind !== 'Pod' ||
      typeof this.serverTemplate.metadata === 'undefined'
    ) {
      throw new Error('The server template is invalid')
    }
    // Set default labels
    if (typeof this.serverTemplate.metadata?.labels === 'undefined') {
      this.serverTemplate.metadata.labels = {}
    }
    // Set template name
    if (typeof this.serverTemplate.metadata.name === 'undefined') {
      this.serverTemplate.metadata.name = 'mfmc-{type}-{id}'
    }
    if (typeof process.env.ORCHESTRATOR_SERVERS_IMAGE_PULL_SECRET === 'string') {
      if (typeof this.serverTemplate.spec.imagePullSecrets === 'undefined') {
        this.serverTemplate.spec.imagePullSecrets = []
      }

      this.serverTemplate.spec.imagePullSecrets.push({
        name: process.env.ORCHESTRATOR_SERVERS_IMAGE_PULL_SECRET
      })
    }

    // Test the permissions
    await this.testPermissions()

    // Create initial servers
    for (const type in ServerType) {
      if (typeof this.images[type] !== 'undefined') {
        let needInstance = Number(process.env[`ORCHESTRATOR_SERVER_${type}_INITINSTANCE`] ?? 0)
        if (needInstance > this.images[type].maxInstance) {
          global.log.error(
            `Could not initialize ${type} servers, the initial instance if bigger then maximum instance.`
          )
          continue
        }

        // Decrease need instance with already created servers
        needInstance -= (await this.listServer(ServerType[type])).length

        for (let i = 0; i < needInstance; i++) {
          this.createServer(ServerType[type])
        }
      }
    }
  }

  /**
   * List the server of specified type
   * @param type The type of server want listed
   */
  public async listServer(type: ServerType): Promise<string[]> {
    global.log.debug({ msg: `Try list server for type '${type}'`, module: 'orchestrator' })
    const servers = (
      await this.k8sApi
        .listNamespacedPod(this.namespace, undefined, false, undefined, undefined, `minefight.fr/server-type=${type}`)
        .catch((err) => {
          throw this.parseError(err)
        })
    ).body.items.map((pod) => pod.metadata?.name as string)

    global.log.debug({
      msg: `Server for type '${type}' is listed with ${servers.length} items`,
      module: 'orchestrator'
    })
    return servers
  }

  /**
   * Create an server
   * @param type The type of server want created
   * @param dryRun When present, indicates that modifications should not be persisted.
   */
  public async createServer(type: ServerType, dryRun = false): Promise<ServerInfo> {
    if (typeof this.serverTemplate === 'undefined') {
      throw new RangeError('The orchestrator is not initialized')
    }
    const image = this.images[type]

    // Check if the number of maximum instance is reached
    if ((await this.listServer(type)).length >= image.maxInstance) {
      throw new RangeError(`The maximum of instance for ${type} is reached`)
    }

    global.log.debug({
      msg: `Try create server for type '${type}' ${dryRun ? 'in dry mode' : ''}`,
      module: 'orchestrator'
    })

    // Initialize pod spec
    const id = randomBytes(3).toString('hex')
    const podSpec = cloneDeep(this.serverTemplate)
    if (typeof podSpec.metadata.labels !== 'undefined') {
      podSpec.metadata.labels['minefight.fr/api-managed'] = 'true'
      podSpec.metadata.labels['minefight.fr/server-type'] = type
      podSpec.metadata.labels['minefight.fr/server-id'] = id
    }

    // set name
    podSpec.metadata.name = podSpec.metadata.name
      ?.replace('{type}', type.toLowerCase().replace(/_/g, ''))
      .replace('{id}', id.toLowerCase())

    // Set image
    podSpec.spec.containers[0].image = image.name
    podSpec.spec.containers[0].imagePullPolicy = image.pullPolicy

    // Ser ressources
    if (typeof podSpec.spec.containers[0].resources !== 'undefined') {
      if (typeof podSpec.spec.containers[0].resources.requests !== 'undefined') {
        podSpec.spec.containers[0].resources.requests.memory = image.memory + 256 + 'Mi'
        podSpec.spec.containers[0].resources.requests.cpu = '1'
      }
      if (typeof podSpec.spec.containers[0].resources.limits !== 'undefined') {
        podSpec.spec.containers[0].resources.limits.memory = image.memory + 512 + 'Mi'
        podSpec.spec.containers[0].resources.limits.cpu = '1'
      }
    }
    if (typeof podSpec.spec.containers[0].env !== 'undefined') {
      let memorySet = false
      podSpec.spec.containers[0].env.forEach((env) => {
        if (env.name === 'MEMORY') {
          env.value = image.memory + 'M'
          memorySet = true
        }
      })

      if (!memorySet) {
        podSpec.spec.containers[0].env.push({
          name: 'MEMORY',
          value: image.memory + 'M'
        })
      }
    }

    // Set hostname
    podSpec.spec.hostname = id
    podSpec.spec.subdomain = this.serviceName

    // Create pod
    const pod = (
      await this.k8sApi
        .createNamespacedPod(this.namespace, podSpec, undefined, dryRun ? 'All' : undefined)
        .catch((err) => {
          throw this.parseError(err)
        })
    ).body

    global.log.debug({
      msg: `Server for type '${type}' is now created with name '${pod.metadata?.name}' ${dryRun ? 'in dry mode' : ''}`,
      module: 'orchestrator'
    })

    return {
      name: pod.metadata?.name as string,
      address: this.serverDns
        .replace('{id}', id)
        .replace('{service}', this.serviceName)
        .replace('{namespace}', this.namespace),
      host: this.serverHost.replace('{id}', id)
    }
  }

  /**
   * Delete an server
   * @param name The name of server
   * @param dryRun When present, indicates that modifications should not be persisted.
   */
  public async deleteServer(name: string, dryRun = false): Promise<void> {
    global.log.debug({ msg: `Try delete server '${name}' ${dryRun ? 'in dry mode' : ''}`, module: 'orchestrator' })
    await this.k8sApi
      .deleteNamespacedPod(name, this.namespace, undefined, dryRun ? 'All' : undefined)
      .catch((err) => {
        throw this.parseError(err)
      })
      .then(() => {
        global.log.debug({
          msg: `Server '${name}' is now deleted ${dryRun ? 'in dry mode' : ''}`,
          module: 'orchestrator'
        })
      })
  }

  /**
   * List the server of specified type
   * @param type The type of server want listed
   */
  public async serverExist(name: string): Promise<boolean> {
    global.log.debug({ msg: `Try read server '${name}'`, module: 'orchestrator' })

    let founded = false
    await this.k8sApi
      .readNamespacedPod(name, this.namespace)
      .then(() => (founded = true))
      .catch((err: HttpError) => {
        if (err.statusCode !== 404) {
          throw this.parseError(err)
        }
      })
    global.log.debug({
      msg: `Server '${name}' is readed`,
      module: 'orchestrator'
    })
    return founded
  }

  /**
   * Test the permissions for orchestrator
   */
  private async testPermissions(): Promise<void> {
    const isNotAuthorized = (err: K8sError): void => {
      if (err && err.status && err.status.code === 403) {
        throw err
      }
    }

    // List pod
    await this.listServer(ServerType.LOBBY).catch(isNotAuthorized)
    // create pod
    await this.createServer(ServerType.LOBBY, true).catch(isNotAuthorized)
    // Delete pod
    await this.deleteServer('mfmc-lobby-test').catch(isNotAuthorized)
    // Check if server exist
    await this.serverExist('mfmc-lobby-test').catch(isNotAuthorized)
  }

  /**
   * Parse error to K8sError
   * @param error The original error
   */
  private parseError(error: HttpError): K8sError {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new K8sError((error.response as any).body)
  }
}

export default new Orchestrator(
  process.env.ORCHESTRATOR_NAMESPACE ?? 'default',
  process.env.ORCHESTRATOR_SERVERS_IMAGE ?? '',
  process.env.ORCHESTRATOR_SERVER_HOST ?? '',
  process.env.ORCHESTRATOR_SERVER_SERVICE_NAME ?? '',
  process.env.ORCHESTRATOR_SERVER_DNS ?? ''
)
