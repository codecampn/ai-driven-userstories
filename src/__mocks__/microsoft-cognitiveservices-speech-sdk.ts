const originalModule = jest.requireActual("microsoft-cognitiveservices-speech-sdk");

export const AudioInputStream = {
  createPushStream: jest.fn(),
};

export const AudioStreamFormat = {
  getWaveFormatPCM: jest.fn(),
};

export const AudioConfig = {
  fromStreamInput: jest.fn(),
};

export const SpeechRecognitionEventArgs = originalModule.SpeechRecognitionEventArgs;
export const SpeechRecognitionResult = originalModule.SpeechRecognitionResult;
export const SpeechRecognitionCanceledEventArgs = originalModule.SpeechRecognitionCanceledEventArgs;
export const CancellationReason = originalModule.CancellationReason;
export const CancellationErrorCode = originalModule.CancellationErrorCode;
export const SessionEventArgs = originalModule.SessionEventArgs;
export const ResultReason = originalModule.ResultReason;
export const SpeechConfig = originalModule.SpeechConfig;

let speechRecognizerInstances: SpeechRecognizer[] = [];

export const getSpeecRecognizers = () => {
  return speechRecognizerInstances;
};

export class SpeechRecognizer {
  recognizing = jest.fn();
  recognized = jest.fn();
  canceled = jest.fn();
  sessionStopped = jest.fn();

  startContinuousRecognitionAsync = jest.fn();
  stopContinuousRecognitionAsync = jest.fn();
}

afterEach(() => {
  speechRecognizerInstances = [];
});
