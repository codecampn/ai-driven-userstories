import { WebMBackend } from "./webm-backend";

export const createWebMAzureBackend = () =>
  WebMBackend({ channels: 1, frameSize: 960, rate: 16000 });
