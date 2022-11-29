type EventStreamSendFunction = (key: string, value: any) => void;
type EventStreamCallback = (send: EventStreamSendFunction) => () => void;

export function eventStream(request: Request, callback: EventStreamCallback) {
  // const { headers } = request;
  // const accept = headers.get("Accept") || "";
  // const isEventStream = accept.includes("text/event-stream");

  // if (!isEventStream) {
  //   return new Response("Not Acceptable", { status: 406 });
  // }

  const headersInit = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send: EventStreamSendFunction = (key, value) => {
        const data = JSON.stringify({ [key]: value });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      const cleanup = callback(send);

      if (cleanup) {
        request.signal.onabort = cleanup;
      }
    },
  });

  return new Response(stream, { headers: headersInit });
}
