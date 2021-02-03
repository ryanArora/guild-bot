import { AxiosError } from "axios";
import { getMinecraftProfile } from "../../util/mojang";
import { ICommand, RunCallback } from "./../../Client";

function WaitlistAddCommand(): ICommand {
  const run: RunCallback = async (client, message, args, settings, minecraftClient) => {
    if (!settings) {
      message.channel.send("Error fetching guild settings!");
      client.logger.warn("Settings not passed to command");
      return;
    }

    if (!settings.waitlist) {
      message.channel.send("This guild hasn't configured a waitlist yet!");
      return;
    }

    getMinecraftProfile(args[1] as string)
      .then((profile) => {
        if (!profile) {
          message.channel.send("That username does not exist!");
          return;
        }

        let duplicate = false;

        for (const [discordId, minecraftUuid] of settings.waitlist!.entries()) {
          if (discordId === args[0] || minecraftUuid === profile.id) {
            duplicate = true;
            break;
          }
        }

        if (duplicate) {
          message.channel.send("That person is already on the waitlist!");
          return;
        }

        settings.waitlist!.set(args[0] as string, profile.id);

        settings
          .save()
          .then(() => {
            if (settings.waitlistRole) {
              message.member?.roles.add(settings.waitlistRole, `Added by officer ${message.author.tag}`);
            }

            message.channel.send(`Added \`${profile.name}\` to the waitlist!`);
          })
          .catch((err) => {
            message.channel.send("Error saving waitlist!");
            client.logger.warn(err);
          });
      })
      .catch((err: AxiosError) => {
        if (!err.response) {
          message.channel.send("Error fetching minecraft name!");
          client.logger.warn(err);
        }
      });
  };

  return {
    description: "Add a person to the waitlist",
    guildOnly: true,
    hasPermission: (message, settings) => !!message.member?.roles.cache.get(settings?.officerRole as string),
    args: [
      {
        name: "Discord id",
        validator: (a) => typeof a === "string",
      },
      {
        name: "Minecraft name",
        validator: (a) => typeof a === "string",
      },
    ],
    run,
  };
}

export default WaitlistAddCommand();
