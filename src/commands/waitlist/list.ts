import Client from "../../Client";
import { Message } from "discord.js";
import ICommand from "../../interfaces/ICommand";

function WaitlistListCommand() {
  async function run(client: Client, message: Message, args: string[]) {
    message.channel.send("waitlist list");
  }

  const cmd: ICommand = {
    description: "Waitlist list",
    guildOnly: false,
    run,
  };

  return cmd;
}

export default WaitlistListCommand();
