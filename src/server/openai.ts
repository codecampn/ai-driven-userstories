import { logger } from "@/src/logger";
import axios from "axios";
import { OpenAIApi } from "openai";
import { openAIConfiguration, openAiPrompt } from "../config";

export const createStory = async (query: string): Promise<string> => {
  const openai = new OpenAIApi(openAIConfiguration);
  try {
    const result = await openai.createCompletion({
      model: "text-davinci-003",
      max_tokens: 2048,
      temperature: 0.4,
      prompt: `${openAiPrompt} ${query}`,
    });

    return result.data.choices[0].text ?? "";
  } catch (e) {
    if (axios.isAxiosError(e)) {
      logger.error({ error: e.response?.data }, "Could not query openai");
      throw Error(e.response?.data);
    }
    logger.error({ error: String(e) }, "Could not query openai");
    throw e;
  }
};
