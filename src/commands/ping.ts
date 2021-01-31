import { RunCallback, ICommand } from "../Client";

function PingCommand(): ICommand {
  const run: RunCallback = async (client, message, args, settings) => {
    message.channel.send(`Latency is ${Date.now() - message.createdTimestamp}ms, pong!`);
  };

  return {
    description: "Pings discord",
    guildOnly: false,
    run,
    args: [
      {
        name: "Discord ID",
        validator: (arg) => arg === "bruh",
      },
      {
        name: "lol",
        validator: (arg) => arg === "bruh",
      },
      {
        name: "lol",
        validator: (arg) => arg === "bruh",
      },
      {
        name: "lol",
        validator: (arg) => arg === "bruh",
      },
    ],
  };
}

export default PingCommand();
