import { AxiosError } from "axios";
import { getGuild } from "../../util/hypixel";
import { getMinecraftNameHistory } from "../../util/mojang";
import { ICommand, RunCallback } from "./../../Client";

function WaitlistInviteCommand(): ICommand {
  const run: RunCallback = (client, message, args, settings, minecraftClient) => {
    if (!settings) {
      message.channel.send("Error fetching guild settings!");
      client.logger.warn("Settings not passed to command");
      return;
    }

    if (!minecraftClient) {
      message.channel.send("This server doesn't have a minecraft bot in its guild!");
      return;
    }

    if (!settings.hypixelGuildId) {
      message.channel.send("This server hasn't been linked to a hypixel guild yet!");
      return;
    }

    if (!settings.waitlist) {
      message.channel.send("This guild hasn't configured a waitlist yet!");
      return;
    }

    let uuid = "";
    let pos = 0;
    for (const [discordId, minecraftUuid] of settings.waitlist.entries()) {
      pos++;
      if (discordId === message.author.id) {
        uuid = minecraftUuid;
        break;
      }
    }

    if (!uuid) {
      message.channel.send("You're not in the waitlist!");
      return;
    }

    getGuild(settings.hypixelGuildId as string)
      .then((guild) => {
        if (!guild?.members?.length) {
          message.channel.send("Unable to find slots open slots!");
        }

        const canJoin = (guild?.members?.length ? guild?.members?.length : Infinity) + pos <= 125;
        console.log(canJoin);

        if (!canJoin) {
          message.channel.send("The guild is too full for you to join right now!");
          return;
        }

        getMinecraftNameHistory(uuid)
          .then((history) => {
            const name = history[history.length - 1]?.name;

            if (!name) {
              message.channel.send("Error fetching your latest name!");
            }

            minecraftClient?.write("chat", { message: `/w mynameryan /g invite ${name}` });
            message.channel.send("Attempted to invite you to the guild!");
          })
          .catch((err: AxiosError) => {
            message.channel.send("Error fetching your latest name!");
          });
      })
      .catch((err: AxiosError) => {
        message.channel.send("Error fetching guild!");
      });
  };

  return {
    description: "Request an invite to the guild",
    guildOnly: true,
    run,
  };
}

export default WaitlistInviteCommand();
