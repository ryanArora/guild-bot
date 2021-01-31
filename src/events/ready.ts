import Client from "../Client";

export default function ready(client: Client) {
  client.logger.info(`${client.user!.tag} is ready to serve ${client.guilds.cache.size} guilds!`);
}
