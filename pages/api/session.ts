import { azureBackend, transcodeBackend } from "@/src/config";
import { createSpeechSession, sessionStore } from "@/src/server/recognition/session";
import type { NextApiHandler } from "next";
import { v4 } from "uuid";

const handler: NextApiHandler = (req, res) => {
  if (req.method === "PUT") {
    const id = v4();
    const session = createSpeechSession({ azureBackend, transcodeBackend });
    req.on("close", () => {
      console.log("Client aborted, closing session");
      session.close();
      sessionStore.delete(id);
    });
    sessionStore.set(id, session);
    res.status(201).send({ id: id });
    return;
  }
  res.status(405).end();
};

export default handler;
