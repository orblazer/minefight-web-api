const base = 'fr.minefight.common.'

export type InetSocketAddress = ['java.net.InetSocketAddress', string]
export type ArrayList<T> = ['java.util.ArrayList', Array<T>]

export default {
  pubSub: {
    accountLink: base + 'pubSub.AccountLinkNotifyData',
    accountSubscription: base + 'pubSub.AccountSubscriptionData',
    accountSanctionNotify: base + 'pubSub.AccountSanctionNotifyData',
    serverNotify: base + 'pubSub.ServerNotifyData',
    gameRequest: base + 'pubSub.GameRequestData'
  }
}
