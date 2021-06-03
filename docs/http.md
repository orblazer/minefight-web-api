# HTTP documentation

This is documentation for http routes

## Global route

### HEAD `/`

Check the status of the api

## Account routes

### GET `/accounts`

Get all accounts

Result (`application/json`) :

Retrieve [paginable](./types.md#paginable) [Account](./types.md#account) list

### GET `/accounts/list`

Get the list of all accounts

Result (`application/json`) :

| path       | type   | description                    |
| ---------- | ------ | ------------------------------ |
| `id`       | string | The account id of player       |
| `uniqueId` | string | The unique id (UUID) of player |
| `username` | string | The name of player             |

### HEAD `/account/:id`

Check if account exist

Params :

| path | type   | description           |
| ---- | ------ | --------------------- |
| `id` | string | The player account id |

### GET `/account/:id`

Get the account data

Params :

| path | type   | description           |
| ---- | ------ | --------------------- |
| `id` | string | The player account id |

Result (`application/json`) :

Retrieve the [Account](./types.md#account) from the passed account id

The extra properties :

| path          | type                                                     | description                  |
| ------------- | -------------------------------------------------------- | ---------------------------- |
| `websiteRole` | `PLAYER`, `STAFF`, `ADMIN`                               | The website role             |
| `activeBan`   | [AccountSanction](./types.md#account-sanction)?          | The active ban of the player |
| `lastLogin`   | [AccountLoginHistory](./types.md#account-login-history)? | The last login of the player |

### GET `/account/:id/login-history`

Get the account login history

Params :

| path | type   | description           |
| ---- | ------ | --------------------- |
| `id` | string | The player account id |

Result (`application/json`) :

Retrieve [paginable](./types.md#paginable) [AccountLoginHistory](./types.md#account-login-history) list

### POST `/account/:id/link`

Link the website account to minecraft account

Params :

| path | type   | description           |
| ---- | ------ | --------------------- |
| `id` | string | The player account id |

Body :

| path     | type                  | description                  |
| -------- | --------------------- | ---------------------------- |
| `status` | `SUCCESS` or `FAILED` | The status of linked account |

Result (`application/json`) :

| path     | type | description           |
| -------- | ---- | --------------------- |
| `status` | `ok` | The status of request |

### DELETE `/account/:id/link`

Unlink the website account from minecraft account

Params :

| path | type   | description           |
| ---- | ------ | --------------------- |
| `id` | string | The player account id |

Body :

| path     | type                  | description                    |
| -------- | --------------------- | ------------------------------ |
| `status` | `SUCCESS` or `FAILED` | The status of unlinked account |

Result (`application/json`) :

| path     | type | description           |
| -------- | ---- | --------------------- |
| `status` | `ok` | The status of request |

### PUT `/account/:id/subscription`

Set or update the subscription to the player

Params :

| path | type   | description           |
| ---- | ------ | --------------------- |
| `id` | string | The player account id |

Body :

| path           | type                                                            | description           |
| -------------- | --------------------------------------------------------------- | --------------------- |
| `subscription` | [AccountSubscriptionType](./types.md#account-subscription-type) | The subscription type |

Result (`application/json`) :

| path     | type | description           |
| -------- | ---- | --------------------- |
| `status` | `ok` | The status of request |

### DELETE `/account/:id/subscription`

Delete the subscription to the player

Params :

| path | type   | description           |
| ---- | ------ | --------------------- |
| `id` | string | The player account id |

Result (`application/json`) :

| path     | type | description           |
| -------- | ---- | --------------------- |
| `status` | `ok` | The status of request |

### POST `/account/beta/:uuid`

Assign beta key to the player

Params :

| path   | type   | description                     |
| ------ | ------ | ------------------------------- |
| `uuid` | string | The player account trimmed uuid |

Result (`application/json`) :

| path     | type | description           |
| -------- | ---- | --------------------- |
| `status` | `ok` | The status of request |

### DELETE `/account/beta/:uuid`

Remove beta key from the player

Params :

| path   | type   | description                     |
| ------ | ------ | ------------------------------- |
| `uuid` | string | The player account trimmed uuid |

Result (`application/json`) :

| path     | type | description           |
| -------- | ---- | --------------------- |
| `status` | `ok` | The status of request |

## Server routes

### GET `/server/:name`

Get the server info from the name

Params :

| path   | type   | description     |
| ------ | ------ | --------------- |
| `name` | string | The server name |

Result (`application/json`) :

Retrieve the [Server](./types.md#server) from the server name

### DELETE `/server/:name`

Delete and server from the name

Params :

| path   | type   | description     |
| ------ | ------ | --------------- |
| `name` | string | The server name |

Result (`application/json`) :

| path     | type | description           |
| -------- | ---- | --------------------- |
| `status` | `ok` | The status of request |

### GET `/servers/:type`

Get servers info from the type

Params :

| path   | type   | description     |
| ------ | ------ | --------------- |
| `type` | string | The server type |

Result (`application/json`) :

Retrieve the list of [Server](./types.md#server) from the server type

### POST `/servers/create`

Create an new server

Params :

| path   | type   | description                  |
| ------ | ------ | ---------------------------- |
| `type` | string | The of server want to create |

Result (`application/json`) :

Retrieve the [Server](./types.md#server) created data

## Statistics routes

### GET `/statistics`

Get the global statistics

Result (`application/json`) :

| path       | type   | description                      |
| ---------- | ------ | -------------------------------- |
| `accounts` | number | The count of created accounts    |
| `balances` | number | The total of all account balance |
| `online`   | number | The current online players       |

### GET `/statistics/account/:accountId`

Get the statistics of the player

Params :

| path        | type   | description           |
| ----------- | ------ | --------------------- |
| `accountId` | string | The player account id |

Result (`application/json`) :

Retrieve the global statistics from the passed account id.
For the data see [Account](./types.md#account)#statistics

### GET `/statistics/account/:accountId/:serverType`

Get the statistics of the player from specified server type

Params :

| path         | type   | description           |
| ------------ | ------ | --------------------- |
| `accountId`  | string | The player account id |
| `serverType` | string | The server type       |

Result (`application/json`) :

Retrieve the [AccountStatistics](./types.md#account-statistics) of specified server type from the passed account id

## Sanctions routes

### GET `/sanctions`

Get the all sanctions

Result (`application/json`) :

Retrieve [paginable](./types.md#paginable) [AccountSanction](./types.md#account-sanction) list

### POST `/sanctions/create`

Create an new sanction

Body :

| path       | type                                     | description                                  |
| ---------- | ---------------------------------------- | -------------------------------------------- |
| `player`   | string                                   | The player account id want sanctioned        |
| `type`     | [SanctionType](./types.md#sanction-type) | The type of the sanction                     |
| `reason`   | string                                   | The reason of the sanction                   |
| `owner`    | string                                   | The owner account id of the sanction         |
| `end_date` | string?                                  | The end date of the sanction (in ISO format) |

Result (`application/json`) :

| path     | type | description           |
| -------- | ---- | --------------------- |
| `status` | `ok` | The status of request |

### GET `/sanctions/:id`

Get the sanction data

Params :

| path | type   | description     |
| ---- | ------ | --------------- |
| `id` | string | The sanction id |

Result (`application/json`) :

Retrieve the [AccountSanction](./types.md#account-sanction) from the passed sanction id

### POST `/sanctions/:id`

End the sanction

Params :

| path | type   | description     |
| ---- | ------ | --------------- |
| `id` | string | The sanction id |

Body :

| path     | type   | description                             |
| -------- | ------ | --------------------------------------- |
| `reason` | string | The reason of the end sanction          |
| `owner`  | string | The owner account id apply end sanction |

Result (`application/json`) :

| path     | type | description           |
| -------- | ---- | --------------------- |
| `status` | `ok` | The status of request |

### GET `/sanctions/account/:id`

Get the all sanctions of an specified account

Params :

| path | type   | description           |
| ---- | ------ | --------------------- |
| `id` | string | The player account id |

Result (`application/json`) :

Retrieve [paginable](./types.md#paginable) [AccountSanction](./types.md#account-sanction) list

### GET `/sanctions/account/:id/active`

Get the all active sanctions of an specified account

Params :

| path | type   | description           |
| ---- | ------ | --------------------- |
| `id` | string | The player account id |

Result (`application/json`) :

Retrieve [paginable](./types.md#paginable) [AccountSanction](./types.md#account-sanction) list

### GET `/sanctions/type/:type`

Get the all sanctions with specified type

Params :

| path   | type                                     | description                  |
| ------ | ---------------------------------------- | ---------------------------- |
| `type` | [SanctionType](./types.md#sanction-type) | The type of wanted sanctions |

Result (`application/json`) :

Retrieve [paginable](./types.md#paginable) [AccountSanction](./types.md#account-sanction) list

## Messages routes

### GET `/messages`

Get the all messages

Result (`application/json`) :

Retrieve [paginable](./types.md#paginable) [Message](./types.md#message) list

### POST `/messages`

Create an new message

Body :

| path       | type                           | description                 |
| ---------- | ------------------------------ | --------------------------- |
| `path`     | string                         | The message path            |
| `messages` | string (json, `lang: message`) | The json object of messages |

Result (`application/json`) :

| path     | type | description           |
| -------- | ---- | --------------------- |
| `status` | `ok` | The status of request |

### HEAD `/messages/:path`

Check if message exist

Params :

| path   | type   | description      |
| ------ | ------ | ---------------- |
| `path` | string | The message path |

### GET `/messages/:id`

Get an specific message

Params :

| path | type   | description    |
| ---- | ------ | -------------- |
| `id` | string | The message id |

Result (`application/json`) :

Retrieve the [Message](./types.md#message) from the passed message id

### PATCH `/messages/:id`

Edit an message

Params :

| path | type   | description    |
| ---- | ------ | -------------- |
| `id` | string | The message id |

Body :

| path       | type                           | description                 |
| ---------- | ------------------------------ | --------------------------- |
| `messages` | string (json, `lang: message`) | The json object of messages |

Result (`application/json`) :

| path     | type | description           |
| -------- | ---- | --------------------- |
| `status` | `ok` | The status of request |

### DELETE `/messages/:id`

Delete an message

Params :

| path | type   | description    |
| ---- | ------ | -------------- |
| `id` | string | The message id |

Result (`application/json`) :

| path     | type | description           |
| -------- | ---- | --------------------- |
| `status` | `ok` | The status of request |

### GET `/messages/stats`

Get the messages statistics

Result (`application/json`) :

| path             | type   | description                         |
| ---------------- | ------ | ----------------------------------- |
| `count`          | number | The number of messages              |
| `unLocalized.en` | number | The number of missing `en` messages |
| `unLocalized.fr` | number | The number of missing `fr` messages |
