window.__ModuleLoader__.load({
	id: "dsh-threebody-boot",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;

		/**
		 * dsh-threebody-boot — browser half.
		 *
		 * SOURCE TEMPLATE. lib/client.js is generated from this file by
		 * three-body-login/tools/build_live.mjs, which replaces the marker below with
		 * the live player: the film's own React components (three-body-login/src),
		 * bundled with React and a frame clock instead of Remotion. Edit this file,
		 * then rebuild; never edit lib/client.js by hand.
		 *
		 * Two surfaces, the same split as dsh-550c-boot:
		 *
		 *   the splash       mounted IMPERATIVELY at module evaluation, not through a
		 *                    slot: slots render only after every client plugin has
		 *                    loaded, which is also when DSH's own boot card is
		 *                    disposed, so a slot-based splash always comes late.
		 *   the 三体 page     settings.section + one list slot (mode, sound, login ID;
		 *                    dsh-threebody-skin adds its own rows).
		 *
		 * The splash renders live, which is what makes the login real: the timeline
		 * stops at the filled-in login panel until the 进入 button is clicked, and the
		 * identity typed in (and greeted after verification) is the one set here.
		 *
		 * Every exit — played out, skipped, stalled, watchdog, a throw — funnels
		 * through record.finish(), so a broken splash can never trap anyone behind a
		 * dark screen.
		 */

		/*@@LIVE_BUNDLE@@*/

		const React = require('react')

		/** lib/index.js MODE_KEY / DEFAULT_MODE — keep in sync. */
		const MODE_KEY = 'dsh-threebody-boot:mode'
		const MODE_VALUES = ['off', 'short', 'full']
		const DEFAULT_MODE = 'short'
		const VOLUME_KEY = 'dsh-threebody-boot:volume'
		const VOLUME_VALUES = ['mute', 'low', 'mid', 'high']
		const DEFAULT_VOLUME = 'mid'
		const VOLUME_LEVEL = { mute: 0, low: 0.3, mid: 0.6, high: 1 }
		/** The identity typed into the login panel and greeted after verification. */
		const ID_KEY = 'dsh-threebody-boot:id'
		const DEFAULT_ID = '海人'
		const ID_MAX = 12
		/** lib/index.js FIRST_FRAME_GLOBAL / VERSION_GLOBAL — keep in sync. */
		const FIRST_FRAME_GLOBAL = '__dshThreebodyFirstFrame'
		const VERSION_GLOBAL = '__dshThreebodyVersion'
		const STATE_GLOBAL = '__dshThreebodyState'
		/** lib/index.js FIRST_FRAME_BG: the film's corner colour after its vignette. */
		const BG = '#020305'
		/** dsh-threebody-skin sets this on <html> while it is on. */
		const SKIN_ATTR = 'data-tbskin'
		/** Overlay fade; with the skin on, the landscape dissolves slowly into its ghost. */
		const FADE_MS = 650
		const GHOST_FADE_MS = 2800
		/** Fonts and audio get this long before the splash gives up on starting. */
		const START_TIMEOUT_MS = 6000
		/** The timeline has not moved for this long outside the login wait → give up. */
		const STALL_MS = 8000
		const HOST_SHEET_ID = 'dsh-threebody-boot-host'
		const ROW_STYLE_ID = 'dsh-threebody-boot-row-style'
		const CAPTION_STYLE_ID = 'dsh-threebody-boot-caption'
		/** Windows caption-button glyph colour while the splash plays (the film's pale steel). */
		const CAPTION_SYMBOL = '#b8c7d9'
		const INTRO_HINT = '按任意键跳到登录 · Esc 跳过片头'
		const MUTED_HINT = '声音被浏览器暂停 · 按 M 开启'
		/** Keys that never count as "any key". */
		const IGNORED_KEYS = ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Fn', 'FnLock', 'NumLock', 'ScrollLock', 'Process', 'Unidentified', 'Dead']

		/** One state object per page: "already applied", "already auto-played". */
		function tbState() {
		  const existing = window[STATE_GLOBAL]
		  if (existing !== undefined && existing !== null) return existing
		  const created = { applied: false, splashPlayed: false }
		  window[STATE_GLOBAL] = created
		  return created
		}

		function readChoice(key, values, fallback) {
		  try {
		    const raw = window.localStorage.getItem(key)
		    return values.indexOf(raw) >= 0 ? raw : fallback
		  } catch (error) {
		    return fallback
		  }
		}

		function writeChoice(key, value) {
		  try {
		    window.localStorage.setItem(key, value)
		  } catch (error) {
		    /* private mode: the choice simply does not persist */
		  }
		}

		const readMode = () => readChoice(MODE_KEY, MODE_VALUES, DEFAULT_MODE)
		const readVolume = () => readChoice(VOLUME_KEY, VOLUME_VALUES, DEFAULT_VOLUME)

		/** The stored identity, trimmed and capped; empty means the default. */
		function readId() {
		  try {
		    const raw = window.localStorage.getItem(ID_KEY)
		    const clean = typeof raw === 'string' ? Array.from(raw.trim()).slice(0, ID_MAX).join('') : ''
		    return clean === '' ? DEFAULT_ID : clean
		  } catch (error) {
		    return DEFAULT_ID
		  }
		}

		function installedVersion() {
		  const value = window[VERSION_GLOBAL]
		  return typeof value === 'string' && value !== '' ? value : null
		}

		/** The Electron preload writes html[data-platform]; a browser tab has none. */
		function desktopPlatform() {
		  const platform = document.documentElement.dataset.platform
		  return platform === undefined || platform === '' ? null : platform
		}

		/**
		 * Document-level sheet for the overlay host and the drag band.
		 *
		 * In the document, not the shadow root: a document rule always outranks a
		 * `:host` declaration, and DSH's own base sheet styles direct body children
		 * (`-webkit-app-region` on darwin). `!important` keeps third-party sheets off
		 * the geometry, as dsh-550c-boot learned the hard way.
		 */
		const HOST_SHEET_CSS =
		  'body>.dshtb-host{position:fixed;inset:0;display:block;box-sizing:border-box;margin:0;z-index:2147483500 !important;background:' + BG + ';pointer-events:auto !important;opacity:1}\n' +
		  'body>.dshtb-host.dshtb-out{opacity:0 !important;pointer-events:none !important;transition:opacity ' + String(FADE_MS) + 'ms cubic-bezier(.4,0,.2,1) !important}\n' +
		  'body>.dshtb-host.dshtb-out.dshtb-ghost{transition:opacity ' + String(GHOST_FADE_MS) + 'ms cubic-bezier(.45,0,.25,1) !important}\n' +
		  'html[data-platform="darwin"] body>.dshtb-host{-webkit-app-region:initial !important}\n' +
		  // The window stays draggable by its top strip while the splash plays.
		  'body>.dshtb-dragband{position:fixed;top:0;left:0;right:0;height:40px;z-index:2147483501;-webkit-app-region:drag}\n'

		const SHADOW_CSS =
		  ':host{all:initial}\n' +
		  '.stage{position:absolute;inset:0;overflow:hidden;background:' + BG + ';opacity:0;transition:opacity .25s ease;user-select:none;-webkit-user-select:none}\n' +
		  '.stage.on{opacity:1}\n' +
		  '.hint{position:absolute;left:50%;top:54px;transform:translateX(-50%);padding:6px 14px;' +
		  'font:12px/1.5 "JetBrains Mono TB","Cascadia Mono",Consolas,ui-monospace,"Microsoft YaHei",sans-serif;letter-spacing:.18em;' +
		  'color:rgba(184,199,217,.62);white-space:nowrap;opacity:0;transition:opacity .9s ease;pointer-events:none;user-select:none}\n' +
		  '.hint.on{opacity:1}\n'

		function ensureHostSheet() {
		  if (document.getElementById(HOST_SHEET_ID) !== null) return
		  const style = document.createElement('style')
		  style.id = HOST_SHEET_ID
		  style.textContent = HOST_SHEET_CSS
		  document.head.appendChild(style)
		}

		/** Retire the host half's cover; called on the same task that mounts the overlay. */
		function endFirstFrame() {
		  const handle = window[FIRST_FRAME_GLOBAL]
		  if (handle === undefined || handle === null) return
		  delete window[FIRST_FRAME_GLOBAL]
		  try {
		    handle.end()
		  } catch (error) {
		    console.error('[dsh-threebody-boot] first frame refused to end', error)
		  }
		}

		/**
		 * Make the Windows caption strip see-through while the splash plays (same
		 * mechanism as dsh-550c-boot's adaptCaption: the Desktop preload measures a
		 * body-level probe span, and a <head> mutation triggers the re-measure).
		 *
		 * @returns a disposer, or null when there is nothing to adapt
		 */
		function adaptCaption() {
		  const platform = desktopPlatform()
		  if (platform === null || platform === 'darwin') return null
		  const style = document.createElement('style')
		  style.id = CAPTION_STYLE_ID
		  style.textContent =
		    'body>span[style*="dsw-specific-sidebar-fill"]{background-color:transparent !important;color:' +
		    CAPTION_SYMBOL +
		    ' !important}'
		  document.head.appendChild(style)
		  return () => style.remove()
		}

		/** The one live splash; the boot trigger and the preview button share it. */
		let liveOverlay = null

		/**
		 * Mount the splash.
		 *
		 * @param force - play even when the stored mode is 'off' (the preview button)
		 * @param cut - which cut to play; defaults to the stored mode
		 * @returns the live overlay record, or null when nothing was mounted
		 */
		function mountOverlay(force, cut) {
		  if (liveOverlay !== null) return liveOverlay
		  if (document.body === null) {
		    // The factory can run while the document is still parsing.
		    document.addEventListener('DOMContentLoaded', () => mountOverlay(force, cut), { once: true })
		    return null
		  }
		  const stored = readMode()
		  if (force !== true) {
		    // Automatic play happens once per document: the client re-renders and
		    // reconnects during a session and must not bring the splash back.
		    const state = tbState()
		    if (state.splashPlayed === true) return null
		    state.splashPlayed = true
		    if (stored === 'off') return null
		  }
		  const mode = cut === 'full' || cut === 'short' ? cut : stored === 'full' ? 'full' : 'short'
		  const record = createSession(mode, buildOverlay(mode))
		  liveOverlay = record
		  startShow(record)
		  return record
		}

		/** Host element, shadow root, stage, hint line and (Desktop) drag band. */
		function buildOverlay(mode) {
		  ensureHostSheet()
		  const host = document.createElement('div')
		  host.className = 'dshtb-host'
		  host.dataset.dshThreebodyBoot = mode
		  host.setAttribute('aria-hidden', 'true')
		  // Recorded for verification: did the splash beat DSH's own boot card?
		  host.dataset.sawBootCard = String(document.querySelector('[data-dsh-boot]') !== null)
		  const shadow = host.attachShadow({ mode: 'open' })
		  const style = document.createElement('style')
		  style.textContent = SHADOW_CSS
		  const stage = document.createElement('div')
		  stage.className = 'stage'
		  const hint = document.createElement('div')
		  hint.className = 'hint'
		  shadow.appendChild(style)
		  shadow.appendChild(stage)
		  shadow.appendChild(hint)
		  document.body.appendChild(host)

		  let dragBand = null
		  if (desktopPlatform() !== null) {
		    dragBand = document.createElement('div')
		    dragBand.className = 'dshtb-dragband'
		    dragBand.setAttribute('data-window-drag', '')
		    document.body.appendChild(dragBand)
		  }
		  return { host: host, stage: stage, hint: hint, dragBand: dragBand }
		}

		/**
		 * One splash's lifecycle: finish (the single way out) and dispose (DOM teardown
		 * after the fade).
		 */
		function createSession(mode, parts) {
		  const record = {
		    mode: mode,
		    host: parts.host,
		    stage: parts.stage,
		    hint: parts.hint,
		    dragBand: parts.dragBand,
		    player: null,
		    started: false,
		    finished: false,
		    timers: [],
		    watchdog: null,
		    caption: null,
		  }

		  record.later = (fn, ms) => {
		    record.timers.push(window.setTimeout(fn, ms))
		  }

		  record.showHint = (text, ms) => {
		    record.hint.textContent = text
		    record.hint.classList.add('on')
		    if (ms > 0) record.later(() => record.hint.classList.remove('on'), ms)
		  }

		  record.finish = (reason) => {
		    if (record.finished) return
		    record.finished = true
		    for (const id of record.timers) window.clearTimeout(id)
		    record.timers = []
		    if (record.watchdog !== null) window.clearInterval(record.watchdog)
		    record.watchdog = null
		    if (reason !== 'played' && reason !== 'skipped') console.warn('[dsh-threebody-boot] splash ended early:', reason)
		    // Played to the end with the skin on: the last frame is the skin's own
		    // ghost image, so the overlay dissolves slowly into it instead of cutting.
		    const fade = reason === 'played' && document.documentElement.hasAttribute(SKIN_ATTR) ? GHOST_FADE_MS : FADE_MS
		    if (fade === GHOST_FADE_MS) record.host.classList.add('dshtb-ghost')
		    if (record.player !== null) record.player.fadeOut(fade)
		    record.host.classList.add('dshtb-out')
		    record.timers.push(window.setTimeout(record.dispose, fade + 40))
		  }

		  record.dispose = () => {
		    for (const id of record.timers) window.clearTimeout(id)
		    record.timers = []
		    if (record.watchdog !== null) window.clearInterval(record.watchdog)
		    record.watchdog = null
		    record.host.removeEventListener('click', record.onClick)
		    window.removeEventListener('keydown', record.onKey, true)
		    if (record.player !== null) record.player.dispose()
		    record.player = null
		    if (record.caption !== null) record.caption()
		    record.caption = null
		    if (record.dragBand !== null) record.dragBand.remove()
		    record.host.remove()
		    // Should the host's cover still be up, it goes with the overlay.
		    endFirstFrame()
		    if (liveOverlay === record) liveOverlay = null
		  }

		  /** Clicks that reach the host missed the 进入 button (the button stops its own). */
		  record.onClick = () => {
		    if (record.finished || record.player === null) return
		    if (record.player.handleClick() === 'finish') record.finish('skipped')
		  }

		  record.onKey = (event) => {
		    if (record.finished) return
		    if (event.key === 'Escape') {
		      event.preventDefault()
		      event.stopPropagation()
		      record.finish('skipped')
		      return
		    }
		    if (IGNORED_KEYS.indexOf(event.key) >= 0) return
		    // Shortcuts (DevTools, window switching…) pass through untouched.
		    if (event.ctrlKey || event.metaKey || event.altKey) return
		    // No key that reaches the splash may also land in the composer underneath.
		    event.preventDefault()
		    event.stopPropagation()
		    if (record.player === null) return
		    if (event.key === 'm' || event.key === 'M') {
		      record.player.toggleMute()
		      return
		    }
		    if (record.player.handleKey() === 'finish') record.finish('skipped')
		  }

		  return record
		}

		/**
		 * Wire input, start the player, retire the host's cover.
		 *
		 * endFirstFrame() is the last statement of the task that put the overlay on
		 * screen: the overlay paints the same colour as the cover, so they swap in one
		 * paint, and the stage fades in once fonts and sound are ready.
		 */
		function startShow(record) {
		  try {
		    record.host.addEventListener('click', record.onClick)
		    window.addEventListener('keydown', record.onKey, true)
		    record.caption = adaptCaption()

		    const live = typeof __dshThreebodyLive === 'object' && __dshThreebodyLive !== null ? __dshThreebodyLive : null
		    if (live === null) throw new Error('live player missing from the bundle')
		    record.player = live.createPlayer({
		      container: record.stage,
		      mode: record.mode,
		      id: readId(),
		      volume: VOLUME_LEVEL[readVolume()],
		      onFinish: (reason) => record.finish(reason),
		      onAudioBlocked: (blocked) => {
		        if (blocked) record.showHint(MUTED_HINT, 0)
		        else if (record.hint.textContent === MUTED_HINT) record.hint.classList.remove('on')
		      },
		    })

		    const startedAt = performance.now()
		    record.player
		      .start()
		      .then(() => {
		        if (record.finished) return
		        record.started = true
		        record.stage.classList.add('on')
		        record.later(() => {
		          if (!record.hint.classList.contains('on')) record.showHint(INTRO_HINT, 3600)
		        }, 900)
		      })
		      .catch((error) => {
		        console.error('[dsh-threebody-boot] live player failed to start', error)
		        record.finish('start-failed')
		      })

		    // Watchdog: never wait forever outside the login (where waiting is the point).
		    record.watchdog = window.setInterval(() => {
		      const player = record.player
		      if (record.finished || player === null) return
		      const now = performance.now()
		      if (!record.started) {
		        if (now - startedAt > START_TIMEOUT_MS) record.finish('start-timeout')
		        return
		      }
		      if (!player.waiting && now - player.lastAdvance > STALL_MS) record.finish('stalled')
		    }, 1000)

		    endFirstFrame()
		  } catch (error) {
		    console.error('[dsh-threebody-boot] splash failed to start', error)
		    record.finish('start-failed')
		  }
		}

		/* ------------------------------------------------------------------ */
		/* Settings: the 三体 page                                              */
		/* ------------------------------------------------------------------ */

		/** Row sheet; DSH tokens so it matches either theme (same tokens as 550C's rows). */
		const ROW_CSS =
		  '.dshtb-row{display:flex;align-items:center;gap:16px;padding:10px 0;flex-wrap:wrap;min-width:0;max-width:100%}\n' +
		  '.dshtb-row-text{flex:1;min-width:220px}\n' +
		  '.dshtb-row-title{font-size:13px;line-height:1.5;color:var(--dsw-alias-label-primary,#191919)}\n' +
		  '.dshtb-row-desc{margin-top:2px;font-size:12px;line-height:1.6;color:var(--dsw-alias-label-secondary,#666)}\n' +
		  '.dshtb-row-ctrl{display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-width:0}\n' +
		  '.dshtb-seg{display:inline-flex;border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.35));border-radius:8px;overflow:hidden}\n' +
		  '.dshtb-seg button{border:0;background:transparent;color:var(--dsw-alias-label-secondary,#666);font-family:inherit;font-size:12.5px;line-height:1.4;padding:5px 14px;cursor:pointer}\n' +
		  '.dshtb-seg button+button{border-left:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.35))}\n' +
		  '.dshtb-seg button:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14))}\n' +
		  // Fixed black-on-white for the active segment: the brand tokens flip between
		  // themes and skins rewrite them (the bug 550C fixed three times).
		  '.dshtb-seg button.on{background:#111;color:#fff;font-weight:600}\n' +
		  '.dshtb-btn{border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.35));background:transparent;color:var(--dsw-alias-label-primary,#191919);font-family:inherit;font-size:12.5px;line-height:1.4;padding:5px 14px;border-radius:8px;cursor:pointer}\n' +
		  '.dshtb-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14))}\n' +
		  '.dshtb-input{border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.35));background:transparent;color:var(--dsw-alias-label-primary,#111);border-radius:8px;padding:5px 10px;font:inherit;font-size:13px;width:180px;box-sizing:border-box}\n' +
		  '.dshtb-input:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#4d6bfe);outline-offset:1px}\n' +
		  '.dshtb-meta{margin-top:4px;font-size:11.5px;color:var(--dsw-alias-label-tertiary,#999)}\n'

		function ensureRowStyle() {
		  if (document.getElementById(ROW_STYLE_ID) !== null) return
		  const style = document.createElement('style')
		  style.id = ROW_STYLE_ID
		  style.textContent = ROW_CSS
		  document.head.appendChild(style)
		}

		const h = React.createElement

		function Segmented(props) {
		  return h(
		    'div',
		    { className: 'dshtb-seg' },
		    props.options.map((option) =>
		      h(
		        'button',
		        {
		          key: option.value,
		          type: 'button',
		          className: props.value === option.value ? 'on' : '',
		          onClick: () => props.onChange(option.value),
		        },
		        option.label,
		      ),
		    ),
		  )
		}

		function Row(props) {
		  return h(
		    'div',
		    { className: 'dshtb-row' },
		    h(
		      'div',
		      { className: 'dshtb-row-text' },
		      h('div', { className: 'dshtb-row-title' }, props.title),
		      h('div', { className: 'dshtb-row-desc' }, props.desc),
		      props.meta === undefined ? null : h('div', { className: 'dshtb-meta' }, props.meta),
		    ),
		    h('div', { className: 'dshtb-row-ctrl' }, props.children),
		  )
		}

		/** Hook for one persisted choice. */
		function useChoice(read, key) {
		  const [value, setValue] = React.useState(read)
		  const choose = React.useCallback(
		    (next) => {
		      writeChoice(key, next)
		      setValue(next)
		    },
		    [key],
		  )
		  return [value, choose]
		}

		function ModeRow() {
		  const [mode, choose] = useChoice(readMode, MODE_KEY)
		  const version = installedVersion()
		  return h(
		    Row,
		    {
		      title: '三体启动动画',
		      desc: '打开客户端时播放《三体》游戏启动片头，并在登录页停下，用鼠标点击「进入」后继续。精简：三星追逐、标题、登录、验证，然后群山远景缓缓浮现；完整：另含开头的唤醒、自检，以及穿过轨道落到荒原。开启时不再播放 550C 开机动画（两者只开一个）；装了三体皮肤时，远景最后淡成界面上的虚影。按任意键跳到登录，Esc 跳过片头，M 切换静音。',
		      meta: version === null ? undefined : 'dsh-threebody-boot v' + version,
		    },
		    h(Segmented, {
		      value: mode,
		      onChange: choose,
		      options: [
		        { value: 'off', label: '关闭' },
		        { value: 'short', label: '精简' },
		        { value: 'full', label: '完整' },
		      ],
		    }),
		    h(
		      'button',
		      { type: 'button', className: 'dshtb-btn', onClick: () => mountOverlay(true, mode === 'off' ? 'short' : mode) },
		      '预览',
		    ),
		  )
		}

		function IdRow() {
		  const [value, setValue] = React.useState(() => {
		    try {
		      return window.localStorage.getItem(ID_KEY) ?? ''
		    } catch (error) {
		      return ''
		    }
		  })
		  const change = (event) => {
		    const next = Array.from(event.target.value).slice(0, ID_MAX).join('')
		    setValue(next)
		    writeChoice(ID_KEY, next.trim())
		  }
		  return h(
		    Row,
		    {
		      title: '登录身份',
		      desc: '登录页身份栏里输入的 ID，验证通过后显示“欢迎你，××”。留空即默认的“海人”；最多 ' + String(ID_MAX) + ' 个字。密钥自动填写，不用设置。',
		    },
		    h('input', {
		      className: 'dshtb-input',
		      type: 'text',
		      value: value,
		      placeholder: DEFAULT_ID,
		      maxLength: ID_MAX * 2,
		      spellCheck: false,
		      onChange: change,
		    }),
		  )
		}

		function SoundRow() {
		  const [volume, choose] = useChoice(readVolume, VOLUME_KEY)
		  return h(
		    Row,
		    {
		      title: '片头声音',
		      desc: '片头自带合成音效；登录页等待时是一段低沉的底噪。浏览器标签页可能拦截有声自动播放，那时按 M 开启。',
		    },
		    h(Segmented, {
		      value: volume,
		      onChange: choose,
		      options: [
		        { value: 'mute', label: '静音' },
		        { value: 'low', label: '低' },
		        { value: 'mid', label: '中' },
		        { value: 'high', label: '高' },
		      ],
		    }),
		  )
		}

		/** The page shell: one card that renders this plugin's list slot. */
		function ThreebodyPanel(props) {
		  ensureRowStyle()
		  return h(
		    'div',
		    { style: { width: '100%', minWidth: 0, boxSizing: 'border-box', paddingBottom: '8px' } },
		    h(
		      'div',
		      {
		        style: {
		          borderRadius: '18px',
		          border: '1px solid color-mix(in srgb, currentColor 14%, transparent)',
		          background: 'color-mix(in srgb, currentColor 5%, transparent)',
		          padding: '14px 22px 16px',
		          boxSizing: 'border-box',
		        },
		      },
		      props.renderSlot('settings.threebody.item', {}),
		    ),
		  )
		}

		/**
		 * Declare the 三体 page and fill it.
		 *
		 * Slot names are literals on purpose: the injector's pre-flight check reads
		 * register() calls statically and cannot follow a constant.
		 */
		function installSettings(ctx) {
		  ctx.slots.inject('settings.section', () =>
		    ctx.slots.register(
		      {
		        name: 'settings.section',
		        id: 'threebody',
		        order: 31,
		        label: () => '三体',
		        children: {
		          'settings.threebody.item': { kind: 'list', scope: 'root' },
		        },
		      },
		      ThreebodyPanel,
		    ),
		  )
		  ctx.slots.inject('settings.threebody.item', () => {
		    const placed = [
		      ctx.slots.register({ name: 'settings.threebody.item', id: 'boot-threebody-mode', order: 10 }, ModeRow),
		      ctx.slots.register({ name: 'settings.threebody.item', id: 'boot-threebody-id', order: 20 }, IdRow),
		      ctx.slots.register({ name: 'settings.threebody.item', id: 'boot-threebody-sound', order: 30 }, SoundRow),
		    ]
		    return () => {
		      for (const dispose of placed) dispose()
		    }
		  })
		}

		/** Disabling the plugin removes whatever the module-evaluation mount started. */
		function installTeardown(ctx) {
		  ctx.effect(
		    () => () => {
		      if (liveOverlay !== null) liveOverlay.dispose()
		      endFirstFrame()
		    },
		    'dsh-threebody-boot: splash teardown',
		  )
		}

		function apply(ctx) {
		  // A reconnect can call apply() again; registering the same slot id twice throws.
		  const state = tbState()
		  if (state.applied === true) return
		  state.applied = true
		  installSettings(ctx)
		  installTeardown(ctx)
		}

		/**
		 * Mount at MODULE EVALUATION time — as early as a client plugin can draw,
		 * while the module system is still draining and before apply() runs.
		 */
		mountOverlay(false)

		exports.name = 'boot-threebody'
		exports.inject = ['slots']
		exports.apply = apply
		return module.exports;
	}
});
