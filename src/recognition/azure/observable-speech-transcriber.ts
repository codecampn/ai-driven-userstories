import {
  AudioConfig,
  CancellationReason,
  SpeechConfig,
  SpeechRecognizer,
} from "microsoft-cognitiveservices-speech-sdk";
import { defer, finalize, merge, Observable, Subject } from "rxjs";

/**
 * An observable wrapping azures Recognizer service and allowing to subscribe to changes.
 *
 */
export const AzureSpeechTranscriberObservable = {
  fromRecognizer(recognizer: RecognizerImpl): RecognizerObservable {
    return defer(() => {
      recognizer.startContinuousRecognitionAsync();
      const recognitionStream = new Subject<RecognitionPayload>();
      const recognizingStream = new Subject<RecognitionPayload>();
      recognizer.recognized = (_sender, event) => {
        recognitionStream.next({ type: "recognized", recognized: event.result.text });
      };
      recognizer.recognizing = (_sender, event) => {
        recognizingStream.next({ type: "recognizing", recognized: event.result.text });
      };
      recognizer.canceled = (_sender, event) => {
        if (event.reason === CancellationReason.Error) {
          recognitionStream.error({ message: event.errorDetails, details: event });
        }
        recognitionStream.complete();
        recognizingStream.complete();
      };

      recognizer.sessionStopped = (_sender, event) => {
        recognitionStream.complete();
        recognizingStream.complete();
      };

      return merge(recognitionStream, recognizingStream).pipe(
        finalize(() => recognizer.stopContinuousRecognitionAsync())
      );
    });
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
