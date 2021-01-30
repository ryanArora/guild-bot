import { RunCallback, ICommand } from "../Client";

function PingCommand(): ICommand {
  const run: RunCallback = async (client, message, args, settings) => {
    message.channel.send(`Latency is ${Date.now() - message.createdTimestamp}ms, pong!`);
  };

  return {
    description: "Pings discord",
    guildOnly: false,
    run,
  };
}

export default PingCommand();
