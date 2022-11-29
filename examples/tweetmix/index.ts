import { Tweet } from "./tweet";

async function go() {
  const tweet = await Tweet.first();

  if (!tweet) return;

  tweet.id;
  tweet.hello();
}

go();
