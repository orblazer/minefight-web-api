import { Gauge, Counter } from 'prom-client'
import { AccountModel } from '@/mongodb/Account'

export const balance = new Gauge({
  name: `${global.metricsPrefix}_balance`,
  help: 'The sum of players balances'
})
export const uniqueAccounts = new Counter({
  name: `${global.metricsPrefix}_created_account_total`,
  help: 'The number of created account'
})

export function initialize(): void {
  if (process.env.INIT_METRICS === 'true') {
    AccountModel.countDocuments({ data: { $exists: true } }).then((count) => {
      uniqueAccounts.inc(count)
    })
  }
}
