import { estimatePitch } from './pitch.js?v=desk-mic-1';
self.onmessage = ({data}) => self.postMessage(estimatePitch(new Float32Array(data.buffer), data.sampleRate, data.mode));
