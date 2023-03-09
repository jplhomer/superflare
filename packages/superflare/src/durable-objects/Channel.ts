interface Session {
  webSocket: WebSocket;
  id: string;
  quit?: boolean;
  user?: UserPayload;
}

interface UserPayload {
  sessionId?: string;
  presenceData?: any;
}

type Env = unknown;

export class Channel implements DurableObject {
  storage: DurableObjectStorage;
  sessions: Session[] = [];
  env: Env;

  constructor(controller: any, env: Env) {
    this.storage = controller.storage;
    this.env = env;
  }

  async fetch(request: Request) {
    if (request.method === "POST") {
      const message = await request.json();

      // Broadcast the message to all connected clients.
      this.broadcast(message);

      return new Response("ok");
    }

    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }

    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("expected websocket", { status: 400 });
    }

    const pair = new WebSocketPair();

    const url = new URL(request.url);
    const user = JSON.parse(url.searchParams.get("user") || "{}");

    await this.handleSession(pair[1], user);

    // Now we return the other end of the pair to the client.
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  async handleSession(webSocket: WebSocket, user?: UserPayload) {
    // @ts-ignore idk?
    webSocket.accept();

    // Create our session and add it to the sessions list.
    const session: Session = {
      webSocket,
      user,
      id: user?.sessionId || "anonymous",
    };
    this.sessions.push(session);

    // TODO: Queue up a `here` message containing all the other members
    // this.sessions.forEach((otherSession) => {
    //   if (otherSession.user?.presenceData) {
    //     session.blockedMessages.push(
    //       JSON.stringify({ joined: user?.presenceData })
    //     );
    //   }
    // });

    let receivedInitialMessage = false;

    // Handle messages from the client.
    webSocket.addEventListener("message", async (message) => {
      try {
        let data = JSON.parse(message.data);

        if (!receivedInitialMessage) {
          // Broadcast to all other connections that this user has joined.
          if (session.user?.presenceData) {
            this.broadcast({ joined: session.user.presenceData });
          }

          receivedInitialMessage = true;

          return;
        }

        // Construct sanitized message for storage and broadcast.
        data = { message: "" + data.message };

        let dataStr = JSON.stringify(data);
        this.broadcast(dataStr);
      } catch (e: any) {
        webSocket.send(JSON.stringify({ error: e.message }));
      }
    });

    // On "close" and "error" events, remove the WebSocket from the sessions list and broadcast
    // a quit message.
    let closeOrErrorHandler = () => {
      session.quit = true;
      this.sessions = this.sessions.filter((member) => member !== session);
      if (session.user?.presenceData) {
        this.broadcast({ quit: session.user.presenceData });
      }
    };
    webSocket.addEventListener("close", closeOrErrorHandler);
    webSocket.addEventListener("error", closeOrErrorHandler);
  }

  broadcast(message: any) {
    if (typeof message !== "string") {
      message = JSON.stringify(message);
    }

    // Iterate over all the sessions sending them messages.
    let quitters: Session[] = [];
    this.sessions = this.sessions.filter((session) => {
      try {
        session.webSocket.send(message);
        return true;
      } catch (err) {
        // Whoops, this connection is dead. Remove it from the list and arrange to notify
        // everyone below.
        session.quit = true;
        quitters.push(session);
        return false;
      }
    });

    quitters.forEach((quitter) => {
      if (quitter.user?.presenceData) {
        this.broadcast({ quit: quitter.user.presenceData });
      }
    });
  }
}
