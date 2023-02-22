import sessionStore from "@/src/recognition/session/session";
import { NextApiHandler } from "next";
import { Configuration, OpenAIApi } from "openai";
import axios from "axios";
import process from "node:process";

const configuration = new Configuration({
  apiKey: process.env.OPENAPI_KEY,
});
const openai = new OpenAIApi(configuration);

const handleGet: NextApiHandler = async (req, res) => {
  const { sessionId } = req.query;
  const state = sessionStore.get(sessionId as string);

  if (!state) {
    res.status(404).end();
    return;
  }
  try {
    const result = await openai.createCompletion({
      model: "text-davinci-003",
      max_tokens: 3000,
      temperature: 0.4,
      prompt: `Create a scrum user story (in german) from the following requirements with a story, requirements and acceptance criteria: ${state.textStream.join()}`,
    });

    res.send(result.data.choices[0].text);
    res.status(200).end();
  } catch (e) {
    if (axios.isAxiosError(e)) {
      console.error(e.response?.data);
      res.send({ error: e.response?.data });
    }
    res.status(500).end();
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

export default handler;
