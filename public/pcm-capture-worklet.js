// AudioWorklet processor that downsamples the mic's native rate (typically
// 48000Hz) to a target rate and posts each block as raw 16-bit PCM — the same
// format the agent-test WebSocket's BrowserFrameSerializer expects
// (see app/services/browser_ws_serializer.py). Runs on the audio rendering
// thread, not the main thread, so it doesn't stall on React re-renders.
//
// Target rate is 16000 (cascaded mode) by default, or 24000 when testing
// OpenAI Realtime (the only rate its PCM audio format accepts) — passed in
// via processorOptions since that's the only way to configure an
// AudioWorkletProcessor at construction time.
// Audio is accumulated into CHUNK_MS-long messages rather than posted once per
// render quantum. process() runs every 128 input samples — 2.67ms at a 48kHz
// mic — so posting per call put ~375 WebSocket messages/second on the wire,
// and the server turns every one into its own InputAudioRawFrame that walks
// all ~15 pipeline processors (measured live: the turn detector, which sits
// near the end of that chain, fell up to 4 seconds behind the STT service
// mid-call, and the cached greeting took 7-11s to start playing because its
// frames queued behind that backlog). 20ms matches what a real Telnyx media
// stream sends, cutting the frame rate 7.5x to 50/second.
const CHUNK_MS = 20;

class PCMCaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this._targetRate = options?.processorOptions?.targetRate || 16000;
    this._ratio = sampleRate / this._targetRate;
    this._acc = 0;
    this._chunkSamples = Math.round((this._targetRate * CHUNK_MS) / 1000);
    this._pending = new Int16Array(this._chunkSamples);
    this._pendingLen = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const channel = input[0];
      for (let i = 0; i < channel.length; i++) {
        this._acc += 1;
        if (this._acc >= this._ratio) {
          this._acc -= this._ratio;
          const s = Math.max(-1, Math.min(1, channel[i]));
          this._pending[this._pendingLen++] = s < 0 ? s * 0x8000 : s * 0x7fff;
          if (this._pendingLen === this._chunkSamples) {
            // postMessage transfers (detaches) the buffer, so the next chunk
            // needs a fresh one rather than reusing this array.
            this.port.postMessage(this._pending.buffer, [this._pending.buffer]);
            this._pending = new Int16Array(this._chunkSamples);
            this._pendingLen = 0;
          }
        }
      }
    }
    return true;
  }
}

registerProcessor('pcm-capture-worklet', PCMCaptureProcessor);
