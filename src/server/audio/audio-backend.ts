import type { Readable } from "node:stream";

export interface AudioBackend {
  createStream(stream: Readable): AudioConversionStream;
}

/**
 * A stream that converts an input audio format to an OutputFormat;
 */
export type AudioConversionStream = Readable;
