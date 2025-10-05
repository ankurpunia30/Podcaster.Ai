import { useEffect, useRef } from 'react'

// Captures mic, computes smoothed volume level (0..1), returns stop() and level ref
export function useMicAudio(onLevel) {
  const mediaStreamRef = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    return () => stop()
  }, [])

  async function start() {
    if (mediaStreamRef.current) return
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaStreamRef.current = stream
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    audioCtxRef.current = ctx
    const src = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 512
    src.connect(analyser)
    analyserRef.current = analyser
    const data = new Uint8Array(analyser.frequencyBinCount)
    const loop = () => {
      analyser.getByteTimeDomainData(data)
      // Compute RMS
      let sum = 0
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128
        sum += v * v
      }
      const rms = Math.sqrt(sum / data.length)
      const level = Math.min(1, rms * 4)
      onLevel && onLevel(level)
      rafRef.current = requestAnimationFrame(loop)
    }
    loop()
  }

  function stop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (audioCtxRef.current) audioCtxRef.current.close()
    audioCtxRef.current = null
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop())
      mediaStreamRef.current = null
    }
  }

  return { start, stop }
}


