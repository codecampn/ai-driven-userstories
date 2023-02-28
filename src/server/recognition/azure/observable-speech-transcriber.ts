import { logger } from "@/src/logger";
import {
  AudioConfig,
  CancellationReason,
  SpeechConfig,
  SpeechRecognizer,
} from "microsoft-cognitiveservices-speech-sdk";
import { finalize, merge, Observable, Subject } from "rxjs";

/**
 * An observable wrapping azures Recognizer service and allowing to subscribe to changes.
 *
 */
export const AzureSpeechTranscriberObservable = {
  fromRecognizer(recognizer: RecognizerImpl): RecognizerObservable {
    recognizer.startContinuousRecognitionAsync();
    const recognitionStream = new Subject<RecognitionPayload>();
    const recognizingStream = new Subject<RecognitionPayload>();
    recognizer.recognized = (_sender, event) => {
      logger.debug({ event }, "Recognized");
      recognitionStream.next({ type: "recognized", recognized: event.result.text });
    };
    recognizer.recognizing = (_sender, event) => {
      logger.debug({ event }, "Recognizing");
      recognizingStream.next({ type: "recognizing", recognized: event.result.text });
    };
    recognizer.canceled = (_sender, event) => {
      logger.info(
        { reason: event.reason, message: event.errorDetails, code: event.errorCode },
        "Cancelled",
        event.reason
      );
      if (event.reason === CancellationReason.Error) {
        recognitionStream.error({ message: event.errorDetails, details: event });
      }
      recognitionStream.complete();
      recognizingStream.complete();
    };

    recognizer.sessionStopped = (_sender, event) => {
      console.log("Session stopped");
      recognitionStream.complete();
      recognizingStream.complete();
    };

    return merge(recognitionStream, recognizingStream).pipe(
      finalize(() => recognizer.stopContinuousRecognitionAsync())
    );
  },

  fromConfig(speechConfig: SpeechConfig, audioConfig: AudioConfig): RecognizerObservable {
    return AzureSpeechTranscriberObservable.fromRecognizer(new SpeechRecognizer(speechConfig, audioConfig));
  },
};

export type RecognizerObservable = Observable<RecognitionPayload>;
export type RecognitionPayload = { recognized: string; type: "recognized" | "recognizing" };
export type RecognizerImpl = Pick<
  SpeechRecognizer,
  | "startContinuousRecognitionAsync"
  | "stopContinuousRecognitionAsync"
  | "recognized"
  | "recognizing"
  | "canceled"
  | "sessionStopped"
>;
