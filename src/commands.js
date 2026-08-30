import { Events, SlashCommandBuilder } from 'discord.js';
import { config } from './config.js';
import { buildActionRow, buildConnectModal, buildServerEmbed } from './embeds.js';
import { offlineSnapshot } from './serverQuery.js';
import { state } from './state.js';

const serverCommand = new SlashCommandBuilder()
  .setName('server')
  .setDescription('View live Rust server status (players, online state, connect)');

export async function registerCommands(client) {
  try {
    const guild = client.guilds.cache.get(config.guildId);
    if (!guild) {
      console.warn('[commands] guild not found in cache, skipping registration');
      return;
    }
    await guild.commands.set([serverCommand]);
    console.log('[commands] /server registered');
  } catch (err) {
    console.error('[commands] registration failed:', err.message);
  }
}

export function setupInteractions(client) {
  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (interaction.isButton() && interaction.customId === 'connect') {
        await interaction.showModal(buildConnectModal());
        return;
      }

      if (interaction.isModalSubmit() && interaction.customId === 'connect_modal') {
        await interaction.reply({
          content: 'Open **Steam** → **Connect to Server** → paste:\n`steam://connect/' +
            `${config.serverIp}:${config.serverPort}` + '`',
          ephemeral: true,
        });
        return;
      }

      if (!interaction.isChatInputCommand() || interaction.commandName !== 'server') return;

      const snapshot = state.lastSnapshot ?? offlineSnapshot();
      await interaction.reply({
        embeds: [buildServerEmbed(snapshot)],
        components: [buildActionRow()],
      });

      const message = await interaction.fetchReply();
      state.trackedMessages.set(interaction.channelId, message.id);
    } catch (err) {
      console.error('[interaction] handler failed:', err.message);
    }
  });
}
