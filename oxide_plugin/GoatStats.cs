using System;
using System.Collections.Generic;
using Oxide.Core;
using Oxide.Core.Libraries;
using UnityEngine;

namespace Oxide.Plugins
{
    [Info("GoatStats", "GOAT 5X Team", "1.0.0")]
    [Description("Automated in-game stats synchronization for GOAT 5X Rust Server Leaderboard")]
    public class GoatStats : RustPlugin
    {
        // -----------------------------------------------------------
        // CONFIGURATION
        // -----------------------------------------------------------
        private string ApiEndpoint = "https://goat-production-d72e.up.railway.app/api/sync-stats";
        private string ApiSecret = "goat-stats-sync-secret";
        private int BatchSyncIntervalSeconds = 30;

        // In-memory buffer to aggregate stats before sending to API
        private Dictionary<ulong, PlayerBuffer> statBuffer = new Dictionary<ulong, PlayerBuffer>();
        private Timer syncTimer;

        public class PlayerBuffer
        {
            public string Name;
            public int Kills;
            public int Deaths;
            public int Headshots;
            public int ExplosivesUsed;
            public int WoodGathered;
            public int StoneGathered;
            public int MetalGathered;
            public int SulfurGathered;
        }

        private PlayerBuffer GetBuffer(BasePlayer player)
        {
            if (player == null) return null;
            if (!statBuffer.TryGetValue(player.userID, out var buffer))
            {
                buffer = new PlayerBuffer { Name = player.displayName };
                statBuffer[player.userID] = buffer;
            }
            buffer.Name = player.displayName;
            return buffer;
        }

        // -----------------------------------------------------------
        // OXIDE HOOKS
        // -----------------------------------------------------------
        void Loaded()
        {
            Puts("[GoatStats] Initialized. Syncing stats to " + ApiEndpoint);
            syncTimer = timer.Every(BatchSyncIntervalSeconds, FlushStats);
        }

        void Unload()
        {
            if (syncTimer != null)
            {
                syncTimer.Destroy();
            }
            FlushStats();
        }

        // 1. Track Player Deaths & Kills
        void OnPlayerDeath(BasePlayer player, HitInfo info)
        {
            if (player == null || player.IsNpc) return;

            var victimBuf = GetBuffer(player);
            if (victimBuf != null)
            {
                victimBuf.Deaths++;
            }

            if (info != null && info.InitiatorPlayer != null && info.InitiatorPlayer != player && !info.InitiatorPlayer.IsNpc)
            {
                var killerBuf = GetBuffer(info.InitiatorPlayer);
                if (killerBuf != null)
                {
                    killerBuf.Kills++;
                    if (info.isHeadshot)
                    {
                        killerBuf.Headshots++;
                    }
                }
            }
        }

        // 2. Track Gathering (Wood, Stone, Metal, Sulfur)
        void OnDispenserGather(ResourceDispenser dispenser, BaseEntity entity, Item item)
        {
            BasePlayer player = entity as BasePlayer;
            if (player == null || player.IsNpc || item == null) return;

            var buf = GetBuffer(player);
            if (buf == null) return;

            string shortname = item.info.shortname;
            int amount = item.amount;

            if (shortname == "sulfur.ore" || shortname == "sulfur")
            {
                buf.SulfurGathered += amount;
            }
            else if (shortname == "wood")
            {
                buf.WoodGathered += amount;
            }
            else if (shortname == "stones")
            {
                buf.StoneGathered += amount;
            }
            else if (shortname == "metal.ore" || shortname == "metal.refined")
            {
                buf.MetalGathered += amount;
            }
        }

        // 3. Track Explosives Thrown (C4, Satchels, Beancans)
        void OnExplosiveThrown(BasePlayer player, BaseEntity entity, ThrownWeapon item)
        {
            if (player == null || player.IsNpc || item == null) return;
            var buf = GetBuffer(player);
            if (buf != null)
            {
                buf.ExplosivesUsed++;
            }
        }

        // 4. Track Rockets Fired
        void OnRocketLaunched(BasePlayer player, BaseProjectile projectile)
        {
            if (player == null || player.IsNpc) return;
            var buf = GetBuffer(player);
            if (buf != null)
            {
                buf.ExplosivesUsed++;
            }
        }

        // -----------------------------------------------------------
        // API DISPATCHER
        // -----------------------------------------------------------
        private void FlushStats()
        {
            if (statBuffer.Count == 0) return;

            var currentBatch = new Dictionary<ulong, PlayerBuffer>(statBuffer);
            statBuffer.Clear();

            foreach (var kvp in currentBatch)
            {
                ulong steamId = kvp.Key;
                PlayerBuffer b = kvp.Value;

                // Only send if there is at least one stat to increment
                if (b.Kills == 0 && b.Deaths == 0 && b.Headshots == 0 &&
                    b.ExplosivesUsed == 0 && b.WoodGathered == 0 &&
                    b.StoneGathered == 0 && b.MetalGathered == 0 && b.SulfurGathered == 0)
                {
                    continue;
                }

                var payload = new Dictionary<string, object>
                {
                    { "secret", ApiSecret },
                    { "steam_id", steamId.ToString() },
                    { "steam_name", b.Name },
                    { "increment", true },
                    { "stats", new Dictionary<string, object>
                        {
                            { "kills", b.Kills },
                            { "deaths", b.Deaths },
                            { "headshots", b.Headshots },
                            { "explosives_used", b.ExplosivesUsed },
                            { "wood_gathered", b.WoodGathered },
                            { "stone_gathered", b.StoneGathered },
                            { "metal_gathered", b.MetalGathered },
                            { "sulfur_gathered", b.SulfurGathered }
                        }
                    }
                };

                string json = Oxide.Core.Libraries.Covalence.Formatter.ToPlaintext(Oxide.Core.Libraries.Covalence.Utility.ConvertToJson(payload));

                webrequest.Enqueue(
                    ApiEndpoint,
                    json,
                    (code, response) =>
                    {
                        if (code != 200)
                        {
                            Puts("[GoatStats] Sync error HTTP " + code + ": " + response);
                        }
                    },
                    this,
                    RequestMethod.POST,
                    new Dictionary<string, string> { { "Content-Type", "application/json" } },
                    5f
                );
            }
        }
    }
}
