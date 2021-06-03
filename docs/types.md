# Type object documentation

## Sanction Type

This is an string with possible value : `MUTE`, `BAN`, `KICK` or `REPORT`

## Paginable

| path                 | type    | description                             |
| -------------------- | ------- | --------------------------------------- |
| `docs`               | array   | The list of documents                   |
| `meta.totalDocs`     | number  | The count of total founded docs         |
| `meta.totalPage`     | number  | The count of the available pages        |
| `meta.page`          | number  | The current page                        |
| `meta.limit`         | number  | The current limit of documents by pages |
| `meta.pagingCounter` | number  | The paging counter                      |
| `meta.hasPrevPage`   | boolean | The pagination have previous page       |
| `meta.hasNextPage`   | boolean | The pagination have next page           |
| `meta.prevPage`      | number  | The previous page                       |
| `meta.nextPage`      | number  | The next page                           |

## Account

| path                       | type                                                       | description                          |
| -------------------------- | ---------------------------------------------------------- | ------------------------------------ |
| `id`                       | string                                                     | The unique id (UUID)                 |
| `username`                 | string                                                     | The player name (minecraft username) |
| `createdAt`                | string                                                     | The created date                     |
| `createdIp`                | string                                                     | The ip used when create account      |
| `data.locale`              | string                                                     | The locale                           |
| `data.balance`             | number                                                     | The balance                          |
| `data.group`               | [Group](#permissions-group)                                | The group                            |
| `data.websiteLinked`       | boolean                                                    | The current status of website link   |
| `data.subscription`        | [AccountSubscriptionType](#account-subscription-type)      | The current subscription             |
| `data.subscriptionEndDate` | string?                                                    | The end date of current subscription |
| `data.serverData`          | { [serverType]: object }                                   | The data linked to server            |
| `statistics`               | { [serverType]: [AccountStatistics](#account-statistics) } | The statistics                       |

## Account subscription type

This is an string with possible value : `BRONZE`, `EMERALD`, or `DIAMOND`

## Account statistics

| path     | type   | description                   |
| -------- | ------ | ----------------------------- |
| `played` | number | The time of played in seconds |
| `data`   | object | The statistics                |

## Account login history

| path         | type   | description                 |
| ------------ | ------ | --------------------------- |
| `_id`        | string | The id of the login         |
| `account_id` | string | The account id of the login |
| `date`       | string | The date of the login       |
| `ip`         | string | The ip of the login         |
| `username`   | string | The username of the login   |

## Account sanction

| path         | type                           | description                                 |
| ------------ | ------------------------------ | ------------------------------------------- |
| `id`         | string                         | The id of the sanction                      |
| `account_id` | string                         | The account id linked to the sanction       |
| `date`       | string                         | The date of the sanction                    |
| `owner`      | string                         | The owner account id linked to the sanction |
| `reason`     | string                         | The reason of the sanction                  |
| `type`       | [SanctionType](#sanction-type) | The type of the sanction                    |
| `end_date`   | string?                        | The end date of the sanction                |
| `end_reason` | string?                        | The end reason of the sanction              |
| `end_owner`  | string?                        | The end owner account id of the sanction    |
| `isActive`   | boolean (virtual)              | The current status of the sanction          |

## Server

| path      | type     | description                |
| --------- | -------- | -------------------------- |
| `name`    | string   | The name of server         |
| `host`    | string   | The host of server         |
| `type`    | string   | The type of server         |
| `players` | string[] | The list of online players |
| `full`    | boolean  | The server full status     |

## Server resources

| path             | type                                  | description                            |
| ---------------- | ------------------------------------- | -------------------------------------- |
| `state`          | `off`, `on`, `starting` or `stopping` | The current state of server            |
| `memory.current` | number                                | The current memory usage               |
| `memory.limit`   | number                                | The limit of memory                    |
| `cpu.current`    | number                                | The current cpu usage                  |
| `cpu.cores`      | number                                | The current usage of each cores of cpu |
| `cpu.limit`      | number                                | The limit of cpu                       |
| `disk.current`   | number                                | The current disk usage                 |
| `disk.limit`     | number                                | The limit of disk                      |

## Message

| path       | type                                | description                 |
| ---------- | ----------------------------------- | --------------------------- |
| `_id`      | string                              | The id of server            |
| `path`     | string                              | The path of message         |
| `messages` | {[string (lang)]: string (message)} | The json object of messages |
