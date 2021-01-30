import { Message } from "discord.js";

export default interface ICommandSettings {
  description: string;
  guildOnly: boolean;
  hasPermission?: (message: Message) => boolean;
  defaultSubcommand?: string;
}
