import { Observable } from "rxjs";

export type VoiceRecognitionBackend = (
  audioStream: Observable<PcmBuffer>
) => Observable<RecognizedAudio>;

export type RecognizedAudio = string;
export type PcmBuffer = Buffer;
