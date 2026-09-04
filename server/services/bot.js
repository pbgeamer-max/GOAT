import {
  Client,
  Events,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActivityType,
  SlashCommandBuilder,
} from "discord.js";
import {
  updateRoleStatus,
  updateBoosterStatus,
  getUserByDiscordId,
  addVoiceTime,
  logVoiceSession,
  getVoiceLeaderboard,
  getExpiredVips,
  grantVipSubscription,
  revokeVipSubscription,
} from "../database/db.js";
import { setRustServerBooster, setRustServerVip } from "./rcon.js";
import { config } from "../config.js";
import dgram from "dgram";


export const botClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
  ],
});

let isBotReady = false;
let lastStatusSnapshot = null;
let lastPresenceAt = 0;
let lastRenameAt = 0;
const trackedMessages = new Map();

/**
 * Perform direct UDP A2S_INFO query with automatic WebRcon fallback
 */
export function queryRustServer(host = config.rust.ip, port = config.rust.port) {
  return new Promise((resolve) => {
    const client = dgram.createSocket("udp4");
    let answered = false;

    const A2S_INFO = Buffer.from([
      0xFF, 0xFF, 0xFF, 0xFF, 0x54,
      ...Buffer.from("Source Engine Query\0"),
    ]);

    const cleanup = () => {
      try {
        client.close();
      } catch (_) {}
    };

    const tryRconFallback = async () => {
      try {
        const { executeRconCommand } = await import("./rcon.js");
        const rconRes = await executeRconCommand("status", 3500);
        if (rconRes.success && rconRes.output) {
          const out = rconRes.output;
          const hostMatch = out.match(/hostname:\s*(.+)/i);
          const mapMatch = out.match(/map\s*:\s*(.+)/i);
          const playersMatch = out.match(/players\s*:\s*(\d+)\s*\((\d+)\s*max\)\s*\((\d+)\s*queued\)/i);
          
          const players = playersMatch ? parseInt(playersMatch[1], 10) : 0;
          const maxPlayers = playersMatch ? parseInt(playersMatch[2], 10) : 300;
          const queue = playersMatch ? parseInt(playersMatch[3], 10) : 0;
          const serverName = hostMatch ? hostMatch[1].trim() : config.rust.name;
          const map = mapMatch ? mapMatch[1].trim() : "Procedural Map";

          return resolve({
            online: true,
            isOnline: true,
            serverName,
            ip: host,
            port,
            players,
            maxPlayers,
            queue,
            map,
            version: "Active",
            lastWipe: null,
            nextWipe: config.rust.wipeCycle,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (_) {}
      resolve(getOfflineSnapshot());
    };

    client.on("message", (msg) => {
      try {
        if (msg[4] === 0x41) {
          const challenge = msg.subarray(5, 9);
          const requestWithChallenge = Buffer.concat([A2S_INFO, challenge]);
          client.send(requestWithChallenge, port, host);
          return;
        }

        if (msg[4] === 0x49) {
          answered = true;
          let offset = 5;
          const protocol = msg.readUInt8(offset++);

          function readString() {
            const start = offset;
            while (msg[offset] !== 0 && offset < msg.length) offset++;
            const str = msg.toString("utf8", start, offset);
            offset++;
            return str;
          }

          const name = readString();
          const map = readString();
          const folder = readString();
          const game = readString();
          const steamAppId = msg.readUInt16LE(offset);
          offset += 2;
          let players = msg.readUInt8(offset++);
          let maxPlayers = msg.readUInt8(offset++);
          const bots = msg.readUInt8(offset++);
          const serverType = String.fromCharCode(msg.readUInt8(offset++));
          const environment = String.fromCharCode(msg.readUInt8(offset++));
          const visibility = msg.readUInt8(offset++);
          const vac = msg.readUInt8(offset++);
          const version = readString();

          let keywords = "";
          if (offset < msg.length) {
            const edf = msg.readUInt8(offset++);
            if (edf & 0x80) offset += 2;
            if (edf & 0x10) offset += 8;
            if (edf & 0x40) offset += 2;
            if (edf & 0x20) keywords = readString();
          }

          let queue = 0;
          let born = 0;
          if (keywords) {
            const tags = keywords.split(",");
            tags.forEach((t) => {
              if (t.startsWith("qp")) queue = parseInt(t.slice(2), 10) || 0;
              if (t.startsWith("mp")) maxPlayers = parseInt(t.slice(2), 10) || maxPlayers;
              if (t.startsWith("cp")) players = parseInt(t.slice(2), 10) || players;
              if (t.startsWith("born")) born = parseInt(t.slice(4), 10) || 0;
            });
          }

          cleanup();
          resolve({
            online: true,
            isOnline: true,
            serverName: name || config.rust.name,
            ip: host,
            port,
            players,
            maxPlayers,
            queue,
            map: map || "Procedural Map",
            version,
            lastWipe: born ? new Date(born * 1000).toISOString() : null,
            nextWipe: config.rust.wipeCycle,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        cleanup();
        tryRconFallback();
      }
    });

    client.on("error", () => {
      cleanup();
      tryRconFallback();
    });

    client.send(A2S_INFO, port, host, (err) => {
      if (err) {
        cleanup();
        tryRconFallback();
      }
    });

    setTimeout(() => {
      if (!answered) {
        cleanup();
        tryRconFallback();
      }
    }, config.timing.queryTimeoutMs);
  });
}

function getOfflineSnapshot() {
  return {
    online: false,
    isOnline: false,
    serverName: config.rust.name,
    ip: config.rust.ip,
    port: config.rust.port,
    players: 0,
    maxPlayers: 100,
    queue: 0,
    map: "Procedural Map",
    version: "-",
    lastWipe: null,
    nextWipe: config.rust.wipeCycle,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Build Server Status Discord Embed
 */
export function buildServerEmbed(snapshot) {
  const online = snapshot.isOnline || snapshot.online;
  const embed = new EmbedBuilder()
    .setTitle(`⚔️ ${online ? snapshot.serverName : config.rust.name}`)
    .setDescription(
      online
        ? "🟢 **Server is Online & Accepting Survivors**\nJoin now for accelerated 5X progression, active PvP, and fast raiding!"
        : "🔴 **Server is currently Offline or Restarting**"
    )
    .setColor(online ? 0x00ffcc : 0xff3366)
    .addFields(
      { name: "📊 Status", value: online ? "🟢 Online" : "🔴 Offline", inline: true },
      { name: "👥 Players", value: online ? `**${snapshot.players}/${snapshot.maxPlayers}**` : "0", inline: true },
      { name: "⏳ Queue", value: online ? `${snapshot.queue || 0}` : "0", inline: true },
      { name: "🗺️ Map", value: snapshot.map || "Procedural 4000", inline: true },
      { name: "🔄 Next Wipe", value: snapshot.nextWipe || "Thursday @ 5:00 PM", inline: true },
      { name: "🎮 Direct Connect", value: `\`\`\`connect ${config.rust.ip}:${config.rust.port}\`\`\``, inline: false }
    )
    .setThumbnail("https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg")
    .setFooter({ text: `GOAT SERVERS • Live Status • Auto-refresh every ${Math.round(config.timing.pollIntervalMs / 1000)}s` })
    .setTimestamp();

  return embed;
}

export function buildActionRow() {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Join Server")
      .setStyle(ButtonStyle.Link)
      .setURL(`steam://connect/${config.rust.ip}:${config.rust.port}`),
    new ButtonBuilder()
      .setLabel("Website & Stats")
      .setStyle(ButtonStyle.Link)
      .setURL(config.baseUrl)
  );

  if (config.discord.inviteUrl) {
    row.addComponents(
      new ButtonBuilder()
        .setLabel("Discord Community")
        .setStyle(ButtonStyle.Link)
        .setURL(config.discord.inviteUrl)
    );
  }

  return row;
}

// Deduplication map to prevent sending duplicate link notifications within 2 minutes
const recentLinkNotifications = new Map();

/**
 * Automatically assign @Verified role and send logs + DM
 */
export async function grantVerifiedRole(discordId, steamUser) {
  if (!isBotReady || !config.discord.guildId) {
    console.warn("[Bot] Cannot assign role: Bot not ready or GUILD_ID not set");
    return { success: false, reason: "Bot not ready" };
  }

  try {
    const guild = await botClient.guilds.fetch(config.discord.guildId);
    if (!guild) {
      console.warn(`[Bot] Guild ${config.discord.guildId} not found`);
      return { success: false, reason: "Guild not found" };
    }

    const member = await guild.members.fetch(discordId).catch(() => null);
    if (!member) {
      console.warn(`[Bot] Member ${discordId} not found in guild`);
    }

    // Grant Role if configured
    if (member && config.discord.verifiedRoleId) {
      await member.roles.add(config.discord.verifiedRoleId).catch((err) => {
        console.error(`[Bot] Could not add role ${config.discord.verifiedRoleId}:`, err.message);
      });
      updateRoleStatus(steamUser.steam_id, 1);
      console.log(`[Bot] Assigned role to member: ${member.user.tag} (${discordId})`);
    }

    // Send Verification Embed to Log Channel (Debounced to prevent duplicates)
    const now = Date.now();
    const lastSent = recentLinkNotifications.get(steamUser.steam_id) || 0;

    if (config.discord.logChannelId && now - lastSent > 120000) {
      recentLinkNotifications.set(steamUser.steam_id, now);
      try {
        const logChannel = await botClient.channels.fetch(config.discord.logChannelId);
        if (logChannel?.isTextBased()) {
          const logEmbed = new EmbedBuilder()
            .setTitle("✅ Account Successfully Linked!")
            .setColor(0x00ff88)
            .setDescription(`A player has linked their Steam and Discord accounts on the website.`)
            .addFields(
              { name: "🎮 Steam Name", value: `**${steamUser.steam_name}**`, inline: true },
              { name: "🆔 SteamID64", value: `\`${steamUser.steam_id}\``, inline: true },
              { name: "💬 Discord", value: `<@${discordId}>`, inline: true },
              { name: "🎁 In-Game Reward", value: "`/kit discord`", inline: true },
              { name: "🛡️ Assigned Role", value: config.discord.verifiedRoleId ? `<@&${config.discord.verifiedRoleId}>` : "Verified", inline: true }
            )
            .setThumbnail(steamUser.avatar || "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg")
            .setFooter({ text: "GOAT SERVERS • Automated Verification System" })
            .setTimestamp();

          await logChannel.send({ embeds: [logEmbed] });
        }
      } catch (logErr) {
        console.error("[Bot] Failed to send verification log embed:", logErr.message);
      }
    }

    // Send DM to the user
    if (member) {
      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle("🎉 Welcome to GOAT SERVERS Verification!")
          .setColor(0x00e5ff)
          .setDescription(
            `Hey **${steamUser.steam_name}**, your Steam account is now officially linked to Discord!\n\n` +
            `🎁 **In-Game Reward Unlocked:**\n` +
            `Type \`/kit discord\` in the Rust server chat to claim your exclusive verified reward crate!\n\n` +
            `🌐 **View your live stats & leaderboard:** [GOAT Servers Dashboard](${config.baseUrl})`
          )
          .setThumbnail(steamUser.avatar)
          .setFooter({ text: "Thank you for playing on GOAT 5X!" });

        await member.send({ embeds: [dmEmbed] }).catch(() => {});
      } catch (_) {}
    }

    // Check if user is already a Discord Server Booster upon linking
    if (member && member.premiumSince) {
      console.log(`[Bot Link] 🚀 Member ${member.user.tag} is actively boosting! Unlocking in-game booster perks...`);
      await setRustServerBooster(steamUser.steam_id, true, steamUser.steam_name);
      updateBoosterStatus(steamUser.steam_id, 1);
    }

    // Check if user already has VIP / MVP / GOD / BUILDER / GUNS roles upon linking
    if (member && member.roles && member.roles.cache) {
      for (const [, r] of member.roles.cache) {
        const tier = getTierFromRole(r);
        if (tier) {
          console.log(`[Bot Link] 👑 Member has existing ${tier.toUpperCase()} role — syncing to Rust (${steamUser.steam_id})...`);
          await setRustServerVip(steamUser.steam_id, true, tier, steamUser.steam_name);
          grantVipSubscription(steamUser.steam_id, tier, 30);
        }
      }
    }

    return { success: true };
  } catch (err) {
    console.error("[Bot] Error in grantVerifiedRole:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Handle a member starting to boost the Discord server.
 * Executes: o.grant user <STEAM_ID_64> goatkitsui.booster
 *            o.usergroup add <STEAM_ID_64> booster
 */
export async function handleMemberBoostStart(member) {
  const user = getUserByDiscordId(member.id);

  if (user && user.steam_id) {
    console.log(`[Discord Boost] 🚀 Linked SteamID found: ${user.steam_id} (${user.steam_name}) for booster ${member.user.tag}`);

    // 1. Send RCON command to unlock booster perks on Rust server
    await setRustServerBooster(user.steam_id, true, user.steam_name);
    updateBoosterStatus(user.steam_id, 1);

    // 2. Send log embed to log channel
    if (config.discord.logChannelId) {
      try {
        const logChannel = await botClient.channels.fetch(config.discord.logChannelId);
        if (logChannel?.isTextBased()) {
          const embed = new EmbedBuilder()
            .setTitle("🚀 Server Booster Reward Unlocked!")
            .setColor(0xff73fa)
            .setDescription(`**${member.user.tag}** boosted the Discord server! Their in-game booster kit has been activated.`)
            .addFields(
              { name: "👤 Discord User", value: `<@${member.id}> (\`${member.user.tag}\`)`, inline: true },
              { name: "🎮 Linked Steam Name", value: `**${user.steam_name}**`, inline: true },
              { name: "🆔 SteamID64", value: `\`${user.steam_id}\``, inline: true },
              { name: "🎁 In-Game Status", value: "✅ `goatkitsui.booster` granted + added to `booster` group via RCON", inline: false }
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setFooter({ text: "GOAT SERVERS • Booster Perks Automation" })
            .setTimestamp();
          await logChannel.send({ embeds: [embed] });
        }
      } catch (logErr) {
        console.error("[Discord Boost] Failed to send log channel embed:", logErr.message);
      }
    }

    // 3. Send thank-you DM to booster
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle("🚀 Thank You for Boosting GOAT SERVERS!")
        .setColor(0xff73fa)
        .setDescription(
          `Hey **${user.steam_name}**, thank you so much for supporting **GOAT 5X** with a Server Boost!\n\n` +
          `✨ **Your In-Game Booster Perks are now ACTIVE!**\n` +
          `• Permission \`goatkitsui.booster\` has been granted on the server.\n` +
          `• You have been added to the Oxide \`booster\` group.\n` +
          `• Open in-game kits UI and use your exclusive **Booster Kit**!\n` +
          `• Direct connect: \`connect ${config.rust.ip}:${config.rust.port}\`\n\n` +
          `🌐 **View your live stats & leaderboard:** [GOAT Servers Dashboard](${config.baseUrl})`
        )
        .setThumbnail(user.avatar || member.user.displayAvatarURL())
        .setFooter({ text: "GOAT SERVERS • 5X High-Stakes Rust" });
      await member.send({ embeds: [dmEmbed] }).catch(() => {});
    } catch (_) {}
  } else {
    // Member boosted but has not linked Steam account yet!
    console.log(`[Discord Boost] Booster ${member.user.tag} (${member.id}) has NOT linked their Steam account yet.`);

    // Send log embed
    if (config.discord.logChannelId) {
      try {
        const logChannel = await botClient.channels.fetch(config.discord.logChannelId);
        if (logChannel?.isTextBased()) {
          const embed = new EmbedBuilder()
            .setTitle("🚀 New Server Boost (Account Unlinked)")
            .setColor(0xff73fa)
            .setDescription(`**${member.user.tag}** boosted the server, but hasn't linked their Steam account on the website yet.`)
            .addFields(
              { name: "👤 Discord User", value: `<@${member.id}>`, inline: true },
              { name: "⚠️ Status", value: "Awaiting Steam account link", inline: true },
              { name: "🌐 Link URL", value: `[Click Here to Link](${config.baseUrl})`, inline: false }
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setFooter({ text: "Perks will activate automatically once linked." })
            .setTimestamp();
          await logChannel.send({ embeds: [embed] });
        }
      } catch (_) {}
    }

    // DM the user guiding them to link
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle("🚀 Thank You for Boosting GOAT SERVERS!")
        .setColor(0xff73fa)
        .setDescription(
          `Hey **${member.user.username}**, thank you for boosting **GOAT 5X**!\n\n` +
          `To automatically claim your **In-Game Booster Kit & Perks**, please link your Steam account on our website:\n` +
          `👉 **[Click Here to Link Your Steam Account](${config.baseUrl})**\n\n` +
          `Once linked, your booster status will be instantly transmitted to the Rust server!`
        )
        .setFooter({ text: "GOAT SERVERS" });
      await member.send({ embeds: [dmEmbed] }).catch(() => {});
    } catch (_) {}
  }
}

/**
 * Handle a member stopping boosting the Discord server.
 * Executes: o.revoke user <STEAM_ID_64> goatkitsui.booster
 *            o.usergroup remove <STEAM_ID_64> booster
 */
export async function handleMemberBoostEnd(member) {
  const user = getUserByDiscordId(member.id);

  if (user && user.steam_id) {
    console.log(`[Discord Boost] ⚠️ Removing booster perks for SteamID: ${user.steam_id} (${user.steam_name})`);

    // 1. Send RCON command to lock booster perks on Rust server
    await setRustServerBooster(user.steam_id, false, user.steam_name);
    updateBoosterStatus(user.steam_id, 0);

    // 2. Send log embed
    if (config.discord.logChannelId) {
      try {
        const logChannel = await botClient.channels.fetch(config.discord.logChannelId);
        if (logChannel?.isTextBased()) {
          const embed = new EmbedBuilder()
            .setTitle("⚠️ Server Boost Expired")
            .setColor(0x888888)
            .setDescription(`**${member.user.tag}** is no longer boosting. In-game booster perks have been disabled.`)
            .addFields(
              { name: "👤 Discord User", value: `<@${member.id}>`, inline: true },
              { name: "🎮 Linked Steam Name", value: `**${user.steam_name}**`, inline: true },
              { name: "🆔 SteamID64", value: `\`${user.steam_id}\``, inline: true },
              { name: "🔒 Status", value: "🔒 `goatkitsui.booster` revoked + removed from `booster` group", inline: false }
            )
            .setTimestamp();
          await logChannel.send({ embeds: [embed] });
        }
      } catch (_) {}
    }

    // 3. DM notification
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle("ℹ️ Server Boost Expired")
        .setColor(0x888888)
        .setDescription(
          `Hey **${user.steam_name}**, your Discord Server Boost has ended and your in-game booster perks have been locked.\n\n` +
          `Thank you so much for your past support of GOAT SERVERS! If you ever boost again, your perks will automatically re-enable.`
        );
      await member.send({ embeds: [dmEmbed] }).catch(() => {});
    } catch (_) {}
  }
}

// ── Voice Tracking Memory Store ──────────────────────────────
// Key: discord_id -> { joinTime: Date, channelId: string, channelName: string, lastFlush: number }
const _voiceJoinTimes = new Map();

/**
 * Setup Voice State Update listener for Discord Voice Time Tracking
 * Works for all voice & stage channels (including private/locked rooms)
 */
function setupVoiceTracking() {
  botClient.on(Events.VoiceStateUpdate, (oldState, newState) => {
    try {
      const member = newState.member || oldState.member;
      if (!member || member.user.bot) return;

      const discordId = member.id;
      const now = new Date();

      // 1. User Joined a Voice Channel
      if (!oldState.channelId && newState.channelId && newState.channel) {
        _voiceJoinTimes.set(discordId, {
          joinTime: now,
          channelId: newState.channel.id,
          channelName: newState.channel.name,
          lastFlush: Date.now(),
        });
        console.log(`[Voice] 🎙️ JOIN: ${member.user.tag} entered #${newState.channel.name}`);
      }
      // 2. User Left a Voice Channel
      else if (oldState.channelId && !newState.channelId) {
        if (_voiceJoinTimes.has(discordId)) {
          const session = _voiceJoinTimes.get(discordId);
          _voiceJoinTimes.delete(discordId);

          const elapsedSinceFlush = Math.floor((Date.now() - session.lastFlush) / 1000);
          const totalSessionSeconds = Math.floor((now.getTime() - session.joinTime.getTime()) / 1000);

          if (elapsedSinceFlush > 0) {
            addVoiceTime(discordId, elapsedSinceFlush);
          }
          if (totalSessionSeconds > 0) {
            logVoiceSession(discordId, session.channelId, session.channelName, session.joinTime, now, totalSessionSeconds);
          }

          const h = Math.floor(totalSessionSeconds / 3600);
          const m = Math.floor((totalSessionSeconds % 3600) / 60);
          console.log(`[Voice] 🎙️ LEAVE: ${member.user.tag} left voice (Session: ${h}h ${m}m)`);
        }
      }
      // 3. User Moved between Voice Channels
      else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId && newState.channel) {
        if (_voiceJoinTimes.has(discordId)) {
          const session = _voiceJoinTimes.get(discordId);
          const elapsed = Math.floor((Date.now() - session.lastFlush) / 1000);
          const totalSecs = Math.floor((now.getTime() - session.joinTime.getTime()) / 1000);

          if (elapsed > 0) addVoiceTime(discordId, elapsed);
          if (totalSecs > 0) logVoiceSession(discordId, session.channelId, session.channelName, session.joinTime, now, totalSecs);
        }

        _voiceJoinTimes.set(discordId, {
          joinTime: now,
          channelId: newState.channel.id,
          channelName: newState.channel.name,
          lastFlush: Date.now(),
        });
        console.log(`[Voice] 🎙️ MOVE: ${member.user.tag} moved to #${newState.channel.name}`);
      }
    } catch (err) {
      console.error("[Voice Tracking Event Error]:", err.message);
    }
  });
}

/**
 * Scan all active voice channels on bot startup to immediately track members currently in voice
 */
async function scanActiveVoiceMembers() {
  if (!isBotReady) return;
  try {
    const guilds = botClient.guilds.cache;
    let count = 0;
    const now = new Date();

    for (const [, guild] of guilds) {
      const channels = guild.channels.cache.filter((c) => c.isVoiceBased());
      for (const [, vc] of channels) {
        for (const [, member] of vc.members) {
          if (!member.user.bot) {
            _voiceJoinTimes.set(member.id, {
              joinTime: now,
              channelId: vc.id,
              channelName: vc.name,
              lastFlush: Date.now(),
            });
            count++;
          }
        }
      }
    }
    console.log(`[Voice Scan] 🔍 Initial voice scan complete. Tracking ${count} member(s) currently in voice rooms.`);
  } catch (err) {
    console.error("[Voice Scan Error]:", err.message);
  }
}

/**
 * Periodic flush loop: every 30 seconds, add accumulated voice seconds to database
 * Ensures live voice stats update on the website in real-time without leaving the room!
 */
function startVoiceFlushLoop() {
  setInterval(() => {
    try {
      const now = Date.now();
      for (const [discordId, session] of _voiceJoinTimes.entries()) {
        const elapsed = Math.floor((now - session.lastFlush) / 1000);
        if (elapsed >= 10) {
          addVoiceTime(discordId, elapsed);
          session.lastFlush = now;
        }
      }
    } catch (err) {
      console.error("[Voice Flush Loop Error]:", err.message);
    }
  }, 30000);
}

const TIER_ROLE_NAMES = ["god", "mvp", "vip", "builder", "guns"];

export function getTierFromRole(role) {
  if (!role) return null;
  const roleName = String(role.name || "").toLowerCase().trim();
  const roleId = String(role.id || "").trim();

  for (const [tier, id] of Object.entries(config.discord.tierRoles || {})) {
    if (id && roleId === String(id).trim()) return tier.toLowerCase();
  }

  for (const tier of TIER_ROLE_NAMES) {
    const regex = new RegExp(`\\b${tier}\\b`, "i");
    if (regex.test(roleName) || roleName.includes(tier)) {
      return tier;
    }
  }
  return null;
}

export async function handleRoleUpdates(oldMember, newMember) {
  const addedRoles = newMember.roles.cache.filter((r) => !oldMember.roles.cache.has(r.id));
  const removedRoles = oldMember.roles.cache.filter((r) => !newMember.roles.cache.has(r.id));

  for (const [, role] of addedRoles) {
    const tier = getTierFromRole(role);
    if (!tier) continue;

    console.log(`[Discord Roles] 💎 Member ${newMember.user.tag} received ${tier.toUpperCase()} role (${role.name})!`);
    const user = getUserByDiscordId(newMember.id);

    if (user && user.steam_id) {
      await setRustServerVip(user.steam_id, true, tier, user.steam_name);
      grantVipSubscription(user.steam_id, tier, 30);

      if (config.discord.logChannelId) {
        try {
          const logChan = await botClient.channels.fetch(config.discord.logChannelId);
          if (logChan?.isTextBased()) {
            const embed = new EmbedBuilder()
              .setTitle(`👑 In-Game Rank Granted: ${tier.toUpperCase()}`)
              .setColor(0x00ff88)
              .setDescription(`Discord member <@${newMember.id}> was granted the **${tier.toUpperCase()}** role.`)
              .addFields(
                { name: "🎮 Steam User", value: `**${user.steam_name}**`, inline: true },
                { name: "🆔 SteamID", value: `\`${user.steam_id}\``, inline: true },
                { name: "⭐ Kit / Rank", value: `**${tier.toUpperCase()}** (30 Days)`, inline: true }
              )
              .setFooter({ text: "GOAT SERVERS • Role Integration" })
              .setTimestamp();
            await logChan.send({ embeds: [embed] });
          }
        } catch (_) {}
      }

      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle(`🎉 Your ${tier.toUpperCase()} Rank is Active on GOAT 5X!`)
          .setColor(0xf5a623)
          .setDescription(
            `Hey **${user.steam_name}**, your **${tier.toUpperCase()}** rank has been granted!\n\n` +
            `🎁 **In-Game Perks:**\n` +
            `• Type \`/kit\` in Rust to claim your exclusive **${tier.toUpperCase()} Kit**\n` +
            `• HQ Building Upgrade & queue privileges unlocked!\n\n` +
            `Thank you for supporting **GOAT SERVERS**!`
          )
          .setFooter({ text: "GOAT SERVERS" });
        await newMember.send({ embeds: [dmEmbed] }).catch(() => {});
      } catch (_) {}
    } else {
      console.warn(`[Discord Roles] ⚠️ Member ${newMember.user.tag} received ${tier.toUpperCase()} but Steam account is not linked.`);
      try {
        const linkEmbed = new EmbedBuilder()
          .setTitle(`⚠️ Action Required: Link Your Steam Account!`)
          .setColor(0xff9900)
          .setDescription(
            `You were given the **${tier.toUpperCase()}** role in Discord, but your Steam account is not linked yet!\n\n` +
            `👉 **Link your Steam account now to instantly receive your in-game kits & perks:**\n` +
            `[Click here to Link Steam](${config.baseUrl}/auth/steam)`
          )
          .setFooter({ text: "GOAT SERVERS" });
        await newMember.send({ embeds: [linkEmbed] }).catch(() => {});
      } catch (_) {}
    }
  }

  for (const [, role] of removedRoles) {
    const tier = getTierFromRole(role);
    if (!tier) continue;

    console.log(`[Discord Roles] 🔒 Member ${newMember.user.tag} lost ${tier.toUpperCase()} role (${role.name}).`);
    const user = getUserByDiscordId(newMember.id);
    if (user && user.steam_id) {
      await setRustServerVip(user.steam_id, false, tier, user.steam_name);
      revokeVipSubscription(user.steam_id, tier);
    }
  }
}

/**
 * Setup GuildMemberUpdate + GuildMemberAdd listeners for Discord Server Boost & Role detection.
 */
function setupBoosterListener() {
  botClient.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    try {
      if (config.discord.guildId && newMember.guild.id !== config.discord.guildId) return;

      const wasBoosting = Boolean(oldMember.premiumSince);
      const isBoosting = Boolean(newMember.premiumSince);

      if (!wasBoosting && isBoosting) {
        console.log(`[Discord Boost] 🚀 ${newMember.user.tag} (${newMember.id}) STARTED boosting.`);
        await handleMemberBoostStart(newMember);
      } else if (wasBoosting && !isBoosting) {
        console.log(`[Discord Boost] ⚠️ ${newMember.user.tag} (${newMember.id}) STOPPED boosting.`);
        await handleMemberBoostEnd(newMember);
      }

      // VIP / MVP / GOD / BUILDER / GUNS role detection
      await handleRoleUpdates(oldMember, newMember);
    } catch (err) {
      console.error("[Discord Boost GuildMemberUpdate Error]:", err.message);
    }
  });

  botClient.on(Events.GuildMemberAdd, async (member) => {
    try {
      if (config.discord.guildId && member.guild.id !== config.discord.guildId) return;
      if (!member.premiumSince) return;

      const user = getUserByDiscordId(member.id);
      if (user && user.steam_id) {
        console.log(`[Discord Boost] 🔄 Booster ${member.user.tag} joined the guild — syncing perks to Rust (${user.steam_id})...`);
        await setRustServerBooster(user.steam_id, true, user.steam_name);
        updateBoosterStatus(user.steam_id, 1);
      }
    } catch (err) {
      console.error("[Discord Boost GuildMemberAdd Error]:", err.message);
    }
  });
}

/**
 * Register Slash Commands
 */
async function registerCommands() {
  try {
    const guild = botClient.guilds.cache.get(config.discord.guildId);
    if (!guild) return;

    const commands = [
      new SlashCommandBuilder()
        .setName("server")
        .setDescription("Check GOAT 5X live server status, players online & wipe details"),
      new SlashCommandBuilder()
        .setName("link")
        .setDescription("Get the link to connect your Steam & Discord to unlock /kit discord"),
      new SlashCommandBuilder()
        .setName("stats")
        .setDescription("Check your personal Rust PvP stats on GOAT SERVERS"),
      new SlashCommandBuilder()
        .setName("voice")
        .setDescription("Check your Discord voice channel call hours and active clan rank"),
      new SlashCommandBuilder()
        .setName("topvoice")
        .setDescription("View the Top 10 Discord voice champions leaderboard"),
    ];

    await guild.commands.set(commands);
    console.log("[Bot] Slash commands (/server, /link, /stats, /voice, /topvoice) registered successfully.");
  } catch (err) {
    console.error("[Bot] Slash commands registration failed:", err.message);
  }
}

/**
 * Update Voice Channel Name with player counts
 */
async function syncVoiceChannel(force = false) {
  if (!config.discord.voiceChannelId || !isBotReady) return;
  try {
    const channel = await botClient.channels.fetch(config.discord.voiceChannelId);
    if (!channel?.isVoiceBased()) return;

    const name = lastStatusSnapshot?.online
      ? `🟢 ${lastStatusSnapshot.players}/${lastStatusSnapshot.maxPlayers}`
      : "🔴 Offline";

    if (channel.name === name) return;

    const now = Date.now();
    if (!force && now - lastRenameAt < config.timing.voiceMinRenameMs) return;

    await channel.setName(name);
    lastRenameAt = now;
  } catch (err) {
    lastRenameAt = Date.now();
  }
}

/**
 * Update Presence
 */
async function updatePresence(snapshot) {
  if (!isBotReady) return;
  if (Date.now() - lastPresenceAt < config.timing.presenceMinMs) return;

  try {
    const online = snapshot.isOnline || snapshot.online;
    await botClient.user.setPresence({
      status: online ? "online" : "dnd",
      activities: [
        {
          name: online
            ? `${snapshot.players}/${snapshot.maxPlayers} players online`
            : "Server Offline",
          type: online ? ActivityType.Watching : ActivityType.Custom,
        },
      ],
    });
    lastPresenceAt = Date.now();
  } catch (err) {
    console.error("[Bot] Presence update error:", err.message);
  }
}

/**
 * Tick function for polling server status
 */
async function tick() {
  try {
    const snapshot = await queryRustServer();
    lastStatusSnapshot = snapshot;

    await Promise.allSettled([
      updatePresence(snapshot),
      syncVoiceChannel(),
    ]);
  } catch (err) {
    console.error("[Bot] Poll error:", err.message);
  }
}

/**
 * Setup Slash Command Interactions
 */
function setupInteractions() {
  botClient.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "server") {
      const snap = lastStatusSnapshot || (await queryRustServer());
      await interaction.reply({
        embeds: [buildServerEmbed(snap)],
        components: [buildActionRow()],
      });
    } else if (interaction.commandName === "link") {
      const linkEmbed = new EmbedBuilder()
        .setTitle("🔗 Link Your Steam Account")
        .setDescription(
          `Connect your Steam profile on our website to automatically receive your verified Discord role and unlock **/kit discord** in-game!\n\n` +
          `👉 **[Click Here to Link Your Account](${config.baseUrl})**`
        )
        .setColor(0x00e5ff);

      await interaction.reply({ embeds: [linkEmbed], ephemeral: true });
    } else if (interaction.commandName === "stats") {
      const user = getUserByDiscordId(interaction.user.id);
      if (!user || !user.is_linked) {
        await interaction.reply({
          content: `⚠️ Your Discord account is not linked to Steam yet! Visit ${config.baseUrl} to link and track your stats.`,
          ephemeral: true,
        });
        return;
      }

      const s = user.stats || {};
      const statsEmbed = new EmbedBuilder()
        .setTitle(`📊 Rust Stats for ${user.steam_name}`)
        .setColor(0xffaa00)
        .addFields(
          { name: "⚔️ PvP Kills", value: `${s.kills || 0}`, inline: true },
          { name: "💀 Deaths", value: `${s.deaths || 0}`, inline: true },
          { name: "🎯 K/D Ratio", value: `${s.kd_ratio || 0}`, inline: true },
          { name: "⏱️ Playtime", value: `${Math.round((s.playtime_seconds || 0) / 3600)} hrs`, inline: true },
          { name: "💥 Explosives Used", value: `${s.explosives_used || 0}`, inline: true },
          { name: "⛏️ Sulfur Farmed", value: `${(s.sulfur_gathered || 0).toLocaleString()}`, inline: true }
        )
        .setThumbnail(user.avatar)
        .setFooter({ text: "GOAT SERVERS • Live Rust Statistics" });

      await interaction.reply({ embeds: [statsEmbed], ephemeral: true });
    } else if (interaction.commandName === "voice") {
      const user = getUserByDiscordId(interaction.user.id);
      const totalSeconds = user?.voice_time_seconds || 0;
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      const voiceEmbed = new EmbedBuilder()
        .setTitle(`🎙️ Discord Voice Stats — ${interaction.user.username}`)
        .setColor(0x5865F2)
        .setDescription(
          `Track your voice room activity and earn clan standing on **GOAT 5X**!\n\n` +
          `⏱️ **Total Voice Time:** \`${hours} Hours, ${minutes} Minutes\`\n` +
          `🎮 **Linked Steam:** ${user?.steam_name ? `**${user.steam_name}** (\`${user.steam_id}\`)` : "*Not linked yet*"}\n` +
          `🚀 **Booster Status:** ${user?.is_booster ? "✅ Active Booster" : "❌ Regular Member"}\n\n` +
          `🌐 **Live Dashboard:** [View on Website](${config.baseUrl})`
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: "GOAT SERVERS • Voice Rewards System" });

      await interaction.reply({ embeds: [voiceEmbed], ephemeral: true });
    } else if (interaction.commandName === "topvoice") {
      const top = getVoiceLeaderboard(10);
      const embed = new EmbedBuilder()
        .setTitle("🎙️ Top 10 Discord Voice Champions")
        .setColor(0x5865F2)
        .setDescription(
          top.length === 0
            ? "No voice hours recorded yet. Join any voice channel to start ranking!"
            : top
                .map((m, idx) => {
                  const h = Math.floor((m.voice_time_seconds || 0) / 3600);
                  const min = Math.floor(((m.voice_time_seconds || 0) % 3600) / 60);
                  const medal = idx === 0 ? "👑" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `**#${idx + 1}**`;
                  return `${medal} <@${m.discord_id}> (${m.steam_name || "Survivor"}) — **${h}h ${min}m**`;
                })
                .join("\n")
        )
        .setFooter({ text: "GOAT SERVERS • Continuous Voice Tracking" });

      await interaction.reply({ embeds: [embed] });
    }
  });
}

/**
 * Scan and synchronize all existing Discord Server Boosters on bot startup
 */
export async function syncExistingBoosters() {
  if (!config.discord.guildId || !isBotReady) return;

  try {
    const guild = await botClient.guilds.fetch(config.discord.guildId).catch(() => null);
    if (!guild) return;

    console.log(`[Discord Boost Sync] 🔍 Scanning members in "${guild.name}" for active boosters...`);
    const members = await guild.members.fetch().catch(() => null);
    if (!members) return;

    const boostingMembers = members.filter((m) => Boolean(m.premiumSince));
    console.log(`[Discord Boost Sync] Found ${boostingMembers.size} active booster(s) in Discord.`);

    for (const [id, member] of boostingMembers) {
      const user = getUserByDiscordId(member.id);
      if (user && user.steam_id) {
        console.log(`[Discord Boost Sync] 🚀 Synced active booster: ${member.user.tag} -> Steam: ${user.steam_name} (${user.steam_id})`);
        await setRustServerBooster(user.steam_id, true, user.steam_name);
        updateBoosterStatus(user.steam_id, 1);
      } else {
        console.log(`[Discord Boost Sync] ℹ️ Booster ${member.user.tag} (${member.id}) has not linked Steam account yet.`);
      }
    }
  } catch (err) {
    console.error("[Discord Boost Sync Error]:", err.message);
  }
}

// Map to track members who received revocation DM (prevents DM spam)
const notifiedRevokeDms = new Set();

/**
 * Automatically sync verified roles across all Discord members:
 * - If a member has the verified role but is NOT linked -> Automatically REVOKE the role and send DM with link!
 * - If a member is linked but missing the role -> Automatically GRANT the role!
 */
export async function syncVerifiedRoles() {
  if (!config.discord.guildId || !config.discord.verifiedRoleId || !isBotReady) return;

  try {
    const guild = await botClient.guilds.fetch(config.discord.guildId).catch(() => null);
    if (!guild) return;

    const roleId = config.discord.verifiedRoleId;
    const members = await guild.members.fetch().catch(() => null);
    if (!members) return;

    let revokedCount = 0;
    let grantedCount = 0;

    for (const [id, member] of members) {
      if (member.user.bot) continue;

      const hasRole = member.roles.cache.has(roleId);
      const linkedUser = getUserByDiscordId(member.id);

      if (hasRole && (!linkedUser || !linkedUser.is_linked)) {
        // Member has role but is NOT linked in database -> Revoke role!
        await member.roles.remove(roleId).catch(() => {});
        revokedCount++;
        console.log(`[Role Sync] 🔒 Revoked verified role from unlinked member: ${member.user.tag} (${member.id})`);

        // Send friendly DM with link to connect (only once)
        if (!notifiedRevokeDms.has(member.id)) {
          notifiedRevokeDms.add(member.id);
          try {
            const revokeEmbed = new EmbedBuilder()
              .setTitle("⚠️ تنبيه: مطلوب ربط حسابك في GOAT RUST")
              .setColor(0xff3b30)
              .setDescription(
                `مرحباً **${member.user.username}** 👋\n\n` +
                `تمت إزالة رتبة التحقق لأن حسابك في الديسكورد غير مربوط بحسابك في **Steam** بعد.\n\n` +
                `🎁 **المميزات التي ستحصل عليها عند الربط:**\n` +
                `• استعادة رتبة التحقق الرسمية في الديسكورد.\n` +
                `• فتح كيت اللعبة المجاني \`/kit\` فوراً داخل سيرفر الراست.\n` +
                `• تتبع ساعات لعبك وقتلاتك وساعات الصوت في الترتيب العام!\n\n` +
                `👇 **اضغط على الزر أدناه للدخول وربط حسابك الآن:**`
              )
              .setFooter({ text: "GOAT SERVERS • Automated Verification System" })
              .setTimestamp();

            const linkRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel("🔗 اربط حسابك الآن | Link Account")
                .setStyle(ButtonStyle.Link)
                .setURL(`${config.baseUrl}`)
            );

            await member.send({ embeds: [revokeEmbed], components: [linkRow] }).catch(() => {});
          } catch (_) {}
        }
      } else if (!hasRole && linkedUser && linkedUser.is_linked) {
        // Member is linked in database but missing role -> Grant role!
        await member.roles.add(roleId).catch(() => {});
        notifiedRevokeDms.delete(member.id); // Reset so if they unlink later, they can be notified
        grantedCount++;
        console.log(`[Role Sync] ⭐ Restored verified role for linked member: ${member.user.tag} (${member.id})`);
      }
    }

    if (revokedCount > 0 || grantedCount > 0) {
      console.log(`[Role Sync] 🔄 Role audit complete: ${revokedCount} unlinked revoked, ${grantedCount} linked restored.`);
    }
  } catch (err) {
    console.error("[Role Sync Error]:", err.message);
  }
}

/**
 * Initialize and start Discord Bot
 */
export async function startDiscordBot() {
  if (!config.discord.botToken) {
    console.warn("[Bot] No DISCORD_BOT_TOKEN provided. Discord bot features disabled.");
    return;
  }

  botClient.once(Events.ClientReady, async () => {
    isBotReady = true;
    console.log(`[Bot] Discord Bot logged in as ${botClient.user.tag} (${botClient.user.id})`);

    await registerCommands();
    setupInteractions();
    setupBoosterListener();
    setupVoiceTracking();
    await syncExistingBoosters();
    await syncVerifiedRoles();
    await checkAndExpireVips();
    await scanActiveVoiceMembers();
    startVoiceFlushLoop();
    await tick();

    setInterval(tick, config.timing.pollIntervalMs);
    setInterval(() => syncVoiceChannel(), config.timing.voiceSyncMs);
    setInterval(() => syncVerifiedRoles(), 120000); // Audit and auto-revoke unlinked members every 2 minutes
    setInterval(() => checkAndExpireVips(), 300000); // Check and auto-expire 30-day VIP subscriptions every 5 minutes
  });

  botClient.on(Events.Error, (err) => {
    console.error("[Bot] Discord Client Error:", err.message);
  });

  try {
    await botClient.login(config.discord.botToken);
  } catch (err) {
    console.error("[Bot] Login failed:", err.message);
  }
}

/**
 * Transmit a player/cheater report to Discord (Staff Channel + Direct Staff DM)
 */
export async function sendPlayerReport(reportData) {
  if (!isBotReady) {
    console.warn("[Bot Report] Discord bot is not ready yet to send report.");
    return { success: false, reason: "Discord bot is offline" };
  }

  try {
    const {
      suspectSteamId,
      suspectName = "Unknown Player",
      suspectAvatar = "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg",
      category = "Suspicious Behavior",
      proofUrl = "",
      description = "",
      reporterName = "Anonymous Survivor",
      reporterSteamId = null,
      reporterDiscordTag = null,
    } = reportData;

    const embed = new EmbedBuilder()
      .setTitle(`🚨 CHEATER REPORT: ${suspectName}`)
      .setColor(0xe62020)
      .setDescription(
        `A player has submitted an urgent cheater/rule violation report via the **GOAT RUST** website.\n\n` +
        `**🎯 Suspect Name:** \`${suspectName}\`\n` +
        `**🆔 Steam64 ID:** \`${suspectSteamId}\`\n` +
        `**⚠️ Violation Type:** \`${category}\``
      )
      .addFields(
        {
          name: "📝 Description / Combatlog",
          value: description ? `\`\`\`${description.slice(0, 1000)}\`\`\`` : "*No additional description provided*",
          inline: false,
        },
        {
          name: "📹 Video / Proof Link",
          value: proofUrl ? `[🔗 Watch Proof Evidence](${proofUrl})` : "*No video link attached*",
          inline: true,
        },
        {
          name: "👤 Reported By",
          value: reporterSteamId
            ? `**${reporterName}** (\`${reporterSteamId}\`)${reporterDiscordTag ? ` • <@${reporterDiscordTag}>` : ""}`
            : "*Anonymous Survivor*",
          inline: true,
        },
        {
          name: "🎮 Server Node",
          value: `\`${config.rust.name}\` (${config.rust.ip}:${config.rust.port})`,
          inline: false,
        }
      )
      .setThumbnail(suspectAvatar)
      .setFooter({ text: "GOAT Anti-Cheat Overwatch System • Automated Report Dispatcher" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Open Steam Profile")
        .setStyle(ButtonStyle.Link)
        .setURL(`https://steamcommunity.com/profiles/${suspectSteamId}`),
      new ButtonBuilder()
        .setLabel("RustStats Tracker")
        .setStyle(ButtonStyle.Link)
        .setURL(`https://ruststats.gg/player/${suspectSteamId}`)
    );

    let delivered = false;

    // 1. Send to Staff Report Channel
    const channelId = config.discord.reportChannelId || config.discord.logChannelId;
    if (channelId) {
      try {
        const channel = await botClient.channels.fetch(channelId).catch(() => null);
        if (channel?.isTextBased()) {
          await channel.send({ embeds: [embed], components: [row] });
          console.log(`[Bot Report] 📢 Sent cheater report for ${suspectName} to channel #${channel.name}`);
          delivered = true;
        }
      } catch (err) {
        console.error("[Bot Report Channel Error]:", err.message);
      }
    }

    // 2. Send Direct DM to Staff/Admin if configured in DISCORD_REPORT_USER_ID
    if (config.discord.reportUserId) {
      try {
        const targetUser = await botClient.users.fetch(config.discord.reportUserId).catch(() => null);
        if (targetUser) {
          await targetUser.send({
            content: `🚨 **[URGENT CHEATER REPORT]** Received from **${reporterName}**:`,
            embeds: [embed],
            components: [row],
          });
          console.log(`[Bot Report] 📩 Sent cheater report DM to Staff/Owner (${targetUser.tag})`);
          delivered = true;
        }
      } catch (err) {
        console.error("[Bot Report DM Error]:", err.message);
      }
    }

    return { success: delivered };
  } catch (err) {
    console.error("[Bot Report Error]:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Grant VIP Discord Role & Send Congratulations DM
 */
export async function grantDiscordVipRole(discordId, tier = "vip", steamName = "Survivor") {
  if (!isBotReady || !config.discord.guildId) return { success: false };

  try {
    const guild = await botClient.guilds.fetch(config.discord.guildId).catch(() => null);
    if (!guild) return { success: false };

    const member = await guild.members.fetch(discordId).catch(() => null);
    if (!member) return { success: false };

    // Grant the tier-specific Discord role (e.g. VIP, MVP, GOD, GUNS, BUILDER)
    const tierKey = (tier || "vip").toLowerCase();
    const roleId = (config.discord.tierRoles || {})[tierKey];
    if (roleId) {
      await member.roles.add(roleId).catch(() => {});
      console.log(`[Bot VIP] 👑 Granted @${tierKey.toUpperCase()} Discord role to ${member.user.tag} (${discordId})`);
    } else {
      console.warn(`[Bot VIP] ⚠️ No Discord role configured for tier "${tierKey}" (set DISCORD_${tierKey.toUpperCase()}_ROLE_ID in Railway)`);
    }

    // Send VIP Welcome Embed DM
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle(`⭐ Congratulations on Unlocking ${tier.toUpperCase()} Rank!`)
        .setColor(0xffaa00)
        .setDescription(
          `Hey **${member.user.username}** 👋, thank you for supporting **GOAT 5X**!\n\n` +
          `🎁 **Your Perks are now Active for 30 Days:**\n` +
          `• 🏰 **Automatic Building Upgrade:** Wood, Stone, Metal, and **HQ (TopTier)**!\n` +
          `• 📦 **In-Game VIP Kits:** Type \`/kit ${tier.toLowerCase()}\` in-game.\n` +
          `• ⚡ **Queue Skip:** Instant slot reservation on wipe days.\n` +
          `• 👑 **Discord VIP Role:** Granted on our community server!\n\n` +
          `🎮 **Linked Steam:** **${steamName}**\n` +
          `🌐 **Dashboard:** ${config.baseUrl}`
        )
        .setFooter({ text: "GOAT SERVERS • Automated Store & Perks System" })
        .setTimestamp();

      await member.send({ embeds: [dmEmbed] }).catch(() => {});
    } catch (_) {}

    return { success: true };
  } catch (err) {
    console.error("[Bot VIP Grant Error]:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Revoke VIP Discord Role upon 30-day expiration & Send Expiration Notice DM
 */
export async function revokeDiscordVipRole(discordId, tier = "vip") {
  if (!isBotReady || !config.discord.guildId) return { success: false };

  try {
    const guild = await botClient.guilds.fetch(config.discord.guildId).catch(() => null);
    if (!guild) return { success: false };

    const member = await guild.members.fetch(discordId).catch(() => null);
    if (!member) return { success: false };

    // Revoke the tier-specific Discord role
    const tierKey = (tier || "vip").toLowerCase();
    const roleId = (config.discord.tierRoles || {})[tierKey];
    if (roleId && member.roles.cache.has(roleId)) {
      await member.roles.remove(roleId).catch(() => {});
      console.log(`[Bot VIP] 🔒 Revoked expired @${tierKey.toUpperCase()} Discord role from ${member.user.tag} (${discordId})`);
    }

    // Send VIP Expiry Notice DM
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle("ℹ️ Your GOAT VIP Membership has Expired")
        .setColor(0x888888)
        .setDescription(
          `Hey **${member.user.username}**, your 30-day **${tier.toUpperCase()}** membership on **GOAT 5X** has concluded.\n\n` +
          `Thank you so much for your support! To renew your perks and re-enable **HQ Building Upgrade & VIP Kits**, visit our official store at:\n` +
          `👉 **[Visit GOAT Store](${config.baseUrl}/#store)**`
        )
        .setFooter({ text: "GOAT SERVERS" });

      await member.send({ embeds: [dmEmbed] }).catch(() => {});
    } catch (_) {}

    return { success: true };
  } catch (err) {
    console.error("[Bot VIP Revoke Error]:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Automated 30-day VIP Expiration Daemon
 * Automatically revokes in-game Oxide groups, upgrade.hq, and Discord VIP role when 30 days pass
 */
export async function checkAndExpireVips() {
  if (!isBotReady) return;

  try {
    const expiredList = getExpiredVips();
    if (!expiredList || expiredList.length === 0) return;

    console.log(`[VIP Expiry Daemon] 🔍 Found ${expiredList.length} expired VIP subscription(s). Revoking perks...`);

    for (const user of expiredList) {
      const tier = user.vip_tier || "vip";
      console.log(`[VIP Expiry Daemon] 🔒 Expiring VIP for SteamID: ${user.steam_id} (${user.steam_name})`);

      // 1. Revoke in-game Oxide VIP group & HQ building permission via RCON
      await setRustServerVip(user.steam_id, false, tier, user.steam_name);

      // 2. Revoke Discord VIP role if user has linked Discord
      if (user.discord_id) {
        await revokeDiscordVipRole(user.discord_id, tier);
      }

      // 3. Update Firebase Firestore database
      revokeVipSubscription(user.steam_id);
    }
  } catch (err) {
    console.error("[VIP Expiry Daemon Error]:", err.message);
  }
}


