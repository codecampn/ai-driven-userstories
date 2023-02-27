import { randomUUID } from "crypto";
import {
  CancellationErrorCode,
  CancellationReason,
  Recognizer,
  ResultReason,
  SessionEventArgs,
  SpeechRecognitionCanceledEventArgs,
  SpeechRecognitionEventArgs,
  SpeechRecognitionResult,
} from "microsoft-cognitiveservices-speech-sdk";
import { map, Subject, takeUntil, tap } from "rxjs";
import { AzureSpeechTranscriberObservable, RecognizerImpl } from "./observable-speech-transcriber";

const testDone = new Subject();

class MockRecognizer implements RecognizerImpl {
  mockRecognition = new Subject<string>();
  mockRecognizing = new Subject<string>();
  mockCancel = new Subject<SpeechRecognitionCanceledEventArgs>();
  mockStopped = new Subject();

  stopContinuousRecognitionAsync = jest.fn();
  startContinuousRecognitionAsync = jest.fn();

  constructor() {
    this.mockRecognition
      .pipe(
        takeUntil(testDone),
        map(
          (text) =>
            new SpeechRecognitionEventArgs(
              new SpeechRecognitionResult(randomUUID(), ResultReason.RecognizedSpeech, text)
            )
        ),
        tap((result) => this.recognized(this as unknown as Recognizer, result))
      )
      .subscribe();

    this.mockRecognizing
      .pipe(
        takeUntil(testDone),
        map(
          (text) =>
            new SpeechRecognitionEventArgs(
              new SpeechRecognitionResult(randomUUID(), ResultReason.RecognizingSpeech, text)
            )
        ),
        tap((result) => this.recognizing(this as unknown as Recognizer, result))
      )
      .subscribe();

    this.mockCancel
      .pipe(
        takeUntil(testDone),
        tap((result) => this.canceled(this as unknown as Recognizer, result))
      )
      .subscribe();

    this.mockStopped
      .pipe(
        takeUntil(testDone),
        tap(() => this.sessionStopped(this as unknown as Recognizer, new SessionEventArgs("")))
      )
      .subscribe();
  }
  sessionStopped: (sender: Recognizer, event: SessionEventArgs) => void = jest.fn();
  canceled: (sender: Recognizer, event: SpeechRecognitionCanceledEventArgs) => void = jest.fn();
  recognizing: (sender: Recognizer, event: SpeechRecognitionEventArgs) => void = jest.fn();
  recognized: (sender: Recognizer, event: SpeechRecognitionEventArgs) => void = jest.fn();
}

describe("Observable speech recognizer", () => {
  afterEach(() => {
    testDone.next(null);
  });

  it("should asynchronously listen to transcriptions when subscribing", () => {
    const recognizer = new MockRecognizer();

    const observable = AzureSpeechTranscriberObservable.fromRecognizer(recognizer);

    observable.pipe(takeUntil(testDone)).subscribe();
    expect(recognizer.startContinuousRecognitionAsync).toHaveBeenCalledTimes(1);
    expect(recognizer.stopContinuousRecognitionAsync).toHaveBeenCalledTimes(0);
  });

  it("should stop to listen to transcriptions when unsubscribing", () => {
    const recognizer = new MockRecognizer();
    const observable = AzureSpeechTranscriberObservable.fromRecognizer(recognizer);

    const subscription = observable.pipe(takeUntil(testDone)).subscribe();
    subscription.unsubscribe();

    expect(recognizer.stopContinuousRecognitionAsync).toHaveBeenCalledTimes(1);
  });

  it("should stop to listen to transcriptions when closing", () => {
    const recognizer = new MockRecognizer();
    const observable = AzureSpeechTranscriberObservable.fromRecognizer(recognizer);

    observable.pipe(takeUntil(testDone)).subscribe();
    recognizer.mockCancel.next(
      new SpeechRecognitionCanceledEventArgs(CancellationReason.EndOfStream, "eof", CancellationErrorCode.NoError)
    );

    expect(recognizer.stopContinuousRecognitionAsync).toHaveBeenCalledTimes(1);
  });

  it("should emit recognized text fragments", () => {
    const recognizer = new MockRecognizer();
    const observable = AzureSpeechTranscriberObservable.fromRecognizer(recognizer);
    const recognitionCalls = jest.fn();

    observable.pipe(takeUntil(testDone)).subscribe(recognitionCalls);
    recognizer.mockRecognition.next("Hello World");

    expect(recognitionCalls).toHaveBeenCalledTimes(1);
    expect(recognitionCalls).toBeCalledWith({ type: "recognized", recognized: "Hello World" });
  });

  it("should emit recognizing text fragments", () => {
    const recognizer = new MockRecognizer();
    const observable = AzureSpeechTranscriberObservable.fromRecognizer(recognizer);
    const recognitionCalls = jest.fn();

    observable.pipe(takeUntil(testDone)).subscribe(recognitionCalls);
    recognizer.mockRecognizing.next("Hello World");

    expect(recognitionCalls).toHaveBeenCalledTimes(1);
    expect(recognitionCalls).toBeCalledWith({ type: "recognizing", recognized: "Hello World" });
  });

  it("should emit error when the recognition fails", () => {
    const recognizer = new MockRecognizer();
    const observable = AzureSpeechTranscriberObservable.fromRecognizer(recognizer);
    const recognitionCalls = jest.fn();
    const errorCalls = jest.fn();
    const error = new SpeechRecognitionCanceledEventArgs(
      CancellationReason.Error,
      "an error occured",
      CancellationErrorCode.ConnectionFailure
    );

    observable.pipe(takeUntil(testDone)).subscribe({ next: recognitionCalls, error: errorCalls });
    recognizer.mockCancel.next(error);

    expect(errorCalls).toHaveBeenCalledTimes(1);
    expect(errorCalls).toBeCalledWith({ message: "an error occured", details: error });
  });
});
