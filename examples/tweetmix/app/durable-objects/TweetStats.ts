export class TweetStats {
  constructor(public state: DurableObjectState) {}

  async fetch(request: Request) {
    return new Response("Hello from TweetStats!");
  }
}
