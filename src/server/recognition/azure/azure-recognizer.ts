import { logger } from "@/src/logger";
import { AudioConfig, AudioInputStream, AudioStreamFormat, SpeechConfig } from "microsoft-cognitiveservices-speech-sdk";
import { filter, finalize, map, tap } from "rxjs";
import type { VoiceRecognitionBackend } from "../voice-recognition-backend";
import { AzureSpeechTranscriberObservable } from "./observable-speech-transcriber";

export const AzureRecognizerBackend =
  (config: AzureSpeechConfig): VoiceRecognitionBackend =>
  (audioStream) => {
    logger.debug("Creating new audio stream");
    const pushStream = AudioInputStream.createPushStream(createAudioFormat(config));
    const stream = AzureSpeechTranscriberObservable.fromConfig(
      config.azureConfig,
      AudioConfig.fromStreamInput(pushStream)
    );
    audioStream
      .pipe(
        finalize(() => {
          logger.info("Closing audio stream");
          pushStream.close();
        }),
        tap((buffer) => pushStream.write(buffer))
      )
      .subscribe();

    return stream.pipe(
      filter((recognized) => recognized.type === "recognized"),
      finalize(() => logger.info("Closed audio stream")),
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
