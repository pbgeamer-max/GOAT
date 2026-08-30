import {
  Client,
  Events,
  GatewayIntentBits,
} from 'discord.js';
import { config, validateConfig } from './config.js';
import { queryRustServer, offlineSnapshot } from './serverQuery.js';
import { buildActionRow, buildPresence, buildServerEmbed } from './embeds.js';
import { state } from './state.js';
import { registerCommands, setupInteractions } from './commands.js';

validateConfig();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

let polling = false;

async function updatePresence(snapshot) {
  if (Date.now() - state.lastPresenceAt < config.presenceMinMs) return;
  try {
    await client.user.setPresence(buildPresence(snapshot));
    state.lastPresenceAt = Date.now();
  } catch (err) {
    console.error('[presence] update failed:', err.message);
  }
}

async function syncVoiceChannel(force = false) {
  if (!config.voiceChannelId) return;
  try {
    const channel = await client.channels.fetch(config.voiceChannelId);
    if (!channel?.isVoiceBased()) return;

    const name = state.lastSnapshot?.online
      ? `🟢 ${state.lastSnapshot.players}/${state.lastSnapshot.maxPlayers}`
      : '🔴 Offline';

    if (channel.name === name) return;

    const now = Date.now();
    if (!force && now - state.lastRenameAt < config.voiceMinRenameMs) return;

    await channel.setName(name);
    state.lastRenameAt = now;
  } catch (err) {
    state.lastRenameAt = Date.now();
    console.error('[voice] sync failed:', err.message);
  }
}

async function updateTrackedMessages() {
  const snapshot = state.lastSnapshot ?? offlineSnapshot();
  const payload = {
    embeds: [buildServerEmbed(snapshot)],
    components: [buildActionRow()],
  };

  for (const [channelId, messageId] of state.trackedMessages) {
    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel?.isTextBased()) {
        state.trackedMessages.delete(channelId);
        continue;
      }
      const message = await channel.messages.fetch(messageId);
      if (!message.editable) continue;
      await message.edit(payload);
    } catch (err) {
      state.trackedMessages.delete(channelId);
      console.error(`[message] update failed for channel ${channelId}:`, err.message);
    }
  }
}

async function tick() {
  if (polling) return;
  polling = true;
  try {
    const snapshot = await queryRustServer();
    const prev = state.lastSnapshot;
    const stateFlipped = !prev || snapshot.online !== prev.online;
    const countsChanged = snapshot.online && (
      snapshot.players !== prev?.players || snapshot.maxPlayers !== prev?.maxPlayers
    );
    const changed = stateFlipped || countsChanged;

    state.lastSnapshot = snapshot;

    if (changed) {
      console.log(
        `[status] ${snapshot.online ? '🟢 ONLINE' : '🔴 OFFLINE'} (${snapshot.players}/${snapshot.maxPlayers})`
      );
      await Promise.allSettled([
        updatePresence(snapshot),
        syncVoiceChannel(stateFlipped),
        updateTrackedMessages(),
      ]);
    } else {
      await Promise.allSettled([
        updatePresence(snapshot),
        updateTrackedMessages(),
      ]);
    }
  } catch (err) {
    console.error('[poll] unexpected error:', err);
    state.lastSnapshot = offlineSnapshot();
    await Promise.allSettled([
      updatePresence(state.lastSnapshot),
      syncVoiceChannel(true),
      updateTrackedMessages(),
    ]);
  } finally {
    polling = false;
  }
}

async function ensureStatusChannelMessage() {
  if (!config.statusChannelId) return;
  try {
    const channel = await client.channels.fetch(config.statusChannelId);
    if (!channel?.isTextBased()) return;

    const messages = await channel.messages.fetch({ limit: 10 });
    const own = messages.find((m) => m.author.id === client.user.id);

    if (own) {
      state.trackedMessages.set(channel.id, own.id);
    } else {
      const sent = await channel.send({
        embeds: [buildServerEmbed(offlineSnapshot())],
        components: [buildActionRow()],
      });
      state.trackedMessages.set(channel.id, sent.id);
    }
  } catch (err) {
    console.error('[status channel] init failed:', err.message);
  }
}

client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag} (${client.user.id})`);

  await registerCommands(client);
  setupInteractions(client);
  await ensureStatusChannelMessage();

  await tick();
  setInterval(tick, config.pollIntervalMs);
  setInterval(() => syncVoiceChannel(), config.voiceSyncMs);
});

client.on(Events.Error, (err) => {
  console.error('[client] error:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

client.login(config.token).catch((err) => {
  console.error('[login] failed:', err.message);
  process.exit(1);
});
