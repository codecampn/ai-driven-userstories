import { AudioBackend } from "@/src/audio/audio-backend";
import { defer, shareReplay, Subject, takeUntil } from "rxjs";
import { Duplex } from "stream";
import { VoiceRecognitionBackend } from "../voice-recognition-backend";
import { Session } from "./types";

export const createSpeechSession = ({ transcodeBackend, azureBackend }: SessionConfig): Session => {
  try {
    const transform = new Duplex({
      read() {},
      write() {},
    });

    if (!transform) {
      throw "Could not create stream";
    }
    const transcoder = defer(() => {
      const bufferStream = transcodeBackend.createStream(transform);
      const result = new Subject<Buffer>();
      bufferStream.on("data", (data) => result.next(data));
      return result;
    });

    const closed = new Subject();
    return {
      stream: transform,
      textStream: azureBackend(transcoder).pipe(takeUntil(closed), shareReplay()),
      close: () => {
        closed.next(null);
        transform.destroy();
      },
    };
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export interface SessionConfig {
  transcodeBackend: AudioBackend;
  azureBackend: VoiceRecognitionBackend;
}
