import Discord, { ClientOptions, Message } from "discord.js";
import fs from "fs";
import path from "path";

import ICommand from "./interfaces/ICommand";
import ICommandSettings from "./interfaces/ICommandSettings";

export default class Client extends Discord.Client {
  prefix = "g?";
  commands: Map<string, ICommand> = new Map();

  constructor(options?: ClientOptions) {
    super(options);
  }

  tryExecuteCommand(command: ICommand, message: Message, args: string[]) {
    if (command.guildOnly && !message.guild) return;

    try {
      if (command.hasPermission) {
        if (command.hasPermission(message) === false) {
          message.channel.send("You don't have permission to run that command!");
        }
      }

      command.run(this, message, args);
    } catch (e) {
      message.channel.send(`An unexpected error occured while trying to run this command: \`${e}\``);
    }
  }

  registerCommandsIn(commandsDir: string) {
    let parentName: string | undefined = undefined;
    this.commands = walk(commandsDir);
    console.log("Done registering commands!");

    function walk(dir: string) {
      const commands: Map<string, ICommand> = new Map();
      const files = fs.readdirSync(dir);

      files.forEach((file: string) => {
        const name = file.split(".")[0] as string;
        const stats = fs.statSync(path.join(dir, file));

        if (stats.isFile()) {
          if (name === parentName) return;

          const command: ICommand = require(path.join(dir, file)).default;

          commands.set(name, command);
        } else if (stats.isDirectory()) {
          parentName = name;

          const subcommands = walk(path.join(dir, file));

          if (name === parentName) {
            const options: ICommandSettings = require(path.join(dir, parentName, name)).default;

            const command: ICommand = {
              description: options.description,
              guildOnly: options.guildOnly,
              hasPermission: options.hasPermission,
              defaultSubcommand: options.defaultSubcommand,
              subcommands,
              run: (client: Client, message: Message, args: string[]) => {
                const subcommandName = args.shift();
                let subcommand: ICommand | undefined = undefined;

                if (subcommandName) {
                  subcommand = subcommands.get(subcommandName);
                } else if (command.defaultSubcommand) {
                  subcommand = subcommands.get(command.defaultSubcommand);
                }

                if (subcommand) {
                  client.tryExecuteCommand(subcommand, message, args);
                }
              },
            };

            commands.set(name, command);
          }
        }
      });

      return commands;
    }
  }

  registerEventsIn(eventsDir: string) {
    const eventFiles = fs.readdirSync(eventsDir);

    eventFiles.forEach((file: string) => {
      const eventName = file.split(".")[0] as string;
      const event: () => void = require(path.join(eventsDir, file)).default;

      this.on(eventName, event.bind(null, this));
    });

    console.log("Done registering events!");
  }
}
