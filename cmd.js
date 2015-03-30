#!/usr/bin/env node

var launch = require('chrome-launch')
var tmpdir = require('budo/lib/tmpdir')
var chrome = require('./lib/remote-interface')
var xtend = require('xtend')
var path = require('path')

var args = process.argv.slice(2)
var argv = require('minimist')(args)

var ready = argv.open ? openURI : function() {}

//get entries
var entries = argv._
delete argv._

//make sure budo does not create its own watcher
//but also ensure that it injects live-reload snippet if user requested it
var liveOpts = xtend(argv)
argv['live-script'] = argv.live
delete argv.live

//write to stdout
argv.stream = process.stdout

var budo = require('budo')(entries, argv)
  .on('connect', setup)
  .on('exit', function() {
    if (watcher)
      watcher.close()
  })

function setup(ev) {
  var uri = ev.uri
  var bundleFile = ev.from
  var reloader

  if (argv.open)
    openURI(budo)

  //Wait for chrome to boot up before 
  //starting debugger
  var delay = argv.open ? 1000 : 0
  setTimeout(function() {
    reloader = chrome({
      uri: uri
    })
  }, delay)

  //listen for HTML/CSS LiveReload events if user requested it
  var globs = []
  var liveReload = liveOpts.live || liveOpts['live-plugin']
  if (liveReload)
    globs = ['**/*.{html,css}']

  //listen to the bundle glob 
  globs.push(ev.glob)

  //enable file watching which budo-chrome needs
  budo.watch(globs)

  //optionally enable live reload as well
  if (liveReload)
    budo.live()

  //only trigger LiveReload events if user wants it
  var ignores = liveReload ? bundleFile : '**/*'

  budo.on('watch', function(event, file) {
    var trigger = event === 'change' || event === 'add'

    //trigger bundle script injection
    if (file === bundleFile && reloader && trigger) {
      reloader(file)
    }
    //otherwise, if live reload is enabled for CSS/HTML...
    else if (liveReload && trigger 
        && ['.css', '.html'].indexOf(path.extname(file)) >= 0) {
      budo.reload(file)
    }
  })
}

//if budo has created a tmpdir,
//use that instead of a new one
function getDir(opt, cb) {
  if (opt.tmp)
    cb(null, opt.dir)
  else
    tmpdir(cb)
}

function openURI(ev, cb) {
  var port = typeof argv.open === 'number' ? argv.open : 9222
  var uri = ev.uri

  getDir(ev, function(err, dir) {
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