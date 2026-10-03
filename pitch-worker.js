import { estimatePitch } from './pitch.js';
self.onmessage = ({data}) => self.postMessage(estimatePitch(new Float32Array(data.buffer), data.sampleRate));
