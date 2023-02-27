import { AudioBackend } from "@/src/server/audio/audio-backend";
import { shareReplay, Subject, takeUntil } from "rxjs";
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
    const bufferStream = transcodeBackend.createStream(transform);
    const transcoder = new Subject<Buffer>();
    bufferStream.on("data", (data) => {
      transcoder.next(data);
    });
    const closed = new Subject();
    const result = azureBackend(transcoder).pipe(takeUntil(closed), shareReplay());
    return {
      stream: transform,
      textStream: result,

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
