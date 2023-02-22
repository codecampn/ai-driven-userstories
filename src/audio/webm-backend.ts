import { AudioBackend } from "./audio-backend";
import { Duplex, Readable, Writable } from "node:stream";

import prism from "prism-media";

const DEFAULT_DECODE_OPTIONS: DecodeOptions = {
  rate: 16000,
  channels: 1,
  frameSize: 960,
};

export interface DecodeOptions {
  rate: 8000 | 16000 | 44100 | 48000 | 96000;
  channels: number;
  frameSize: number;
}

/**
 * Opus based WebM Decoder.
 *
 * Takes a webm encoded audio stream and converts it to a PCM stream.
 */
export const WebMBackend = (decodeOptions: DecodeOptions = DEFAULT_DECODE_OPTIONS): AudioBackend => ({
  createStream(stream: Readable) {
    const result: Duplex = stream
      .pipe(new prism.opus.WebmDemuxer())
      .on("error", (e) => result.emit("error", e))
      .pipe(new prism.opus.Decoder(decodeOptions));
    return result;
  },
});
