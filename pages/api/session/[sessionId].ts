import { sessionStore } from "@/src/server/recognition/session";
import { NextApiHandler, NextConfig } from "next";
import { Readable } from "node:stream";

export const config = {
  api: {
    bodyParser: false,
  },
};
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const convertAndWriteToStream = (stream: Readable, writable: Readable) => {
  stream.on("data", (data) => {
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
  res.status(200);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", "text/event-stream;charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  await new Promise((done, err) => {
    entry.textStream.subscribe({
      next: (text) => {
        res.write(`data: ${JSON.stringify(text)}\n\n`);
      },
      complete: () => {
        console.log("done");
        done(null);
      },
      error: (error) => {
        console.log("error");
        err(error);
      },
    });
  });
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
