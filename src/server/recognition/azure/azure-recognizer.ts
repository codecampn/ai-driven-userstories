import { AudioConfig, AudioInputStream, AudioStreamFormat, SpeechConfig } from "microsoft-cognitiveservices-speech-sdk";
import { connectable, filter, finalize, map, tap } from "rxjs";
import type { VoiceRecognitionBackend } from "../voice-recognition-backend";
import { AzureSpeechTranscriberObservable } from "./observable-speech-transcriber";

export const AzureRecognizerBackend =
  (config: AzureSpeechConfig): VoiceRecognitionBackend =>
  (audioStream) => {
    console.log("Creating new push stream");
    const pushStream = AudioInputStream.createPushStream(createAudioFormat(config));
    const stream = AzureSpeechTranscriberObservable.fromConfig(
      config.azureConfig,
      AudioConfig.fromStreamInput(pushStream)
    );
    const connectStream = connectable(stream);
    connectStream.connect();
    audioStream
      .pipe(
        finalize(() => pushStream.close()),
        tap((buffer) => pushStream.write(buffer))
      )
      .subscribe();

    return connectStream.pipe(
      filter((recognized) => recognized.type === "recognized"),
      tap(console.log),
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
