import ICommandSettings from "./ICommandSettings";
import Client from "../Client";
import { Message } from "discord.js";

export default interface ICommand extends ICommandSettings {
  run: (client: Client, message: Message, args: string[]) => void;
  subcommands?: Map<string, ICommand>;
}
