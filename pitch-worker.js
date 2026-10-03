import { estimatePitch } from './pitch.js?v=speech-mic-2';
self.onmessage = ({data}) => self.postMessage(estimatePitch(new Float32Array(data.buffer), data.sampleRate, data.mode));
