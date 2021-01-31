import { model, Schema, Model, Document } from "mongoose";

export interface IGuildSettings extends Document {
  id: string;
  waitlist?: string[];
}

const GuildSettingsSchema: Schema = new Schema({
  id: { type: String, required: true, index: true, unique: true },
});

const GuildSettings: Model<IGuildSettings> = model("GuildSettings", GuildSettingsSchema);

export default GuildSettings;
