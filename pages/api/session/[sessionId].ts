import sessionStore from "@/src/recognition/session";
import { NextApiHandler } from "next";
import { Readable, Writable } from "node:stream";

export const config = {
  api: {
    bodyParser: false,
  },
};
export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const convertAndWriteToStream = (stream: Readable, writable: Readable) => {
  stream.on("data", (data) => {
    console.log("push");
    writable.push(data);
  });
};

const handlePost: NextApiHandler = (req, res) => {
  const { sessionId } = req.query;
  const store = sessionStore.get(sessionId as string);
  if (!store) {
    res.status(404).end();
    return;
  }
  convertAndWriteToStream(req, store.stream);
  res.status(200).end();
};

const handleDelete: NextApiHandler = (req, res) => {
  const { sessionId } = req.query;
  const store = sessionStore.get(sessionId as string);
  if (!store) {
    res.status(204).end();
    return;
  }
  store.close();
  sessionStore.delete(sessionId as string);
  res.status(204).end();
};

const handleGet: NextApiHandler = async (req, res) => {
  const { sessionId } = req.query;

  const entry = sessionStore.get(sessionId as string);
  if (!entry) {
    res.status(404).end();
    return;
  }
  res.send(JSON.stringify(entry.textStream));
  res.status(200).end();
};

const handler: NextApiHandler = async (req, res) => {
  switch (req.method?.toUpperCase()) {
    case "GET":
      await handleGet(req, res);
    case "POST":
      return handlePost(req, res);
    case "DELETE":
      return handleDelete(req, res);
    default:
      res.status(405).end();
      return;
  }
};

export default handler;
