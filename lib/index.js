/**
 * Host half of dsh-threebody-boot.
 *
 * The splash itself is browser-side (lib/client.js): the film's own React
 * components, rendered live in a shadow root so the login can wait for a click
 * and show the user's own ID. Two things cannot live there:
 *
 *   first frame  DSH draws its own boot card ("HARNESS / Loading plugins…")
 *                before any client plugin is materialised. The only surface that
 *                exists earlier is the served document, reached through
 *                `webserver/index-inject`: the Web carrier renders the rows right
 *                after <head>, the Desktop carrier applies them page-side before
 *                `__DSH_BOOT_READY__`. A style row plus one synchronous script row
 *                therefore covers the glass in the film's own background colour
 *                while the document is still parsing (same approach as
 *                dsh-550c-boot).
 *
 *   media        the soundtrack, the login ambient loop and the fonts ship inside
 *                this package and are served from a prefix route on the host's
 *                webServer. In a browser that is plain
 *                same-origin HTTP; on the Desktop, `dsh-app://app/<path>` requests
 *                that are not front-end assets are forwarded to the same host
 *                (Range header included), so one route covers both carriers.
 *
 * Contracts with lib/client.js (keep in sync):
 *
 *   MODE_KEY / DEFAULT_MODE   same localStorage key and default; 'off' makes the
 *                             cover bow out so DSH boots straight through.
 *   FIRST_FRAME_GLOBAL        `window.__dshThreebodyFirstFrame.end()` is how the
 *                             splash retires the cover once its shadow root is on
 *                             screen. The boot-card watch and the timeout are the
 *                             fallbacks: a client bundle that never arrives must
 *                             not leave a dark window behind.
 *
 * @module dsh-threebody-boot
 */

import { createReadStream, readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const name = 'boot-threebody'

/** lib/client.js MODE_KEY / DEFAULT_MODE — keep in sync. */
const MODE_KEY = 'dsh-threebody-boot:mode'
const DEFAULT_MODE = 'short'
/** lib/client.js FIRST_FRAME_GLOBAL — keep in sync. */
const FIRST_FRAME_GLOBAL = '__dshThreebodyFirstFrame'
/** lib/client.js VERSION_GLOBAL — the running version, for the settings row. */
const VERSION_GLOBAL = '__dshThreebodyVersion'
/** The film's corner colour after its vignette (lib/client.js BG), so the hand-off is invisible. */
const FIRST_FRAME_BG = '#020305'
/** Absolute ceiling (ms): past this the cover yields whatever is on the page. */
const FIRST_FRAME_MAX_MS = 12000
/**
 * Above dsh-550c-boot's own cover (2147482000) so the two never fight when both
 * are installed, below this plugin's overlay (lib/client.js, 2147483500).
 */
const FIRST_FRAME_Z = 2147483400

/** lib/client.js MEDIA_ROUTE — keep in sync. */
const MEDIA_PREFIX = '/dsh-threebody-boot/media'
const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const MEDIA_ROOT = resolve(PACKAGE_ROOT, 'media')
/** A whitelist rather than a traversal check: only these files are ever served. */
const MEDIA_FILES = new Map([
  ['soundtrack.m4a', 'audio/mp4'],
  ['ambient-loop.wav', 'audio/wav'],
  ['fonts/NotoSerifSC-300.woff2', 'font/woff2'],
  ['fonts/NotoSerifSC-500.woff2', 'font/woff2'],
  ['fonts/NotoSansSC-300.woff2', 'font/woff2'],
  ['fonts/NotoSansSC-500.woff2', 'font/woff2'],
  ['fonts/JetBrainsMono-300.woff', 'font/woff'],
  ['fonts/JetBrainsMono-400.woff', 'font/woff'],
])

function packageVersion() {
  try {
    return JSON.parse(readFileSync(resolve(PACKAGE_ROOT, 'package.json'), 'utf8')).version ?? null
  } catch (error) {
    return null
  }
}

const VERSION = packageVersion()

/**
 * The cover: the film's background colour, above anything the page paints and
 * below the splash that replaces it. `::after`, because dsh-550c-boot owns
 * `html::before` for its own cover. The doubled class outranks 550C's
 * `html.dsh550c-first` token overrides, which the Desktop preload measures into
 * the Windows caption strip.
 */
const FIRST_FRAME_CSS =
  'html.dshtb-first::after{content:"";position:fixed;inset:0;background:' +
  FIRST_FRAME_BG +
  ';z-index:' +
  String(FIRST_FRAME_Z) +
  ';pointer-events:none}\n' +
  'html.dshtb-first.dshtb-first{background:' +
  FIRST_FRAME_BG +
  ';--dsw-specific-sidebar-fill:' +
  FIRST_FRAME_BG +
  ';--dsw-alias-label-primary:#b8c7d9}'

/**
 * Runs while <head> is being parsed, before the shell exists. Serialised with
 * Function.prototype.toString, so it must stay self-contained ES5-ish code.
 *
 * Besides the cover it performs the 550C hand-off: when dsh-550c-boot is also
 * installed, its splash and this one would both play on every boot. 550C keeps a
 * documented per-page flag (`window.__dsh550cState.splashPlayed`, "this page
 * already played the splash") and skips its automatic splash when it is set.
 * Setting it here — only when the 三体 splash is actually going to play —
 * makes the two splashes mutually exclusive (三体 on → 550C stays quiet; 三体 off
 * → 550C plays as configured) and leaves 550C's settings page and its preview
 * button untouched.
 */
function firstFrame(config) {
  var mode = null
  try {
    mode = window.localStorage.getItem(config.modeKey)
  } catch (error) {
    /* private mode: defaults apply */
  }
  if (mode !== 'off' && mode !== 'short' && mode !== 'full') mode = config.defaultMode
  if (mode === 'off') return
  var state = window.__dsh550cState
  if (state === undefined || state === null) {
    state = {}
    window.__dsh550cState = state
  }
  state.splashPlayed = true
  var root = document.documentElement
  var watch = null
  var end = function () {
    if (watch !== null) {
      window.clearInterval(watch)
      watch = null
    }
    root.classList.remove('dshtb-first')
  }
  window[config.handle] = { end: end }
  root.classList.add('dshtb-first')
  // Fallbacks only: the splash ends the cover itself. The kernel removes the boot
  // card when the application mounts, and drops its spinner when it renders a
  // failure — a broken page must stay readable rather than hidden.
  var seen = false
  watch = window.setInterval(function () {
    var card = document.querySelector('[data-dsh-boot]')
    if (card === null) {
      if (seen) end()
      return
    }
    seen = true
    if (card.querySelector('[data-dsh-boot-spinner]') === null) end()
  }, 250)
  window.setTimeout(end, config.maxMs)
}

const FIRST_FRAME_SCRIPT =
  '(' +
  firstFrame.toString() +
  ')(' +
  JSON.stringify({
    modeKey: MODE_KEY,
    defaultMode: DEFAULT_MODE,
    handle: FIRST_FRAME_GLOBAL,
    maxMs: FIRST_FRAME_MAX_MS,
  }) +
  ')'

/**
 * Parse a single `bytes=` range against a file size.
 * @returns {{start:number,end:number}|null|'invalid'} null when there is no range
 */
function parseRange(header, size) {
  if (typeof header !== 'string' || header === '') return null
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim())
  if (match === null) return 'invalid'
  let start
  let end
  if (match[1] === '') {
    // Suffix range: the last N bytes.
    const length = Number(match[2])
    if (!Number.isFinite(length) || length <= 0) return 'invalid'
    start = Math.max(0, size - length)
    end = size - 1
  } else {
    start = Number(match[1])
    end = match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1)
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= size) return 'invalid'
  return { start, end }
}

/**
 * GET/HEAD /dsh-threebody-boot/media/<file>
 *
 * Range-aware, because Chromium's media pipeline asks for byte ranges and a
 * 200-only server makes it fetch the whole file before it can seek or start.
 */
function mediaHandler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { allow: 'GET, HEAD' })
    res.end()
    return
  }
  let fileName
  try {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1')
    fileName = decodeURIComponent(url.pathname.slice(MEDIA_PREFIX.length)).replace(/^\/+/, '')
  } catch (error) {
    res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('bad request')
    return
  }
  const type = MEDIA_FILES.get(fileName)
  if (type === undefined) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('not found')
    return
  }
  const file = resolve(MEDIA_ROOT, fileName)
  let size
  try {
    size = statSync(file).size
  } catch (error) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
    res.end('not found')
    return
  }

  const headers = {
    'content-type': type,
    'accept-ranges': 'bytes',
    'cache-control': 'no-store',
  }
  const range = parseRange(req.headers.range, size)
  if (range === 'invalid') {
    res.writeHead(416, { ...headers, 'content-range': `bytes */${String(size)}` })
    res.end()
    return
  }
  const start = range === null ? 0 : range.start
  const end = range === null ? size - 1 : range.end
  if (range === null) {
    res.writeHead(200, { ...headers, 'content-length': String(size) })
  } else {
    res.writeHead(206, {
      ...headers,
      'content-range': `bytes ${String(start)}-${String(end)}/${String(size)}`,
      'content-length': String(end - start + 1),
    })
  }
  if (req.method === 'HEAD') {
    res.end()
    return
  }
  const stream = createReadStream(file, { start, end })
  stream.on('error', () => res.destroy())
  res.on('close', () => stream.destroy())
  stream.pipe(res)
}

/**
 * Contribute the first frame to every index response and serve the media.
 *
 * The media route goes through an optional injection (`ctx.inject(['webServer'],
 * …)`), so a profile without an HTTP carrier still loads the plugin; the splash
 * then fails to load its sound and fonts, plays silently with fallback fonts.
 *
 * @param ctx - the plugin context.
 */
export function apply(ctx) {
  ctx.on('webserver/index-inject', (table) => {
    table.push({ kind: 'style', text: FIRST_FRAME_CSS })
    table.push({ kind: 'script', placement: 'head', text: FIRST_FRAME_SCRIPT })
    if (VERSION !== null) table.push({ kind: 'global', name: VERSION_GLOBAL, value: VERSION })
  })

  ctx.inject(['webServer'], (webCtx) => {
    webCtx.effect(
      () =>
        webCtx.webServer.register({
          kind: 'prefix',
          path: MEDIA_PREFIX,
          handler: mediaHandler,
        }),
      `boot-threebody: GET ${MEDIA_PREFIX}/*`,
    )
  })
}

/** Exposed for scripts/test-host.mjs only. */
export const __test = { parseRange, mediaHandler, FIRST_FRAME_SCRIPT, MEDIA_PREFIX }
