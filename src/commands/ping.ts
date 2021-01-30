import Client from "../Client";
import { Message } from "discord.js";
import ICommand from "../interfaces/ICommand";

function PingCommand() {
  async function run(client: Client, message: Message, args: string[]) {
    message.channel.send(`Latency is ${Date.now() - message.createdTimestamp}ms, pong!`);
  }

  const cmd: ICommand = {
    description: "Pings discord",
    guildOnly: false,
    run,
  };

  return cmd;
}

export default PingCommand();
