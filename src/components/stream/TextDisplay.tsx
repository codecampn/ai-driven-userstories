"use client";

import { useEventSource } from "@/src/hooks/useEventSource";
import { Fragment, useEffect, useState } from "react";
import { filter, map } from "rxjs";

export const TextDisplay = (props: TextDisplayProps) => {
  const { close, messages } = useEventSource(`/api/session/${props.sessionId}`);
  const [textMessages, setTextMessages] = useState<string[]>([]);

  useEffect(() => {
    const subscription = messages
      .pipe(
        map((event) => JSON.parse(event.data)),
        filter(Boolean)
      )
      .subscribe((message) => {
        setTextMessages((state) => [...state, message]);
      });
    return () => {
      subscription.unsubscribe();
      close();
    };
  }, [props.sessionId]);

  return (
    <div className="flex flex-col">
      {textMessages.map((message, idx) => (
        <Fragment key={idx}>
          <div className="mr-2 py-3 my-4 px-4 bg-blue-400 rounded-bl-3xl rounded-tl-3xl rounded-tr-xl text-white">
            &quot;{message}&quot;
          </div>
        </Fragment>
      ))}
    </div>
  );
};

interface TextDisplayProps {
  sessionId?: string;
}
