"use client";
import { StoryDisplay } from "@/src/stream/StoryDisplay";
import { TextDisplay } from "@/src/stream/TextDisplay";
import { AudioRecorder } from "@/src/webrtc/AudioRecorder";
import { Inter } from "@next/font/google";
import { useState } from "react";
import styles from "./page.module.css";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [record, setRecord] = useState(false);
  const [session, setSession] = useState<string>();
  const [summaryRequest, setSummary] = useState(false);

  return (
    <main>
      <div className="my-5 flex justify-center">
        <div className="block p-6 rounded-lg shadow-lg bg-white max-w-lg text-center">
          <h5 className="text-gray-900 text-xl leading-tight font-medium mb-2">
            Press Record to capture your current conversation.
          </h5>
          <p className="text-gray-700 text-base mb-4">
            Your discussion will be submitted to Microsoft Azure.
          </p>
          {record || (
            <button
              type="button"
              onClick={() => setRecord(true)}
              className=" inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out"
            >
              Start Recording
            </button>
          )}
          <AudioRecorder
            recording={record}
            onSessionChange={(sessionId) => setSession(sessionId)}
          ></AudioRecorder>
          {session && record && (
            <button
              type="button"
              onClick={() => {
                setRecord(false);
                setSummary(true);
              }}
              className=" inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out"
            >
              Create a story
            </button>
          )}

          {session && record && <TextDisplay sessionId={session}></TextDisplay>}
          {session && summaryRequest && (
            <TextDisplay sessionId={session}></TextDisplay>
          )}
        </div>
      </div>
      <div className="my-5 flex justify-center">
        {session && summaryRequest && (
          <div className="flex my-6">
            <div className="block p-6 rounded-lg shadow-lg bg-white max-w-lg text-left">
              <h4>Your Story</h4>
              <StoryDisplay sessionId={session}></StoryDisplay>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
