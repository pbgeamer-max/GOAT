using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Oxide.Core;
using Oxide.Game.Rust.Cui;
using Oxide.Core.Plugins;
using UnityEngine;

namespace Oxide.Plugins
{
    [Info("Upgrade", "Antigravity", "3.1.0")]
    [Description("Direct upgrade & repair system with strict ascending grade logic, Discord linking requirement, HQ VIP Kit lock, instant raid block rejection, and zero-crash architecture.")]
    public class Upgrade : RustPlugin
    {
        [PluginReference]
        private Plugin DiscordAuth, DiscordCore, DiscordRoles;

        #region Fields & Constants

        private const string AdminPermission = "upgrade.admin";
        private const string LinkedPermission = "upgrade.linked";
        private const string HqPermission = "upgrade.hq";
        private const string MainUIName = "Upgrade_Side_Panel";
        private const string RustFont = "robotocondensed-bold.ttf";

        private static Upgrade _instance;
        private Configuration _config;

        private readonly Dictionary<ulong, UpgradeJob> _activeJobs = new Dictionary<ulong, UpgradeJob>();
        private readonly Dictionary<ulong, RepairJob> _activeRepairJobs = new Dictionary<ulong, RepairJob>();
        private readonly Dictionary<ulong, PlayerAutoUpgradeState> _playerStates = new Dictionary<ulong, PlayerAutoUpgradeState>();
        private readonly HashSet<ulong> _openTcPlayers = new HashSet<ulong>();
        private readonly Dictionary<ulong, float> _lastClickTime = new Dictionary<ulong, float>();

        private static ulong _sessionCounter = 0;

        private static readonly Dictionary<BuildingGrade.Enum, string> GradeResourceShortnames = new Dictionary<BuildingGrade.Enum, string>
        {
            [BuildingGrade.Enum.Wood] = "wood",
            [BuildingGrade.Enum.Stone] = "stones",
            [BuildingGrade.Enum.Metal] = "metal.fragments",
            [BuildingGrade.Enum.TopTier] = "metal.refined"
        };

        private static readonly Dictionary<BuildingGrade.Enum, string> GradeEffectPrefabs = new Dictionary<BuildingGrade.Enum, string>
        {
            [BuildingGrade.Enum.Wood] = "assets/bundled/prefabs/fx/build/promote_wood.prefab",
            [BuildingGrade.Enum.Stone] = "assets/bundled/prefabs/fx/build/promote_stone.prefab",
            [BuildingGrade.Enum.Metal] = "assets/bundled/prefabs/fx/build/promote_metal.prefab",
            [BuildingGrade.Enum.TopTier] = "assets/bundled/prefabs/fx/build/promote_toptier.prefab"
        };

        private const string GenericBuildEffect = "assets/bundled/prefabs/fx/build/repair.prefab";

        private readonly Dictionary<BuildingGrade.Enum, int> _cachedResourceItemIds = new Dictionary<BuildingGrade.Enum, int>();

        private readonly HashSet<ulong> _repairJobsBeingTornDown = new HashSet<ulong>();
        private readonly HashSet<ulong> _upgradeJobsBeingTornDown = new HashSet<ulong>();

        #endregion

        #region Configuration Data

        private class Configuration
        {
            [JsonProperty("RequireLinkedAccount (Only allow verified/linked accounts to upgrade/repair)")]
            public bool RequireLinkedAccount { get; set; } = true;

            [JsonProperty("WebsiteLinkUrl (Link to show players when not linked)")]
            public string WebsiteLinkUrl { get; set; } = "https://yourwebsite.com/link";

            [JsonProperty("RequirePermissionForHQ (Require specific permission/kit to upgrade to HQ)")]
            public bool RequirePermissionForHQ { get; set; } = true;

            [JsonProperty("StoreLinkUrl (Store link shown when player lacks HQ permission)")]
            public string StoreLinkUrl { get; set; } = "https://yourstore.com";

            [JsonProperty("CustomLinkedPermission (Oxide permission for linked players)")]
            public string CustomLinkedPermission { get; set; } = "discordauth.linked";

            [JsonProperty("CustomHqPermission (Oxide permission for HQ upgrade)")]
            public string CustomHqPermission { get; set; } = "upgrade.hq";

            [JsonProperty("UpgradeInterval (Seconds between pieces - Higher = Slower)")]
            public float UpgradeInterval { get; set; } = 0.35f;

            [JsonProperty("RepairInterval (Seconds between repairs - Higher = Slower)")]
            public float RepairInterval { get; set; } = 0.35f;

            [JsonProperty("MaxDistanceToTC (Meters before stopping)")]
            public float MaxDistanceToTC { get; set; } = 45f;

            [JsonProperty("BlockDuringRaid (Prevent upgrade and repair if raid blocked or attacked)")]
            public bool BlockDuringRaid { get; set; } = true;

            [JsonProperty("RaidDamageCooldownSeconds (Seconds to wait after base piece is attacked)")]
            public float RaidDamageCooldownSeconds { get; set; } = 30f;

            [JsonProperty("RepairCostRatio (Fraction of full build cost for 100% damage)")]
            public float RepairCostRatio { get; set; } = 0.20f;

            [JsonProperty("StopWhenLeavingTC")]
            public bool StopWhenLeavingTC { get; set; } = true;

            [JsonProperty("StopOnDeath")]
            public bool StopOnDeath { get; set; } = true;

            [JsonProperty("PlayEffectsOnUpgrade")]
            public bool PlayEffectsOnUpgrade { get; set; } = true;

            [JsonProperty("PlayEffectsOnRepair")]
            public bool PlayEffectsOnRepair { get; set; } = true;

            [JsonProperty("SortQueueByHeight (Ground up)")]
            public bool SortQueueByHeight { get; set; } = true;

            [JsonProperty("DebugLogging (Print debug info to console)")]
            public bool DebugLogging { get; set; } = false;

            [JsonProperty("UIPosition")]
            public UIPositionConfig UIPosition { get; set; } = new UIPositionConfig();

            [JsonProperty("BaseMaterials")]
            public BaseMaterialsConfig BaseMaterials { get; set; } = new BaseMaterialsConfig();
        }

        private class UIPositionConfig
        {
            [JsonProperty("AnchorMin")]
            public string AnchorMin { get; set; } = "0.950 0.145";

            [JsonProperty("AnchorMax")]
            public string AnchorMax { get; set; } = "0.995 0.315";
        }

        private class BaseMaterialsConfig
        {
            [JsonProperty("Wood")]
            public bool Wood { get; set; } = true;

            [JsonProperty("Stone")]
            public bool Stone { get; set; } = true;

            [JsonProperty("Metal")]
            public bool Metal { get; set; } = true;

            [JsonProperty("HQ")]
            public bool HQ { get; set; } = true;
        }

        protected override void LoadConfig()
        {
            base.LoadConfig();
            try
            {
                _config = Config.ReadObject<Configuration>();
                if (_config == null) throw new Exception();

                bool needsSave = false;
                if (_config.UIPosition == null)
                {
                    _config.UIPosition = new UIPositionConfig();
                    needsSave = true;
                }

                if (_config.BaseMaterials == null)
                {
                    _config.BaseMaterials = new BaseMaterialsConfig();
                    needsSave = true;
                }

                if (needsSave)
                {
                    SaveConfig();
                }
            }
            catch
            {
                Puts("Configuration file was invalid or missing. Generating default configuration...");
                LoadDefaultConfig();
            }
        }

        protected override void LoadDefaultConfig()
        {
            _config = new Configuration();
            SaveConfig();
        }

        protected override void SaveConfig() => Config.WriteObject(_config, true);

        #endregion

        #region Player State & Jobs

        private class PlayerAutoUpgradeState
        {
            public ulong PlayerId;
            public BuildingGrade.Enum TargetGrade = BuildingGrade.Enum.Wood;
            public string TargetDisplayName = "WOOD";
            public bool IsActive = false;
            public BuildingPrivlidge TargetTC;
        }

        private class UpgradeJob
        {
            public ulong PlayerId;
            public ulong SessionId;
            public BasePlayer Player;
            public BuildingPrivlidge TC;
            public uint BuildingId;
            public BuildingGrade.Enum TargetGrade;
            public string TargetDisplayName;
            public int TotalCount;
            public int CompletedCount;
            public Timer ScheduledTimer;
            public bool TickInProgress;
        }

        private class RepairJob
        {
            public ulong PlayerId;
            public ulong SessionId;
            public BasePlayer Player;
            public BuildingPrivlidge TC;
            public uint BuildingId;
            public List<NetworkableId> DamagedBlockIds = new List<NetworkableId>();
            public int TotalCount;
            public int CompletedCount;
            public Timer ScheduledTimer;
            public bool TickInProgress;
        }

        private PlayerAutoUpgradeState GetOrCreateState(BasePlayer player)
        {
            if (!_playerStates.TryGetValue(player.userID, out var state))
            {
                state = new PlayerAutoUpgradeState
                {
                    PlayerId = player.userID,
                    TargetGrade = BuildingGrade.Enum.Wood,
                    TargetDisplayName = "WOOD",
                    IsActive = false
                };
                _playerStates[player.userID] = state;
            }
            return state;
        }

        private void DebugLog(string message)
        {
            if (_config != null && _config.DebugLogging)
            {
                Puts($"[DEBUG] {message}");
            }
        }

        private bool IsClickThrottled(ulong playerId)
        {
            float now = Time.realtimeSinceStartup;
            if (_lastClickTime.TryGetValue(playerId, out float last) && (now - last) < 0.25f)
            {
                return true;
            }
            _lastClickTime[playerId] = now;
            return false;
        }

        private static bool FastContains(string source, string target)
        {
            return source != null && source.IndexOf(target, StringComparison.OrdinalIgnoreCase) >= 0;
        }

        private static bool IsBlockUsable(BuildingBlock block)
        {
            if (block == null) return false;
            if (block.IsDestroyed) return false;

            try
            {
                if (!block.IsValid()) return false;
                if (block.net == null || !block.net.ID.IsValid) return false;
                if (block.gameObject == null) return false;
                if (block.transform == null) return false;
            }
            catch
            {
                return false;
            }

            return true;
        }

        private static bool TryGetSafeMaxHealth(BuildingBlock block, out float maxHealth)
        {
            maxHealth = 0f;
            if (!IsBlockUsable(block)) return false;

            try
            {
                maxHealth = block.MaxHealth();
            }
            catch
            {
                return false;
            }

            if (float.IsNaN(maxHealth) || float.IsInfinity(maxHealth) || maxHealth <= 0.01f)
            {
                return false;
            }

            return true;
        }

        private static bool TryGetSafeHealth(BuildingBlock block, out float health)
        {
            health = 0f;
            if (!IsBlockUsable(block)) return false;

            try
            {
                health = block.Health();
            }
            catch
            {
                return false;
            }

            if (float.IsNaN(health) || float.IsInfinity(health) || health < 0f)
            {
                return false;
            }

            return true;
        }

        #endregion

        #region Verification & Permissions

        private bool IsPlayerLinked(BasePlayer player)
        {
            if (player == null) return false;
            if (!_config.RequireLinkedAccount) return true;

            // Admin bypass
            if (player.IsAdmin || (player.Connection != null && player.Connection.authLevel >= 1)) return true;
            if (permission.UserHasPermission(player.UserIDString, AdminPermission)) return true;

            // Permission / Group checks
            if (permission.UserHasPermission(player.UserIDString, LinkedPermission)) return true;
            if (permission.UserHasPermission(player.UserIDString, "goatkitsui.linked")) return true;
            if (permission.UserHasGroup(player.UserIDString, "linked")) return true;

            if (!string.IsNullOrEmpty(_config.CustomLinkedPermission) && permission.UserHasPermission(player.UserIDString, _config.CustomLinkedPermission))
                return true;

            if (permission.UserHasPermission(player.UserIDString, "discordauth.linked") || permission.UserHasPermission(player.UserIDString, "discordcore.linked"))
                return true;

            // External plugin hooks
            if (DiscordAuth != null && DiscordAuth.IsLoaded)
            {
                try { var res = DiscordAuth.Call("IsLinked", player.userID); if (res is bool b && b) return true; } catch { }
            }

            if (DiscordCore != null && DiscordCore.IsLoaded)
            {
                try { var res = DiscordCore.Call("IsLinked", player.userID); if (res is bool b && b) return true; } catch { }
            }

            return false;
        }

        private bool HasHqPermission(BasePlayer player)
        {
            if (player == null) return false;
            if (player.IsAdmin || (player.Connection != null && player.Connection.authLevel >= 1)) return true;
            if (permission.UserHasPermission(player.UserIDString, AdminPermission)) return true;
            if (permission.UserHasPermission(player.UserIDString, HqPermission)) return true;

            if (!string.IsNullOrEmpty(_config.CustomHqPermission) && permission.UserHasPermission(player.UserIDString, _config.CustomHqPermission))
                return true;

            return false;
        }

        #endregion

        #region Oxide Hooks

        private void Init()
        {
            _instance = this;
            permission.RegisterPermission(AdminPermission, this);
            permission.RegisterPermission(LinkedPermission, this);
            permission.RegisterPermission(HqPermission, this);
        }

        private void OnServerInitialized()
        {
            foreach (var kvp in GradeResourceShortnames)
            {
                var def = ItemManager.FindItemDefinition(kvp.Value);
                if (def != null)
                {
                    _cachedResourceItemIds[kvp.Key] = def.itemid;
                }
            }
        }

        private void Unload()
        {
            foreach (var kvp in _activeJobs.ToList())
            {
                StopUpgradeJob(kvp.Value, "Plugin unloaded.");
            }
            _activeJobs.Clear();

            foreach (var kvp in _activeRepairJobs.ToList())
            {
                StopRepairJob(kvp.Value, "Plugin unloaded.");
            }
            _activeRepairJobs.Clear();

            _playerStates.Clear();
            _lastClickTime.Clear();
            _repairJobsBeingTornDown.Clear();
            _upgradeJobsBeingTornDown.Clear();

            foreach (var player in BasePlayer.activePlayerList)
            {
                DestroyUI(player);
            }
            _openTcPlayers.Clear();
            _instance = null;
        }

        private void OnPlayerDisconnected(BasePlayer player, string reason)
        {
            if (player == null) return;

            _openTcPlayers.Remove(player.userID);
            _lastClickTime.Remove(player.userID);

            if (_activeJobs.TryGetValue(player.userID, out var job))
            {
                StopUpgradeJob(job, "Player disconnected.");
            }
            if (_activeRepairJobs.TryGetValue(player.userID, out var repJob))
            {
                StopRepairJob(repJob, "Player disconnected.");
            }
            _playerStates.Remove(player.userID);
            DestroyUI(player);
        }

        private void OnPlayerDeath(BasePlayer player, HitInfo info)
        {
            if (player == null) return;

            _openTcPlayers.Remove(player.userID);
            DestroyUI(player);

            if (_config.StopOnDeath)
            {
                if (_playerStates.TryGetValue(player.userID, out var state))
                {
                    state.IsActive = false;
                }

                if (_activeJobs.TryGetValue(player.userID, out var job))
                {
                    StopUpgradeJob(job, GetLang("JobStoppedDeath", player.UserIDString));
                }

                if (_activeRepairJobs.TryGetValue(player.userID, out var repJob))
                {
                    StopRepairJob(repJob, GetLang("JobStoppedDeath", player.UserIDString));
                }
            }
        }

        private void OnLootEntity(BasePlayer player, BaseEntity entity)
        {
            if (player == null || entity == null) return;

            if (entity is BuildingPrivlidge tc)
            {
                var state = GetOrCreateState(player);
                state.TargetTC = tc;

                _openTcPlayers.Add(player.userID);
                NextTick(() =>
                {
                    if (player != null && player.IsValid() && player.IsConnected && _openTcPlayers.Contains(player.userID))
                    {
                        CreateUpgradeUI(player, tc);
                    }
                });
            }
        }

        private void OnLootEntityEnd(BasePlayer player, BaseEntity entity)
        {
            if (player == null) return;

            if (entity is BuildingPrivlidge tc)
            {
                _openTcPlayers.Remove(player.userID);
                DestroyUI(player);

                if (_config.StopWhenLeavingTC)
                {
                    if (_activeJobs.TryGetValue(player.userID, out var job))
                    {
                        if (job.TC == null || !job.TC.IsValid() || Vector3.Distance(player.transform.position, job.TC.transform.position) > _config.MaxDistanceToTC)
                        {
                            StopUpgradeJob(job, GetLang("JobStoppedLeftTC", player.UserIDString));
                        }
                    }

                    if (_activeRepairJobs.TryGetValue(player.userID, out var repJob))
                    {
                        if (repJob.TC == null || !repJob.TC.IsValid() || Vector3.Distance(player.transform.position, repJob.TC.transform.position) > _config.MaxDistanceToTC)
                        {
                            StopRepairJob(repJob, GetLang("JobStoppedLeftTC", player.UserIDString));
                        }
                    }
                }
            }
        }

        private void OnPlayerLootEnd(PlayerLoot inventory)
        {
            var player = inventory?.baseEntity as BasePlayer;
            if (player == null) return;

            _openTcPlayers.Remove(player.userID);
            DestroyUI(player);
        }

        #endregion

        #region Helpers & Resource Mechanics

        public int GetGradeLevel(BuildingGrade.Enum grade)
        {
            switch (grade)
            {
                case BuildingGrade.Enum.Wood:
                    return 1;
                case BuildingGrade.Enum.Stone:
                    return 2;
                case BuildingGrade.Enum.Metal:
                    return 3;
                case BuildingGrade.Enum.TopTier:
                    return 4;
                default:
                    return 0;
            }
        }

        private bool BlockNeedsUpgrade(BuildingBlock block, BuildingGrade.Enum targetGrade)
        {
            if (!IsBlockUsable(block)) return false;
            return GetGradeLevel(block.grade) < GetGradeLevel(targetGrade);
        }

        private bool BlockNeedsRepair(BuildingBlock block)
        {
            if (!TryGetSafeMaxHealth(block, out float maxHp)) return false;
            if (!TryGetSafeHealth(block, out float curHp)) return false;
            return curHp < (maxHp - 0.5f);
        }

        private int GetResourceIdForGrade(BuildingGrade.Enum grade)
        {
            if (_cachedResourceItemIds.TryGetValue(grade, out int id))
                return id;

            if (GradeResourceShortnames.TryGetValue(grade, out string shortname))
            {
                var def = ItemManager.FindItemDefinition(shortname);
                if (def != null)
                {
                    _cachedResourceItemIds[grade] = def.itemid;
                    return def.itemid;
                }
            }

            return 0;
        }

        private int GetAvailableResource(BuildingPrivlidge tc, int itemId)
        {
            if (itemId == 0 || tc == null || !tc.IsValid() || tc.inventory == null) return 0;
            try
            {
                return tc.inventory.GetAmount(itemId, true);
            }
            catch
            {
                return 0;
            }
        }

        private bool DeductResource(BuildingPrivlidge tc, int itemId, int amount)
        {
            if (amount <= 0 || itemId == 0 || tc == null || !tc.IsValid() || tc.inventory == null) return false;

            try
            {
                int inTc = tc.inventory.GetAmount(itemId, true);
                if (inTc < amount)
                {
                    return false;
                }

                tc.inventory.Take(null, itemId, amount);
                return true;
            }
            catch (Exception ex)
            {
                DebugLog($"Exception in DeductResource (itemId={itemId}, amount={amount}): {ex.Message}");
                return false;
            }
        }

        private void RefundResource(BuildingPrivlidge tc, int resId, int amount)
        {
            if (tc == null || !tc.IsValid() || tc.inventory == null || resId <= 0 || amount <= 0) return;

            try
            {
                var refundItem = ItemManager.CreateByItemID(resId, amount);
                if (refundItem != null)
                {
                    if (!tc.inventory.GiveItem(refundItem))
                    {
                        refundItem.Drop(tc.transform.position, Vector3.up * 0.5f);
                    }
                }
            }
            catch (Exception ex)
            {
                DebugLog($"Exception refunding resource itemId={resId} amount={amount}: {ex.Message}");
            }
        }

        private int GetBaseResourceCostForPiece(BuildingBlock block, BuildingGrade.Enum targetGrade)
        {
            int baseAmount;
            switch (targetGrade)
            {
                case BuildingGrade.Enum.Wood:
                    baseAmount = 100;
                    break;
                case BuildingGrade.Enum.Stone:
                    baseAmount = 300;
                    break;
                case BuildingGrade.Enum.Metal:
                    baseAmount = 200;
                    break;
                case BuildingGrade.Enum.TopTier:
                    baseAmount = 25;
                    break;
                default:
                    return 0;
            }

            if (block != null && IsBlockUsable(block))
            {
                string name = block.ShortPrefabName;
                if (FastContains(name, "triangle") || FastContains(name, "frame"))
                {
                    baseAmount = Mathf.Max(1, baseAmount / 2);
                }
                else if (FastContains(name, "roof"))
                {
                    baseAmount = (int)(baseAmount * 1.5f);
                }
            }

            return baseAmount;
        }

        private int GetBlockCategoryOrder(BuildingBlock block)
        {
            string name = block.ShortPrefabName;
            if (FastContains(name, "foundation")) return 1;
            if (FastContains(name, "wall") || FastContains(name, "doorway") || FastContains(name, "window")) return 2;
            if (FastContains(name, "floor")) return 3;
            if (FastContains(name, "roof")) return 4;
            if (FastContains(name, "stairs")) return 5;
            return 6;
        }

        private static List<BuildingBlock> CreateSafeBlockSnapshot(BuildingPrivlidge tc)
        {
            var snapshot = new List<BuildingBlock>();
            if (tc == null || !tc.IsValid() || tc.IsDestroyed) return snapshot;

            try
            {
                var building = tc.GetBuilding();
                if (building == null || building.buildingBlocks == null) return snapshot;

                uint tcBuildingId = tc.buildingID;
                foreach (var block in building.buildingBlocks)
                {
                    if (IsBlockUsable(block))
                    {
                        if (tcBuildingId == 0 || block.buildingID == tcBuildingId)
                        {
                            snapshot.Add(block);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _instance?.DebugLog($"Exception creating block snapshot: {ex.Message}");
            }

            return snapshot;
        }

        #endregion

        #region Upgrade Logic

        [ConsoleCommand("upgrade.click")]
        private void CmdUpgradeClick(ConsoleSystem.Arg arg)
        {
            var player = arg.Player();
            if (player == null) return;

            if (IsClickThrottled(player.userID))
            {
                return;
            }

            string actionType = arg.GetString(0);
            string targetKey = arg.GetString(1);

            switch (actionType.ToLowerInvariant())
            {
                case "repair":
                    ToggleRepairMode(player);
                    break;

                case "select_material":
                    HandleMaterialClick(player, targetKey);
                    break;
            }
        }

        private bool TryResolveGradeFromKey(string selectionKey, out BuildingGrade.Enum grade, out string displayName)
        {
            if (selectionKey.Equals("Wood", StringComparison.OrdinalIgnoreCase))
            {
                grade = BuildingGrade.Enum.Wood;
                displayName = "WOOD";
                return true;
            }
            if (selectionKey.Equals("Stone", StringComparison.OrdinalIgnoreCase))
            {
                grade = BuildingGrade.Enum.Stone;
                displayName = "STONE";
                return true;
            }
            if (selectionKey.Equals("Metal", StringComparison.OrdinalIgnoreCase))
            {
                grade = BuildingGrade.Enum.Metal;
                displayName = "METAL";
                return true;
            }
            if (selectionKey.Equals("HQ", StringComparison.OrdinalIgnoreCase) || selectionKey.Equals("TopTier", StringComparison.OrdinalIgnoreCase))
            {
                grade = BuildingGrade.Enum.TopTier;
                displayName = "HQ";
                return true;
            }

            grade = BuildingGrade.Enum.None;
            displayName = null;
            return false;
        }

        private void HandleMaterialClick(BasePlayer player, string selectionKey)
        {
            var tc = player.GetBuildingPrivilege();
            if (tc == null || !tc.IsValid() || tc.IsDestroyed)
            {
                SendReply(player, GetLang("NoValidTC", player.UserIDString));
                return;
            }

            if (!tc.IsAuthed(player.userID))
            {
                SendReply(player, GetLang("NotAuthedOnTC", player.UserIDString));
                return;
            }

            // 1. Account Linking Lock
            if (!IsPlayerLinked(player))
            {
                SendReply(player, GetLang("AccountNotLinked", player.UserIDString, _config.WebsiteLinkUrl));
                Effect.server.Run("assets/prefabs/locks/keypad/sound/lock.code.denied.prefab", player.transform.position);
                return;
            }

            if (!TryResolveGradeFromKey(selectionKey, out BuildingGrade.Enum grade, out string displayName))
            {
                return;
            }

            // 2. HQ VIP / Kit Lock
            if (grade == BuildingGrade.Enum.TopTier && _config.RequirePermissionForHQ)
            {
                if (!HasHqPermission(player))
                {
                    SendReply(player, GetLang("NoHqPermission", player.UserIDString, _config.StoreLinkUrl));
                    Effect.server.Run("assets/prefabs/locks/keypad/sound/lock.code.denied.prefab", player.transform.position);
                    return;
                }
            }

            var state = GetOrCreateState(player);
            state.TargetTC = tc;

            if (state.IsActive && state.TargetGrade == grade && _activeJobs.TryGetValue(player.userID, out var runningJob))
            {
                state.IsActive = false;
                StopUpgradeJob(runningJob, GetLang("UpgradeStoppedByUser", player.UserIDString));
                return;
            }

            if (IsRaidBlocked(player, tc))
            {
                state.IsActive = false;
                SendReply(player, GetLang("RaidBlocked", player.UserIDString));
                Effect.server.Run("assets/prefabs/locks/keypad/sound/lock.code.denied.prefab", player.transform.position);
                if (_openTcPlayers.Contains(player.userID))
                    CreateUpgradeUI(player, tc);
                return;
            }

            if (_activeRepairJobs.TryGetValue(player.userID, out var repJob))
            {
                StopRepairJob(repJob, null);
            }

            if (_activeJobs.TryGetValue(player.userID, out var oldJob))
            {
                StopUpgradeJob(oldJob, null);
            }

            state.TargetGrade = grade;
            state.TargetDisplayName = displayName;
            state.IsActive = true;

            StartUpgradeJobForPlayer(player, state, tc);
        }

        private void StartUpgradeJobForPlayer(BasePlayer player, PlayerAutoUpgradeState state, BuildingPrivlidge tc)
        {
            BuildingGrade.Enum targetGrade = state.TargetGrade;
            string targetDisplayName = state.TargetDisplayName;

            var snapshot = CreateSafeBlockSnapshot(tc);
            if (snapshot.Count == 0)
            {
                state.IsActive = false;
                SendReply(player, GetLang("NoBlocksFound", player.UserIDString));
                if (_openTcPlayers.Contains(player.userID)) CreateUpgradeUI(player, tc);
                return;
            }

            int countNeedingUpgrade = 0;
            foreach (var block in snapshot)
            {
                if (BlockNeedsUpgrade(block, targetGrade))
                {
                    countNeedingUpgrade++;
                }
            }

            if (countNeedingUpgrade == 0)
            {
                state.IsActive = false;
                SendReply(player, GetLang("NoBlocksNeedUpgrade", player.UserIDString, targetDisplayName));
                if (_openTcPlayers.Contains(player.userID)) CreateUpgradeUI(player, tc);
                return;
            }

            int resourceItemId = GetResourceIdForGrade(targetGrade);
            int availableResource = GetAvailableResource(tc, resourceItemId);
            int minCostNeeded = GetBaseResourceCostForPiece(null, targetGrade) / 2;

            if (availableResource < minCostNeeded)
            {
                state.IsActive = false;
                string resName = targetGrade.ToString().ToUpperInvariant();
                SendReply(player, GetLang("NoResourceAvailable", player.UserIDString, resName, targetDisplayName));
                Effect.server.Run("assets/prefabs/locks/keypad/sound/lock.code.denied.prefab", player.transform.position);
                if (_openTcPlayers.Contains(player.userID)) CreateUpgradeUI(player, tc);
                return;
            }

            if (_activeJobs.TryGetValue(player.userID, out var existingJob))
            {
                StopUpgradeJob(existingJob, null);
            }

            ulong sessionId = ++_sessionCounter;
            var newJob = new UpgradeJob
            {
                PlayerId = player.userID,
                SessionId = sessionId,
                Player = player,
                TC = tc,
                BuildingId = tc.buildingID,
                TargetGrade = targetGrade,
                TargetDisplayName = targetDisplayName,
                TotalCount = countNeedingUpgrade,
                CompletedCount = 0,
                TickInProgress = false
            };

            _activeJobs[player.userID] = newJob;

            SendReply(player, GetLang("UpgradeStarted", player.UserIDString, targetDisplayName, countNeedingUpgrade));

            ScheduleNextUpgradeTick(newJob, _config.UpgradeInterval);

            if (_openTcPlayers.Contains(player.userID))
            {
                CreateUpgradeUI(player, tc);
            }
        }

        private void ScheduleNextUpgradeTick(UpgradeJob job, float delay)
        {
            if (job == null) return;

            if (job.ScheduledTimer != null && !job.ScheduledTimer.Destroyed)
            {
                try { job.ScheduledTimer.Destroy(); } catch { }
            }

            job.ScheduledTimer = timer.Once(delay, () =>
            {
                if (!_activeJobs.TryGetValue(job.PlayerId, out var currentJob) || currentJob.SessionId != job.SessionId)
                {
                    return;
                }

                if (job.TickInProgress) return;

                job.TickInProgress = true;
                try
                {
                    ProcessUpgradeTick(job);
                }
                finally
                {
                    job.TickInProgress = false;
                }
            });
        }

        private void ProcessUpgradeTick(UpgradeJob job)
        {
            if (job == null) return;

            try
            {
                if (job.Player == null || !job.Player.IsConnected)
                {
                    StopUpgradeJob(job, "Player disconnected.");
                    return;
                }

                if (_config.StopOnDeath && (!job.Player.IsAlive() || job.Player.IsSleeping()))
                {
                    StopUpgradeJob(job, GetLang("JobStoppedDeath", job.Player.UserIDString));
                    return;
                }

                if (job.TC == null || !job.TC.IsValid() || job.TC.IsDestroyed)
                {
                    StopUpgradeJob(job, GetLang("TCWasDestroyed", job.Player.UserIDString));
                    return;
                }

                if (_config.StopWhenLeavingTC && Vector3.Distance(job.Player.transform.position, job.TC.transform.position) > _config.MaxDistanceToTC)
                {
                    StopUpgradeJob(job, GetLang("JobStoppedLeftTC", job.Player.UserIDString));
                    return;
                }

                if (IsRaidBlocked(job.Player, job.TC))
                {
                    StopUpgradeJob(job, GetLang("JobStoppedRaidBlock", job.Player.UserIDString));
                    return;
                }

                var snapshot = CreateSafeBlockSnapshot(job.TC);
                if (snapshot.Count == 0)
                {
                    CompleteUpgradeJob(job);
                    return;
                }

                int blocksNeedingUpgrade = 0;
                BuildingBlock bestCandidate = null;
                int bestCandidateCategory = int.MaxValue;
                float bestCandidateY = float.MaxValue;

                foreach (var block in snapshot)
                {
                    if (!IsBlockUsable(block)) continue;
                    if (!BlockNeedsUpgrade(block, job.TargetGrade)) continue;

                    blocksNeedingUpgrade++;

                    float secondsSinceAttacked;
                    try { secondsSinceAttacked = block.SecondsSinceAttacked; }
                    catch { continue; }

                    if (_config.RaidDamageCooldownSeconds > 0 && secondsSinceAttacked < _config.RaidDamageCooldownSeconds)
                    {
                        StopUpgradeJob(job, GetLang("JobStoppedRaidBlock", job.Player.UserIDString));
                        return;
                    }

                    if (!_config.SortQueueByHeight)
                    {
                        if (bestCandidate == null)
                        {
                            bestCandidate = block;
                        }
                    }
                    else
                    {
                        int cat = GetBlockCategoryOrder(block);
                        float y = block.transform.position.y;

                        if (bestCandidate == null || cat < bestCandidateCategory || (cat == bestCandidateCategory && y < bestCandidateY))
                        {
                            bestCandidate = block;
                            bestCandidateCategory = cat;
                            bestCandidateY = y;
                        }
                    }
                }

                if (blocksNeedingUpgrade == 0)
                {
                    CompleteUpgradeJob(job);
                    return;
                }

                job.TotalCount = Mathf.Max(job.TotalCount, job.CompletedCount + blocksNeedingUpgrade);

                if (bestCandidate == null)
                {
                    StopUpgradeJob(job, GetLang("JobStoppedRaidBlock", job.Player.UserIDString));
                    return;
                }

                if (!IsBlockUsable(bestCandidate) || !BlockNeedsUpgrade(bestCandidate, job.TargetGrade))
                {
                    ScheduleNextUpgradeTick(job, _config.UpgradeInterval);
                    return;
                }

                int resId = GetResourceIdForGrade(job.TargetGrade);
                int cost = GetBaseResourceCostForPiece(bestCandidate, job.TargetGrade);
                int available = GetAvailableResource(job.TC, resId);

                if (available < cost)
                {
                    StopUpgradeJob(job, GetLang("ResourcesExhaustedPartial", job.Player.UserIDString, job.CompletedCount, job.TotalCount));
                    return;
                }

                if (TryUpgradeSingleBlockDirect(job.TC, job.Player, bestCandidate, job.TargetGrade))
                {
                    job.CompletedCount++;

                    if (blocksNeedingUpgrade <= 1)
                    {
                        CompleteUpgradeJob(job);
                        return;
                    }
                }

                ScheduleNextUpgradeTick(job, _config.UpgradeInterval);
            }
            catch (Exception ex)
            {
                PrintError($"Unhandled exception in ProcessUpgradeTick for player {job?.PlayerId}: {ex}");
                StopUpgradeJob(job, null);
            }
        }

        private bool TryUpgradeSingleBlockDirect(BuildingPrivlidge tc, BasePlayer player, BuildingBlock block, BuildingGrade.Enum grade)
        {
            if (tc == null || !tc.IsValid() || tc.IsDestroyed) return false;
            if (!IsBlockUsable(block)) return false;
            if (!BlockNeedsUpgrade(block, grade)) return false;

            int resId = GetResourceIdForGrade(grade);
            if (resId == 0) return false;
            int cost = GetBaseResourceCostForPiece(block, grade);

            int available = GetAvailableResource(tc, resId);
            if (available < cost) return false;

            if (!DeductResource(tc, resId, cost)) return false;

            if (!IsBlockUsable(block))
            {
                RefundResource(tc, resId, cost);
                return false;
            }

            try
            {
                block.SetGrade(grade);
                block.SetHealthToMax();
                block.SendNetworkUpdate(BasePlayer.NetworkQueue.Update);
                block.UpdateSkin();
            }
            catch (Exception ex)
            {
                RefundResource(tc, resId, cost);
                PrintError($"Error upgrading block (grade={grade}): {ex}");
                return false;
            }

            if (_config.PlayEffectsOnUpgrade)
            {
                SafePlayPromoteEffect(grade, SafeGetPosition(block));
            }

            return true;
        }

        private void StopUpgradeJob(UpgradeJob job, string reason)
        {
            if (job == null) return;

            if (_upgradeJobsBeingTornDown.Contains(job.PlayerId)) return;
            _upgradeJobsBeingTornDown.Add(job.PlayerId);

            try
            {
                try
                {
                    if (job.ScheduledTimer != null && !job.ScheduledTimer.Destroyed)
                    {
                        job.ScheduledTimer.Destroy();
                    }
                }
                catch { }
                job.ScheduledTimer = null;

                if (_activeJobs.TryGetValue(job.PlayerId, out var currentlyTracked) && currentlyTracked.SessionId == job.SessionId)
                {
                    _activeJobs.Remove(job.PlayerId);
                }

                if (_playerStates.TryGetValue(job.PlayerId, out var state))
                {
                    state.IsActive = false;
                }

                if (job.Player != null && job.Player.IsConnected)
                {
                    if (!string.IsNullOrEmpty(reason))
                    {
                        SendReply(job.Player, reason);
                    }

                    if (_openTcPlayers.Contains(job.PlayerId) && job.TC != null && job.TC.IsValid())
                    {
                        CreateUpgradeUI(job.Player, job.TC);
                    }
                }
            }
            catch (Exception ex)
            {
                PrintError($"Unhandled exception in StopUpgradeJob: {ex}");
            }
            finally
            {
                _upgradeJobsBeingTornDown.Remove(job.PlayerId);
            }
        }

        private void CompleteUpgradeJob(UpgradeJob job)
        {
            if (job == null) return;

            if (_upgradeJobsBeingTornDown.Contains(job.PlayerId)) return;
            _upgradeJobsBeingTornDown.Add(job.PlayerId);

            try
            {
                try
                {
                    if (job.ScheduledTimer != null && !job.ScheduledTimer.Destroyed)
                    {
                        job.ScheduledTimer.Destroy();
                    }
                }
                catch { }
                job.ScheduledTimer = null;

                if (_activeJobs.TryGetValue(job.PlayerId, out var currentlyTracked) && currentlyTracked.SessionId == job.SessionId)
                {
                    _activeJobs.Remove(job.PlayerId);
                }

                if (_playerStates.TryGetValue(job.PlayerId, out var state))
                {
                    state.IsActive = false;
                }

                if (job.Player != null && job.Player.IsConnected)
                {
                    SendReply(job.Player, GetLang("UpgradeComplete", job.Player.UserIDString, job.CompletedCount));
                    SafePlayPromoteEffect(job.TargetGrade, SafeGetPositionOfPlayer(job.Player));

                    if (_openTcPlayers.Contains(job.PlayerId) && job.TC != null && job.TC.IsValid())
                    {
                        CreateUpgradeUI(job.Player, job.TC);
                    }
                }
            }
            catch (Exception ex)
            {
                PrintError($"Unhandled exception in CompleteUpgradeJob: {ex}");
            }
            finally
            {
                _upgradeJobsBeingTornDown.Remove(job.PlayerId);
            }
        }

        private static Vector3 SafeGetPosition(BuildingBlock block)
        {
            try
            {
                if (IsBlockUsable(block))
                {
                    return block.transform.position;
                }
            }
            catch { }
            return Vector3.zero;
        }

        private static Vector3 SafeGetPositionOfPlayer(BasePlayer player)
        {
            try
            {
                if (player != null && player.IsValid())
                {
                    return player.transform.position;
                }
            }
            catch { }
            return Vector3.zero;
        }

        private void SafePlayPromoteEffect(BuildingGrade.Enum grade, Vector3 position)
        {
            if (position == Vector3.zero) return;

            string prefab = GradeEffectPrefabs.TryGetValue(grade, out string specific)
                ? specific
                : GenericBuildEffect;

            try
            {
                Effect.server.Run(prefab, position);
            }
            catch { }
        }

        #endregion

        #region Safe Queue-Based Repair Engine

        private void ToggleRepairMode(BasePlayer player)
        {
            var tc = player.GetBuildingPrivilege();
            if (tc == null || !tc.IsValid() || tc.IsDestroyed)
            {
                SendReply(player, GetLang("NoValidTC", player.UserIDString));
                return;
            }

            if (!tc.IsAuthed(player.userID))
            {
                SendReply(player, GetLang("NotAuthedOnTC", player.UserIDString));
                return;
            }

            // 1. Account Linking Lock
            if (!IsPlayerLinked(player))
            {
                SendReply(player, GetLang("AccountNotLinked", player.UserIDString, _config.WebsiteLinkUrl));
                Effect.server.Run("assets/prefabs/locks/keypad/sound/lock.code.denied.prefab", player.transform.position);
                return;
            }

            if (_activeRepairJobs.TryGetValue(player.userID, out var runningRepJob))
            {
                StopRepairJob(runningRepJob, GetLang("RepairStoppedByUser", player.UserIDString));
                return;
            }

            if (IsRaidBlocked(player, tc))
            {
                SendReply(player, GetLang("RaidBlocked", player.UserIDString));
                Effect.server.Run("assets/prefabs/locks/keypad/sound/lock.code.denied.prefab", player.transform.position);
                if (_openTcPlayers.Contains(player.userID))
                    CreateUpgradeUI(player, tc);
                return;
            }

            var state = GetOrCreateState(player);
            state.IsActive = false;

            if (_activeJobs.TryGetValue(player.userID, out var upJob))
            {
                StopUpgradeJob(upJob, null);
            }

            StartRepairJobForPlayer(player, tc);
        }

        private void StartRepairJobForPlayer(BasePlayer player, BuildingPrivlidge tc)
        {
            if (tc == null || !tc.IsValid() || tc.IsDestroyed)
            {
                SendReply(player, GetLang("NoValidTC", player.UserIDString));
                return;
            }

            var snapshot = CreateSafeBlockSnapshot(tc);
            if (snapshot.Count == 0)
            {
                SendReply(player, GetLang("NoBlocksFound", player.UserIDString));
                if (_openTcPlayers.Contains(player.userID)) CreateUpgradeUI(player, tc);
                return;
            }

            var damagedBlocks = new List<BuildingBlock>();
            foreach (var block in snapshot)
            {
                if (BlockNeedsRepair(block))
                {
                    damagedBlocks.Add(block);
                }
            }

            if (damagedBlocks.Count == 0)
            {
                SendReply(player, GetLang("NoDamagedBlocks", player.UserIDString));
                if (_openTcPlayers.Contains(player.userID)) CreateUpgradeUI(player, tc);
                return;
            }

            if (_config.SortQueueByHeight)
            {
                damagedBlocks.Sort((a, b) =>
                {
                    int catA = GetBlockCategoryOrder(a);
                    int catB = GetBlockCategoryOrder(b);
                    if (catA != catB) return catA.CompareTo(catB);
                    return a.transform.position.y.CompareTo(b.transform.position.y);
                });
            }

            var idQueue = new List<NetworkableId>(damagedBlocks.Count);
            foreach (var b in damagedBlocks)
            {
                if (b.net != null && b.net.ID.IsValid)
                {
                    idQueue.Add(b.net.ID);
                }
            }

            if (_activeRepairJobs.TryGetValue(player.userID, out var existingJob))
            {
                StopRepairJob(existingJob, null);
            }

            ulong sessionId = ++_sessionCounter;
            var repJob = new RepairJob
            {
                PlayerId = player.userID,
                SessionId = sessionId,
                Player = player,
                TC = tc,
                BuildingId = tc.buildingID,
                DamagedBlockIds = idQueue,
                TotalCount = idQueue.Count,
                CompletedCount = 0,
                TickInProgress = false
            };

            _activeRepairJobs[player.userID] = repJob;

            SendReply(player, GetLang("RepairStarted", player.UserIDString, idQueue.Count));

            ScheduleNextRepairTick(repJob, _config.RepairInterval);

            if (_openTcPlayers.Contains(player.userID))
            {
                CreateUpgradeUI(player, tc);
            }
        }

        private void ScheduleNextRepairTick(RepairJob job, float delay)
        {
            if (job == null) return;

            if (job.ScheduledTimer != null && !job.ScheduledTimer.Destroyed)
            {
                try { job.ScheduledTimer.Destroy(); } catch { }
            }

            job.ScheduledTimer = timer.Once(delay, () =>
            {
                if (!_activeRepairJobs.TryGetValue(job.PlayerId, out var currentJob) || currentJob.SessionId != job.SessionId)
                {
                    return;
                }

                if (job.TickInProgress) return;

                job.TickInProgress = true;
                try
                {
                    ProcessRepairTick(job);
                }
                finally
                {
                    job.TickInProgress = false;
                }
            });
        }

        private void ProcessRepairTick(RepairJob job)
        {
            if (job == null) return;

            try
            {
                if (job.Player == null || !job.Player.IsConnected)
                {
                    StopRepairJob(job, "Player disconnected.");
                    return;
                }

                if (_config.StopOnDeath && (!job.Player.IsAlive() || job.Player.IsSleeping()))
                {
                    StopRepairJob(job, GetLang("JobStoppedDeath", job.Player.UserIDString));
                    return;
                }

                if (job.TC == null || !job.TC.IsValid() || job.TC.IsDestroyed)
                {
                    StopRepairJob(job, GetLang("TCWasDestroyed", job.Player.UserIDString));
                    return;
                }

                if (_config.StopWhenLeavingTC && Vector3.Distance(job.Player.transform.position, job.TC.transform.position) > _config.MaxDistanceToTC)
                {
                    StopRepairJob(job, GetLang("JobStoppedLeftTC", job.Player.UserIDString));
                    return;
                }

                if (IsRaidBlocked(job.Player, job.TC))
                {
                    StopRepairJob(job, GetLang("JobStoppedRaidBlock", job.Player.UserIDString));
                    return;
                }

                BuildingBlock targetBlock = null;
                while (job.DamagedBlockIds.Count > 0)
                {
                    var nextId = job.DamagedBlockIds[0];
                    job.DamagedBlockIds.RemoveAt(0);

                    if (!nextId.IsValid) continue;

                    var ent = BaseNetworkable.serverEntities.Find(nextId) as BuildingBlock;
                    if (ent != null && IsBlockUsable(ent) && BlockNeedsRepair(ent))
                    {
                        if (_config.RaidDamageCooldownSeconds > 0)
                        {
                            float secondsSinceAttacked;
                            try { secondsSinceAttacked = ent.SecondsSinceAttacked; }
                            catch { secondsSinceAttacked = float.MaxValue; }

                            if (secondsSinceAttacked < _config.RaidDamageCooldownSeconds)
                            {
                                StopRepairJob(job, GetLang("JobStoppedRaidBlock", job.Player.UserIDString));
                                return;
                            }
                        }

                        targetBlock = ent;
                        break;
                    }
                }

                if (targetBlock == null)
                {
                    CompleteRepairJob(job);
                    return;
                }

                int resId = GetResourceIdForGrade(targetBlock.grade);
                if (resId == 0)
                {
                    ScheduleNextRepairTick(job, _config.RepairInterval);
                    return;
                }

                if (!TryGetSafeMaxHealth(targetBlock, out float maxHp) || !TryGetSafeHealth(targetBlock, out float curHp))
                {
                    ScheduleNextRepairTick(job, _config.RepairInterval);
                    return;
                }

                int fullBuildCost = GetBaseResourceCostForPiece(targetBlock, targetBlock.grade);
                float missingHpRatio = Mathf.Clamp01((maxHp - curHp) / maxHp);
                int repairCost = Mathf.Max(1, (int)(fullBuildCost * _config.RepairCostRatio * missingHpRatio));
                int available = GetAvailableResource(job.TC, resId);

                if (available < repairCost)
                {
                    string resName = targetBlock.grade.ToString().ToUpperInvariant();
                    StopRepairJob(job, GetLang("RepairNoResource", job.Player.UserIDString, resName));
                    return;
                }

                if (TryRepairSingleBlockDirect(job.TC, job.Player, targetBlock, maxHp, resId, repairCost))
                {
                    job.CompletedCount++;

                    if (job.DamagedBlockIds.Count == 0)
                    {
                        CompleteRepairJob(job);
                        return;
                    }
                }

                ScheduleNextRepairTick(job, _config.RepairInterval);
            }
            catch (Exception ex)
            {
                PrintError($"[Repair Engine] Exception for player {job?.PlayerId}: {ex}");
                StopRepairJob(job, null);
            }
        }

        private bool TryRepairSingleBlockDirect(BuildingPrivlidge tc, BasePlayer player, BuildingBlock block, float maxHp, int resId, int repairCost)
        {
            if (tc == null || !tc.IsValid() || tc.IsDestroyed) return false;
            if (!IsBlockUsable(block)) return false;

            if (!DeductResource(tc, resId, repairCost)) return false;

            if (!IsBlockUsable(block))
            {
                RefundResource(tc, resId, repairCost);
                return false;
            }

            try
            {
                block.SetHealth(maxHp);
                block.SendNetworkUpdate(BasePlayer.NetworkQueue.Update);
            }
            catch (Exception ex)
            {
                RefundResource(tc, resId, repairCost);
                PrintError($"[Repair Engine] Block healing failed: {ex}");
                return false;
            }

            if (_config.PlayEffectsOnRepair)
            {
                SafePlayGenericEffect(SafeGetPosition(block));
            }

            return true;
        }

        private void SafePlayGenericEffect(Vector3 position)
        {
            if (position == Vector3.zero) return;

            try
            {
                Effect.server.Run(GenericBuildEffect, position);
            }
            catch { }
        }

        private void StopRepairJob(RepairJob job, string reason)
        {
            if (job == null) return;

            if (_repairJobsBeingTornDown.Contains(job.PlayerId)) return;
            _repairJobsBeingTornDown.Add(job.PlayerId);

            try
            {
                try
                {
                    if (job.ScheduledTimer != null && !job.ScheduledTimer.Destroyed)
                    {
                        job.ScheduledTimer.Destroy();
                    }
                }
                catch { }
                job.ScheduledTimer = null;

                if (_activeRepairJobs.TryGetValue(job.PlayerId, out var currentlyTracked) && currentlyTracked.SessionId == job.SessionId)
                {
                    _activeRepairJobs.Remove(job.PlayerId);
                }

                if (job.Player != null && job.Player.IsConnected)
                {
                    if (!string.IsNullOrEmpty(reason))
                    {
                        SendReply(job.Player, reason);
                    }

                    if (_openTcPlayers.Contains(job.PlayerId) && job.TC != null && job.TC.IsValid())
                    {
                        CreateUpgradeUI(job.Player, job.TC);
                    }
                }
            }
            catch (Exception ex)
            {
                PrintError($"Unhandled exception in StopRepairJob: {ex}");
            }
            finally
            {
                _repairJobsBeingTornDown.Remove(job.PlayerId);
            }
        }

        private void CompleteRepairJob(RepairJob job)
        {
            if (job == null) return;

            if (_repairJobsBeingTornDown.Contains(job.PlayerId)) return;
            _repairJobsBeingTornDown.Add(job.PlayerId);

            try
            {
                try
                {
                    if (job.ScheduledTimer != null && !job.ScheduledTimer.Destroyed)
                    {
                        job.ScheduledTimer.Destroy();
                    }
                }
                catch { }
                job.ScheduledTimer = null;

                if (_activeRepairJobs.TryGetValue(job.PlayerId, out var currentlyTracked) && currentlyTracked.SessionId == job.SessionId)
                {
                    _activeRepairJobs.Remove(job.PlayerId);
                }

                if (job.Player != null && job.Player.IsConnected)
                {
                    SendReply(job.Player, GetLang("RepairComplete", job.Player.UserIDString, job.CompletedCount));
                    SafePlayGenericEffect(SafeGetPositionOfPlayer(job.Player));

                    if (_openTcPlayers.Contains(job.PlayerId) && job.TC != null && job.TC.IsValid())
                    {
                        CreateUpgradeUI(job.Player, job.TC);
                    }
                }
            }
            catch (Exception ex)
            {
                PrintError($"Unhandled exception in CompleteRepairJob: {ex}");
            }
            finally
            {
                _repairJobsBeingTornDown.Remove(job.PlayerId);
            }
        }

        #endregion

        #region Safe Raid Block Integration

        private bool IsRaidBlocked(BasePlayer player, BuildingPrivlidge tc)
        {
            if (!_config.BlockDuringRaid) return false;

            try
            {
                if (player != null && player.IsValid())
                {
                    Plugin noEscape = plugins.Find("NoEscape");
                    if (noEscape != null && noEscape.IsLoaded)
                    {
                        try
                        {
                            object res = noEscape.Call("IsRaidBlocked", player.UserIDString);
                            if (res is bool b && b) return true;

                            res = noEscape.Call("IsCombatBlocked", player.UserIDString);
                            if (res is bool b2 && b2) return true;
                        }
                        catch { }
                    }
                }

                if (tc != null && tc.IsValid() && !tc.IsDestroyed && _config.RaidDamageCooldownSeconds > 0)
                {
                    float cooldown = _config.RaidDamageCooldownSeconds;

                    float tcAttacked;
                    try { tcAttacked = tc.SecondsSinceAttacked; } catch { tcAttacked = float.MaxValue; }
                    if (tcAttacked < cooldown)
                    {
                        return true;
                    }

                    var building = tc.GetBuilding();
                    if (building != null && building.buildingBlocks != null)
                    {
                        foreach (var block in building.buildingBlocks)
                        {
                            if (!IsBlockUsable(block)) continue;

                            float secondsSinceAttacked;
                            try { secondsSinceAttacked = block.SecondsSinceAttacked; }
                            catch { continue; }

                            if (secondsSinceAttacked < cooldown)
                            {
                                return true;
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                DebugLog($"Exception checking IsRaidBlocked: {ex.Message}");
                return false;
            }

            return false;
        }

        #endregion

        #region User Interface

        private void CreateUpgradeUI(BasePlayer player, BuildingPrivlidge tc)
        {
            if (player == null || !player.IsConnected) return;

            DestroyUI(player);

            var state = GetOrCreateState(player);
            bool isUpJobRunning = _activeJobs.TryGetValue(player.userID, out var currentUpJob);
            bool isRepJobRunning = _activeRepairJobs.TryGetValue(player.userID, out var currentRepJob);

            var elements = new CuiElementContainer();

            elements.Add(new CuiPanel
            {
                Image = { Color = "0.05 0.05 0.05 0.92" },
                RectTransform = { AnchorMin = _config.UIPosition.AnchorMin, AnchorMax = _config.UIPosition.AnchorMax },
                CursorEnabled = false
            }, "Overlay", MainUIName);

            elements.Add(new CuiLabel
            {
                Text = { Text = "UPGRADE", FontSize = 7, Align = TextAnchor.MiddleCenter, Color = "0.75 0.75 0.75 1.0", Font = RustFont },
                RectTransform = { AnchorMin = "0.02 0.86", AnchorMax = "0.98 0.98" }
            }, MainUIName, MainUIName + "_Header");

            var itemsList = new List<UIListItem>();

            if (_config.BaseMaterials.Wood)
                itemsList.Add(new UIListItem { Name = "WOOD", CommandKey = "Wood", Grade = BuildingGrade.Enum.Wood });

            if (_config.BaseMaterials.Stone)
                itemsList.Add(new UIListItem { Name = "STONE", CommandKey = "Stone", Grade = BuildingGrade.Enum.Stone });

            if (_config.BaseMaterials.Metal)
                itemsList.Add(new UIListItem { Name = "METAL", CommandKey = "Metal", Grade = BuildingGrade.Enum.Metal });

            if (_config.BaseMaterials.HQ)
                itemsList.Add(new UIListItem { Name = "HQ", CommandKey = "HQ", Grade = BuildingGrade.Enum.TopTier });

            int totalItems = itemsList.Count;
            float topY = 0.84f;
            float bottomY = 0.17f;
            float availableHeight = topY - bottomY;
            float slotHeight = totalItems > 0 ? availableHeight / totalItems : availableHeight;

            for (int i = 0; i < totalItems; i++)
            {
                var item = itemsList[i];
                float yMin = bottomY + (totalItems - 1 - i) * slotHeight + 0.008f;
                float yMax = bottomY + (totalItems - i) * slotHeight - 0.008f;

                string buttonPanelName = $"{MainUIName}_Item_{i}";
                string cmd = $"upgrade.click select_material {item.CommandKey}";

                bool isThisGradeActive = state.IsActive && state.TargetGrade == item.Grade;
                string btnColor = isThisGradeActive ? "0.24 0.44 0.16 0.95" : "0.12 0.12 0.12 0.90";

                elements.Add(new CuiButton
                {
                    Button = { Command = cmd, Color = btnColor },
                    RectTransform = { AnchorMin = $"0.03 {yMin:F4}", AnchorMax = $"0.97 {yMax:F4}" },
                    Text = { Text = "" }
                }, MainUIName, buttonPanelName);

                if (isThisGradeActive && isUpJobRunning)
                {
                    elements.Add(new CuiLabel
                    {
                        Text = { Text = $"{item.Name} {currentUpJob.CompletedCount}/{currentUpJob.TotalCount}", FontSize = 6, Align = TextAnchor.MiddleCenter, Color = "1 1 1 1", Font = RustFont },
                        RectTransform = { AnchorMin = "0 0", AnchorMax = "1 1" }
                    }, buttonPanelName);
                }
                else if (isThisGradeActive)
                {
                    elements.Add(new CuiLabel
                    {
                        Text = { Text = $"{item.Name} ●", FontSize = 6, Align = TextAnchor.MiddleCenter, Color = "0.90 0.95 0.70 1.0", Font = RustFont },
                        RectTransform = { AnchorMin = "0 0", AnchorMax = "1 1" }
                    }, buttonPanelName);
                }
                else
                {
                    elements.Add(new CuiLabel
                    {
                        Text = { Text = item.Name, FontSize = 6, Align = TextAnchor.MiddleCenter, Color = "0.82 0.82 0.82 1.0", Font = RustFont },
                        RectTransform = { AnchorMin = "0 0", AnchorMax = "1 1" }
                    }, buttonPanelName);
                }
            }

            string repColor = isRepJobRunning ? "0.65 0.18 0.16 0.95" : "0.18 0.36 0.52 0.95";
            string repText = isRepJobRunning ? $"STOP {currentRepJob.CompletedCount}/{currentRepJob.TotalCount}" : "REPAIR";

            elements.Add(new CuiButton
            {
                Button = { Command = "upgrade.click repair none", Color = repColor },
                RectTransform = { AnchorMin = "0.03 0.02", AnchorMax = "0.97 0.15" },
                Text = { Text = repText, FontSize = 6, Align = TextAnchor.MiddleCenter, Color = "1 1 1 1", Font = RustFont }
            }, MainUIName, MainUIName + "_RepBtn");

            CuiHelper.AddUi(player, elements);
        }

        private void DestroyUI(BasePlayer player)
        {
            if (player == null) return;
            CuiHelper.DestroyUi(player, MainUIName);
        }

        private class UIListItem
        {
            public string Name;
            public string CommandKey;
            public BuildingGrade.Enum Grade;
        }

        #endregion

        #region Commands & Localization

        [ChatCommand("upgrade")]
        private void CmdChatUpgrade(BasePlayer player, string command, string[] args)
        {
            if (player == null) return;

            // 1. Account Linking Lock
            if (!IsPlayerLinked(player))
            {
                SendReply(player, GetLang("AccountNotLinked", player.UserIDString, _config.WebsiteLinkUrl));
                Effect.server.Run("assets/prefabs/locks/keypad/sound/lock.code.denied.prefab", player.transform.position);
                return;
            }

            if (args.Length > 0)
            {
                if (args[0].Equals("stop", StringComparison.OrdinalIgnoreCase))
                {
                    var state = GetOrCreateState(player);
                    state.IsActive = false;

                    if (_activeJobs.TryGetValue(player.userID, out var job))
                    {
                        StopUpgradeJob(job, GetLang("UpgradeStoppedByUser", player.UserIDString));
                    }
                    if (_activeRepairJobs.TryGetValue(player.userID, out var repJob))
                    {
                        StopRepairJob(repJob, GetLang("RepairStoppedByUser", player.UserIDString));
                    }
                    SendReply(player, GetLang("UpgradeStoppedByUser", player.UserIDString));
                    return;
                }

                if (args[0].Equals("repair", StringComparison.OrdinalIgnoreCase))
                {
                    ToggleRepairMode(player);
                    return;
                }
            }

            var tc = player.GetBuildingPrivilege();
            if (tc == null)
            {
                SendReply(player, GetLang("NoValidTC", player.UserIDString));
                return;
            }

            CreateUpgradeUI(player, tc);
        }

        [ChatCommand("repair")]
        private void CmdChatRepair(BasePlayer player, string command, string[] args)
        {
            if (player == null) return;

            // 1. Account Linking Lock
            if (!IsPlayerLinked(player))
            {
                SendReply(player, GetLang("AccountNotLinked", player.UserIDString, _config.WebsiteLinkUrl));
                Effect.server.Run("assets/prefabs/locks/keypad/sound/lock.code.denied.prefab", player.transform.position);
                return;
            }

            ToggleRepairMode(player);
        }

        protected override void LoadDefaultMessages()
        {
            lang.RegisterMessages(new Dictionary<string, string>
            {
                ["AccountNotLinked"] = "<color=#ce3f27>[Upgrade]</color> You must link your Steam & Discord accounts to use Base Upgrade and Repair!\n<color=#00A8FF>👉 Link Account URL:</color> {0}",
                ["NoHqPermission"] = "<color=#ce3f27>[Upgrade]</color> Upgrading to <color=#ffd24d>HQ</color> requires a VIP Kit / Store perk!\n<color=#00A8FF>👉 Store:</color> {0}",
                ["NoValidTC"] = "<color=#ce3f27>[Upgrade]</color> You must be inside your base with building privilege on a Tool Cupboard.",
                ["NotAuthedOnTC"] = "<color=#ce3f27>[Upgrade]</color> You are not authorized on this Tool Cupboard.",
                ["NoBlocksFound"] = "<color=#ce3f27>[Upgrade]</color> No building blocks found connected to this Tool Cupboard.",
                ["NoBlocksNeedUpgrade"] = "<color=#738d43>[Upgrade]</color> All connected pieces are already at or above <color=#ffd24d>{0}</color>.",
                ["NoResourceAvailable"] = "<color=#ce3f27>[Upgrade]</color> You do not have enough <color=#ffd24d>{0}</color> in your Tool Cupboard to upgrade to <color=#ffd24d>{1}</color>.",
                ["UpgradeStarted"] = "<color=#738d43>[Upgrade]</color> Selected <color=#ffd24d>{0}</color>. Upgrade started ({1} pieces)...",
                ["UpgradeComplete"] = "<color=#738d43>[Upgrade]</color> Base upgrade complete! Successfully upgraded <color=#ffd24d>{0}</color> pieces.",
                ["UpgradeStoppedByUser"] = "<color=#ffd24d>[Upgrade]</color> Upgrade process stopped.",
                ["JobStoppedDeath"] = "<color=#ce3f27>[Upgrade]</color> Process stopped because player died.",
                ["JobStoppedLeftTC"] = "<color=#ce3f27>[Upgrade]</color> Process stopped because you moved too far from the Tool Cupboard.",
                ["TCWasDestroyed"] = "<color=#ce3f27>[Upgrade]</color> Process stopped because the Tool Cupboard was destroyed.",
                ["ResourcesExhaustedPartial"] = "<color=#ce3f27>[Upgrade]</color> Not enough resources in Tool Cupboard. Upgraded <color=#55ff55>{0}/{1}</color> pieces.",
                ["NoDamagedBlocks"] = "<color=#738d43>[Repair]</color> All connected building pieces are at 100% full health.",
                ["RepairStarted"] = "<color=#738d43>[Repair]</color> Repairing base damage ({0} pieces)...",
                ["RepairComplete"] = "<color=#738d43>[Repair]</color> Base repair complete! Successfully repaired <color=#ffd24d>{0}</color> pieces.",
                ["RepairStoppedByUser"] = "<color=#ffd24d>[Repair]</color> Base repair stopped.",
                ["RepairNoResource"] = "<color=#ce3f27>[Repair]</color> Not enough <color=#ffd24d>{0}</color> in Tool Cupboard to continue repair.",
                ["RaidBlocked"] = "<color=#ce3f27>[Upgrade]</color> Action blocked! You cannot upgrade or repair while Raid Blocked or while base is under attack.",
                ["JobStoppedRaidBlock"] = "<color=#ce3f27>[Upgrade]</color> Process stopped because the base is under attack or Raid Blocked."
            }, this, "en");
        }

        private string GetLang(string key, string userId = null, params object[] args)
        {
            string message = lang.GetMessage(key, this, "en");
            if (string.IsNullOrEmpty(message))
                message = lang.GetMessage(key, this, null);

            if (args != null && args.Length > 0)
            {
                try
                {
                    return string.Format(message, args);
                }
                catch
                {
                    return message;
                }
            }
            return message;
        }

        #endregion
    }
}