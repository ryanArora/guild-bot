import { AxiosError } from "axios";
import { getMinecraftNameHistory } from "../../util/mojang";
import { ICommand, RunCallback } from "./../../Client";

function WaitlistRemoveCommand(): ICommand {
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

    if (!settings.waitlist.has(args[0] as string)) {
      message.channel.send("That person isn't in the waitlist!");
      return;
    }

    const minecraftUuid = settings.waitlist.get(args[0] as string);

    settings.waitlist.delete(args[0] as string);
    settings
      .save()
      .then(async () => {
        if (settings.waitlistRole) {
          message.member?.roles.remove(settings.waitlistRole, `Removed by officer ${message.author.tag}`);
        }

        let name = `<@${args[0]}>`;

        if (minecraftUuid) {
          const history = await getMinecraftNameHistory(minecraftUuid);

          if (history) {
            const minecraftName = history[history.length - 1]?.name;

            if (minecraftName) {
              name = `\`${minecraftName}\``;
            }
          }

          message.channel.send(`Removed ${name} from the waitlist!`);
        }
      })
      .catch((err: AxiosError) => {
        message.channel.send("Error saving waitlist!");
        client.logger.warn(err);
      });
  };

  return {
    description: "Remove a person from the waitlist",
    guildOnly: true,
    hasPermission: (message, settings) => !!message.member?.roles.cache.get(settings?.officerRole as string),
    args: [
      {
        name: "Discord id",
        validator: (a) => typeof a === "string",
      },
    ],
    run,
  };
}

export default WaitlistRemoveCommand();
