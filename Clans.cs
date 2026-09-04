using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Oxide.Core;
using Oxide.Core.Libraries.Covalence;
using Oxide.Core.Plugins;
using Oxide.Game.Rust.Cui;
using UnityEngine;

namespace Oxide.Plugins
{
    [Info("Clans", "dcode / Modified", "3.2.2")]
    [Description("Standalone Clans system with permanent clan entity ownership, inventory-based auto-lock, wipe-clean support and full persistence.")]
    public class Clans : RustPlugin
    {
        private const string ClanUI_Name = "Clans_MenuUI";
        private const string CodeLockPrefab = "assets/prefabs/locks/keypad/lock.code.prefab";
        private const string CodeLockItemShortname = "lock.code";
        private const string KeyLockPrefab = "assets/prefabs/locks/keylock/lock.key.prefab";
        private const string KeyLockItemShortname = "lock.key";

        #region Configuration

        private Configuration config;

        public class Configuration
        {
            [JsonProperty(PropertyName = "Auto Lock Enabled")]
            public bool AutoLockEnabled = true;

            [JsonProperty(PropertyName = "Auto Lock Doors")]
            public bool AutoLockDoors = true;

            [JsonProperty(PropertyName = "Auto Lock Garage Doors")]
            public bool AutoLockGarageDoors = true;

            [JsonProperty(PropertyName = "Auto Lock Key Locks")]
            public bool AutoLockKeyLocks = true;

            [JsonProperty(PropertyName = "Code Length")]
            public int CodeLength = 4;

            [JsonProperty(PropertyName = "Show Generated Code To Builder")]
            public bool ShowGeneratedCodeToBuilder = true;
        }

        protected override void LoadConfig()
        {
            base.LoadConfig();
            try
            {
                config = Config.ReadObject<Configuration>();
                if (config == null) LoadDefaultConfig();
            }
            catch
            {
                LoadDefaultConfig();
            }
            SaveConfig();
        }

        protected override void LoadDefaultConfig()
        {
            config = new Configuration();
        }

        protected override void SaveConfig()
        {
            Config.WriteObject(config, true);
        }

        #endregion

        #region Data Models

        private class Clan
        {
            public string tag;
            public string description;
            public string owner;
            public List<string> moderators = new List<string>();
            public List<string> members = new List<string>();
            public List<string> invited = new List<string>();
            public string homePosition;
            public bool allowFriendlyFire = false;

            public JObject ToJObject()
            {
                var obj = new JObject();
                obj["tag"] = tag;
                obj["description"] = description;
                obj["owner"] = owner;
                obj["homePosition"] = homePosition;
                obj["allowFriendlyFire"] = allowFriendlyFire;
                var mods = new JArray();
                foreach (var m in moderators) mods.Add(m);
                obj["moderators"] = mods;
                var mems = new JArray();
                foreach (var m in members) mems.Add(m);
                obj["members"] = mems;
                var invs = new JArray();
                foreach (var i in invited) invs.Add(i);
                obj["invited"] = invs;
                return obj;
            }
        }

        private class ClanData
        {
            public string tag;
            public string description;
            public string owner;
            public string homePosition;
            public List<string> moderators;
            public List<string> members;
            public List<string> invited;
            public bool allowFriendlyFire;
        }

        #endregion

        #region Fields

        private Dictionary<string, Clan> clans = new Dictionary<string, Clan>(StringComparer.OrdinalIgnoreCase);
        private Dictionary<string, string> playerClans = new Dictionary<string, string>();
        private Dictionary<ulong, string> originalNames = new Dictionary<ulong, string>();
        private Dictionary<ulong, Timer> activeTeleports = new Dictionary<ulong, Timer>();
        private Dictionary<ulong, Timer> doorCloseTimers = new Dictionary<ulong, Timer>();

        private Dictionary<ulong, string> entityToClan = new Dictionary<ulong, string>();

        private HashSet<ulong> processingClanRemoval = new HashSet<ulong>();
        private HashSet<ulong> autoLockProcessing = new HashSet<ulong>();
        private bool isInternalTeamCreate = false;

        #endregion

        #region Oxide Lifecycle & Wipe Hook

        void Loaded()
        {
            LoadData();
            foreach (var player in BasePlayer.activePlayerList)
            {
                UpdatePlayerDisplayName(player);
            }
        }

        void OnServerInitialized()
        {
            RebuildAndValidateClanEntityRegistry();
            foreach (var tag in clans.Keys)
            {
                SyncAllClanPrivileges(tag);
            }
        }

        void OnServerSave()
        {
            SaveData();
        }

        void OnNewSave()
        {
            Puts("[Clans] New Wipe/Save detected! Wiping all clans and entity registrations...");

            clans.Clear();
            playerClans.Clear();
            entityToClan.Clear();
            activeTeleports.Clear();
            doorCloseTimers.Clear();

            foreach (var player in BasePlayer.activePlayerList)
            {
                if (player != null)
                {
                    string clean = GetRealPlayerName(player);
                    player.displayName = clean;
                    player._name = clean;
                    if (player.net?.connection != null) player.net.connection.username = clean;
                    if (player.IPlayer != null) player.IPlayer.Name = clean;
                    ServerMgr.Instance.persistance.SetPlayerName(player.userID, clean);
                    player.SendNetworkUpdate();
                }
            }
            originalNames.Clear();

            SaveData();
            Puts("[Clans] Clans successfully wiped for the fresh wipe!");
        }

        void Unload()
        {
            SaveData();

            foreach (var player in BasePlayer.activePlayerList)
            {
                CuiHelper.DestroyUi(player, ClanUI_Name);
                if (player != null)
                {
                    string clean = GetRealPlayerName(player);
                    player.displayName = clean;
                    player._name = clean;
                    if (player.net?.connection != null) player.net.connection.username = clean;
                    if (player.IPlayer != null) player.IPlayer.Name = clean;
                    ServerMgr.Instance.persistance.SetPlayerName(player.userID, clean);
                    player.SendNetworkUpdate();
                    player.SendNetworkUpdateImmediate();
                }
            }

            originalNames.Clear();

            foreach (var timer in activeTeleports.Values)
            {
                timer?.Destroy();
            }
            activeTeleports.Clear();

            foreach (var timer in doorCloseTimers.Values)
            {
                timer?.Destroy();
            }
            doorCloseTimers.Clear();
        }

        #endregion

        #region Data Management

        void LoadData()
        {
            clans.Clear();
            playerClans.Clear();
            entityToClan.Clear();

            var data = Interface.Oxide.DataFileSystem.ReadObject<Dictionary<string, ClanData>>("Clans");
            if (data != null)
            {
                foreach (var pair in data)
                {
                    var c = new Clan
                    {
                        tag = pair.Value.tag,
                        description = pair.Value.description,
                        owner = pair.Value.owner,
                        homePosition = pair.Value.homePosition,
                        moderators = pair.Value.moderators ?? new List<string>(),
                        members = pair.Value.members ?? new List<string>(),
                        invited = pair.Value.invited ?? new List<string>(),
                        allowFriendlyFire = pair.Value.allowFriendlyFire
                    };

                    c.members = c.members.Where(m => !string.IsNullOrEmpty(m)).Distinct().ToList();
                    c.moderators = c.moderators.Where(m => !string.IsNullOrEmpty(m)).Distinct().ToList();

                    clans[c.tag] = c;
                    foreach (var m in c.members)
                    {
                        playerClans[m] = c.tag;
                    }
                }
            }

            var entityData = Interface.Oxide.DataFileSystem.ReadObject<Dictionary<ulong, string>>("Clans_Entities");
            if (entityData != null)
            {
                foreach (var pair in entityData)
                {
                    if (!string.IsNullOrEmpty(pair.Value) && clans.ContainsKey(pair.Value))
                    {
                        entityToClan[pair.Key] = pair.Value;
                    }
                }
            }
        }

        void SaveData()
        {
            var data = new Dictionary<string, ClanData>();
            foreach (var pair in clans)
            {
                data[pair.Key] = new ClanData
                {
                    tag = pair.Value.tag,
                    description = pair.Value.description,
                    owner = pair.Value.owner,
                    homePosition = pair.Value.homePosition,
                    moderators = pair.Value.moderators,
                    members = pair.Value.members,
                    invited = pair.Value.invited,
                    allowFriendlyFire = pair.Value.allowFriendlyFire
                };
            }
            Interface.Oxide.DataFileSystem.WriteObject("Clans", data);
            Interface.Oxide.DataFileSystem.WriteObject("Clans_Entities", entityToClan);
        }

        [ConsoleCommand("clans.save")]
        void cmdConsoleSave(ConsoleSystem.Arg arg)
        {
            if (arg.Player() != null && !arg.Player().IsAdmin) return;

            SaveData();
            Puts("[Clans] All clan and entity registry data has been successfully saved to disk!");
            if (arg.Player() != null)
            {
                SendReply(arg.Player(), "<color=#2ecc71>All clan and entity data has been successfully saved!</color>");
            }
        }

        #endregion

        #region Plugin APIs (For GoatKitsUI & Other Plugins)

        [HookMethod("GetClanOf")]
        public string GetClanOf(object playerObj)
        {
            if (playerObj == null) return null;
            if (playerObj is ulong uId) return GetPlayerClanTagByID(uId);
            if (playerObj is string sId) return GetPlayerClanTagByID(sId);
            if (playerObj is BasePlayer bp) return GetPlayerClanTag(bp);
            return null;
        }

        [HookMethod("GetClanTag")]
        public string GetClanTag(ulong userId)
        {
            return GetPlayerClanTagByID(userId);
        }

        [HookMethod("GetClanMembers")]
        public List<string> GetClanMembers(string tag)
        {
            if (string.IsNullOrEmpty(tag)) return null;
            if (clans.TryGetValue(tag, out Clan clan))
            {
                return new List<string>(clan.members);
            }
            return null;
        }

        #endregion

        #region Clan Entity Registry & Ownership

        private string EnsureEntityClan(BaseEntity entity)
        {
            if (entity == null || entity.net == null) return null;

            ulong entityId = entity.net.ID.Value;

            if (entityToClan.TryGetValue(entityId, out string registeredTag) && !string.IsNullOrEmpty(registeredTag))
            {
                if (clans.ContainsKey(registeredTag)) return registeredTag;
                entityToClan.Remove(entityId);
            }

            BaseEntity parent = entity.GetParentEntity();
            if (parent != null && parent.net != null)
            {
                ulong parentId = parent.net.ID.Value;
                if (entityToClan.TryGetValue(parentId, out string parentTag) && !string.IsNullOrEmpty(parentTag))
                {
                    if (clans.ContainsKey(parentTag))
                    {
                        entityToClan[entityId] = parentTag;
                        return parentTag;
                    }
                    entityToClan.Remove(parentId);
                }
            }

            if (entity is Door door)
            {
                BaseLock childLock = door.GetSlot(BaseEntity.Slot.Lock) as BaseLock;
                if (childLock != null && childLock.net != null)
                {
                    ulong lockId = childLock.net.ID.Value;
                    if (entityToClan.TryGetValue(lockId, out string lockTag) && !string.IsNullOrEmpty(lockTag))
                    {
                        if (clans.ContainsKey(lockTag))
                        {
                            entityToClan[entityId] = lockTag;
                            return lockTag;
                        }
                        entityToClan.Remove(lockId);
                    }
                }
            }

            string discoveredTag = null;
            if (entity.OwnerID != 0)
            {
                discoveredTag = GetPlayerClanTagByID(entity.OwnerID);
            }

            if (string.IsNullOrEmpty(discoveredTag) && parent != null && parent.OwnerID != 0)
            {
                discoveredTag = GetPlayerClanTagByID(parent.OwnerID);
            }

            if (!string.IsNullOrEmpty(discoveredTag) && clans.ContainsKey(discoveredTag))
            {
                entityToClan[entityId] = discoveredTag;
                if (parent != null && parent.net != null)
                {
                    entityToClan[parent.net.ID.Value] = discoveredTag;
                }
                return discoveredTag;
            }

            return null;
        }

        private void RebuildAndValidateClanEntityRegistry()
        {
            List<ulong> deadEntities = new List<ulong>();
            foreach (var kvp in entityToClan)
            {
                if (!clans.ContainsKey(kvp.Value))
                {
                    deadEntities.Add(kvp.Key);
                    continue;
                }

                BaseNetworkable netEntity = BaseNetworkable.serverEntities.Find(new NetworkableId(kvp.Key));
                if (netEntity == null || netEntity.IsDestroyed)
                {
                    deadEntities.Add(kvp.Key);
                }
            }

            foreach (var id in deadEntities)
            {
                entityToClan.Remove(id);
            }

            foreach (var entity in BaseNetworkable.serverEntities)
            {
                if (entity == null || entity.IsDestroyed) continue;

                if (entity is BuildingPrivlidge || entity is AutoTurret || entity is Door || entity is BaseLock)
                {
                    BaseEntity baseEnt = entity as BaseEntity;
                    if (baseEnt != null)
                    {
                        EnsureEntityClan(baseEnt);
                    }
                }
            }

            SaveData();
        }

        #endregion

        #region Auto-Lock System

        private Item FindCodeLockItem(BasePlayer player)
        {
            if (player == null || player.inventory == null) return null;
            ItemDefinition codeLockDef = ItemManager.FindItemDefinition(CodeLockItemShortname);
            if (codeLockDef == null) return null;

            if (player.inventory.containerBelt != null)
            {
                for (int i = 0; i < player.inventory.containerBelt.itemList.Count; i++)
                {
                    Item item = player.inventory.containerBelt.itemList[i];
                    if (item != null && item.info == codeLockDef && item.amount >= 1) return item;
                }
            }

            if (player.inventory.containerMain != null)
            {
                for (int i = 0; i < player.inventory.containerMain.itemList.Count; i++)
                {
                    Item item = player.inventory.containerMain.itemList[i];
                    if (item != null && item.info == codeLockDef && item.amount >= 1) return item;
                }
            }
            return null;
        }

        private Item FindKeyLockItem(BasePlayer player)
        {
            if (player == null || player.inventory == null) return null;
            ItemDefinition keyLockDef = ItemManager.FindItemDefinition(KeyLockItemShortname);
            if (keyLockDef == null) return null;

            if (player.inventory.containerBelt != null)
            {
                for (int i = 0; i < player.inventory.containerBelt.itemList.Count; i++)
                {
                    Item item = player.inventory.containerBelt.itemList[i];
                    if (item != null && item.info == keyLockDef && item.amount >= 1) return item;
                }
            }

            if (player.inventory.containerMain != null)
            {
                for (int i = 0; i < player.inventory.containerMain.itemList.Count; i++)
                {
                    Item item = player.inventory.containerMain.itemList[i];
                    if (item != null && item.info == keyLockDef && item.amount >= 1) return item;
                }
            }
            return null;
        }

        private bool ConsumeCodeLockItem(BasePlayer player)
        {
            Item item = FindCodeLockItem(player);
            if (item == null || item.amount < 1) return false;

            if (item.amount > 1)
            {
                item.amount -= 1;
                item.MarkDirty();
            }
            else
            {
                item.RemoveFromContainer();
                item.Remove();
            }
            return true;
        }

        private bool ConsumeKeyLockItem(BasePlayer player)
        {
            Item item = FindKeyLockItem(player);
            if (item == null || item.amount < 1) return false;

            if (item.amount > 1)
            {
                item.amount -= 1;
                item.MarkDirty();
            }
            else
            {
                item.RemoveFromContainer();
                item.Remove();
            }
            return true;
        }

        private string GenerateRandomCode(int length)
        {
            if (length <= 0) length = 4;
            int min = (int)Math.Pow(10, length - 1);
            int max = (int)Math.Pow(10, length);
            return UnityEngine.Random.Range(min, max).ToString();
        }

        private bool IsEligibleForAutoLock(Door door)
        {
            if (door == null || door.IsDestroyed) return false;
            if (!config.AutoLockEnabled) return false;

            string shortname = door.ShortPrefabName.ToLower();
            bool isGarage = shortname.Contains("garage") || shortname.Contains("shutter");

            return isGarage ? config.AutoLockGarageDoors : config.AutoLockDoors;
        }

        private void TryAutoLockDoor(Door door, BasePlayer player)
        {
            if (door == null || door.IsDestroyed || door.net == null) return;
            if (player == null || !player.IsConnected || player.IsDead()) return;

            ulong doorId = door.net.ID.Value;
            if (autoLockProcessing.Contains(doorId)) return;
            autoLockProcessing.Add(doorId);

            try
            {
                if (!IsEligibleForAutoLock(door)) return;
                if (door.GetSlot(BaseEntity.Slot.Lock) != null) return;

                Item codeLockItem = FindCodeLockItem(player);
                if (codeLockItem != null)
                {
                    BaseEntity lockEntity = GameManager.server.CreateEntity(CodeLockPrefab, Vector3.zero, Quaternion.identity);
                    if (lockEntity == null) return;

                    CodeLock codeLock = lockEntity as CodeLock;
                    if (codeLock == null)
                    {
                        lockEntity.Kill();
                        return;
                    }

                    codeLock.OwnerID = player.userID;
                    codeLock.SetParent(door, door.GetSlotAnchorName(BaseEntity.Slot.Lock));
                    codeLock.Spawn();
                    door.SetSlot(BaseEntity.Slot.Lock, codeLock);

                    if (door.GetSlot(BaseEntity.Slot.Lock) != codeLock || codeLock.GetParentEntity() != door)
                    {
                        codeLock.Kill();
                        return;
                    }

                    if (!ConsumeCodeLockItem(player))
                    {
                        door.SetSlot(BaseEntity.Slot.Lock, null);
                        codeLock.Kill();
                        return;
                    }

                    string generatedCode = GenerateRandomCode(config.CodeLength);
                    codeLock.hasCode = true;
                    codeLock.code = generatedCode;

                    // FIX: تعيين حالة القفل مباشرة على حقل flags لتفادي حجب الدالة في التحديث الجديد
                    codeLock.flags |= BaseEntity.Flags.Locked;

                    if (codeLock.whitelistPlayers == null) codeLock.whitelistPlayers = new List<ulong>();
                    if (!codeLock.whitelistPlayers.Contains(player.userID)) codeLock.whitelistPlayers.Add(player.userID);

                    codeLock.SendNetworkUpdate();
                    door.SendNetworkUpdate();

                    string playerClan = GetPlayerClanTag(player);
                    if (!string.IsNullOrEmpty(playerClan))
                    {
                        EnsureEntityClan(door);
                        EnsureEntityClan(codeLock);
                        SyncAllClanPrivileges(playerClan);
                    }

                    if (config.ShowGeneratedCodeToBuilder && player.IsConnected)
                    {
                        SendReply(player, $"<color=#2ecc71>Door locked automatically.</color> <color=#ffa500>Code:</color> {generatedCode}");
                    }
                    return;
                }

                if (config.AutoLockKeyLocks)
                {
                    Item keyLockItem = FindKeyLockItem(player);
                    if (keyLockItem != null)
                    {
                        BaseEntity lockEntity = GameManager.server.CreateEntity(KeyLockPrefab, Vector3.zero, Quaternion.identity);
                        if (lockEntity == null) return;

                        KeyLock keyLock = lockEntity as KeyLock;
                        if (keyLock == null)
                        {
                            lockEntity.Kill();
                            return;
                        }

                        keyLock.OwnerID = player.userID;
                        keyLock.SetParent(door, door.GetSlotAnchorName(BaseEntity.Slot.Lock));
                        keyLock.Spawn();
                        door.SetSlot(BaseEntity.Slot.Lock, keyLock);

                        if (door.GetSlot(BaseEntity.Slot.Lock) != keyLock || keyLock.GetParentEntity() != door)
                        {
                            keyLock.Kill();
                            return;
                        }

                        if (!ConsumeKeyLockItem(player))
                        {
                            door.SetSlot(BaseEntity.Slot.Lock, null);
                            keyLock.Kill();
                            return;
                        }

                        // FIX: تعيين حالة القفل مباشرة على حقل flags
                        keyLock.flags |= BaseEntity.Flags.Locked;
                        keyLock.SendNetworkUpdate();
                        door.SendNetworkUpdate();

                        string playerClan = GetPlayerClanTag(player);
                        if (!string.IsNullOrEmpty(playerClan))
                        {
                            EnsureEntityClan(door);
                            EnsureEntityClan(keyLock);
                            SyncAllClanPrivileges(playerClan);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                PrintError($"[Clans] Error during AutoLock processing for Door {doorId}: {ex}");
            }
            finally
            {
                autoLockProcessing.Remove(doorId);
            }
        }

        #endregion

        #region Entity Authorization Primitives

        private bool AuthorizeOnCupboard(BuildingPrivlidge priv, ulong userId)
        {
            if (priv == null || priv.authorizedPlayers == null) return false;
            if (!priv.authorizedPlayers.Contains(userId))
            {
                priv.authorizedPlayers.Add(userId);
                return true;
            }
            return false;
        }

        private bool DeauthorizeFromCupboard(BuildingPrivlidge priv, ulong userId)
        {
            if (priv == null || priv.authorizedPlayers == null) return false;
            return priv.authorizedPlayers.Remove(userId);
        }

        private bool AuthorizeOnTurret(AutoTurret turret, ulong userId)
        {
            if (turret == null || turret.authorizedPlayers == null) return false;
            if (!turret.authorizedPlayers.Contains(userId))
            {
                turret.authorizedPlayers.Add(userId);
                return true;
            }
            return false;
        }

        private bool DeauthorizeFromTurret(AutoTurret turret, ulong userId)
        {
            if (turret == null || turret.authorizedPlayers == null) return false;
            return turret.authorizedPlayers.Remove(userId);
        }

        private bool AuthorizeOnCodeLock(CodeLock codeLock, ulong userId)
        {
            if (codeLock == null || codeLock.whitelistPlayers == null) return false;
            if (!codeLock.whitelistPlayers.Contains(userId))
            {
                codeLock.whitelistPlayers.Add(userId);
                return true;
            }
            return false;
        }

        private bool DeauthorizeFromCodeLock(CodeLock codeLock, ulong userId)
        {
            if (codeLock == null) return false;
            bool changed = false;
            if (codeLock.whitelistPlayers != null && codeLock.whitelistPlayers.Remove(userId)) changed = true;
            if (codeLock.guestPlayers != null && codeLock.guestPlayers.Remove(userId)) changed = true;
            return changed;
        }

        #endregion

        #region Mass Privilege Synchronization

        private void GrantAllClanPrivileges(BasePlayer player, string clanTag)
        {
            if (player == null || string.IsNullOrEmpty(clanTag)) return;
            ulong userId = player.userID;

            foreach (var netEntity in BaseNetworkable.serverEntities)
            {
                if (netEntity == null || netEntity.IsDestroyed) continue;

                if (netEntity is BuildingPrivlidge priv)
                {
                    string entClan = EnsureEntityClan(priv);
                    if (!string.IsNullOrEmpty(entClan) && entClan.Equals(clanTag, StringComparison.OrdinalIgnoreCase))
                    {
                        if (AuthorizeOnCupboard(priv, userId)) priv.SendNetworkUpdate();
                    }
                }
                else if (netEntity is AutoTurret turret)
                {
                    string entClan = EnsureEntityClan(turret);
                    if (!string.IsNullOrEmpty(entClan) && entClan.Equals(clanTag, StringComparison.OrdinalIgnoreCase))
                    {
                        if (AuthorizeOnTurret(turret, userId)) turret.SendNetworkUpdate();
                    }
                }
                else if (netEntity is CodeLock codeLock)
                {
                    string entClan = EnsureEntityClan(codeLock);
                    if (!string.IsNullOrEmpty(entClan) && entClan.Equals(clanTag, StringComparison.OrdinalIgnoreCase))
                    {
                        if (AuthorizeOnCodeLock(codeLock, userId)) codeLock.SendNetworkUpdate();
                    }
                }
                else if (netEntity is Door door)
                {
                    string entClan = EnsureEntityClan(door);
                    if (!string.IsNullOrEmpty(entClan) && entClan.Equals(clanTag, StringComparison.OrdinalIgnoreCase))
                    {
                        BaseLock baseLock = door.GetSlot(BaseEntity.Slot.Lock) as BaseLock;
                        if (baseLock is CodeLock cl)
                        {
                            EnsureEntityClan(cl);
                            if (AuthorizeOnCodeLock(cl, userId)) cl.SendNetworkUpdate();
                        }
                    }
                }
            }
        }

        private void SyncAllClanPrivileges(string clanTag)
        {
            if (string.IsNullOrEmpty(clanTag) || !clans.TryGetValue(clanTag, out Clan clan)) return;

            List<ulong> memberUlongs = new List<ulong>();
            foreach (var m in clan.members)
            {
                if (ulong.TryParse(m, out ulong mid)) memberUlongs.Add(mid);
            }

            foreach (var netEntity in BaseNetworkable.serverEntities)
            {
                if (netEntity == null || netEntity.IsDestroyed) continue;

                if (netEntity is BuildingPrivlidge priv)
                {
                    string entClan = EnsureEntityClan(priv);
                    if (!string.IsNullOrEmpty(entClan) && entClan.Equals(clanTag, StringComparison.OrdinalIgnoreCase))
                    {
                        bool updated = false;
                        foreach (var uid in memberUlongs)
                        {
                            if (AuthorizeOnCupboard(priv, uid)) updated = true;
                        }
                        if (updated) priv.SendNetworkUpdate();
                    }
                }
                else if (netEntity is AutoTurret turret)
                {
                    string entClan = EnsureEntityClan(turret);
                    if (!string.IsNullOrEmpty(entClan) && entClan.Equals(clanTag, StringComparison.OrdinalIgnoreCase))
                    {
                        bool updated = false;
                        foreach (var uid in memberUlongs)
                        {
                            if (AuthorizeOnTurret(turret, uid)) updated = true;
                        }
                        if (updated) turret.SendNetworkUpdate();
                    }
                }
                else if (netEntity is CodeLock codeLock)
                {
                    string entClan = EnsureEntityClan(codeLock);
                    if (!string.IsNullOrEmpty(entClan) && entClan.Equals(clanTag, StringComparison.OrdinalIgnoreCase))
                    {
                        bool updated = false;
                        foreach (var uid in memberUlongs)
                        {
                            if (AuthorizeOnCodeLock(codeLock, uid)) updated = true;
                        }
                        if (updated) codeLock.SendNetworkUpdate();
                    }
                }
                else if (netEntity is Door door)
                {
                    string entClan = EnsureEntityClan(door);
                    if (!string.IsNullOrEmpty(entClan) && entClan.Equals(clanTag, StringComparison.OrdinalIgnoreCase))
                    {
                        BaseLock baseLock = door.GetSlot(BaseEntity.Slot.Lock) as BaseLock;
                        if (baseLock is CodeLock cl)
                        {
                            EnsureEntityClan(cl);
                            bool updated = false;
                            foreach (var uid in memberUlongs)
                            {
                                if (AuthorizeOnCodeLock(cl, uid)) updated = true;
                            }
                            if (updated) cl.SendNetworkUpdate();
                        }
                    }
                }
            }
        }

        private void RemovePlayerClanPrivileges(ulong userId, string clanTag)
        {
            if (userId == 0 || string.IsNullOrEmpty(clanTag)) return;

            foreach (var netEntity in BaseNetworkable.serverEntities)
            {
                if (netEntity == null || netEntity.IsDestroyed) continue;

                if (netEntity is BuildingPrivlidge priv)
                {
                    string entClan = EnsureEntityClan(priv);
                    if (!string.IsNullOrEmpty(entClan) && entClan.Equals(clanTag, StringComparison.OrdinalIgnoreCase))
                    {
                        if (DeauthorizeFromCupboard(priv, userId)) priv.SendNetworkUpdate();
                    }
                }
                else if (netEntity is AutoTurret turret)
                {
                    string entClan = EnsureEntityClan(turret);
                    if (!string.IsNullOrEmpty(entClan) && entClan.Equals(clanTag, StringComparison.OrdinalIgnoreCase))
                    {
                        if (DeauthorizeFromTurret(turret, userId)) turret.SendNetworkUpdate();
                    }
                }
                else if (netEntity is CodeLock codeLock)
                {
                    string entClan = EnsureEntityClan(codeLock);
                    if (!string.IsNullOrEmpty(entClan) && entClan.Equals(clanTag, StringComparison.OrdinalIgnoreCase))
                    {
                        if (DeauthorizeFromCodeLock(codeLock, userId)) codeLock.SendNetworkUpdate();
                    }
                }
                else if (netEntity is Door door)
                {
                    string entClan = EnsureEntityClan(door);
                    if (!string.IsNullOrEmpty(entClan) && entClan.Equals(clanTag, StringComparison.OrdinalIgnoreCase))
                    {
                        BaseLock baseLock = door.GetSlot(BaseEntity.Slot.Lock) as BaseLock;
                        if (baseLock is CodeLock cl)
                        {
                            if (DeauthorizeFromCodeLock(cl, userId)) cl.SendNetworkUpdate();
                        }
                    }
                }
            }

            BasePlayer target = BasePlayer.FindByID(userId);
            if (target != null && target.IsConnected)
            {
                SendReply(target, "<color=#ff4444>Clan door, Tool Cupboard and Auto Turret access revoked.</color>");
            }
        }

        #endregion

        #region Centralized Clan Membership Logic

        private void HandlePlayerRemovedFromClan(ulong userId, string clanTag, bool isKick = false)
        {
            if (processingClanRemoval.Contains(userId)) return;
            processingClanRemoval.Add(userId);

            try
            {
                string playerId = userId.ToString();
                if (string.IsNullOrEmpty(clanTag) || !clans.TryGetValue(clanTag, out Clan clan))
                {
                    playerClans.Remove(playerId);
                    return;
                }

                clan.members.Remove(playerId);
                clan.moderators.Remove(playerId);
                clan.invited.Remove(playerId);
                playerClans.Remove(playerId);

                RemovePlayerClanPrivileges(userId, clanTag);
                CancelTeleport(userId);

                var team = RelationshipManager.ServerInstance.FindPlayersTeam(userId);
                if (team != null)
                {
                    team.RemovePlayer(userId);
                    if (team.members.Count == 0)
                    {
                        RelationshipManager.ServerInstance.DisbandTeam(team);
                    }
                }

                if (clan.members.Count == 0)
                {
                    clans.Remove(clanTag);
                    List<ulong> entToRemove = new List<ulong>();
                    foreach (var kvp in entityToClan)
                    {
                        if (kvp.Value.Equals(clanTag, StringComparison.OrdinalIgnoreCase))
                            entToRemove.Add(kvp.Key);
                    }
                    foreach (var id in entToRemove)
                    {
                        entityToClan.Remove(id);
                    }
                }
                else if (clan.owner == playerId)
                {
                    string newOwnerIdStr = clan.members[0];
                    clan.owner = newOwnerIdStr;

                    if (!clan.moderators.Contains(newOwnerIdStr))
                    {
                        clan.moderators.Add(newOwnerIdStr);
                    }

                    if (ulong.TryParse(newOwnerIdStr, out ulong newOwnerUlong))
                    {
                        var clanTeam = RelationshipManager.ServerInstance.FindPlayersTeam(newOwnerUlong);
                        if (clanTeam != null)
                        {
                            clanTeam.SetTeamLeader(newOwnerUlong);
                        }

                        BasePlayer newOwnerPlayer = BasePlayer.FindByID(newOwnerUlong);
                        if (newOwnerPlayer != null && newOwnerPlayer.IsConnected)
                        {
                            SendReply(newOwnerPlayer, $"<color=#2ecc71>The previous owner left. You are now the leader of clan [{clanTag}]!</color>");
                        }
                    }
                }

                SaveData();

                BasePlayer targetPlayer = BasePlayer.FindByID(userId);
                if (targetPlayer != null)
                {
                    CuiHelper.DestroyUi(targetPlayer, ClanUI_Name);
                    UpdatePlayerDisplayName(targetPlayer);

                    if (isKick)
                        SendReply(targetPlayer, $"<color=#ff4444>You have been kicked from clan [{clanTag}].</color>");
                    else
                        SendReply(targetPlayer, $"You have left clan [{clanTag}].");

                    NextTick(() =>
                    {
                        if (targetPlayer != null) UpdatePlayerDisplayName(targetPlayer);
                    });
                }
            }
            finally
            {
                processingClanRemoval.Remove(userId);
            }
        }

        #endregion

        #region Player & Name Utilities

        void OnPlayerConnected(BasePlayer player)
        {
            if (player == null) return;
            NextTick(() => {
                UpdatePlayerDisplayName(player);
            });
        }

        void OnPlayerDisconnected(BasePlayer player)
        {
            if (player == null) return;
            CuiHelper.DestroyUi(player, ClanUI_Name);
            if (originalNames.ContainsKey(player.userID))
            {
                player.displayName = originalNames[player.userID];
                player._name = originalNames[player.userID];
                originalNames.Remove(player.userID);
            }
            CancelTeleport(player.userID);
        }

        private string CleanTagFromText(string name)
        {
            if (string.IsNullOrEmpty(name)) return string.Empty;
            name = name.Trim();

            while (name.StartsWith("[") && name.Contains("]"))
            {
                int closeIdx = name.IndexOf(']');
                if (closeIdx != -1)
                {
                    name = name.Substring(closeIdx + 1).Trim();
                }
                else
                {
                    break;
                }
            }
            return name;
        }

        private string GetRealPlayerName(BasePlayer player)
        {
            if (player == null) return string.Empty;

            if (originalNames.TryGetValue(player.userID, out string stored) && !string.IsNullOrEmpty(stored))
            {
                string clean = CleanTagFromText(stored);
                if (!string.IsNullOrEmpty(clean))
                {
                    originalNames[player.userID] = clean;
                    return clean;
                }
            }

            if (player.net?.connection != null && !string.IsNullOrEmpty(player.net.connection.username))
            {
                string clean = CleanTagFromText(player.net.connection.username);
                if (!string.IsNullOrEmpty(clean))
                {
                    originalNames[player.userID] = clean;
                    return clean;
                }
            }

            if (player.IPlayer != null && !string.IsNullOrEmpty(player.IPlayer.Name))
            {
                string clean = CleanTagFromText(player.IPlayer.Name);
                if (!string.IsNullOrEmpty(clean))
                {
                    originalNames[player.userID] = clean;
                    return clean;
                }
            }

            string cleanDisplay = CleanTagFromText(player.displayName);
            originalNames[player.userID] = cleanDisplay;
            return cleanDisplay;
        }

        private void UpdatePlayerDisplayName(BasePlayer player)
        {
            if (player == null) return;

            string realName = GetRealPlayerName(player);
            string tag = GetPlayerClanTag(player);

            string targetName = !string.IsNullOrEmpty(tag) ? $"[{tag}] {realName}" : realName;

            if (player.displayName != targetName || player._name != targetName)
            {
                player.displayName = targetName;
                player._name = targetName;

                if (player.net != null && player.net.connection != null)
                {
                    player.net.connection.username = targetName;
                }

                if (player.IPlayer != null)
                {
                    player.IPlayer.Name = targetName;
                }

                ServerMgr.Instance.persistance.SetPlayerName(player.userID, targetName);

                try
                {
                    player.IPlayer?.Rename(targetName);
                }
                catch { }

                player.SendNetworkUpdateImmediate();
                player.SendNetworkUpdate();

                try
                {
                    if (player.net?.group != null && player.net.group != BaseNetworkable.LimboNetworkGroup)
                    {
                        List<Network.Connection> connections = Facepunch.Pool.Get<List<Network.Connection>>();
                        for (int i = 0; i < Network.Net.sv.connections.Count; i++)
                        {
                            Network.Connection conn = Network.Net.sv.connections[i];
                            if (conn.connected && conn.isAuthenticated && conn.player is BasePlayer && conn.player != player)
                            {
                                connections.Add(conn);
                            }
                        }
                        player.OnNetworkSubscribersLeave(connections);
                        Facepunch.Pool.FreeUnmanaged(ref connections);

                        NextTick(() =>
                        {
                            if (player != null && player.IsConnected)
                            {
                                player.UpdateNetworkGroup();
                                player.SendNetworkUpdate();
                            }
                        });
                    }
                }
                catch { }
            }
        }

        private string GetPlayerClanTag(BasePlayer player)
        {
            if (player == null) return null;
            return GetPlayerClanTagByID(player.UserIDString);
        }

        private string GetPlayerClanTagByID(string playerId)
        {
            if (string.IsNullOrEmpty(playerId)) return null;

            if (playerClans.TryGetValue(playerId, out string tag) && !string.IsNullOrEmpty(tag))
            {
                if (clans.ContainsKey(tag) && clans[tag].members.Contains(playerId))
                    return tag;
                else
                    playerClans.Remove(playerId);
            }

            foreach (var clan in clans.Values)
            {
                if (clan.members != null && clan.members.Contains(playerId))
                {
                    playerClans[playerId] = clan.tag;
                    return clan.tag;
                }
            }

            return null;
        }

        private string GetPlayerClanTagByID(ulong userId)
        {
            return GetPlayerClanTagByID(userId.ToString());
        }

        #endregion

        #region Hooks: Entity Placement, Spawning & Destruction

        void OnEntityBuilt(Planner plan, GameObject go)
        {
            if (plan == null || go == null) return;
            BasePlayer player = plan.GetOwnerPlayer();
            if (player == null) return;

            Door door = go.GetComponent<Door>();
            if (door != null)
            {
                NextTick(() =>
                {
                    if (door == null || door.IsDestroyed) return;
                    EnsureEntityClan(door);
                    TryAutoLockDoor(door, player);
                });
            }
        }

        void OnEntitySpawned(BaseNetworkable entity)
        {
            if (entity == null) return;

            if (entity is BuildingPrivlidge tc)
            {
                NextTick(() =>
                {
                    if (tc == null || tc.IsDestroyed || tc.net == null) return;
                    string clanTag = EnsureEntityClan(tc);
                    if (!string.IsNullOrEmpty(clanTag))
                    {
                        SyncAllClanPrivileges(clanTag);
                    }
                });
            }
            else if (entity is AutoTurret turret)
            {
                NextTick(() =>
                {
                    if (turret == null || turret.IsDestroyed || turret.net == null) return;
                    string clanTag = EnsureEntityClan(turret);
                    if (!string.IsNullOrEmpty(clanTag))
                    {
                        SyncAllClanPrivileges(clanTag);
                    }
                });
            }
            else if (entity is Door door)
            {
                NextTick(() =>
                {
                    if (door == null || door.IsDestroyed) return;
                    EnsureEntityClan(door);
                });
            }
            else if (entity is BaseLock baseLock)
            {
                NextTick(() =>
                {
                    if (baseLock == null || baseLock.IsDestroyed || baseLock.net == null) return;
                    string clanTag = EnsureEntityClan(baseLock);
                    if (!string.IsNullOrEmpty(clanTag))
                    {
                        SyncAllClanPrivileges(clanTag);
                    }
                });
            }
        }

        void OnEntityKill(BaseNetworkable entity)
        {
            if (entity == null || entity.net == null) return;
            ulong entityId = entity.net.ID.Value;

            entityToClan.Remove(entityId);
            autoLockProcessing.Remove(entityId);

            if (doorCloseTimers.TryGetValue(entityId, out Timer existing))
            {
                existing?.Destroy();
                doorCloseTimers.Remove(entityId);
            }
        }

        #endregion

        #region Hooks: Doors, Locks & Auto-Close

        object CanUseLockedEntity(BasePlayer player, BaseLock baseLock)
        {
            if (player == null || baseLock == null) return null;

            string playerClan = GetPlayerClanTag(player);
            if (string.IsNullOrEmpty(playerClan)) return null;

            string lockClan = EnsureEntityClan(baseLock);

            if (!string.IsNullOrEmpty(lockClan) && lockClan.Equals(playerClan, StringComparison.OrdinalIgnoreCase))
            {
                if (baseLock is CodeLock codeLock)
                {
                    if (codeLock.whitelistPlayers != null && !codeLock.whitelistPlayers.Contains(player.userID))
                    {
                        codeLock.whitelistPlayers.Add(player.userID);
                        codeLock.SendNetworkUpdate();
                    }
                }
                return true;
            }

            return null;
        }

        void OnCodeEntered(CodeLock codeLock, BasePlayer player, string code)
        {
            if (codeLock == null || player == null || string.IsNullOrEmpty(code)) return;
            if (!codeLock.hasCode || code != codeLock.code) return;

            string tag = GetPlayerClanTag(player);
            if (!string.IsNullOrEmpty(tag))
            {
                EnsureEntityClan(codeLock);
                NextTick(() =>
                {
                    if (codeLock == null || codeLock.IsDestroyed) return;
                    SyncAllClanPrivileges(tag);
                });
            }
        }

        void OnDoorOpened(Door door, BasePlayer player)
        {
            if (door == null || door.net == null) return;

            string doorClan = EnsureEntityClan(door);
            if (string.IsNullOrEmpty(doorClan)) return;

            if (player != null)
            {
                string playerClan = GetPlayerClanTag(player);
                if (playerClan != doorClan) return;
            }

            ulong doorId = door.net.ID.Value;
            if (doorCloseTimers.TryGetValue(doorId, out Timer existing))
            {
                existing?.Destroy();
                doorCloseTimers.Remove(doorId);
            }

            doorCloseTimers[doorId] = timer.Once(30f, () =>
            {
                doorCloseTimers.Remove(doorId);
                if (door != null && !door.IsDestroyed && door.IsOpen())
                {
                    door.SetOpen(false);
                }
            });
        }

        void OnDoorClosed(Door door, BasePlayer player)
        {
            if (door == null || door.net == null) return;
            ulong doorId = door.net.ID.Value;
            if (doorCloseTimers.TryGetValue(doorId, out Timer existing))
            {
                existing?.Destroy();
                doorCloseTimers.Remove(doorId);
            }
        }

        #endregion

        #region Hooks: Cupboards, Turrets & Traps

        void OnCupboardAuthorize(BuildingPrivlidge priv, BasePlayer player)
        {
            if (priv == null || player == null) return;
            string tag = GetPlayerClanTag(player);
            if (!string.IsNullOrEmpty(tag))
            {
                EnsureEntityClan(priv);
                NextTick(() => SyncAllClanPrivileges(tag));
            }
        }

        void OnTurretAuthorize(AutoTurret turret, BasePlayer player)
        {
            if (turret == null || player == null) return;
            string tag = GetPlayerClanTag(player);
            if (!string.IsNullOrEmpty(tag))
            {
                EnsureEntityClan(turret);
                NextTick(() => SyncAllClanPrivileges(tag));
            }
        }

        void OnBuildingPrivilegeEnter(BuildingPrivlidge priv, BasePlayer player)
        {
            if (priv == null || player == null || player.IsDead()) return;

            string privClan = EnsureEntityClan(priv);
            string playerClan = GetPlayerClanTag(player);

            if (!string.IsNullOrEmpty(playerClan) && !string.IsNullOrEmpty(privClan) && privClan.Equals(playerClan, StringComparison.OrdinalIgnoreCase))
            {
                if (AuthorizeOnCupboard(priv, player.userID))
                {
                    priv.SendNetworkUpdate();
                }
            }
        }

        object CanUseUI(BasePlayer player, BuildingPrivlidge priv)
        {
            if (player == null || priv == null) return null;

            string playerClan = GetPlayerClanTag(player);
            string privClan = EnsureEntityClan(priv);

            if (!string.IsNullOrEmpty(playerClan) && !string.IsNullOrEmpty(privClan) && privClan.Equals(playerClan, StringComparison.OrdinalIgnoreCase))
            {
                if (AuthorizeOnCupboard(priv, player.userID))
                {
                    priv.SendNetworkUpdate();
                }
            }
            return null;
        }

        object OnTurretTarget(AutoTurret turret, BaseCombatEntity target)
        {
            if (turret == null || turret.IsDestroyed || target == null) return null;

            BasePlayer targetPlayer = target as BasePlayer;
            if (targetPlayer == null) return null;

            string turretClan = EnsureEntityClan(turret);
            if (string.IsNullOrEmpty(turretClan)) return null;

            string targetClan = GetPlayerClanTag(targetPlayer);
            if (!string.IsNullOrEmpty(targetClan) && targetClan.Equals(turretClan, StringComparison.OrdinalIgnoreCase))
            {
                if (AuthorizeOnTurret(turret, targetPlayer.userID))
                {
                    turret.SendNetworkUpdate();
                }
                return false;
            }

            return null;
        }

        object OnTrapTrigger(BaseTrap trap, GameObject go)
        {
            if (trap == null || go == null) return null;
            BasePlayer player = go.GetComponent<BasePlayer>();
            if (player == null) return null;

            string trapClan = EnsureEntityClan(trap);
            if (string.IsNullOrEmpty(trapClan)) return null;

            string playerClan = GetPlayerClanTag(player);
            if (!string.IsNullOrEmpty(playerClan) && playerClan.Equals(trapClan, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            return null;
        }

        #endregion

        #region Hooks: Teams, Friendly Fire & Chat

        void OnTeamAcceptInvite(RelationshipManager.PlayerTeam team, BasePlayer player)
        {
            if (team == null || player == null) return;

            string tag = GetPlayerClanTagByID(team.teamLeader);
            if (string.IsNullOrEmpty(tag))
            {
                foreach (var member in team.members)
                {
                    tag = GetPlayerClanTagByID(member);
                    if (!string.IsNullOrEmpty(tag)) break;
                }
            }

            if (!string.IsNullOrEmpty(tag) && clans.TryGetValue(tag, out Clan clan))
            {
                string playerId = player.UserIDString;
                if (!clan.members.Contains(playerId))
                {
                    clan.members.Add(playerId);
                }
                playerClans[playerId] = tag;

                GrantAllClanPrivileges(player, tag);
                SyncAllClanPrivileges(tag);
                SaveData();

                NextTick(() => {
                    UpdatePlayerDisplayName(player);
                    SendReply(player, $"<color=#2ecc71>Joined [{tag}]! You now have instant access to all clan doors, TCs, and turrets.</color>");
                });
            }
        }

        object OnPlayerChat(BasePlayer player, string message)
        {
            if (player == null || string.IsNullOrEmpty(message)) return null;
            if (message.StartsWith("/")) return null;

            string playerId = player.UserIDString;
            string tag = GetPlayerClanTag(player);
            string realName = GetRealPlayerName(player);

            // Check GoatKitsUI tier to color the player's NAME only
            string nameColor = GetGoatTierColor(player);

            string formattedSender;
            if (nameColor != null)
            {
                // Has a tier → color BOTH clan tag and name with the tier color
                formattedSender = !string.IsNullOrEmpty(tag)
                    ? $"<color={nameColor}>[{tag}] {realName}</color>"
                    : $"<color={nameColor}>{realName}</color>";
            }
            else
            {
                // No tier → default blue for everyone
                formattedSender = !string.IsNullOrEmpty(tag)
                    ? $"<color=#3498DB>[{tag}] {realName}</color>"
                    : $"<color=#3498DB>{realName}</color>";
            }

            rust.BroadcastChat(formattedSender, message, playerId);
            return false;
        }

        // Returns the hex color for a player's GoatKitsUI tier, or null if none
        private string GetGoatTierColor(BasePlayer player)
        {
            try
            {
                Plugin goat = plugins.Find("GoatKitsUI");
                if (goat == null || !goat.IsLoaded) return null;

                // Call GoatKitsUI's exported method to get tier color
                string color = goat.Call<string>("GetPlayerTierColor", player);
                return string.IsNullOrEmpty(color) ? null : color;
            }
            catch { return null; }
        }

        object OnEntityTakeDamage(BaseCombatEntity entity, HitInfo info)
        {
            if (entity == null || info == null) return null;

            BasePlayer victim = entity as BasePlayer;
            BasePlayer attacker = info.InitiatorPlayer;

            if (victim != null && attacker != null && victim != attacker)
            {
                string victimTag = GetPlayerClanTag(victim);
                string attackerTag = GetPlayerClanTag(attacker);

                if (!string.IsNullOrEmpty(victimTag) && victimTag.Equals(attackerTag, StringComparison.OrdinalIgnoreCase))
                {
                    if (clans.TryGetValue(victimTag, out Clan clan))
                    {
                        if (!clan.allowFriendlyFire)
                        {
                            SendReply(attacker, "<color=#ff4444>This is your clanmate</color>");
                            return true;
                        }
                    }
                }
            }

            return null;
        }

        void OnEntityDeath(BaseEntity entity, HitInfo info)
        {
            if (entity == null || info == null) return;

            BasePlayer victim = entity as BasePlayer;
            if (victim != null)
            {
                CancelTeleport(victim.userID);
            }

            BasePlayer killer = info.InitiatorPlayer;

            if (victim != null && killer != null && victim != killer)
            {
                UpdatePlayerDisplayName(killer);
                UpdatePlayerDisplayName(victim);

                string killerTag = GetPlayerClanTag(killer);
                string victimTag = GetPlayerClanTag(victim);

                if (string.IsNullOrEmpty(killerTag)) return;

                string killerRealName = GetRealPlayerName(killer);
                string victimRealName = GetRealPlayerName(victim);

                string killerFormatted = !string.IsNullOrEmpty(killerTag) ? $"<color=#2ecc71>[{killerTag}] {killerRealName}</color>" : $"<color=#2ecc71>{killerRealName}</color>";
                string victimFormatted = !string.IsNullOrEmpty(victimTag) ? $"<color=#e74c3c>[{victimTag}] {victimRealName}</color>" : $"<color=#e74c3c>{victimRealName}</color>";

                string killMessage = $"{killerFormatted} <color=#ffffff>killed</color> {victimFormatted}";

                HashSet<ulong> targetUsers = new HashSet<ulong>();

                if (clans.TryGetValue(killerTag, out Clan killerClan))
                {
                    foreach (var memberId in killerClan.members)
                    {
                        if (ulong.TryParse(memberId, out ulong mId)) targetUsers.Add(mId);
                    }
                }

                if (!string.IsNullOrEmpty(victimTag) && clans.TryGetValue(victimTag, out Clan victimClan))
                {
                    foreach (var memberId in victimClan.members)
                    {
                        if (ulong.TryParse(memberId, out ulong mId)) targetUsers.Add(mId);
                    }
                }

                foreach (var userId in targetUsers)
                {
                    BasePlayer targetPlayer = BasePlayer.FindByID(userId);
                    if (targetPlayer != null && targetPlayer.IsConnected)
                    {
                        targetPlayer.SendConsoleCommand("chat.add", 2, 0, killMessage);
                    }
                }
            }
        }

        object OnTeamCreate(BasePlayer player)
        {
            if (isInternalTeamCreate) return null;
            SendReply(player, "<color=#ff4444>Direct team creation is disabled!</color> Use <color=#ffa500>/clan create TAG</color> to create a clan.");
            return false;
        }

        private RelationshipManager.PlayerTeam GetOrCreateTeam(Clan clan)
        {
            if (clan == null || string.IsNullOrEmpty(clan.owner)) return null;
            if (!ulong.TryParse(clan.owner, out ulong ownerId)) return null;

            var ownerPlayer = BasePlayer.FindByID(ownerId);
            var team = RelationshipManager.ServerInstance.FindPlayersTeam(ownerId);

            if (team == null && ownerPlayer != null)
            {
                isInternalTeamCreate = true;
                team = RelationshipManager.ServerInstance.CreateTeam();
                isInternalTeamCreate = false;

                if (team != null)
                {
                    team.teamLeader = ownerId;
                    team.AddPlayer(ownerPlayer);
                }
            }

            return team;
        }

        void OnTeamLeave(RelationshipManager.PlayerTeam team, BasePlayer player)
        {
            if (player == null) return;
            string tag = GetPlayerClanTag(player);
            HandlePlayerRemovedFromClan(player.userID, tag, false);
        }

        void OnTeamKick(RelationshipManager.PlayerTeam team, BasePlayer player, ulong target)
        {
            string tag = GetPlayerClanTagByID(target);
            HandlePlayerRemovedFromClan(target, tag, true);
        }

        #endregion

        #region Teleportation

        private void CancelTeleport(ulong userId)
        {
            if (activeTeleports.TryGetValue(userId, out var timer))
            {
                timer?.Destroy();
                activeTeleports.Remove(userId);
            }
        }

        #endregion

        #region Clan UI

        [ConsoleCommand("clan_ui_leave")]
        void cmdClanUILeave(ConsoleSystem.Arg arg)
        {
            BasePlayer player = arg.Player();
            if (player == null) return;

            string tag = GetPlayerClanTag(player);
            HandlePlayerRemovedFromClan(player.userID, tag, false);
        }

        private void ShowClanMenu(BasePlayer player)
        {
            CuiHelper.DestroyUi(player, ClanUI_Name);

            CuiElementContainer container = new CuiElementContainer();

            string panelName = container.Add(new CuiPanel
            {
                Image = { Color = "0.1 0.1 0.1 0.9" },
                RectTransform = { AnchorMin = "0.38 0.38", AnchorMax = "0.62 0.62" },
                CursorEnabled = true
            }, "Overlay", ClanUI_Name);

            container.Add(new CuiElement
            {
                Parent = panelName,
                Components =
                {
                    new CuiTextComponent { Text = "<b>CLANS MENU</b>", FontSize = 16, Align = TextAnchor.MiddleCenter, Color = "1 0.65 0 1" },
                    new CuiRectTransformComponent { AnchorMin = "0.1 0.75", AnchorMax = "0.9 0.9" }
                }
            });

            string clanTag = GetPlayerClanTag(player);
            string infoText = !string.IsNullOrEmpty(clanTag) ? $"Clan: [{clanTag}]" : "Not in a clan.";
            container.Add(new CuiElement
            {
                Parent = panelName,
                Components =
                {
                    new CuiTextComponent { Text = infoText, FontSize = 13, Align = TextAnchor.MiddleCenter, Color = "0.8 0.8 0.8 1" },
                    new CuiRectTransformComponent { AnchorMin = "0.1 0.45", AnchorMax = "0.9 0.65" }
                }
            });

            container.Add(new CuiButton
            {
                Button = { Color = "0.8 0.1 0.1 1", Command = "clan_ui_leave" },
                RectTransform = { AnchorMin = "0.85 0.8", AnchorMax = "0.95 0.95" },
                Text = { Text = "<b>X</b>", FontSize = 14, Align = TextAnchor.MiddleCenter, Color = "1 1 1 1" }
            }, panelName);

            CuiHelper.AddUi(player, container);
        }

        #endregion

        #region Chat Commands

        [ChatCommand("cff")]
        void cmdCFF(BasePlayer player, string command, string[] args)
        {
            string playerId = player.UserIDString;
            string tag = GetPlayerClanTag(player);

            if (string.IsNullOrEmpty(tag))
            {
                SendReply(player, "<color=#ffffff>You are not in a clan!</color>");
                return;
            }

            Clan clan = clans[tag];
            if (clan.owner != playerId)
            {
                SendReply(player, "<color=#ffffff>Only the clan owner can change friendly fire settings!</color>");
                return;
            }

            clan.allowFriendlyFire = !clan.allowFriendlyFire;
            SaveData();

            string status = clan.allowFriendlyFire ? "enabled" : "disabled";
            SendReply(player, $"<color=#ffffff>Clan friendly fire has been {status}.</color>");
        }

        [ChatCommand("clan")]
        void cmdClan(BasePlayer player, string command, string[] args)
        {
            string playerId = player.UserIDString;

            if (args.Length == 0)
            {
                ShowClanMenu(player);
                return;
            }

            string subCmd = args[0].ToLower();

            if (subCmd == "help")
            {
                string helpMessage = "<color=#ffa500>=== CLAN COMMANDS HELP ===</color>\n" +
                                     "<color=#3498DB>/clan</color> - Opens the clan management UI menu.\n" +
                                     "<color=#3498DB>/clan help</color> - Shows this help list.\n" +
                                     "<color=#3498DB>/clan create <TAG> [Desc]</color> - Creates a new clan.\n" +
                                     "<color=#3498DB>/clan invite <PlayerName></color> - Invites a player to your clan (Owner/Mod).\n" +
                                     "<color=#3498DB>/clan leave</color> - Leaves your current clan.\n" +
                                     "<color=#3498DB>/clan sethome</color> - Sets your clan home position (Owner/Mod).\n" +
                                     "<color=#3498DB>/clan home</color> - Teleports to your clan home.\n" +
                                     "<color=#3498DB>/clan kick <PlayerName></color> - Kicks a member from your clan (Owner/Mod).\n" +
                                     "<color=#3498DB>/cff</color> - Toggles friendly fire on/off for your clan (Owner only).";

                SendReply(player, helpMessage);
                return;
            }

            if (subCmd == "create")
            {
                if (args.Length < 2)
                {
                    SendReply(player, "Usage: /clan create TAG Description");
                    return;
                }

                if (playerClans.ContainsKey(playerId))
                {
                    SendReply(player, "You are already in a clan!");
                    return;
                }

                string tag = args[1].Replace("\"", "").Trim();
                if (tag.Length < 2 || tag.Length > 6)
                {
                    SendReply(player, "Clan TAG must be between 2 and 6 characters.");
                    return;
                }

                if (clans.ContainsKey(tag))
                {
                    SendReply(player, "This clan TAG is already taken!");
                    return;
                }

                string desc = args.Length > 2 ? string.Join(" ", args.Skip(2)).Replace("\"", "").Trim() : "";

                Clan clan = new Clan
                {
                    tag = tag,
                    description = desc,
                    owner = playerId
                };
                clan.members.Add(playerId);
                clan.moderators.Add(playerId);

                clans[tag] = clan;
                playerClans[playerId] = tag;

                GrantAllClanPrivileges(player, tag);
                SyncAllClanPrivileges(tag);
                SaveData();

                UpdatePlayerDisplayName(player);
                GetOrCreateTeam(clan);

                SendReply(player, $"Successfully created clan [{tag}]!");
                return;
            }

            if (subCmd == "invite")
            {
                string tag = GetPlayerClanTag(player);
                if (string.IsNullOrEmpty(tag))
                {
                    SendReply(player, "You are not in a clan!");
                    return;
                }

                Clan clan = clans[tag];
                if (!clan.moderators.Contains(playerId))
                {
                    SendReply(player, "You do not have permission to invite members!");
                    return;
                }

                if (args.Length < 2)
                {
                    SendReply(player, "Usage: /clan invite PlayerName");
                    return;
                }

                string targetName = string.Join(" ", args.Skip(1)).Replace("\"", "").Trim();
                BasePlayer target = BasePlayer.Find(targetName);
                if (target == null)
                {
                    SendReply(player, "Player not found!");
                    return;
                }

                if (!clan.invited.Contains(target.UserIDString))
                    clan.invited.Add(target.UserIDString);

                SaveData();

                var team = GetOrCreateTeam(clan);
                if (team != null)
                {
                    team.SendInvite(target);
                }

                string cleanTargetName = GetRealPlayerName(target);
                double activeSecs = (target.net != null && target.net.connection != null) ? (UnityEngine.Time.realtimeSinceStartup - target.net.connection.connectionTime) : 0.0;
                TimeSpan t = TimeSpan.FromSeconds(activeSecs);
                string playTimeStr = string.Format("{0}h {1}m", (int)t.TotalHours, t.Minutes);

                SendReply(player, $"Invitation sent to {cleanTargetName} <color=#ffa500>(Active: {playTimeStr})</color>.");
                SendReply(target, $"You received an invitation to clan [{tag}]. Accept it from the team interface.");
                return;
            }

            if (subCmd == "leave")
            {
                string tag = GetPlayerClanTag(player);
                if (string.IsNullOrEmpty(tag))
                {
                    var team = RelationshipManager.ServerInstance.FindPlayersTeam(player.userID);
                    if (team != null) team.RemovePlayer(player.userID);
                    UpdatePlayerDisplayName(player);
                    SendReply(player, "You are not in a team/clan!");
                    return;
                }

                HandlePlayerRemovedFromClan(player.userID, tag, false);
                return;
            }

            if (subCmd == "sethome")
            {
                string tag = GetPlayerClanTag(player);
                if (string.IsNullOrEmpty(tag))
                {
                    SendReply(player, "You are not in a clan!");
                    return;
                }

                Clan clan = clans[tag];
                if (!clan.moderators.Contains(playerId))
                {
                    SendReply(player, "Only the owner or moderators can set the clan home!");
                    return;
                }

                if (player.IsWounded() || player.IsSwimming() || !player.IsOnGround())
                {
                    SendReply(player, "<color=#ff4444>Cannot set clan home while wounded, swimming, or airborne!</color>");
                    return;
                }

                Vector3 pos = player.transform.position;
                clan.homePosition = $"{pos.x},{pos.y},{pos.z}";
                SaveData();

                SendReply(player, $"<color=#2ecc71>Clan [{tag}] home has been successfully set!</color>");
                return;
            }

            if (subCmd == "home")
            {
                string tag = GetPlayerClanTag(player);
                if (string.IsNullOrEmpty(tag))
                {
                    SendReply(player, "You are not in a clan!");
                    return;
                }

                Clan clan = clans[tag];
                if (string.IsNullOrEmpty(clan.homePosition))
                {
                    SendReply(player, "<color=#ff4444>Your clan has not set a home yet! Use /clan sethome</color>");
                    return;
                }

                if (player.IsWounded() || player.IsSwimming())
                {
                    SendReply(player, "<color=#ff4444>Cannot teleport while wounded or swimming!</color>");
                    return;
                }

                if (activeTeleports.ContainsKey(player.userID))
                {
                    SendReply(player, "<color=#ff4444>You already have a teleport in progress!</color>");
                    return;
                }

                string[] coords = clan.homePosition.Split(',');
                if (coords.Length != 3 || !float.TryParse(coords[0], out float x) || !float.TryParse(coords[1], out float y) || !float.TryParse(coords[2], out float z))
                {
                    SendReply(player, "<color=#ff4444>Invalid clan home coordinates!</color>");
                    return;
                }

                Vector3 targetPos = new Vector3(x, y, z);
                SendReply(player, "<color=#ffffff>Teleporting to clan home in 20 seconds. You can move freely!</color>");

                int timeLeft = 20;

                Timer tpTimer = timer.Every(1f, () => {
                    if (player == null || !player.IsConnected || player.IsDead())
                    {
                        CancelTeleport(player.userID);
                        return;
                    }

                    if (player.IsWounded())
                    {
                        SendReply(player, "<color=#ff4444>Teleport cancelled because you were wounded!</color>");
                        CancelTeleport(player.userID);
                        return;
                    }

                    timeLeft--;
                    if (timeLeft <= 0)
                    {
                        CancelTeleport(player.userID);

                        if (player.GetMounted() != null)
                        {
                            player.GetMounted().DismountPlayer(player);
                        }

                        player.StartSleeping();
                        player.Teleport(targetPos);
                        SendReply(player, "<color=#2ecc71>Successfully teleported to clan home!</color>");
                    }
                });

                activeTeleports[player.userID] = tpTimer;
                return;
            }

            if (subCmd == "kick")
            {
                string tag = GetPlayerClanTag(player);
                if (string.IsNullOrEmpty(tag))
                {
                    SendReply(player, "You are not in a clan!");
                    return;
                }

                Clan clan = clans[tag];
                if (!clan.moderators.Contains(playerId))
                {
                    SendReply(player, "You do not have permission to kick members!");
                    return;
                }

                if (args.Length < 2)
                {
                    SendReply(player, "Usage: /clan kick PlayerName");
                    return;
                }

                string targetInput = string.Join(" ", args.Skip(1)).Replace("\"", "").Trim();
                string targetId = null;

                foreach (var memberId in clan.members)
                {
                    if (memberId.Equals(targetInput, StringComparison.OrdinalIgnoreCase))
                    {
                        targetId = memberId;
                        break;
                    }

                    if (ulong.TryParse(memberId, out ulong uId))
                    {
                        string originalName = originalNames.ContainsKey(uId) ? originalNames[uId] : string.Empty;
                        var onlinePlayer = BasePlayer.FindByID(uId);

                        if (memberId.Equals(targetInput, StringComparison.OrdinalIgnoreCase) ||
                            (!string.IsNullOrEmpty(originalName) && originalName.Equals(targetInput, StringComparison.OrdinalIgnoreCase)) ||
                            (onlinePlayer != null && CleanTagFromText(onlinePlayer.displayName).Equals(targetInput, StringComparison.OrdinalIgnoreCase)))
                        {
                            targetId = memberId;
                            break;
                        }
                    }
                }

                if (targetId == null)
                {
                    SendReply(player, $"Player '{targetInput}' is not in your clan!");
                    return;
                }

                if (targetId == clan.owner && playerId != clan.owner)
                {
                    SendReply(player, "You cannot kick the clan owner!");
                    return;
                }

                if (ulong.TryParse(targetId, out ulong targetUlong))
                {
                    HandlePlayerRemovedFromClan(targetUlong, tag, true);
                    SendReply(player, $"Player has been successfully kicked from the clan.");
                }
                return;
            }
        }

        #endregion
    }
}