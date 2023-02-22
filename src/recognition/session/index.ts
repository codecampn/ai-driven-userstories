export { createSpeechSession } from "./session";
import { Session } from "./types";

export const sessionStore = new Map<string, Session>();
