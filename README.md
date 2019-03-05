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
          matches: /^[0-9]+: DONE\!$/
        notification: # ...and get notified of these failures in various channels
          - email
      server-is-reachable: # here another one
        name: Server Reachability
        error-desc: The server is unreachable
        interval: 0 * * * * *
        type: frontend.get # this one checks the frontend
        config:
          expect-status: 200 # ...to give a 200 OK status
          use-head: true # using the HEAD method (saves traffic)
        notification: # ...and notifies of failures via email, too
          - email

notifications: # here notifications get configured
  email: # like one for email, let's call it email (but you can have multiple ones, too)
    type: email
    config: # this one runs over the gmail server (internally uses nodemailer to send mails)
      imap-server: mail.google.com:port
      imap-user: ...
```

# Roadmap
- [ ] HTTP resource
- [ ] email notification
- [ ] tg notification
- [ ] ...extend ROADMAP
