import type { TweetmixDataFunctionArgs } from "types";
import { eventStream } from "~/lib/event-stream";

export async function loader({ request, context }: TweetmixDataFunctionArgs) {
  return eventStream(request, (send) => {
    send("hello", "world");

    function sendData() {
      send("ping", "hi");
      setTimeout(sendData, 1000);
    }

    sendData();

    return () => {
      console.log("disconnected!");
    };
  });
}
