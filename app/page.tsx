"use client";
import { StoryDisplay } from "@/src/components/stream/StoryDisplay";
import { TextDisplay } from "@/src/components/stream/TextDisplay";
import { AudioRecorder } from "@/src/components/webaudio/AudioRecorder";
import { useState } from "react";

export default function Home() {
  const [record, setRecord] = useState(false);
  const [session, setSession] = useState<string>();
  const [summaryRequest, setSummary] = useState(false);

  const renderRecordBox = (
    <div className="my-5 flex justify-center relative -right-10  z-index-10">
      <div className="block p-6 rounded-lg shadow-lg bg-white max-w-lg text-center">
        <h5 className="text-gray-900 text-xl leading-tight font-medium mb-2">
          Press Record to capture your current conversation.
        </h5>
        <p className="text-gray-700 text-base mb-4">Your discussion will be submitted to Microsoft Azure.</p>
        {record || (
          <button
            type="button"
            onClick={() => setRecord(true)}
            className=" inline-block px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out"
          >
            Start Recording
          </button>
        )}
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
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen flex-row">
      <div className="flex-1 flex bg-gray-100 items-center justify-end ">{renderRecordBox}</div>

      <div className="basis-3/4 bg-gradient-to-r from-cyan-900 to-sky-900 border-r flex-col">
        <div className="my-5 flex justify-center">
          <AudioRecorder recording={record} onSessionChange={(sessionId) => setSession(sessionId)}></AudioRecorder>
          {session && (record || summaryRequest) && <TextDisplay key={"display"} sessionId={session}></TextDisplay>}
        </div>
        {session && summaryRequest && (
          <div className="flex my-6 justify-center min-h-50">
            <div className="block p-6 rounded-lg shadow-lg bg-white max-w-lg text">
              <h4 className="m-auto">Generating Story</h4>
              <StoryDisplay sessionId={session}></StoryDisplay>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
