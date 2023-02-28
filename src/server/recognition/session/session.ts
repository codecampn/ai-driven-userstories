import { logger } from "@/src/logger";
import { AudioBackend } from "@/src/server/audio/audio-backend";
import { debounceTime, shareReplay, Subject, take, takeUntil } from "rxjs";
import { Duplex } from "stream";
import { VoiceRecognitionBackend } from "../voice-recognition-backend";
import { Session } from "./types";

const timeout = 30000;
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

    transcoder.pipe(debounceTime(timeout), take(1)).subscribe(() => {
      logger.warn({ timeout }, "No audio received for, closing session");
      closed.next(true);
      bufferStream.destroy();
      transcoder.complete();

      logger.warn("Session closed, closing session");
    });
    const result = azureBackend(transcoder).pipe(takeUntil(closed), shareReplay());
    return {
      stream: transform,
      textStream: result,

      close: () => {
        closed.next(null);
        transcoder.complete();
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
