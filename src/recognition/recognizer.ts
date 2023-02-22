import {
  AudioConfig,
  AudioInputStream,
  AudioStreamFormat,
  CancellationReason,
  PushAudioInputStream,
  ResultReason,
  SpeechConfig,
  SpeechRecognizer,
} from "microsoft-cognitiveservices-speech-sdk";

const speechConfig = SpeechConfig.fromSubscription(
  "1e52bb7574cd46d08ba3ebf3cfdafb8e",
  "germanywestcentral"
);

speechConfig.speechRecognitionLanguage = "de-DE";
let closeLastSession: (() => void) | undefined = undefined;

export function setupRecognizer(
  register: (stream: PushAudioInputStream) => void,
  onTextRecognized: (text: string) => void
): () => void {
  if (closeLastSession) {
    closeLastSession();
  }
  const pushStream = AudioInputStream.createPushStream(
    AudioStreamFormat.getWaveFormatPCM(16000, 16, 1)
  );

  register(pushStream);
  const audioConfig = AudioConfig.fromStreamInput(pushStream);
  const recognizer = new SpeechRecognizer(speechConfig, audioConfig);

  recognizer.recognizing = (s, e) => {
    console.log(`RECOGNIZING: Text=${e.result.text}`);
  };

  recognizer.recognized = (s, e) => {
    if (e.result.reason == ResultReason.RecognizedSpeech) {
      console.log(`RECOGNIZED: Text=${e.result.text}`);
      onTextRecognized(e.result.text);
    } else if (e.result.reason == ResultReason.NoMatch) {
      console.log("NOMATCH: Speech could not be recognized.");
    }
  };

  recognizer.canceled = (s, e) => {
    console.log(`CANCELED: Reason=${e.reason}`);

    if (e.reason == CancellationReason.Error) {
      console.log(`"CANCELED: ErrorCode=${e.errorCode}`);
      console.log(`"CANCELED: ErrorDetails=${e.errorDetails}`);
      console.log(
        "CANCELED: Did you set the speech resource key and region values?"
      );
    }

    recognizer.stopContinuousRecognitionAsync();
  };

  recognizer.sessionStopped = (s, e) => {
    console.log("\n    Session stopped event.");
    recognizer.stopContinuousRecognitionAsync();
  };
  recognizer.startContinuousRecognitionAsync();
  closeLastSession = () => recognizer.stopContinuousRecognitionAsync();
  return () => {
    recognizer.stopContinuousRecognitionAsync();
    pushStream.close();
  };
}
