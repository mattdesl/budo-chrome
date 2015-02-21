#!/usr/bin/env node
var launch = require('chrome-launch')
var tmpdir = require('budo/lib/tmpdir')
var chrome = require('./lib/remote-interface')
var wtch = require('wtch')
var xtend = require('xtend')

var args = process.argv.slice(2)
var argv = require('minimist')(args)

var ready = argv.open ? openURI : function(){}

require('budo')(args, function(result) {
    var uri = result.uri
    var bundleFile = result.output.from
    var reloader

    if (argv.open)
        openURI(result)

    //Wait for chrome to boot up before 
    //starting debugger
    var delay = argv.open ? 1000 : 0
    setTimeout(function() {
        reloader = chrome({ 
            uri: uri 
        })
    }, delay)

    //listen for LiveReload events if needed
    var globs = []
    var liveReload = argv.live || argv['live-plugin']
    if (liveReload)
        globs = [ '**/*.{html,css}' ]

    //listen to the bundle glob 
    globs.push(result.output.glob)

    //only trigger LiveReload events if needed
    var ignores = liveReload ? bundleFile : '**/*'

    wtch(globs, { ignoreReload: ignores })
        .on('watch', function(event, file) {
            if (reloader 
                  && file === bundleFile
                  && (event === 'change' || event === 'add')) {
                reloader(file)
            }
        })
})
    

//if budo has created a tmpdir,
//use that instead of a new one
function getDir(opt, cb) {
    if (opt.tmp) 
        cb(null, opt.dir)
    else
        tmpdir(cb)
}

function openURI(budo, cb) {
    var port = typeof argv.open === 'number' ? argv.open : 9222
    var uri = budo.uri

    getDir(budo.output, function(err, dir) {
        if (err) {
            console.error("Could not create tmpdir", err)
            process.exit(1)
        }
        
        var proc = launch(uri, {
            dir: dir,
            nuke: false,
            args: [
                '--remote-debugging-port='+port
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