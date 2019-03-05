# gweny

Manage your operations with ease

_Inspired by the gitlab operations dashboard_

## Config

```yaml
operations:
  deb.mkg20001.io: # give your operation an id
    url: https://deb.mkg20001.io # add an url
    desc: 'Debian Package Repo' # and a desc to the ui
    resource: # define resources that exist
      log:
        type: log # such as a logfile
        config:
          logfile: /path/to/your/logfile.log # ...thats stored here for ex
      frontend: # and add more resources
        type: http
        config:
          endpoint: https://deb.mkg20001.io # ...like some HTTP(s) endpoint
    health-checks:
      last-update-success: # ...and define healthchecks for them
        name: Last Update Success
        error-desc: The last update for the repo failed
        interval: 0 3 * * * # ...with cron intervals
        type: log.match # ...using freely defined checks per plugin
        config:
          match-type: regex # ...which even includes checking logfiles with a regex to check if your background-task succeded
          match-last-lines: 20
          matches: '/^[0-9]+: DONE\!$/'
        notification: # ...and get notified of these failures in various channels
          email:
            dest:
              - hello@world.net
      server-is-reachable: # here another one
        name: Server Reachability
        error-desc: The server is unreachable
        interval: 0 * * * * *
        type: frontend.get # this one checks the frontend
        config:
          expect-status: 200 # ...to give a 200 OK status
          use-head: true # using the HEAD method (saves traffic)
        notification: # ...and notifies of failures via email, too, but also via telegram
          email:
            dest:
              - hello@world.net
          tg:
            dest:
              - +1234567890

notifications: # here notifications get configured
  email: # like one for email, let's call it email (but you can have multiple ones, too)
    type: email
    config:
      mail:
        host: mail.someserver.com
        port: 587
        secure: false
        auth:
          user: your-user
          pass: your-pass
      content:
        from: '"Some User" <someuser@someserver.com>'
        # TODO: allow override
        # subject: ''
        # content: ''
  tg:
    type: telegram
    config:
      bot-token: ...

server: # later we need to define a server
  timezone: 'Europe/Berlin' # set your timezone, because everyone lives elsewhere
  api: # enable the api (you can remove this if you don't need it)
    host: localhost
    port: 5328
    authHash: 'bcrypt' # you can skip that and "auth" as well if you don't need auth, or use 'plain' as hash if you hate security
    auth: # access the frontend with HTTP AUTH
      user: # you can also use those as API urls with http://user:hellogweny@your-server/ for ex
        permission: # make a list of operations this user can access the status of, or set to true to allow all
          - deb.mkg20001.io
        password: $2y$12$wJCs3eAfWqQDEMA.uOmP/ufe0yPxo7K7pE4gEnOg6VXQeOkakpO6i # hellogweny
```

# Roadmap
- [ ] HTTP resource
- [ ] email notification
- [ ] tg notification
- [ ] ...extend ROADMAP
