import { useEffect, useRef, useState } from "react";
import { Subject } from "rxjs";

export const useEventSource = (url: string, options: ExtendedEventSourceInit = {}) => {
  const EventSourceImpl = options.implementation || EventSource;
  const [state, setState] = useState<EventSourceState>("init");
  const [eventSource, setEventSource] = useState<EventSource>();
  const eventSubject = useRef(new Subject<{ data: string; type: string }>());

  const closeIfOpen = () => {
    if (eventSource) {
      eventSource.close();
      setState("closed");
    }
  };

  const createEventSource = () => {
    setEventSource(new EventSourceImpl(url, options));
  };

  useEffect(() => {
    setState("connecting");
    createEventSource();
    return () => closeIfOpen();
  }, []);

  useEffect(() => {
    if (!eventSource) {
      return;
    }

    eventSource.addEventListener("error", (err) => {
      setState("error");
      eventSubject.current.error(err);
    });
    eventSource.addEventListener("message", (msg) => {
      eventSubject.current.next(msg);
    });
    eventSource.addEventListener("open", () => {
      setState("open");
    });
    () => {
      eventSubject.current.complete();
    };
  }, [eventSource]);

  return { messages: eventSubject.current, state, close: () => closeIfOpen() };
};

export type ExtendedEventSourceInit = EventSourceInit & {
  implementation?: typeof EventSource;
};
export type EventSourceState = "init" | "connecting" | "open" | "error" | "closed";
