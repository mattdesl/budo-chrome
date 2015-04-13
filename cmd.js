#!/usr/bin/env node

var launch = require('chrome-launch')
var tmpdir = require('./lib/tmpdir')
var chrome = require('./lib/remote-interface')
var xtend = require('xtend')
var path = require('path')

var args = process.argv.slice(2)
var argv = require('minimist')(args)

//get entries
var entries = argv._
delete argv._

//make sure budo does not handle LiveReload itself
var liveOpts = xtend(argv)
delete argv.live
delete argv['live-plugin']

//write to stdout
argv.stream = process.stdout

var budo = require('budo')(entries, argv)
  .on('connect', setup)

function setup(ev) {
  var uri = ev.uri
  var name = ev.serve
  var reloader

  if (argv.open)
    openURI(uri)

  var contents = null

  //Wait for chrome to boot up before 
  //starting debugger
  var delay = argv.open ? 1000 : 0
  setTimeout(function() {
    reloader = chrome({
      uri: uri
    })

    //ensure first update is fired after opening
    if (contents) 
      reloader(name, contents)
  }, delay)


  //listen for HTML/CSS LiveReload events if user requested it
  if (liveOpts.live || liveOpts['live-plugin']) {
    budo.watch(['**/*.{html,css}'])
    budo.live({ plugin: liveOpts['live-plugin'] })
    budo.on('watch', function(event, file) {
      //update CSS/HTML
      budo.reload(file)
    })
  }

  //trigger injection on bundle update
  budo
    .on('update', function(file, data) {
      data = data.toString()
      if (reloader)
        reloader(file, data)
      else
        contents = data
    })

  function openURI() {
    var port = typeof argv.open === 'number' ? argv.open : 9222
    
    tmpdir(function(err, dir) {
      if (err) {
        console.error("Could not create tmpdir", err)
        process.exit(1)
      }

      var proc = launch(uri, {
        dir: dir,
        nuke: false,
        args: [
          '--remote-debugging-port=' + port
        ]
      })
      proc.on('close', function() {
        proc.kill()
      })
      budo.on('exit', function() {
        proc.kill()
      })
    })
  }
}

  