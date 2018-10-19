const make = require('./make')
// const iota = require('iota-array') // TODO: remove if unused
// const lexi = require('lexicographic-integer') // TODO: remove if unused

// This test isn't included in abstract-leveldown because
// the empty-check is currently performed by leveldown.
make('iterator#seek throws if target is empty', function (db, t, done) {
  var targets = ['', Buffer.alloc(0), []]
  var pending = targets.length

  targets.forEach(function (target) {
    var ite = db.iterator()
    var error

    try {
      ite.seek(target)
    } catch (err) {
      error = err.message
    }

    t.is(error, 'cannot seek() to an empty target', 'got error')
    ite.end(end)
  })

  function end (err) {
    t.error(err, 'no error from end()')
    if (!--pending) done()
  }
})

make('iterator optimized for seek', function (db, t, done) {
  var batch = db.batch()
  batch.put('a', 1)
  batch.put('b', 1)
  batch.put('c', 1)
  batch.put('d', 1)
  batch.put('e', 1)
  batch.put('f', 1)
  batch.put('g', 1)
  batch.write(function (err) {
    var ite = db.iterator()
    t.error(err, 'no error from batch')
    ite.next(function (err, key, value) {
      t.error(err, 'no error from next()')
      t.equal(key.toString(), 'a', 'key matches')
      t.equal(ite.cache.length, 0, 'no cache')
      ite.next(function (err, key, value) {
        t.error(err, 'no error from next()')
        t.equal(key.toString(), 'b', 'key matches')
        t.ok(ite.cache.length > 0, 'has cached items')
        ite.seek('d')
        t.notOk(ite.cache, 'cache is removed')
        ite.next(function (err, key, value) {
          t.error(err, 'no error from next()')
          t.equal(key.toString(), 'd', 'key matches')
          t.equal(ite.cache.length, 0, 'no cache')
          ite.next(function (err, key, value) {
            t.error(err, 'no error from next()')
            t.equal(key.toString(), 'e', 'key matches')
            t.ok(ite.cache.length > 0, 'has cached items')
            ite.end(done)
          })
        })
      })
    })
  })
})

make('close db with open iterator', function (db, t, done) {
  var ite = db.iterator()
  var cnt = 0
  ite.next(function loop (err, key, value) {
    if (cnt++ === 0) {
      t.error(err, 'no error from next()')
    } else {
      t.equal(err.message, 'iterator has ended')
    }
    if (key !== undefined) { ite.next(loop) }
  })

  db.close(function (err) {
    t.error(err, 'no error from close()')
    done(false)
  })
})
