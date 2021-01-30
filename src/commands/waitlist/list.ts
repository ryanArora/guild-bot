import { ICommand, RunCallback } from "./../../Client";

function WaitlistListCommand(): ICommand {
  const run: RunCallback = async (client, message, args, settings) => {
    message.channel.send("waitlist list");
  };

  return {
    description: "Waitlist list",
    guildOnly: false,
    run,
  };
}

export default WaitlistListCommand();
