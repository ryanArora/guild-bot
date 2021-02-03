import Discord, { Collection, ClientOptions, Message } from "discord.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import GuildSettings, { IGuildSettings, MinecraftCredentials } from "./models/GuildSettings";
import { toWordsOrdinal } from "number-to-words";
import logger from "./logger";
import { createClient as createMinecraftClient, Client as MinecraftClient } from "minecraft-protocol";

export type ArgumentValidatorCallback = (argument: string | undefined) => boolean;

export interface IArgument {
  name: string;
  validator?: ArgumentValidatorCallback;
}

export type HasPermissionCallback = (message: Message, settings: IGuildSettings | null) => boolean;

export interface ICommandSettings {
  description: string;
  guildOnly: boolean;
  hasPermission?: HasPermissionCallback;
  defaultSubcommand?: string;
  args?: (IArgument | null)[];
}

export type RunCallback = (client: Client, message: Message, args: string[], settings: IGuildSettings | null, minecraftClient: MinecraftClient | null) => void;

export interface ICommand extends ICommandSettings {
  run: RunCallback;
  subcommands?: Map<string, ICommand>;
}

export default class Client extends Discord.Client {
  prefix = "g?";
  commands: Map<string, ICommand> = new Map();
  minecraftClients: Map<string, MinecraftClient> = new Map();
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
        this.logger.info("Successfuly connected to database!");
        this.registerAllMinecraftClients();
        this.login(process.env.DISCORD_TOKEN);
      })
      .catch((err) => {
        this.logger.error(err);
      });
  }

  tryExecuteCommand(command: ICommand, message: Message, args: string[], settings: IGuildSettings | null, minecraftClient: MinecraftClient | null) {
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
          if (argument && argument.validator && !argument.validator(args[index] as string)) {
            msg += ` a ${argument.name} as the ${toWordsOrdinal(index + 1)} argument,${command.args!.length - 2 === index ? " and" : ""}`;
          }
        });

        if (msg.endsWith("and")) {
          msg = msg.substring(0, msg.length - 4);
        } else if (msg.endsWith(",")) {
          msg = msg.substring(0, msg.length - 1);
        }

        msg += ".";

        if (msg !== "You have to provide.") {
          message.channel.send(msg);
          return;
        }
      }

      command.run(this, message, args, settings, minecraftClient);
    } catch (e) {
      message.channel.send(`An unexpected error occured while trying to run this command: \`${e}\``);
    }
  }

  registerMinecraftClient(id: IGuildSettings["id"], credentials: MinecraftCredentials) {
    let minecraftClient: MinecraftClient = createMinecraftClient({
      host: "mc.hypixel.net",
      version: "1.8.9",
      username: credentials.username,
      password: credentials.password,
    });

    minecraftClient.on("connect", () => {
      this.logger.info(`minecraft bot connected as ${minecraftClient.username}`);
    });

    minecraftClient.on("disconnect", (packet) => {
      this.logger.warn(`minecraft bot disconnected ${packet.reason}`);
    });

    minecraftClient.on("disconnect_kick", (packet) => {
      this.logger.warn(`minecraft bot kicked ${packet.reason}`);
    });

    minecraftClient.on("error", (err) => {
      this.logger.error(`unexpected error occured in minecraft bot: ${err}`);
    });

    minecraftClient.on("end", () => {
      setTimeout(() => {
        this.registerMinecraftClient(id, credentials);
      }, 5000);
    });

    this.minecraftClients.set(id, minecraftClient);
  }

  async registerAllMinecraftClients() {
    const guildSettingsList: IGuildSettings[] | null = await GuildSettings.find({ minecraftClientEnabled: true });

    if (!guildSettingsList) {
      this.logger.warn("No minecraft clients registered!");
      return;
    }

    guildSettingsList.forEach((guildSettings: IGuildSettings) => {
      if (guildSettings.minecraftCredentials) {
        const credentials = guildSettings.minecraftCredentials;

        this.registerMinecraftClient(guildSettings.discordGuildId, credentials);
      }
    });

    this.logger.info(`Done registering ${this.minecraftClients.size} Minecraft client${this.minecraftClients.size > 1 ? "s" : ""}!`);
  }

  registerCommandsIn(commandsDir: string) {
    let parentName: string | undefined = undefined;
    this.commands = walk(commandsDir);
    this.logger.info("Done registering commands!");

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
              run: (client, message, args, settings, minecraftClient) => {
                const subcommandName = args.shift()?.toLowerCase();
                let subcommand: ICommand | undefined = undefined;

                if (subcommandName) {
                  subcommand = subcommands.get(subcommandName);
                } else if (command.defaultSubcommand) {
                  subcommand = subcommands.get(command.defaultSubcommand);
                }

                if (subcommand) {
                  client.tryExecuteCommand(subcommand, message, args, settings, minecraftClient);
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

    this.logger.info("Done registering events!");
  }
}
