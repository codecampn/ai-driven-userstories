import { PassthrougBackend } from "@/src/server/audio/passthrough-backend";
import { sessionStore } from "@/src/server/recognition/session";
import http, { IncomingMessage, ServerResponse } from "http";
import { apiResolver } from "next/dist/server/api-utils/node";
import { map, Observable } from "rxjs";
import request from "supertest";
import "./session";
import handler from "./session";

jest.mock("@/src/config", () => ({
  azureBackend: (audioStream: Observable<Buffer>) => audioStream.pipe(map((x) => x.toString("utf-8"))),
  transcodeBackend: PassthrougBackend(),
}));

const requestListener = (req: IncomingMessage, res: ServerResponse) => {
  apiResolver(
    req,
    res,
    undefined,
    handler,
    { previewModeEncryptionKey: " ", previewModeId: "", previewModeSigningKey: " " },
    false,
    true
  );
};
describe("/session endpoint", () => {
  let server: ReturnType<typeof http["createServer"]>;

  beforeEach(() => {
    server = http.createServer(requestListener);
  });

  afterEach(() => {
    server.closeAllConnections();
    server.close();
    sessionStore.clear();
  });

  it("should create a new session with a conversion stream and a textStream", async () => {
    const agent = await request.agent(server).put("/").expect(201);

    const { id } = JSON.parse(agent.text);
    expect(sessionStore.size).toEqual(1);
    expect(sessionStore.get(id)).toBeDefined();
  });

  it("should return method not allowed on get", async () => {
    await request.agent(server).get("/").expect(405);
  });
});
