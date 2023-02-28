import { createStory } from "@/src/server/openai";
import { sessionStore } from "@/src/server/recognition/session";
import { Session } from "@/src/server/recognition/session/types";
import { NextApiHandler } from "next";
import { bufferTime, lastValueFrom, map, take } from "rxjs";

const handleGet: NextApiHandler = async (req, res) => {
  const { sessionId } = req.query;
  const state = sessionStore.get(sessionId as string);
  if (!state) {
    res.status(404).end();
    return;
  }
  try {
    const text = await textFromStream(state);
    const result = await createStory(text);
    res.status(200).end(result);
  } catch (e) {
    res.status(500).end({ message: String(e) });
  }
};

const handler: NextApiHandler = async (req, res) => {
  switch (req.method?.toUpperCase()) {
    case "GET":
      await handleGet(req, res);
    default:
      res.status(405).end();
      return;
  }
};

async function textFromStream(state: Session) {
  return await lastValueFrom(
    state.textStream.pipe(
      bufferTime(0),
      take(1),
      map((x) => x.join("\n"))
    )
  );
}

export default handler;
