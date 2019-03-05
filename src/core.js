'use strict'

const log = require('pino')('op-dashboard')

const CronJob = require('cron').CronJob

module.exports = ({timeZone}) => {
  let Notifications = {}
  let Operations = {}

  function createJob ({interval, resource: {id: resourceId}, operation: {id: operationId}, id: checkId, healthCheck}) {
    const TAG = {operationId, resourceId, checkId}

    return new CronJob(interval, async () => {
      log.info(TAG, 'Starting check...')
      try {
        // async healthCheck()
      } catch (e) {
        Object.assign(e, TAG)
        log.error(e, 'Failed...')
        // TODO: notifi
      }
    })
  }

  return {
    addNotification: (id, notification) => {
      Notifications[id] = {
        id,
        notification
      }
    },
    addOperation: (id, operation) => {
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
      Operations[opId].healthChecks[opId] = {
        id,
        meta: {
          name: config.name,
          errorDesc: config.errorDesc
        },
        resource: Operations[opId].resources[rId],
        operation: Operations[opId],
        checkId: rCheck,
        healthCheck: () => fnc(config.config),
        notification: config.notification,
        interval: config.interval
      }
      Operations[opId].healthChecks[opId].job = createJob(Operations[opId].healthChecks[opId])
    },
    start: () => {
      log.info('Starting...')
      for (const opId in Operations) { // eslint-disable-line guard-for-in
        for (const hcId in Operations[opId].healthCheck) { // eslint-disable-line guard-for-in
          log.info({operationId: opId, healthCheckId: hcId}, 'Enabling job')
          Operations[opId].healthCheck[hcId].job.start()
        }
      }
    },
    stop: () => {
      log.info('Stopping...')
      for (const opId in Operations) { // eslint-disable-line guard-for-in
        for (const hcId in Operations[opId].healthCheck) { // eslint-disable-line guard-for-in
          log.info({operationId: opId, healthCheckId: hcId}, 'Disabling job')
          Operations[opId].healthCheck[hcId].job.stop()
        }
      }
    },
    Notifications,
    Operations
  }
}
