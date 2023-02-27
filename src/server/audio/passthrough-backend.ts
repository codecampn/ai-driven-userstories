import { Readable } from "stream";
import { AudioBackend } from "./audio-backend";

export const PassthrougBackend = (): AudioBackend => ({
  createStream(stream: Readable) {
    return stream;
  },
});
