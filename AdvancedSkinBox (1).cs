using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Network;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Oxide.Core;
using Oxide.Core.Plugins;
using Oxide.Game.Rust.Cui;
using UnityEngine;

namespace Oxide.Plugins
{
    [Info("AdvancedSkinBox", "ProductionEngine", "3.5.0")]
    [Description("Classic native inventory container SkinBox with direct GoatKits GEMS data sync.")]
    public class AdvancedSkinBox : RustPlugin
    {
        #region References

        [PluginReference]
        private Plugin GoatKitsUI;

        #endregion

        #region Permissions

        private const string PermUse = "advancedskinbox.use";
        private const string PermAdmin = "advancedskinbox.admin";
        private const string PermVip = "advancedskinbox.vip";
        private const string PermFree = "advancedskinbox.free";

        #endregion

        #region UI Constants

        private const string CUI_PAGINATION = "ASB_PaginationUI";
        private const string BOX_PREFAB = "assets/prefabs/deployable/large wood storage/box.wooden.large.prefab";

        #endregion

        #region GoatKits Data Schema (For Direct Sync)

        public class GoatAccountEntry
        {
            public string Name;
            public int Gems;
            public int RP;
        }

        public class GoatDatabaseModel
        {
            public Dictionary<string, GoatAccountEntry> Accounts = new Dictionary<string, GoatAccountEntry>();
        }

        #endregion

        #region State & Economy Models

        private class SkinBoxSession
        {
            public BasePlayer Player;
            public StorageContainer BoxEntity;
            public ItemContainer Container => BoxEntity?.inventory;
            public string CurrentShortname = string.Empty;
            public int CurrentPage = 0;
            public bool IsRefreshing = false;
        }

        public class PricingDatabase
        {
            [JsonProperty("DefaultPrice")]
            public double DefaultPrice = 50.0;

            [JsonProperty("CurrencyName")]
            public string CurrencyName = "GEMS";

            [JsonProperty("CustomSkinPrices")]
            public Dictionary<ulong, double> CustomSkinPrices = new Dictionary<ulong, double>();
        }

        private PricingDatabase _pricingData = new PricingDatabase();
        private readonly Dictionary<ulong, SkinBoxSession> _activeSessions = new Dictionary<ulong, SkinBoxSession>();
        private readonly Dictionary<string, List<ulong>> _itemSkins = new Dictionary<string, List<ulong>>(StringComparer.OrdinalIgnoreCase);

        private const string ImportFilePath = "AdvancedSkinBox/Skins-All";
        private const string PricingFilePath = "AdvancedSkinBox/SkinPrices";
        private const string GoatKitsDataFile = "GoatKits_Players";
        private const int SLOTS_PER_PAGE = 35;

        #endregion

        #region Lifecycle Hooks

        private void Init()
        {
            permission.RegisterPermission(PermUse, this);
            permission.RegisterPermission(PermAdmin, this);
            permission.RegisterPermission(PermVip, this);
            permission.RegisterPermission(PermFree, this);

            lang.RegisterMessages(new Dictionary<string, string>
            {
                ["NoPermission"] = "<color=#e74c3c>ليس لديك صلاحية لاستخدام السكن بوكس.</color>",
                ["NotEnoughGems"] = "<color=#e74c3c>ليس لديك رصيد كافٍ من {0}! السعر: {1} {0} | رصيدك: {2}</color>",
                ["SkinPurchased"] = "<color=#2ecc71>تم تطبيق السكن بنجاح! تم خصم {0} {1}.</color>",
                ["SkinFree"] = "<color=#2ecc71>تم تطبيق السكن مجاناً كـ Admin/Owner!</color>",
                ["PageInfo"] = "الصفحة: {0}/{1} | السعر: {2} {3}",
                ["PriceSet"] = "<color=#2ecc71>تم تحديد سعر السكن {0} بمبلغ {1} {2}.</color>"
            }, this, "ar");

            lang.RegisterMessages(new Dictionary<string, string>
            {
                ["NoPermission"] = "<color=#e74c3c>You do not have permission to use SkinBox.</color>",
                ["NotEnoughGems"] = "<color=#e74c3c>You do not have enough {0}! Cost: {1} {0} | Balance: {2}</color>",
                ["SkinPurchased"] = "<color=#2ecc71>Skin applied! Deducted {0} {1}.</color>",
                ["SkinFree"] = "<color=#2ecc71>Skin applied for free as Admin/Owner!</color>",
                ["PageInfo"] = "Page: {0}/{1} | Cost: {2} {3}",
                ["PriceSet"] = "<color=#2ecc71>Price for skin {0} set to {1} {2}.</color>"
            }, this, "en");
        }

        private void OnServerInitialized()
        {
            LoadSkinsDatabase();
            LoadPricingDatabase();
            Puts("[AdvancedSkinBox] Connected directly to GoatKits GEMS system.");
        }

        private void Unload()
        {
            foreach (var session in _activeSessions.Values.ToList())
            {
                CloseSkinBox(session.Player);
            }
            _activeSessions.Clear();
            SavePricingDatabase();
        }

        private void OnPlayerDisconnected(BasePlayer player)
        {
            if (player == null) return;
            CloseSkinBox(player);
        }

        #endregion

        #region GoatKits Direct GEMS Economy Engine

        private void LoadPricingDatabase()
        {
            try
            {
                if (Interface.Oxide.DataFileSystem.ExistsDatafile(PricingFilePath))
                {
                    _pricingData = Interface.Oxide.DataFileSystem.ReadObject<PricingDatabase>(PricingFilePath);
                }
                else
                {
                    _pricingData = new PricingDatabase();
                    SavePricingDatabase();
                }
            }
            catch (Exception ex)
            {
                PrintError($"[AdvancedSkinBox] Failed to load SkinPrices.json: {ex.Message}");
                _pricingData = new PricingDatabase();
            }
        }

        private void SavePricingDatabase()
        {
            try
            {
                Interface.Oxide.DataFileSystem.WriteObject(PricingFilePath, _pricingData);
            }
            catch (Exception ex)
            {
                PrintError($"[AdvancedSkinBox] Failed to save SkinPrices.json: {ex.Message}");
            }
        }

        public double GetSkinPrice(ulong skinId)
        {
            if (skinId == 0) return 0.0; // Vanilla Default skin is free

            if (_pricingData.CustomSkinPrices.TryGetValue(skinId, out double customPrice))
            {
                return customPrice;
            }

            return _pricingData.DefaultPrice;
        }

        // Reads GEMS directly from GoatKits_Players datafile
        public int GetPlayerGems(BasePlayer player)
        {
            if (player == null) return 0;
            try
            {
                if (Interface.Oxide.DataFileSystem.ExistsDatafile(GoatKitsDataFile))
                {
                    var goatData = Interface.Oxide.DataFileSystem.ReadObject<GoatDatabaseModel>(GoatKitsDataFile);
                    if (goatData?.Accounts != null && goatData.Accounts.TryGetValue(player.UserIDString, out var acc))
                    {
                        return acc.Gems;
                    }
                }
            }
            catch { }

            return 0;
        }

        // Deducts GEMS directly from GoatKits_Players datafile
        public bool DeductPlayerGems(BasePlayer player, int amount)
        {
            if (amount <= 0) return true;
            try
            {
                if (Interface.Oxide.DataFileSystem.ExistsDatafile(GoatKitsDataFile))
                {
                    var goatData = Interface.Oxide.DataFileSystem.ReadObject<GoatDatabaseModel>(GoatKitsDataFile);
                    if (goatData?.Accounts != null && goatData.Accounts.TryGetValue(player.UserIDString, out var acc))
                    {
                        if (acc.Gems >= amount)
                        {
                            acc.Gems -= amount;
                            Interface.Oxide.DataFileSystem.WriteObject(GoatKitsDataFile, goatData);
                            return true;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                PrintError($"[AdvancedSkinBox] Failed to deduct gems from {GoatKitsDataFile}: {ex.Message}");
            }

            return false;
        }

        #endregion

        #region Database Loading

        private void LoadSkinsDatabase()
        {
            _itemSkins.Clear();
            string fullPath = Path.Combine(Interface.Oxide.DataDirectory, ImportFilePath + ".json");
            if (!File.Exists(fullPath))
            {
                Puts("[AdvancedSkinBox] Skins-All.json not found. Creating default...");
                CreateDefaultSkinsFile();
                return;
            }

            try
            {
                string json = File.ReadAllText(fullPath);
                var root = JToken.Parse(json);

                if (root is JObject jObj)
                {
                    if (jObj["Skins"] is JArray legacyArray)
                    {
                        foreach (var elem in legacyArray)
                        {
                            string shortname = elem.Value<string>("Item Shortname") ?? elem.Value<string>("shortname");
                            var skinsArray = elem["Skins"] as JArray;
                            if (!string.IsNullOrEmpty(shortname) && skinsArray != null)
                            {
                                AddSkinsToDict(shortname, skinsArray.Select(x => x.Value<ulong>()));
                            }
                        }
                    }
                    else
                    {
                        foreach (var prop in jObj.Properties())
                        {
                            string shortname = prop.Name;
                            if (prop.Value is JArray idArray)
                            {
                                AddSkinsToDict(shortname, idArray.Select(x => x.Value<ulong>()));
                            }
                        }
                    }
                }

                Puts($"[AdvancedSkinBox] Loaded {_itemSkins.Count} items with {_itemSkins.Values.Sum(x => x.Count)} total skins!");
            }
            catch (Exception ex)
            {
                PrintError($"[AdvancedSkinBox] Failed to parse Skins-All.json: {ex.Message}");
            }
        }

        private void AddSkinsToDict(string shortname, IEnumerable<ulong> skinIds)
        {
            shortname = shortname.Trim().ToLowerInvariant();
            if (!_itemSkins.TryGetValue(shortname, out var list))
            {
                list = new List<ulong>();
                _itemSkins[shortname] = list;
            }

            foreach (var id in skinIds)
            {
                if (id > 0 && !list.Contains(id))
                {
                    list.Add(id);
                }
            }
        }

        private void CreateDefaultSkinsFile()
        {
            var template = new Dictionary<string, List<ulong>>
            {
                { "rifle.ak", new List<ulong> { 792197029, 801289131, 842091244 } },
                { "box.wooden.large", new List<ulong> { 789123901, 790123912 } }
            };
            Interface.Oxide.DataFileSystem.WriteObject(ImportFilePath, template);
            LoadSkinsDatabase();
        }

        [ConsoleCommand("skinbox.import")]
        private void CmdConsoleImport(ConsoleSystem.Arg arg)
        {
            LoadSkinsDatabase();
            if (arg.Player() != null) SendReply(arg.Player(), $"[AdvancedSkinBox] Skins reloaded. Total: {_itemSkins.Values.Sum(x => x.Count)}");
        }

        #endregion

        #region Container & Session Engine

        public void OpenSkinBox(BasePlayer player)
        {
            if (!permission.UserHasPermission(player.UserIDString, PermUse) && !player.IsAdmin)
            {
                SendReply(player, lang.GetMessage("NoPermission", this, player.UserIDString));
                return;
            }

            CloseSkinBox(player);

            Vector3 spawnPos = player.transform.position + new Vector3(0, -200f, 0);
            var boxEntity = GameManager.server.CreateEntity(BOX_PREFAB, spawnPos) as StorageContainer;
            if (boxEntity == null) return;

            boxEntity.enableSaving = false;
            boxEntity.Spawn();

            boxEntity.inventory.capacity = 36;
            boxEntity.inventory.allowedContents = ItemContainer.ContentsType.Generic;

            var session = new SkinBoxSession
            {
                Player = player,
                BoxEntity = boxEntity,
                CurrentPage = 0
            };

            _activeSessions[player.userID] = session;

            player.inventory.loot.Clear();
            player.inventory.loot.PositionChecks = false;
            player.inventory.loot.StartLootingEntity(boxEntity, false);
            player.inventory.loot.AddContainer(boxEntity.inventory);
            player.inventory.loot.SendImmediate();
            player.ClientRPC(RpcTarget.Player("RPC_OpenLootPanel", player), "generic");

            RenderPaginationUI(player, 0, 1, _pricingData.DefaultPrice);
        }

        private void CloseSkinBox(BasePlayer player)
        {
            if (player == null) return;

            CuiHelper.DestroyUi(player, CUI_PAGINATION);

            if (_activeSessions.TryGetValue(player.userID, out var session))
            {
                if (session.Container != null)
                {
                    var inputItem = session.Container.GetSlot(0);
                    if (inputItem != null)
                    {
                        inputItem.RemoveFromContainer();
                        player.GiveItem(inputItem, BaseEntity.GiveItemReason.Generic);
                    }

                    session.IsRefreshing = true;
                    for (int i = 1; i < session.Container.capacity; i++)
                    {
                        var item = session.Container.GetSlot(i);
                        if (item != null)
                        {
                            item.RemoveFromContainer();
                            item.Remove();
                        }
                    }
                }

                if (session.BoxEntity != null && !session.BoxEntity.IsDestroyed)
                {
                    session.BoxEntity.Kill();
                }

                _activeSessions.Remove(player.userID);
            }
        }

        private void OnPlayerLootEnd(PlayerLoot inventory)
        {
            var player = inventory?.GetComponent<BasePlayer>();
            if (player != null && _activeSessions.ContainsKey(player.userID))
            {
                CloseSkinBox(player);
            }
        }

        #endregion

        #region Drag & Drop Skin Logic + Gems Check

        private object CanAcceptItem(ItemContainer container, Item item, int targetSlot)
        {
            if (item == null || container == null) return null;

            var session = _activeSessions.Values.FirstOrDefault(s => s.Container == container);
            if (session == null) return null;

            if (targetSlot != 0 && !session.IsRefreshing)
            {
                return ItemContainer.CanAcceptResult.CannotAccept;
            }

            return null;
        }

        private object CanMoveItem(Item item, PlayerInventory playerLoot, ItemContainerId targetContainer, int targetSlot, int amount)
        {
            if (item == null || playerLoot == null) return null;

            var player = playerLoot.GetComponent<BasePlayer>();
            if (player == null || !_activeSessions.TryGetValue(player.userID, out var session)) return null;

            var currentContainer = item.parent;

            if (currentContainer == session.Container && item.position > 0)
            {
                ulong selectedSkin = item.skin;
                NextTick(() =>
                {
                    TryPurchaseAndApplySkin(player, session, selectedSkin);
                });
                return false;
            }

            return null;
        }

        private void OnItemAddedToContainer(ItemContainer container, Item item)
        {
            if (container == null || item == null) return;

            var session = _activeSessions.Values.FirstOrDefault(s => s.Container == container);
            if (session == null || session.IsRefreshing) return;

            if (item.position == 0)
            {
                session.CurrentShortname = item.info.shortname;
                session.CurrentPage = 0;
                NextTick(() => PopulateSkins(session));
            }
        }

        private void OnItemRemovedFromContainer(ItemContainer container, Item item)
        {
            if (container == null || item == null) return;

            var session = _activeSessions.Values.FirstOrDefault(s => s.Container == container);
            if (session == null || session.IsRefreshing) return;

            if (item.position == 0)
            {
                session.CurrentShortname = string.Empty;
                session.CurrentPage = 0;
                NextTick(() => ClearSkinSlots(session));
            }
        }

        private void PopulateSkins(SkinBoxSession session)
        {
            if (session == null || session.Container == null || string.IsNullOrEmpty(session.CurrentShortname)) return;

            session.IsRefreshing = true;
            ClearSkinSlotsInternal(session);

            var availableSkins = new List<ulong>();
            if (_itemSkins.TryGetValue(session.CurrentShortname, out var skinsList))
            {
                availableSkins.AddRange(skinsList);
            }

            if (!availableSkins.Contains(0))
            {
                availableSkins.Insert(0, 0);
            }

            int totalSkins = availableSkins.Count;
            int totalPages = Mathf.Max(1, Mathf.CeilToInt((float)totalSkins / SLOTS_PER_PAGE));
            session.CurrentPage = Mathf.Clamp(session.CurrentPage, 0, totalPages - 1);

            var pageSkins = availableSkins.Skip(session.CurrentPage * SLOTS_PER_PAGE).Take(SLOTS_PER_PAGE).ToList();

            var inputItem = session.Container.GetSlot(0);
            int itemDefId = inputItem != null ? inputItem.info.itemid : ItemManager.FindItemDefinition(session.CurrentShortname).itemid;

            for (int i = 0; i < pageSkins.Count; i++)
            {
                ulong skinId = pageSkins[i];
                var previewItem = ItemManager.CreateByItemID(itemDefId, 1, skinId);
                if (previewItem != null)
                {
                    previewItem.MoveToContainer(session.Container, i + 1, false);
                }
            }

            session.IsRefreshing = false;
            RenderPaginationUI(session.Player, session.CurrentPage, totalPages, _pricingData.DefaultPrice);
        }

        private void ClearSkinSlots(SkinBoxSession session)
        {
            if (session == null || session.Container == null) return;
            session.IsRefreshing = true;
            ClearSkinSlotsInternal(session);
            session.IsRefreshing = false;
            RenderPaginationUI(session.Player, 0, 1, _pricingData.DefaultPrice);
        }

        private void ClearSkinSlotsInternal(SkinBoxSession session)
        {
            for (int i = 1; i < session.Container.capacity; i++)
            {
                var item = session.Container.GetSlot(i);
                if (item != null)
                {
                    item.RemoveFromContainer();
                    item.Remove();
                }
            }
        }

        private void TryPurchaseAndApplySkin(BasePlayer player, SkinBoxSession session, ulong targetSkinId)
        {
            var originalItem = session.Container.GetSlot(0);
            if (originalItem == null) return;

            int price = (int)GetSkinPrice(targetSkinId);
            bool isFreeUser = permission.UserHasPermission(player.UserIDString, PermFree) || player.IsAdmin;

            if (price > 0 && !isFreeUser)
            {
                int currentBalance = GetPlayerGems(player);
                if (currentBalance < price)
                {
                    string failMsg = string.Format(lang.GetMessage("NotEnoughGems", this, player.UserIDString), _pricingData.CurrencyName, price, currentBalance);
                    SendReply(player, failMsg);
                    return;
                }

                if (!DeductPlayerGems(player, price))
                {
                    string failMsg = string.Format(lang.GetMessage("NotEnoughGems", this, player.UserIDString), _pricingData.CurrencyName, price, currentBalance);
                    SendReply(player, failMsg);
                    return;
                }

                string successMsg = string.Format(lang.GetMessage("SkinPurchased", this, player.UserIDString), price, _pricingData.CurrencyName);
                SendReply(player, successMsg);
            }
            else
            {
                SendReply(player, lang.GetMessage("SkinFree", this, player.UserIDString));
            }

            originalItem.skin = targetSkinId;
            originalItem.MarkDirty();

            var heldEntity = originalItem.GetHeldEntity();
            if (heldEntity != null)
            {
                heldEntity.skinID = targetSkinId;
                heldEntity.SendNetworkUpdate();
            }

            Effect.server.Run("assets/prefabs/deployable/repair bench/effects/repairbench_skinchange.prefab", player.transform.position);
        }

        #endregion

        #region Front Layer Pagination CUI

        private void RenderPaginationUI(BasePlayer player, int currentPage, int totalPages, double defaultPrice)
        {
            CuiHelper.DestroyUi(player, CUI_PAGINATION);

            var container = new CuiElementContainer();

            container.Add(new CuiPanel
            {
                Image = { Color = "0.08 0.10 0.13 0.98" },
                RectTransform = { AnchorMin = "0.64 0.73", AnchorMax = "0.98 0.78" }
            }, "Overlay", CUI_PAGINATION);

            if (currentPage > 0)
            {
                container.Add(new CuiButton
                {
                    Button = { Color = "0.18 0.45 0.85 1.00", Command = $"asb.page {currentPage - 1}" },
                    RectTransform = { AnchorMin = "0.02 0.12", AnchorMax = "0.22 0.88" },
                    Text = { Text = "◀ PREV", FontSize = 12, Align = TextAnchor.MiddleCenter, Color = "1 1 1 1" }
                }, CUI_PAGINATION);
            }

            string pageText = string.Format(lang.GetMessage("PageInfo", this, player.UserIDString), currentPage + 1, totalPages, defaultPrice, _pricingData.CurrencyName);
            container.Add(new CuiLabel
            {
                Text = { Text = pageText, FontSize = 12, Align = TextAnchor.MiddleCenter, Color = "0.95 0.85 0.20 1" },
                RectTransform = { AnchorMin = "0.24 0", AnchorMax = "0.76 1" }
            }, CUI_PAGINATION);

            if (currentPage < totalPages - 1)
            {
                container.Add(new CuiButton
                {
                    Button = { Color = "0.18 0.45 0.85 1.00", Command = $"asb.page {currentPage + 1}" },
                    RectTransform = { AnchorMin = "0.78 0.12", AnchorMax = "0.98 0.88" },
                    Text = { Text = "NEXT ▶", FontSize = 12, Align = TextAnchor.MiddleCenter, Color = "1 1 1 1" }
                }, CUI_PAGINATION);
            }

            CuiHelper.AddUi(player, container);
        }

        [ConsoleCommand("asb.page")]
        private void CmdConsolePage(ConsoleSystem.Arg arg)
        {
            var player = arg.Player();
            if (player == null || !_activeSessions.TryGetValue(player.userID, out var session)) return;

            int newPage = arg.GetInt(0, 0);
            session.CurrentPage = newPage;
            PopulateSkins(session);
        }

        #endregion

        #region Chat & Admin Pricing Commands

        [ChatCommand("skinbox")]
        private void CmdChatSkinbox(BasePlayer player, string command, string[] args)
        {
            OpenSkinBox(player);
        }

        [ChatCommand("skins")]
        private void CmdChatSkins(BasePlayer player, string command, string[] args)
        {
            OpenSkinBox(player);
        }

        [ChatCommand("sb")]
        private void CmdChatSb(BasePlayer player, string command, string[] args)
        {
            OpenSkinBox(player);
        }

        [ChatCommand("skinbox.setprice")]
        private void CmdChatSetPrice(BasePlayer player, string command, string[] args)
        {
            if (!player.IsAdmin && !permission.UserHasPermission(player.UserIDString, PermAdmin))
            {
                SendReply(player, lang.GetMessage("NoPermission", this, player.UserIDString));
                return;
            }

            if (args.Length < 2 || !ulong.TryParse(args[0], out ulong skinId) || !double.TryParse(args[1], out double price))
            {
                SendReply(player, "Usage: /skinbox.setprice <skinID> <price>");
                return;
            }

            _pricingData.CustomSkinPrices[skinId] = price;
            SavePricingDatabase();

            string msg = string.Format(lang.GetMessage("PriceSet", this, player.UserIDString), skinId, price, _pricingData.CurrencyName);
            SendReply(player, msg);
        }

        [ChatCommand("skinbox.setdefaultprice")]
        private void CmdChatSetDefaultPrice(BasePlayer player, string command, string[] args)
        {
            if (!player.IsAdmin && !permission.UserHasPermission(player.UserIDString, PermAdmin))
            {
                SendReply(player, lang.GetMessage("NoPermission", this, player.UserIDString));
                return;
            }

            if (args.Length < 1 || !double.TryParse(args[0], out double price))
            {
                SendReply(player, "Usage: /skinbox.setdefaultprice <price>");
                return;
            }

            _pricingData.DefaultPrice = price;
            SavePricingDatabase();
            SendReply(player, $"[AdvancedSkinBox] Default skin price set to {price} {_pricingData.CurrencyName}.");
        }

        #endregion
    }
}