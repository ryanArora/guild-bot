if (process.env.NODE_ENV !== "production") require("dotenv").config();

import Client from "./Client";
import path from "path";

const bot = new Client();

bot.registerCommandsIn(path.join(__dirname, "commands"));
bot.registerEventsIn(path.join(__dirname, "events"));

bot.login(process.env.DISCORD_TOKEN);
