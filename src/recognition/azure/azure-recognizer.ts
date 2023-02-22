import { AudioConfig, AudioInputStream, AudioStreamFormat, SpeechConfig } from "microsoft-cognitiveservices-speech-sdk";
import { EMPTY, filter, finalize, map, merge, mergeMap, tap } from "rxjs";
import type { VoiceRecognitionBackend } from "../voice-recognition-backend";
import { AzureSpeechTranscriberObservable } from "./observable-speech-transcriber";

export const AzureRecognizerBackend =
  (config: AzureSpeechConfig): VoiceRecognitionBackend =>
  (audioStream) => {
    const pushStream = AudioInputStream.createPushStream(createAudioFormat(config));

    return audioStream.pipe(
      finalize(() => pushStream.close()),
      tap((buffer) => pushStream.write(buffer)),
      mergeMap(() =>
        AzureSpeechTranscriberObservable.fromConfig(config.azureConfig, AudioConfig.fromStreamInput(pushStream))
      ),
      filter((recognized) => recognized.type === "recognizing"),
      map((recognized) => recognized.recognized)
    );
  };

const createAudioFormat = (config: AzureSpeechConfig) =>
  AudioStreamFormat.getWaveFormatPCM(config.sampleRate, config.bitRate, config.channels);

export interface AzureSpeechConfig {
  sampleRate: 8000 | 16000 | 44100 | 48000;
  bitRate: 16;
  channels: 1 | 2;
  azureConfig: SpeechConfig;
}
