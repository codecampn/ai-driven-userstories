"use client";

import { useEffect, useState } from "react";
import { SocketStream } from "../stream/SocketStream";

export const AudioRecorder = (props: AudioRecorderProps) => {
  const [audioState, setAudioState] = useState<AudioRecorderState>({
    state: "init",
  });

  useEffect(() => {
    (async () => {
      if (!props.recording) {
        return;
      }
      setAudioState({ state: "pending" });
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      setAudioState({ state: "ready", stream });
    })();
  }, [props.recording]);

  if (!props.recording) {
    return <></>;
  }
  if (audioState.state === "init" && !audioState.stream) {
    return <div>Waiting for audio confirmation</div>;
  }

  return (
    <div className="flex justify-center">
      <span className="animate-pulse rounded-full bg-red-500 h-10 w-10"></span>
      <SocketStream
        onSession={(sessionId) => props.onSessionChange(sessionId)}
        stream={audioState.stream}
      ></SocketStream>
    </div>
  );
};

interface AudioRecorderProps {
  recording: boolean;
  onSessionChange: (sessionId: string) => void;
}

interface AudioRecorderState {
  state: "init" | "pending" | "ready" | "error";
  stream?: MediaStream;
}
