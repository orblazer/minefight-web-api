import { Counter, Gauge } from 'prom-client'
import { SanctionType } from '@/data/enum'
import { AccountSanctionModel } from '@/mongodb/AccountSanction'

const metrics = {
  count: new Counter({
    name: `${global.metricsPrefix}_sanction_created_total`,
    help: 'Number of created sanction',
    labelNames: ['type']
  }),
  active: new Gauge({
    name: `${global.metricsPrefix}_sanction_active`,
    help: 'Number of active sanction',
    labelNames: ['type']
  })
}

export interface SanctionMetrics {
  /**
   *  Manage the number of sanction
   */
  count: Counter.Internal
  /**
   * Manage number of active sanction
   */
  active: Gauge.Internal<string>
}

/**
 * Access to sanction metrics
 * @param type The type of sanction
 */
export default function sanction(type: SanctionType): SanctionMetrics {
  return {
    count: metrics.count.labels(type),
    active: metrics.active.labels(type)
  }
}

// Initialize stats
export function initialize(): void {
  for (const type in SanctionType) {
    const metrics = sanction(SanctionType[type])
    if (process.env.INIT_METRICS === 'true') {
      AccountSanctionModel.countDocuments({ type: SanctionType[type] }).then((count) => {
        metrics.count.inc(count)
      })
    } else {
      metrics.count.inc(0)
    }
  }
}
