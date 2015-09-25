var es = require('event-stream')
var got = require('got')
var concat = require('concat-stream')
var debug = require('debug')('paged-http-stream')

/**
  required: implement opts.next
*/
module.exports = function (opts, getNext) {
  var requested = false
  var nextRequest = null

  return es.readable(function read (count, callback) {
    opts = requested ? nextRequest : opts
    debug('opts', opts)

    var stream = this
    if (!opts) return stream.emit('end')

    var req = request(opts)
    req.pipe(concat(function (buf) {
      try {
        var data = JSON.parse(buf.toString())
        nextRequest = getNext(data)
        requested = true
        stream.emit('data', data)
        callback()
      } catch (err) {
        stream.emit('error', err)
        stream.emit('data', null)
      }
    }))

    req.on('error', function (err) {
      debug('request error', err)
      stream.emit('error', err)
    })

    function request (opts) {
      debug('requesting', opts)
      var req = got.stream(opts.uri, opts)
      req.on('error', function (err) {
        debug('request error', err)
        stream.emit('error', err)
      })
      return req
    }
  })
}
