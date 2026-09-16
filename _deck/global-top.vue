<!--
  Rendered on top of every slide by Slidev (global-top.vue is a convention).

  The Marp deck had a static 4px Qdrant-red rule across the top, via
  `border-top: 4px solid var(--color-highlight)`. Here it earns its keep: same
  strip, same colour, but the fill tracks progress through the deck, so the room
  can see how much is left without a slide counter (STYLE.md: no slide numbers).
-->
<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { useNav } from '@slidev/client'

const { currentPage, total, next, prev, nextSlide, prevSlide } = useNav()

// First slide reads as 0%, last as 100%.
const pct = computed(() => {
  const t = total.value ?? 1
  if (t <= 1) return 0
  return ((currentPage.value - 1) / (t - 1)) * 100
})

/*
 * Hold-to-advance.
 *
 * Slidev does not throttle navigation: discrete presses register at ~12/s.
 * What makes holding an arrow key feel sluggish is the OS keyboard repeat,
 * which waits ~500ms before the first repeat and only then speeds up. That is
 * the "takes a while to pick up momentum" feel.
 *
 * So we drive the repeat ourselves: act immediately on keydown, wait a short
 * HOLD_DELAY, then fire at a steady HOLD_RATE until keyup. Uniform from the
 * first repeat to the last, and independent of the machine's key settings.
 *
 * We listen in the capture phase and stop propagation so Slidev's own handler
 * doesn't also fire and double-advance.
 */
const HOLD_DELAY = 200 // ms before auto-repeat starts (OS default is ~500)
const HOLD_RATE = 110 // ms between repeats once it is going

let delayTimer = null
let repeatTimer = null

function stopRepeat() {
  clearTimeout(delayTimer)
  clearInterval(repeatTimer)
  delayTimer = repeatTimer = null
}

function startRepeat(fn) {
  stopRepeat()
  fn()
  delayTimer = setTimeout(() => {
    repeatTimer = setInterval(fn, HOLD_RATE)
  }, HOLD_DELAY)
}

function keyFor(e) {
  // left/right step through clicks, up/down jump whole slides -- Slidev's own
  // mapping, kept so muscle memory still works
  if (e.key === 'ArrowRight') return next
  if (e.key === 'ArrowLeft') return prev
  if (e.key === 'ArrowDown') return nextSlide
  if (e.key === 'ArrowUp') return prevSlide
  return null
}

function onKeyDown(e) {
  if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
  const target = e.target
  if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return
  const fn = keyFor(e)
  if (!fn) return
  e.preventDefault()
  e.stopPropagation()
  // the OS repeat stream is ignored; our interval is the only driver
  if (e.repeat) return
  startRepeat(fn)
}

function onKeyUp(e) {
  if (keyFor(e)) stopRepeat()
}

onMounted(() => {
  window.addEventListener('keydown', onKeyDown, true)
  window.addEventListener('keyup', onKeyUp, true)
  window.addEventListener('blur', stopRepeat)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown, true)
  window.removeEventListener('keyup', onKeyUp, true)
  window.removeEventListener('blur', stopRepeat)
  stopRepeat()
})
</script>

<template>
  <div class="ts-progress-track">
    <div class="ts-progress-fill" :style="{ width: `${pct}%` }" />
  </div>
</template>

<style scoped>
.ts-progress-track {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: #dc244c1f; /* faint red so the strip reads full-width even at 0% */
  z-index: 50;
  pointer-events: none;
}
.ts-progress-fill {
  height: 100%;
  background: #dc244c; /* Qdrant red */
  transition: width 220ms ease;
}
</style>
