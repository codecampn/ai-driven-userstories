"use client";

import { logger } from "@/src/logger";
import { useEffect, useState } from "react";

export const SocketStream = (props: SocketStreamProps) => {
  const [session, setSession] = useState();

  useEffect(() => {
    if (!session) {
      return;
    }
    props.onSession(session);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const requestNewSession = (): AbortController => {
    const abortController = new AbortController();
    fetch("/api/session", {
      method: "PUT",
    })
      .then((result) => result.json())
      .then(({ id }) => {
        if (abortController.signal.aborted) {
          logger.info({ id }, "Aborted session");
          deleteSession(id);
          return;
        }
        setSession(id);
        logger.info({ session }, "Created session");
      });

    return abortController;
  };

  const deleteSession = async (sessionToDelete: string) => {
    logger.info({ session: sessionToDelete }, "Deleting session");
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
    logger.info({ session }, "Starting recording");
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
    return () => {
      logger.info({ session }, "Stopping recording");
      mediaRecorder.stop();
    };
  }, [session, props.stream]);

  return <div></div>;
};

interface SocketStreamProps {
  stream?: MediaStream;
  onSession: (sessionId: string) => void;
}
