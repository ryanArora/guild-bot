import { Message } from "discord.js";
import Client from "../Client";
import GuildSettings, { IGuildSettings } from "../models/GuildSettings";

export default async function message(client: Client, message: Message) {
  if (message.author.bot) return;
  if (!message.content.startsWith(client.prefix)) return;

  let settings: IGuildSettings | null = null;

  if (message.guild) {
    settings = await GuildSettings.findOne({ id: message.guild.id });

    if (!settings) {
      settings = new GuildSettings({ id: message.guild.id });
      settings.save();
    }
  }

  const args: string[] = message.content.slice(client.prefix.length).trim().split(/ +/g);
  const commandName = args.shift()!.toLowerCase();

  const command = client.commands.get(commandName);

  if (command) {
    client.tryExecuteCommand(command, message, args, settings);
  }
}
