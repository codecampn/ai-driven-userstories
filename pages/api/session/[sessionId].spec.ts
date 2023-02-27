import { PassthrougBackend } from "@/src/server/audio/passthrough-backend";
import { azureBackend, transcodeBackend } from "@/src/config";
import { createSpeechSession, sessionStore } from "@/src/server/recognition/session";
import EventSource from "eventsource";
import http, { IncomingMessage, ServerResponse } from "http";
import { AddressInfo } from "net";
import { NextApiRequest, NextApiResponse } from "next";
import { apiResolver } from "next/dist/server/api-utils/node";
import { map, Observable, shareReplay, tap } from "rxjs";
import request from "supertest";
import { v4 } from "uuid";
import handler from "./[sessionId]";

jest.mock("@/src/config", () => ({
  azureBackend: (audioStream: Observable<Buffer>) => audioStream.pipe(map((x) => x.toString("utf-8"))),
  transcodeBackend: PassthrougBackend(),
}));
const resolver = (req: NextApiRequest, res: NextApiResponse) => {
  req.query = { sessionId: req.url?.toString().split("/")[1] };
  return handler(req, res);
};
resolver.config = { api: { bodyParser: false } };

const requestListener = (req: IncomingMessage, res: ServerResponse) => {
  apiResolver(
    req,
    res,
    undefined,
    resolver,
    { previewModeEncryptionKey: " ", previewModeId: "", previewModeSigningKey: " " },
    false,
    true
  );
};
describe("/session endpoint", () => {
  let server: ReturnType<typeof http["createServer"]>;
  let sessionId = v4();

  beforeEach(() => {
    server = http.createServer(requestListener);
  });

  afterEach(() => {
    server.closeAllConnections();
    server.close();
    sessionStore.clear();
  });

  it("should delete existing sessions on delete", async () => {
    const session = createSpeechSession({ azureBackend, transcodeBackend });
    sessionStore.set(sessionId, session);

    await request
      .agent(server)
      .delete("/" + sessionId)
      .expect(204);

    expect(sessionStore.size).toEqual(0);
  });

  it("should push the provided binary data to a stream on push", async () => {
    const session = createSpeechSession({ azureBackend, transcodeBackend });
    const textStream = jest.fn();

    sessionStore.set(sessionId, session);
    session.textStream.subscribe(textStream);

    await request
      .agent(server)
      .post("/" + sessionId)
      .send(Buffer.from("Test Data", "utf-8"))
      .expect(200);

    expect(textStream).toHaveBeenCalledTimes(1);
    expect(textStream).toBeCalledWith("Test Data");
  });

  it("should return the current state on get", async () => {
    const session = createSpeechSession({ azureBackend, transcodeBackend });
    server.listen();
    sessionStore.set(sessionId, session);
    const agent = request.agent(server);
    session.textStream.subscribe();
    await agent
      .post("/" + sessionId)
      .send(Buffer.from("Test Data", "utf-8"))
      .expect(200);
    const source = new EventSource(`http://127.0.0.1:${(server.address() as AddressInfo).port}/${sessionId}`);
    const result = await new Promise((resolve, reject) => {
      source.addEventListener("error", (err) => {
        reject(err);
      });
      source.addEventListener("message", (msg) => {
        resolve(JSON.parse(msg.data));
      });
    });

    source.close();
    expect(result).toEqual("Test Data");
  });
});
