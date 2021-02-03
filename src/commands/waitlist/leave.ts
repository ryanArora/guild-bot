import { AxiosError } from "axios";
import { ICommand, RunCallback } from "./../../Client";

function WaitlistLeaveCommand(): ICommand {
  const run: RunCallback = (client, message, args, settings, minecraftClient) => {
    if (!settings) {
      message.channel.send("Error fetching guild settings!");
      client.logger.warn("Settings not passed to command");
      return;
    }

    if (!settings.waitlist) {
      message.channel.send("This guild hasn't configured a waitlist yet!");
      return;
    }

    if (!settings.waitlist.has(message.author.id)) {
      message.channel.send("You're not in the waitlist!");
      return;
    }

    settings.waitlist.delete(message.author.id);
    settings
      .save()
      .then(async () => {
        if (settings.waitlistRole) {
          message.member?.roles.remove(settings.waitlistRole, "User requested to be removed");
        }

        message.channel.send("You were removed from the waitlist!");
      })
      .catch((err: AxiosError) => {
        message.channel.send("Error saving waitlist!");
        client.logger.warn(err);
      });
  };

  return {
    description: "Leave the waitlist",
    guildOnly: true,
    run,
  };
}

export default WaitlistLeaveCommand();
