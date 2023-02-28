import { config } from "dotenv";
import getEnv from "env-var";
import { SpeechConfig } from "microsoft-cognitiveservices-speech-sdk";
import { Configuration } from "openai";
import { createWebMAzureBackend } from "./server/audio";
import { AzureRecognizerBackend } from "./server/recognition/azure/azure-recognizer";

config();

const SPEECH_SDK_KEY = getEnv.get("AZURE_SPEECH_SDK_KEY").required().asString();
const SPEECH_SDK_REGION = getEnv.get("AZURE_SPEECH_SDK_REGION").required().asString();
const SPEECH_SDK_LANGUAGE = getEnv.get("AZURE_SPEECH_SDK_LANGUAGE").default("en-US").asString();
const OPENAI_KEY = getEnv.get("OPENAI_KEY").required().asString();
const OPENAI_PROMPT = getEnv.get("OPENAI_PROMPT").required().asString();

const speechConfig = SpeechConfig.fromSubscription(SPEECH_SDK_KEY, SPEECH_SDK_REGION);
speechConfig.speechRecognitionLanguage = SPEECH_SDK_LANGUAGE;

export const openAiPrompt = OPENAI_PROMPT;
export const transcodeBackend = createWebMAzureBackend();
export const azureBackend = AzureRecognizerBackend({
  azureConfig: speechConfig,
  bitRate: 16,
  channels: 1,
  sampleRate: 16000,
});

export const openAIConfiguration = new Configuration({
  apiKey: OPENAI_KEY,
});
