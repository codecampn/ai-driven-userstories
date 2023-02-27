/**
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from "@testing-library/react";
import cors from "cors";
import EventSourceFill from "eventsource";
import express from "express";
import { Server } from "http";
import { AddressInfo } from "net";
import { act } from "react-dom/test-utils";
import { Subject, take, takeUntil } from "rxjs";
import { useEventSource } from "./useEventSource";

const afterTest = new Subject<boolean>();

const createSSESource = () => {
  const messages = new Subject<string>();

  const app = express();
  app.use(cors());
  app.get("/", (request, response) => {
    const headers = {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
    };
    response.writeHead(200, headers);
    response.flushHeaders();

    const subscription = messages.subscribe({
      next: (text) => {
        response.write(`data: ${JSON.stringify(text)}\n\n`);
      },
      complete: () => {
        response.end();
      },
      error: (e) => {
        console.error(e), response.end();
      },
    });
  });

  const server = app.listen();
  afterTest.pipe(take(1)).subscribe(() => {
    server.closeAllConnections();
    server.close();
  });
  return { messages, server };
};

const EventSourceImpl = EventSourceFill as never as typeof EventSource;

describe("(Hook) useEventSource", () => {
  let server: Server;
  let messages: Subject<string>;
  let url: string;

  beforeEach(() => {
    const source = createSSESource();
    server = source.server;
    messages = source.messages;
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterEach(() => {
    afterTest.next(true);
  });

  it("should open a new eventSource on start", async () => {
    const { result } = renderHook(() => useEventSource(url, { implementation: EventSourceImpl }));
    const receivedMessages = jest.fn();

    result.current.messages.pipe(takeUntil(afterTest)).subscribe(receivedMessages);

    await waitFor(() => {
      if (result.current.state !== "open") {
        throw new Error("State not open");
      }
    });

    messages.next("Hello");
    messages.next("World");

    await waitFor(() => {
      expect(receivedMessages).toBeCalledTimes(2);
    });
    afterTest.next(true);
    expect(JSON.parse(receivedMessages.mock.calls[0][0].data)).toEqual("Hello");
    expect(JSON.parse(receivedMessages.mock.calls[1][0].data)).toEqual("World");

    act(() => {
      result.current.close();
    });
    await waitFor(() => {
      if (result.current.state !== "closed") {
        throw new Error("State not closed");
      }
    });
  });
});
