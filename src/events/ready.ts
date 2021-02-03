import Client from "../Client";

export default function ready(client: Client) {
  client.user?.setActivity({ type: "WATCHING", name: `${client.prefix}help` });
  client.logger.info(`${client.user?.tag} is ready to serve ${client.guilds.cache.size} guild${client.guilds.cache.size > 1 ? "s" : ""}!`);
}
