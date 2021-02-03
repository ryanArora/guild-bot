import { Guild, Role, User } from "discord.js";
import { model, Schema, Model, Document } from "mongoose";
import { Guild as HypxielGuild } from "../util/hypixel";

export interface Member {
  minecraftUuid: string;
  minecraftName?: string;
}

export interface MinecraftCredentials {
  username: string;
  password: string;
}

export interface IGuildSettings extends Document {
  discordGuildId: Guild["id"];
  hypixelGuildId?: HypxielGuild["_id"];

  members?: Map<User["id"], Member>;
  waitlist?: Map<User["id"], Member["minecraftUuid"]>;
  officerRole?: Role["id"];
  waitlistRole?: Role["id"];

  minecraftClientEnabled?: boolean;
  minecraftCredentials?: MinecraftCredentials;
}

const MinecraftCredentialsSchema = new Schema({
  username: String,
  password: String,
});

const GuildSettingsSchema = new Schema({
  discordGuildId: { type: String, required: true, index: true, unique: true },
  hypixelGuildId: String,

  members: { type: Map, of: Object },
  waitlist: { type: Map, of: String },
  officerRole: String,
  waitlistRole: String,

  minecraftClientEnabled: Boolean,
  minecraftCredentials: MinecraftCredentialsSchema,
});

const GuildSettings: Model<IGuildSettings> = model("GuildSettings", GuildSettingsSchema);

export default GuildSettings;
