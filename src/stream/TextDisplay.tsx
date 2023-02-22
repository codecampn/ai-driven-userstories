"use client";

import { Fragment, useEffect, useState } from "react";

export const TextDisplay = (props: TextDisplayProps) => {
  const [state, setState] = useState<"init" | "open" | "error" | "closed">(
    "init"
  );
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    if (!props.sessionId) {
      return;
    }
    const interval = setInterval(async () => {
      const result = await fetch(`/api/session/${props.sessionId}`).then((x) =>
        x.json()
      );
      console.log(result);
      setMessages(result);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [props.sessionId]);

  return (
    <>
      {messages.filter(Boolean).map((message, idx) => (
        <Fragment key={idx}>
          <div className="mr-2 py-3 my-4 px-4 bg-blue-400 rounded-bl-3xl rounded-tl-3xl rounded-tr-xl text-white">
            &quot;{message}&quot;
          </div>
        </Fragment>
      ))}
    </>
  );
};

interface TextDisplayProps {
  sessionId?: string;
}
