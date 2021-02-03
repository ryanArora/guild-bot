import axios from "axios";

const key = process.env.HYPIXEL_API_KEY;

export interface GuildMember {
  uuid?: string;
  rank?: string;
  joined?: number;
  expHistory?: Object;
  questParticipation?: number;
  mutedTill?: string;
}

export interface GuildRank {
  name?: string;
  default?: boolean;
  created?: number;
  priority?: number;
  tag?: string | null;
}

export interface Guild {
  _id?: string;
  created?: number;
  name?: string;
  name_lower?: string;
  description?: string;
  tag?: string;
  tagColor?: string;
  exp?: number;
  members?: GuildMember[];
  achievements?: {
    ONLINE_PLAYERS: number;
    EXPERIENCE_KINGS: number;
    WINNERS: number;
  };
  ranks?: GuildRank[];
  joinable?: boolean;
  legacyRanking?: number;
  publiclyListed?: boolean;
  hideGmTag?: boolean;
  preferredGames?: string[];
  chatMute?: number;
  guildExpByGameType?: Object;
  banner?: Object;
}

export function getGuild(id: string): Promise<Guild | null> {
  return new Promise((resolve, reject) => {
    axios
      .get(`https://api.hypixel.net/guild?key=${key}&id=${id}`)
      .then((res) => {
        const guild: Guild = res.data?.guild ? res.data?.guild : null;
        resolve(guild);
      })
      .catch((err) => {
        reject(err);
      });
  });
}
