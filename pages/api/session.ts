import { createWebMAzureBackend } from "@/src/audio";
import { AzureRecognizerBackend } from "@/src/recognition/azure/azure-recognizer";
import { createSpeechSession } from "@/src/recognition/session";
import { SpeechConfig } from "microsoft-cognitiveservices-speech-sdk";
import type { NextApiHandler } from "next";
import process from "node:process";
import { Duplex } from "node:stream";
import { defer, Subject } from "rxjs";
import { v4 } from "uuid";

const debug = false;

const speechConfig = SpeechConfig.fromSubscription(process.env.SUBSCRIPTION ?? "", "germanywestcentral");
speechConfig.speechRecognitionLanguage = "de-DE";

const azureBackend = AzureRecognizerBackend({ azureConfig: speechConfig, bitRate: 16, channels: 1, sampleRate: 16000 });

const handler: NextApiHandler = (req, res) => {
  if (req.method === "PUT") {
    const id = v4();
    const session = createSpeechSession({ azureBackend, transcodeBackend: createWebMAzureBackend() });
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
