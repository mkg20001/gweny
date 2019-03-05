# Adding plugins

**NOTE: `$` represents `module.exports`**

## Resources

A resource should export the following properties:

- `$.function(config)`: An async function that will be called with the config. It _can_ throw an error, it _can_ be ignored based on the missing parameter. It _should_ validate the existance/validity of the given config data (example: whether a file exists)
  - It should return an object where every sub-object has the following properties:
    - `function(config, generateFailure)`: An object that accepts the config, verifies whether the given resource is in the desired condition and throws otherwise
    - `$.schema`: A [joi](npm.im/joi) schema to validate the config _before_ any code execution
    - `minBackoff`: The minimal amount of backoff required for this operation, in ms
- `$.schema`: A [joi](npm.im/joi) schema to validate the config _before_ any code execution

## Notification

- `$.function`: An async function that will be called with the config. It _can_ throw an error which _will_ fataly crash the server. It _should_ validate the existance/validity of the given config data (example: whether an access token is valid)
  - It should return an object with the following properties:
    - `notify(NotificationData)`: An async function that should send a notification. Errors will cause exponential backoff
    - `minBackoff`: The minimal amount of backoff required for this operation, in ms
- `$.schema`: A [joi](npm.im/joi) schema to validate the config _before_ any code execution

# Types

## `NotificationData`, Object:
- `occuredAt Date`: When the failure occured
- `operationId String`: ID of the operation that caused it to fail
- `operation Object`: Operation information
  - `url? String`: The URL sepcified in the operation details
  - `desc? String`: The description specified in the operation details
- `resourceId Object`: The resource ID that caused the failure
- `resource Object`: The resource configuration

# Config

At the begging there are two base-types

```yaml
operations:
notifications:
```

Operations can have a `url`, `name` and `desc` as well as a `resources: ` and `health-checks: ` key

```yaml
operations:
  gitlab-instance:
    url: https://my-gitlab.com
    name: My Gitlab
    desc: That's mine!
    resources:
```

Resources can have the properties `type` and `config` (which is type-sepcific) as well as an optional `failure` parameter (when a resource isn't able to be initialized)

```yaml
operations:
  gitlab-instance:
    url: https://my-gitlab.com
    name: My Gitlab
    desc: That's mine!
    resources:
      frontend:
        type: http # this one for example can do http(s) requests
        config:
          endpoint: https://my-gitlab.com/help
```

Health-Checks can have the properties `interval`, `type`, `config` (again type-specific) and `notification`, as well as an optional `name` and `error-desc` property

```yaml
operations:
  gitlab-instance:
    url: https://my-gitlab.com
    name: My Gitlab
    desc: That's mine!
    resources:
      frontend:
        type: http
        config:
          endpoint: https://my-gitlab.com/help
    health-checks:
      is-frontend-reachable:
        name: Frontend Reachability
        error-desc: The frontend isn't reachable
        interval: 0 * * * * # check every minute (cron-intervals)
        type: frontend.get
        config:
          expect-status: 200
        notification:
          - email # notifi us via email if service is offline
```

TODO: Notifications

Planned features:
 - Notification more customizable: `resendEvery`, `sendOnlyAfterNFailures`, etc. as well as custom texts per service
