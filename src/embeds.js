import {
  ActionRowBuilder,
  ActivityType,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { config, connectUrl } from './config.js';

export const COLORS = {
  online: 0x00ff00,
  offline: 0xff0000,
};

export function buildServerEmbed(snapshot) {
  const online = snapshot.online;
  const embed = new EmbedBuilder()
    .setTitle(online ? snapshot.name : config.serverName)
    .setDescription(online ? '🟢 Server is **online**' : '🔴 Server is currently offline')
    .setColor(online ? COLORS.online : COLORS.offline)
    .addFields(
      { name: 'Status', value: online ? '🟢 Online' : '🔴 Offline', inline: true },
      { name: 'Players', value: online ? `${snapshot.players}/${snapshot.maxPlayers}` : '—', inline: true },
      { name: 'Address', value: `\`${config.serverIp}:${config.serverPort}\``, inline: false }
    )
    .setFooter({ text: `Auto-refresh every ${Math.round(config.pollIntervalMs / 1000)}s` })
    .setTimestamp(Date.now());
  return embed;
}

export function buildActionRow() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('connect')
      .setLabel('Connect')
      .setStyle(ButtonStyle.Secondary)
  );
  if (config.discordInvite) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel('Discord Join')
        .setStyle(ButtonStyle.Link)
        .setURL(config.discordInvite)
    );
  }
  return row;
}

export function buildConnectModal() {
  return new ModalBuilder()
    .setCustomId('connect_modal')
    .setTitle('Connect to Server')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('connect_link')
          .setLabel('Copy the steam://connect link')
          .setStyle(TextInputStyle.Short)
          .setValue(connectUrl)
          .setRequired(true)
      )
    );
}

export function buildPresence(snapshot) {
  return {
    status: snapshot.online ? 'online' : 'dnd',
    activities: [
      {
        name: snapshot.online
          ? `🟢 ${snapshot.players}/${snapshot.maxPlayers} — Online`
          : '🔴 Server Offline',
        type: ActivityType.Custom,
      },
    ],
  };
}
