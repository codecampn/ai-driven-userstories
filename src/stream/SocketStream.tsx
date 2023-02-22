"use client";

import { useEffect, useState } from "react";

export const SocketStream = (props: SocketStreamProps) => {
  const [session, setSession] = useState();

  useEffect(() => {
    if (!session) {
      return;
    }
    props.onSession(session);
  }, [session]);

  const requestNewSession = (): AbortController => {
    const abortController = new AbortController();
    fetch("/api/session", {
      method: "PUT",
    })
      .then((result) => result.json())
      .then(({ id }) => {
        if (abortController.signal.aborted) {
          console.log("Aborted");
          deleteSession(id);
          return;
        }
        setSession(id);
        console.log("Got session", session);
      });

    return abortController;
  };

  const deleteSession = async (sessionToDelete: string) => {
    console.log("Deleting session", sessionToDelete);
    await fetch("/api/session/" + sessionToDelete, {
      method: "DELETE",
    });
  };

  useEffect(() => {
    const abortController = requestNewSession();
    return () => {
      abortController.abort();
      if (session) {
        deleteSession(session);
        setSession(undefined);
      }
    };
  }, []);

  useEffect(() => {
    if (!session || !props.stream) {
      return;
    }
    console.log("Starting recording");
    const mediaRecorder = new MediaRecorder(props.stream, {
      mimeType: "audio/webm",
      audioBitsPerSecond: 64000,
    });
    mediaRecorder.start(500);

    mediaRecorder.addEventListener("dataavailable", async (blobEvent) => {
      fetch(`/api/session/${session}`, {
        body: blobEvent.data,
        method: "POST",
      });
    });
  }, [session, props.stream]);

  return <div></div>;
};

interface SocketStreamProps {
  stream?: MediaStream;
  onSession: (sessionId: string) => void;
}
