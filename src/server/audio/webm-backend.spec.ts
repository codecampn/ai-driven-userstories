import fs from "node:fs";
import path from "node:path";
import { Writable } from "node:stream";
import { WebMBackend } from "./webm-backend";
describe("webm backend", () => {
  it("should convert webm to pcm", async () => {
    const backend = WebMBackend({
      channels: 1,
      frameSize: 60,
      rate: 16000,
    });
    const audio = fs.createReadStream(path.join(__dirname, "test", "clave.webm"));

    let peak = 0;
    const stream = backend.createStream(audio).pipe(
      new Writable({
        write(chunk: Buffer, _, next) {
          chunk.forEach((v) => {
            peak = Math.max(peak, v);
          });
          next();
        },
      })
    );

    await Promise.race([
      new Promise((res) => stream.on("finish", res)),
      new Promise((_res, rej) => stream.on("error", rej)),
    ]);

    expect(peak).toEqual(255);
  });

  it.only("should throw an error when converting a corrupt webm stream", async () => {
    const backend = WebMBackend({
      channels: 1,
      frameSize: 60,
      rate: 16000,
    });
    const audio = fs.createReadStream(path.join(__dirname, "test", "random.pcm"));

    await new Promise((res) => {
      backend
        .createStream(audio)
        .on("error", res)
        .pipe(
          new Writable({
            write(chunk: Buffer, _, next) {
              next();
            },
          })
        );
    });
  });
});
