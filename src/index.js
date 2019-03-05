'use strict'

const resources = require('./resources')
const notifications = require('./notifications')

const {caseFix} = require('./util/processConfig')

const Core = require('./core')

const Joi = require('joi')
const schema = Joi.object().keys({
  operations: Joi.object().required(),
  notifications: Joi.object().required()
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

const throwValError = (err) => { // TODO: better errors
  throw new Error('Configuration validation error: ' + err)
}

module.exports = async (config) => { // TODO: instead of single .validate calls, create monster struct that validates EVERYTHING beforehand
  Joi.validate(config, schema)

  config = caseFix(config)

  const core = Core(config.server)

  for (const notificationId in config.notifications) { // eslint-disable-line guard-for-in
    const notification = config.notifications[notificationId]
    const notificationType = notifications[notification.type]
    if (!notificationType) {
      throwValError(JSON.stringify(notificationType) + ' is not a valid notification type (id=' + JSON.stringify(notificationId) + ')')
    }
    Joi.validate(notification, schemaResource) // validate self
    Joi.validate(notification.config, notificationType.schema) // validate self.config

    try {
      const notificationFnc = notificationType.function
      // core.attachNotification(notificationId, async notificationFnc(notification.config))
    } catch (e) {
      e.stack = 'Notification ' + JSON.stringify(notificationId) + '(type=' + JSON.stringify(notificationType) + ') failed to initialize: ' + e.stack
      throw e
    }
  }

  for (const operationId in config.operations) { // eslint-disable-line guard-for-in
    const operation = config.operations[operationId]
    Joi.validate(operation, schemaOperation)

    for (const resourceId in operation.resources) { // eslint-disable-line guard-for-in
      const resource = config.resources[resourceId]
      const resourceType = resources[resource.type]
      if (!resourceType) {
        throwValError(JSON.stringify(resourceType) + ' is not a valid resource type (id=' + JSON.stringify(resourceId) + ')')
      }
      Joi.validate(resource, schemaResource) // validate self
      Joi.validate(resource.config, resourceType.schema) // validate self.config

      try {
        const resourceFnc = resourceType.function
        // core.attachResource(resourceId, async resourceFnc(resource.config))
      } catch (e) {
        e.stack = 'Resource ' + JSON.stringify(resourceId) + '(type=' + JSON.stringify(resourceType) + ') failed to initialize: ' + e.stack
        throw e
      }
    }
  }
}
