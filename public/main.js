'use strict'

/* globals Vue, $ */

const app = window.dw = new Vue({
  el: '#app',
  data: {
    loading: true,
    lastError: false,
    data: false,
    lastRefresh: 0,
    version: require('../package.json').version
  }
})

const obj2array = (obj, map) => Object.keys(obj).map(k => {
  obj[k].id = k
  if (map) {
    return map(obj[k])
  } else {
    return obj[k]
  }
})

function postProcess (data) {
  return obj2array(data, obj => {
    obj.healthChecks = obj2array(obj.healthChecks)
    obj.healthy = !obj.healthChecks.filter(check => !check.status.healthy).length
    obj.listHealthy = obj.healthChecks.filter(check => check.status.healthy)
    obj.listUnhealthy = obj.healthChecks.filter(check => !check.status.healthy)
    obj.resources = obj2array(obj.resources)
    return obj
  })
}

function doFetch () {
  $.ajax('/api/v1?cache=' + String(Math.random()).replace(/[^2-5]/g, ''))
    .done(data => {
      app.$data.data = postProcess(data)
      app.$data.lastRefresh = Date.now()
      app.$data.lastError = null
      app.$data.loading = false
    })
    .fail(err => {
      app.$data.lastError = err
    })
}

$(document).ready(() => {
  doFetch()
})
