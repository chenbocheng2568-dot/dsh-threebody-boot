// Host-half checks: Range handling of the media route, the whitelist, and the
// first-frame script (evaluated against a minimal fake DOM).
//
//   node scripts/test-host.mjs
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import { __test } from '../lib/index.js'

const { parseRange, mediaHandler, FIRST_FRAME_SCRIPT, MEDIA_PREFIX } = __test
let passed = 0
const ok = (label) => {
  passed += 1
  console.log('ok -', label)
}

// parseRange
assert.equal(parseRange(undefined, 100), null)
assert.deepEqual(parseRange('bytes=0-', 100), { start: 0, end: 99 })
assert.deepEqual(parseRange('bytes=10-19', 100), { start: 10, end: 19 })
assert.deepEqual(parseRange('bytes=90-500', 100), { start: 90, end: 99 })
assert.deepEqual(parseRange('bytes=-10', 100), { start: 90, end: 99 })
assert.equal(parseRange('bytes=100-', 100), 'invalid')
assert.equal(parseRange('bytes=20-10', 100), 'invalid')
assert.equal(parseRange('bytes=0-1,5-6', 100), 'invalid')
ok('parseRange')

// media route over real HTTP
const server = createServer((req, res) => {
  if (req.url.startsWith(MEDIA_PREFIX + '/')) mediaHandler(req, res)
  else {
    res.writeHead(404)
    res.end()
  }
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const base = `http://127.0.0.1:${server.address().port}${MEDIA_PREFIX}/`
const soundFile = fileURLToPath(new URL('../media/soundtrack.m4a', import.meta.url))
const size = statSync(soundFile).size

let response = await fetch(base + 'soundtrack.m4a')
assert.equal(response.status, 200)
assert.equal(response.headers.get('content-type'), 'audio/mp4')
assert.equal(response.headers.get('accept-ranges'), 'bytes')
assert.equal((await response.arrayBuffer()).byteLength, size)
ok('full GET returns the whole file')

response = await fetch(base + 'soundtrack.m4a', { headers: { range: 'bytes=0-1023' } })
assert.equal(response.status, 206)
assert.equal(response.headers.get('content-range'), `bytes 0-1023/${size}`)
const head = Buffer.from(await response.arrayBuffer())
assert.equal(head.length, 1024)
assert.equal(head.subarray(4, 8).toString('latin1'), 'ftyp')
ok('ranged GET returns 206 with the right slice')

response = await fetch(base + 'soundtrack.m4a', { headers: { range: `bytes=${size}-` } })
assert.equal(response.status, 416)
assert.equal(response.headers.get('content-range'), `bytes */${size}`)
ok('out-of-range request returns 416')

response = await fetch(base + 'soundtrack.m4a', { method: 'HEAD' })
assert.equal(response.status, 200)
assert.equal(response.headers.get('content-length'), String(size))
ok('HEAD')

response = await fetch(base + 'fonts/JetBrainsMono-300.woff')
assert.equal(response.status, 200)
assert.equal(response.headers.get('content-type'), 'font/woff')
ok('fonts served')

for (const bad of ['..%2Fpackage.json', '../package.json', 'fonts/../../package.json', 'threebody-short.mp4', 'nope.mp4', '']) {
  response = await fetch(base + bad)
  assert.equal(response.status, 404, bad)
}
ok('only whitelisted files are served')

response = await fetch(base + 'soundtrack.m4a', { method: 'POST' })
assert.equal(response.status, 405)
ok('POST refused')
server.close()

// first-frame script
function fakeWindow(stored) {
  const classes = new Set()
  const timers = []
  const window = {
    localStorage: { getItem: (key) => (key in stored ? stored[key] : null) },
    setInterval: (fn) => {
      timers.push(fn)
      return timers.length
    },
    clearInterval: () => {},
    setTimeout: () => 0,
  }
  window.window = window
  window.document = {
    documentElement: { classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c) } },
    querySelector: () => null,
  }
  return { window, classes }
}

let sandbox = fakeWindow({})
vm.runInNewContext(FIRST_FRAME_SCRIPT, sandbox.window)
assert.ok(sandbox.classes.has('dshtb-first'))
assert.equal(sandbox.window.__dsh550cState.splashPlayed, true)
sandbox.window.__dshThreebodyFirstFrame.end()
assert.ok(!sandbox.classes.has('dshtb-first'))
ok('first frame: default mode covers and yields 550C')

sandbox = fakeWindow({ 'dsh-threebody-boot:mode': 'off' })
vm.runInNewContext(FIRST_FRAME_SCRIPT, sandbox.window)
assert.ok(!sandbox.classes.has('dshtb-first'))
assert.equal(sandbox.window.__dsh550cState, undefined)
ok('first frame: mode off does nothing')

sandbox = fakeWindow({ 'dsh-threebody-boot:mode': 'full' })
sandbox.window.__dsh550cState = { applied: false }
vm.runInNewContext(FIRST_FRAME_SCRIPT, sandbox.window)
assert.ok(sandbox.classes.has('dshtb-first'))
assert.equal(sandbox.window.__dsh550cState.splashPlayed, true)
assert.equal(sandbox.window.__dsh550cState.applied, false)
ok('first frame: full mode yields 550C and keeps its other state')

console.log(`\n${passed} checks passed`)
