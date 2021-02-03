import { Client as MinecraftClient } from "minecraft-protocol";
import { Message } from "discord.js";
import Client from "../Client";
import GuildSettings, { IGuildSettings } from "../models/GuildSettings";

export default async function message(client: Client, message: Message) {
  if (message.author.bot) return;
  if (!message.content.startsWith(client.prefix)) return;

  let settings: IGuildSettings | null = null;
  let minecraftClient: MinecraftClient | null = null;

  if (message.guild) {
    settings = await GuildSettings.findOne({ discordGuildId: message.guild.id });

    if (!settings) {
      settings = new GuildSettings({ discordGuildId: message.guild.id });
      settings.save();
    }

    if (settings.minecraftClientEnabled) {
      const tmpClient = client.minecraftClients.get(message.guild.id);
      minecraftClient = tmpClient ? tmpClient : null;
    }
  }

  const args: string[] = message.content.slice(client.prefix.length).trim().split(/ +/g);
  const commandName = args.shift()!.toLowerCase();

  const command = client.commands.get(commandName);

  if (command) {
    client.tryExecuteCommand(command, message, args, settings, minecraftClient);
  }
}
