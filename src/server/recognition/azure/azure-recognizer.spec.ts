import { AudioInputStream, PushAudioInputStream, SpeechConfig } from "microsoft-cognitiveservices-speech-sdk";
import { Subject } from "rxjs";
import type { PcmBuffer } from "../voice-recognition-backend";
import { AzureRecognizerBackend } from "./azure-recognizer";

jest.mock("microsoft-cognitiveservices-speech-sdk");

describe("Azure voice recognizer", () => {
  const backend = AzureRecognizerBackend({
    bitRate: 16,
    channels: 1,
    azureConfig: SpeechConfig.fromSubscription("123", "123"),
    sampleRate: 16000,
  });

  let audioBufferStream = new Subject<PcmBuffer>();
  let audioBuffer = Buffer.from("PCM Data");
  let mockPushAudioStream: PushAudioInputStream = jest.mocked({
    write: jest.fn(),
    close: jest.fn(),
  });

  beforeEach(() => {
    audioBufferStream = new Subject<PcmBuffer>();
    audioBuffer = Buffer.from("PCM Data");
    mockPushAudioStream = jest.mocked({
      write: jest.fn(),
      close: jest.fn(),
    });
    AudioInputStream.createPushStream = jest.fn(() => mockPushAudioStream);
  });

  it("should subscribe to the provided observable and push the audio to azure", () => {
    backend(audioBufferStream).subscribe();

    audioBufferStream.next(audioBuffer);

    expect(AudioInputStream.createPushStream).toHaveBeenCalled();
    expect(mockPushAudioStream.write).toHaveBeenCalledWith(audioBuffer);
  });

  it("should close the stream once the observable is closed", () => {
    backend(audioBufferStream).subscribe();

    audioBufferStream.next(audioBuffer);
    audioBufferStream.complete();

    expect(mockPushAudioStream.close).toHaveBeenCalledTimes(1);
  });
});
