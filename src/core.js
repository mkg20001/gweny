'use strict'

const log = require('pino')('gweny')

const CronJob = require('cron').CronJob
const API = require('./api')

function DB (path, dbId) {
  // TODO: impl db
  const FAKEDB = {}

  return {
    get: (k) => FAKEDB[k],
    set: (k, v) => (FAKEDB[k] = v)
  }
}

module.exports = ({timezone, api: apiConfig}) => {
  let Notifications = {}
  let Operations = {}

  function generateFailure (msg) { // TODO: make the errors more elaborate, possible wrap them in the cronjob fnc itself
    throw new Error('Check failed: ' + msg)
  }

  function createJob (config) {
    const {interval, notification: notifications, resource: {id: resourceId}, operation: {id: operationId}, id: checkId, checkId: resourceCheckId, healthCheck, db} = config

    const TAG = {operationId, resourceId, checkId}

    return new CronJob(interval, async () => {
      log.info(TAG, 'Starting check...')
      db.set('lastChecked', new Date())
      try {
        await healthCheck()

        db.set('occurences', false)
      } catch (e) {
        Object.assign(e, TAG)
        log.error(e, 'Failed...')

        /*
        - `occuredAt Date`: When the failure occured
        - `firstOccuredAt Date`: The first occurence of the failure since the last success
        - `isFirstOccurence Boolean`: Whether or not this is the first occurence
        - `occurenceCount`: Counter of failures for this healthCheck since last reset

        - `error`: The error as given by the health check

        - `operationId String`: ID of the operation that caused it to fail
        - `operation Object`: Operation information
          - `name? String`: The friendly name specified in the operation details
          - `url? String`: The URL sepcified in the operation details
          - `desc? String`: The description specified in the operation details
        - `resourceId String`: The resource ID that caused the failure
        - `resourceCheckId`: The resource check ID that caused the failure
        - `resource Object`: The resource configuration
          - `name? String`: The friendly name specified in the resource details
          - `errorDesc? String`: The error description specified in the resource details
        - `healthCheckId`: The health check ID that caused the failure
        - `healthCheck Object`: The healthCheck configuration
          - `name? String`: The friendly name specified in the resource details
          - `errorDesc? String`: The error description specified in the resource details
          */

        let occuredAt = new Date()
        let firstOccuredAt = occuredAt
        let isFirstOccurence = true
        let occurenceCount = 1

        let occurences

        if ((occurences = db.get('occurences'))) {
          occurences.push(occuredAt)
          occurenceCount = occurences.length
          isFirstOccurence = false
          firstOccuredAt = occurences[0]
        } else {
          db.set('occurences', [Date])
        }

        let notification = {
          occuredAt,
          firstOccuredAt,
          isFirstOccurence,
          occurenceCount,

          error: String(e),

          operationId,
          operation: config.operation,
          resourceId,
          resourceCheckId,
          resource: config.resource,
          healthCheckId: checkId,
          healthCheck: config
        }

        for (const notifiId in notifications) { // eslint-disable-line guard-for-in
          const notifi = notifications[notifiId]

          log.info(TAG, 'Sending notification for %s', notifiId)

          const Notification = Notifications[notifiId]
          await Notification.notify(notifi.dest, notification)
        }
      }
    }, null, false, timezone)
  }

  const Core = {
    addNotification: (id, notification) => {
      log.info({id}, 'Adding notification %s', id)
      Notifications[id] = {
        id,
        notification
      }
    },
    addOperation: (id, operation) => {
      log.info({id}, 'Adding operation %s', id)
      Operations[id] = {
        id,
        meta: {
          name: operation.name,
          desc: operation.desc,
          url: operation.url
        },
        resources: {},
        healthChecks: {}
      }
    },
    addResource: (opId, id, config, resource) => {
      log.info({opId, id}, 'Adding resource %s', opId + '.' + id)
      Operations[opId].resources[id] = {
        id,
        resource,
        operation: Operations[opId],
        meta: {
          name: config.name
        }
      }
    },
    addHealthCheck: (opId, rId, rCheck, id, config, fnc) => {
      log.info({opId, id, rId, rCheck}, 'Adding health check %s', opId + '.' + id + '@' + opId + rId + rCheck)
      Operations[opId].healthChecks[opId] = {
        id,
        meta: {
          name: config.name,
          errorDesc: config.errorDesc
        },
        resource: Operations[opId].resources[rId],
        operation: Operations[opId],
        checkId: rCheck,
        healthCheck: () => fnc(config.config, generateFailure),
        notification: config.notification,
        interval: config.interval,
        db: DB(opId + '#' + id)
      }
      Operations[opId].healthChecks[opId].job = createJob(Operations[opId].healthChecks[opId])
    },
    start: async () => {
      log.info('Starting...')
      for (const opId in Operations) { // eslint-disable-line guard-for-in
        for (const hcId in Operations[opId].healthCheck) { // eslint-disable-line guard-for-in
          log.info({operationId: opId, healthCheckId: hcId}, 'Enabling job')
          Operations[opId].healthCheck[hcId].job.start()
        }
      }
      if (api) {
        await api.start()
      }
    },
    stop: async () => {
      log.info('Stopping...')
      for (const opId in Operations) { // eslint-disable-line guard-for-in
        for (const hcId in Operations[opId].healthCheck) { // eslint-disable-line guard-for-in
          log.info({operationId: opId, healthCheckId: hcId}, 'Disabling job')
          Operations[opId].healthCheck[hcId].job.stop()
        }
      }
      if (api) {
        await api.stop()
      }
    },
    Notifications,
    Operations
  }

  let api = apiConfig ? API(apiConfig, Core) : false

  return Core
}
