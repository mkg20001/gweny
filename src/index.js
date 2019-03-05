'use strict'

const resources = require('./resources')
const notifications = require('./notifications')

const {caseFix} = require('./util/processConfig')

const Core = require('./core')

const Joi = require('joi')
const schema = Joi.object().keys({
  operations: Joi.object().required(),
  notifications: Joi.object().required(),
  server: {
    timezone: Joi.string().required()
  }
})

const schemaNotification = Joi.object().keys({
  type: Joi.string().required(),
  config: Joi.object().required()
})

const schemaOperation = Joi.object().keys({
  name: Joi.string(),
  desc: Joi.string(),
  url: Joi.string(), // TODO: url check
  resources: Joi.string()
})

const schemaResource = Joi.object().keys({
  type: Joi.string().required(),
  name: Joi.string(),
  desc: Joi.string(),
  config: Joi.object().required()
})

const schemaHealthCheck = Joi.object().keys({
  type: Joi.string().required(),
  name: Joi.string(),
  errorDesc: Joi.string(),
  interval: Joi.string(), // TODO: check cron pattern
  config: Joi.object().required(),
  notification: Joi.array().required() // TODO: check better
})

const throwValError = (err) => { // TODO: better errors
  throw new Error('Configuration validation error: ' + err)
}

module.exports = async (config) => { // TODO: instead of single .validate calls, create monster struct that validates EVERYTHING beforehand
  config = caseFix(config)

  Joi.validate(config, schema)

  const core = Core(config.server)

  for (const notificationId in config.notifications) { // eslint-disable-line guard-for-in
    const notification = config.notifications[notificationId]
    const notificationType = notifications[notification.type]
    if (!notificationType) {
      throwValError(JSON.stringify(notification.type) + ' is not a valid notification type (id=' + JSON.stringify(notificationId) + ')')
    }
    Joi.validate(notification, schemaNotification) // validate self
    Joi.validate(notification.config, notificationType.schema) // validate self.config

    try {
      const notificationFnc = notificationType.function
      core.addNotification(notificationId, await notificationFnc(notification.config))
    } catch (e) {
      e.stack = 'Notification ' + JSON.stringify(notificationId) + '(type=' + JSON.stringify(notificationType) + ') failed to initialize: ' + e.stack
      throw e
    }
  }

  for (const operationId in config.operations) { // eslint-disable-line guard-for-in
    const operation = config.operations[operationId]
    Joi.validate(operation, schemaOperation)

    core.addOperation(operationId, operation)

    let Resources = {}

    for (const resourceId in operation.resources) { // eslint-disable-line guard-for-in
      const resource = config.resources[resourceId]
      const resourceType = resources[resource.type]
      if (!resourceType) {
        throwValError(JSON.stringify(resource.type) + ' is not a valid resource type (id=' + JSON.stringify(resourceId) + ')')
      }
      Joi.validate(resource, schemaResource) // validate self
      Joi.validate(resource.config, resourceType.schema) // validate self.config

      try {
        const resourceFnc = resourceType.function
        Resources[resourceId] = await resourceFnc(resource.config)
        core.addResource(operationId, resourceId, resource, Resources[resourceId])
      } catch (e) {
        e.stack = 'Resource ' + JSON.stringify(operationId) + '.' + JSON.stringify(resourceId) + '(type=' + JSON.stringify(resourceType) + ') failed to initialize: ' + e.stack
        throw e
      }
    }

    for (const healthCheckId in operation.healthChecks) { // eslint-disable-line guard-for-in
      const healthCheck = config.healthChecks[healthCheckId]
      const [providerResource, providerCheckName] = healthCheck.type.split('.')
      let healthCheckType = Resources[providerResource]
      if (!healthCheckType) {
        throwValError(JSON.stringify(providerResource) + ' is not a valid resource in operation ' + JSON.stringify(operationId) + ' (hcid=' + JSON.stringify(healthCheckId) + ')')
      }
      healthCheckType = healthCheckType[providerCheckName]
      if (!healthCheckType) {
        throwValError(JSON.stringify(providerCheckName) + ' is not a valid resource check type in operation ' + JSON.stringify(operationId) + '.' + JSON.stringify(providerResource) + ' (hcid=' + JSON.stringify(healthCheckId) + ')')
      }

      Joi.validate(healthCheck, schemaHealthCheck) // validate self
      Joi.validate(healthCheck.config, healthCheckType.schema) // validate self.config

      try {
        const healthCheckFnc = healthCheckType.function
        core.addHealthCheck(operationId, providerResource, providerCheckName, healthCheck, healthCheckFnc)
      } catch (e) {
        e.stack = 'Health Check ' + JSON.stringify(operationId) + '.' + JSON.stringify(healthCheckId) + '(type=' + JSON.stringify(healthCheck.type) + ') failed to initialize: ' + e.stack
        throw e
      }
    }
  }
}
