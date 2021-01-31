import Discord, { Collection, ClientOptions, Message } from "discord.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { IGuildSettings } from "./models/GuildSettings";
import { toWordsOrdinal } from "number-to-words";
import logger from "./logger";

export type RunCallback = (client: Client, message: Message, args: string[], settings: IGuildSettings | null) => void;
export type HasPermissionCallback = (message: Message, settings: IGuildSettings | null) => boolean;
export type ArgumentValidatorCallback = (argument: string | undefined) => boolean;

export interface IArgument {
  name: string;
  validator: ArgumentValidatorCallback;
}

export interface ICommandSettings {
  description: string;
  guildOnly: boolean;
  hasPermission?: HasPermissionCallback;
  defaultSubcommand?: string;
  args?: (IArgument | null)[];
}

export interface ICommand extends ICommandSettings {
  run: RunCallback;
  subcommands?: Map<string, ICommand>;
}

export default class Client extends Discord.Client {
  prefix = "g?";
  commands: Collection<string, ICommand> = new Collection();

  logger = logger;

  constructor(options?: ClientOptions) {
    super(options);
  }

  start() {
    mongoose
      .connect(`mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}/${process.env.MONGO_DBNAME}?retryWrites=true&w=majority`, {
        useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => {
        logger.info("Successfuly connected to database!");
        this.login(process.env.DISCORD_TOKEN);
      })
      .catch((err) => {
        logger.error("Failed to connect to database");
      });
  }

  tryExecuteCommand(command: ICommand, message: Message, args: string[], settings: IGuildSettings | null) {
    if (command.guildOnly && !message.guild) return;

    try {
      if (command.hasPermission) {
        if (command.hasPermission(message, settings) === false) {
          message.channel.send("You don't have permission to run that command!");
          return;
        }
      }

      if (command.args) {
        let msg = "You have to provide";

        command.args.forEach((argument: IArgument | null, index: number) => {
          if (argument && !argument.validator(args[index] as string)) {
            msg += ` a ${argument.name} as the ${toWordsOrdinal(index + 1)} argument,${command.args!.length - 2 === index ? " and" : ""}`;
          }
        });

        if (msg.endsWith("and")) {
          msg = msg.substring(0, msg.length - 4);
        } else if (msg.endsWith(",")) {
          msg = msg.substring(0, msg.length - 1);
        }

        msg += ".";

        if (msg !== "You have to provide") {
          message.channel.send(msg);
          return;
        }
      }

      command.run(this, message, args, settings);
    } catch (e) {
      message.channel.send(`An unexpected error occured while trying to run this command: \`${e}\``);
    }
  }

  registerCommandsIn(commandsDir: string) {
    let parentName: string | undefined = undefined;
    this.commands = walk(commandsDir);
    logger.info("Done registering commands!");

    function walk(dir: string) {
      const commands: Collection<string, ICommand> = new Collection();
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
              run: (client, message, args, settings) => {
                const subcommandName = args.shift();
                let subcommand: ICommand | undefined = undefined;

                if (subcommandName) {
                  subcommand = subcommands.get(subcommandName);
                } else if (command.defaultSubcommand) {
                  subcommand = subcommands.get(command.defaultSubcommand);
                }

                if (subcommand) {
                  client.tryExecuteCommand(subcommand, message, args, settings);
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

    logger.info("Done registering events!");
  }
}
