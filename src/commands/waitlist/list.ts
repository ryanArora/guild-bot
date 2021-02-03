import { MessageEmbed } from "discord.js";
import { ICommand, RunCallback } from "./../../Client";

function WaitlistListCommand(): ICommand {
  const run: RunCallback = async (client, message, args, settings, minecraftClient) => {
    if (!settings) {
      message.channel.send("Error fetching guild settings!");
      client.logger.warn("Settings not passed to command");
      return;
    }

    if (!settings.waitlist) {
      message.channel.send("This guild hasn't configured a waitlist!");
      return;
    }

    if (settings.waitlist.size <= 0) {
      message.channel.send("There are no people on the waitlist!");
      return;
    }

    const plural = settings.waitlist.size > 1;
    let msg = `There ${plural ? "are" : "is"} currently ${settings.waitlist.size} ${plural ? "people" : "person"} on the waitlist!`;

    let pos = 0;
    for (const [discordId] of settings.waitlist.entries()) {
      pos++;
      msg += `\n  ${pos}. <@${discordId}>`;
    }

    const embed = new MessageEmbed().setTitle("Waitlist").setDescription(msg);

    message.channel.send({ embed });
  };

  return {
    description: "Get all members of the waitlist",
    guildOnly: true,
    run,
  };
}

export default WaitlistListCommand();
