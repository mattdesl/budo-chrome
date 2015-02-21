# budo-chrome

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

[![screenshot](http://i.imgur.com/LJP7d9I.png)](https://www.youtube.com/watch?v=cfgeN3G_Gl0)

<sup>[(click for demo)](https://www.youtube.com/watch?v=cfgeN3G_Gl0)</sup>

A layer on top of [budō](https://github.com/mattdesl/budo) which handles live script injection for Chrome. This allows you to make updates to animations and graphics without destroying application state.  

Under the hood, this uses v8 LiveEdit through Chrome's Remote Debugging protocol. The technology is still experimental, and may not be suitable yet for widespread production use. 

This module needs watchify installed locally (preferred) or globally. Example usage, with [garnish](https://github.com/mattdesl/garnish) for pretty-printing.

```sh
#first, install the tools
npm install -g budo-chrome watchify garnish

#now we can run our dev server
budo-chrome index.js --open | garnish -v
```

This should open Chrome with the remote debugger attached. Changing `index.js` will incrementally update a `bundle.js` file and inject the new source into Chrome. 

## Usage

[![NPM](https://nodei.co/npm/budo-chrome.png)](https://www.npmjs.com/package/budo-chrome)

```sh
Usage:
    budo-chrome [entries] [opts]

Options:
    --open          open a new instance of Chrome
    --remote-port   remote debugging port, default 9222
```

The other options are passed along to [budō](https://github.com/mattdesl/budo) and browserify/watchify. e.g.

```sh
budo Options:
    --outfile, -o   path to output bundle
    --port          port to serve content, default 9966
    --dir           the directory to serve, and the base for --outfile
    --live          enable LiveReload integration
    --live-plugin   enable LiveReload but do not inject script tag
    --live-port     the LiveReload port, default 35729
```

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/budo-chrome/blob/master/LICENSE.md) for details.
