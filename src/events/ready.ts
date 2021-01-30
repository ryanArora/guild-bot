import Client from "../Client";

export default function ready(client: Client) {
  console.log(`${client.user!.tag} is ready to serve ${client.guilds.cache.size} guilds!`);
}
