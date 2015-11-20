#!/usr/bin/env node
var launch = require('chrome-launch')
var tmpdir = require('./lib/tmpdir')
var chrome = require('./lib/remote-interface')

var args = process.argv.slice(2)
var argv = require('budo/lib/parse-args')(args)
var budo = require('budo').cli(args, {
  open: false,
  live: false
})
if (budo) {
  budo.on('connect', setup)
}

function setup (ev) {
  var uri = ev.uri
  var name = ev.serve
  var reloader

  if (argv.open) {
    openURI(uri)
  }

  var contents = null

  // Wait for chrome to boot up before
  // starting debugger
  var delay = argv.open ? 1000 : 0
  setTimeout(function () {
    reloader = chrome({
      uri: uri
    })

    // ensure first update is fired after opening
    if (contents) {
      reloader(name, contents)
    }
  }, delay)

  // listen for HTML/CSS LiveReload events if user requested it
  if (argv.live) {
    budo.watch(['**/*.{html,css}'])
    budo.live()
    budo.on('watch', function (event, file) {
      // update CSS/HTML
      budo.reload(file)
    })
  }

  // trigger injection on bundle update
  budo
    .on('update', function (data) {
      data = data.toString()
      if (reloader) {
        reloader(name, data)
      } else {
        contents = data
      }
    })

  function openURI () {
    var port = typeof argv.open === 'number' ? argv.open : 9222

    tmpdir(function (err, dir) {
      if (err) {
        console.error('Could not create tmpdir', err)
        process.exit(1)
      }

      var proc = launch(uri, {
        dir: dir,
        nuke: false,
        args: [
          '--remote-debugging-port=' + port
        ]
      })
      proc.on('close', function () {
        proc.kill()
      })
      budo.on('exit', function () {
        proc.kill()
      })
    })
  }
}
