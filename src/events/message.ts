import { Message } from "discord.js";
import Client from "../Client";

export default function message(client: Client, message: Message) {
  if (message.author.bot) return;
  if (!message.content.startsWith(client.prefix)) return;

  const args: string[] = message.content.slice(client.prefix.length).trim().split(/ +/g);
  const commandName = args.shift()!.toLowerCase();

  const command = client.commands.get(commandName);

  if (command) {
    client.tryExecuteCommand(command, message, args);
  }
}
