
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using Newtonsoft.Json;
using Oxide.Core;
using Oxide.Core.Libraries;
using Oxide.Core.Plugins;
using Oxide.Game.Rust.Cui;
using UnityEngine;

namespace Oxide.Plugins
{
    [Info("GoatKitsUI", "GOAT5X_Team", "10.8.2")]
    [Description("Atlas-Style 4x2 Kits Grid - True Seamless No-Flicker Architecture")]
    public class GoatKitsUI : RustPlugin
    {
        [PluginReference]
        private Plugin Clans, UniversalClans, RustClans, DiscordCore, DiscordAuth, DiscordBooster, ServerBooster, DiscordRoles;

        private const string PermAdmin   = "goatkitsui.admin";
        private const string PermLinked  = "goatkitsui.linked";
        private const string PermBooster = "goatkitsui.booster";
        private const string PermVip     = "goatkitsui.vip";
        private const string PermMvp     = "goatkitsui.mvp";
        private const string PermGod     = "goatkitsui.god";
        private const string PermBuilder = "goatkitsui.builder";
        private const string PermGuns    = "goatkitsui.guns";

        private const string LayerMain   = "GoatKits_MainLayer";
        private const string LayerContent= "GoatKits_ContentLayer";
        private const string LayerModal  = "GoatKits_ModalLayer";
        private const string LayerNotice = "GoatKits_NoticeLayer";
        private const string LayerTopBar = "GoatKits_TopBar";
        private const string LayerCards  = "GoatKits_Cards";

        // Atlas Glass UI Colors
        private const string ColorBgDimmer   = "0.00 0.00 0.00 0.88";
        private const string ColorBgOverlay  = "0.02 0.03 0.05 0.94";
        private const string ColorSidebar    = "0.04 0.05 0.07 0.96";
        private const string ColorCardBg     = "0.05 0.06 0.08 0.92";
        private const string ColorCardBorder = "0.20 0.23 0.28 0.45";
        private const string ColorSlotBg     = "0.035 0.045 0.06 0.95";
        private const string ColorActiveBlue = "0.00 0.52 1.00 1.00";
        private const string ColorCloseRed   = "0.75 0.18 0.18 1.00";
        private const string ColorNavBtn     = "0.07 0.08 0.11 0.85";
        private const string ColorSuccess    = "0.15 0.72 0.38 1.00";
        private const string ColorActionGreen= "0.15 0.72 0.38 1.00";
        private const string ColorWarning    = "0.95 0.61 0.07 1.00";
        private const string ColorPurple     = "0.65 0.35 0.95 1.00";
        private const string ColorBoosterPurple = "0.65 0.35 0.95 1.00";
        private const string ColorTextMuted  = "0.55 0.60 0.68 1.00";
        private const string ColorTextWhite  = "0.95 0.95 0.95 1.00";
        private const string ColorModalBg    = "0.04 0.05 0.07 0.98";
        private const string ColorInputBg    = "0.08 0.10 0.13 0.95";
        private const string ColorLockedRed  = "0.55 0.15 0.15 1.00";
        private const string ColorCooldownBg = "0.18 0.20 0.24 1.00";
        private const string ColorRowDark    = "0.06 0.07 0.09 0.85";
        private const string ColorRowAlt     = "0.08 0.09 0.12 0.85";

        // Tier Header Colors
        private const string ColorChampion   = "0.98 0.73 0.08 1.00"; // Gold
        private const string ColorVanguard   = "0.92 0.18 0.18 1.00"; // Red
        private const string ColorMythic     = "0.65 0.25 1.00 1.00"; // Purple
        private const string ColorPrime      = "0.18 0.88 0.65 1.00"; // Mint/Teal
        private const string ColorHeaderText = "0.06 0.06 0.07 1.00";
        private const string ColorPriceBar   = "0.09 0.10 0.13 0.96";
        private const string ColorTabActive  = "0.00 0.52 1.00 1.00";
        private const string ColorTabGems    = "0.88 0.65 0.10 1.00";
        private const string ColorTabIdle    = "0.06 0.07 0.10 0.92";
        private const string ColorTabTextDim = "0.50 0.53 0.58 1.00";

        private PluginConfig config;
        private KitsData kitsData;
        private PlayerData playerData;
        private StatsData statsData;
        private ShopData shopData;

        private HashSet<ulong> openUiPlayers = new HashSet<ulong>();
        private Dictionary<ulong, string> activeMenu = new Dictionary<ulong, string>();
        private Dictionary<ulong, string> activePlayerTabs = new Dictionary<ulong, string>();
        private Dictionary<ulong, string> activeStatsTabs = new Dictionary<ulong, string>();
        private Dictionary<ulong, string> activeShopCategory = new Dictionary<ulong, string>();
        private Dictionary<ulong, int> playerPages = new Dictionary<ulong, int>();
        private Dictionary<ulong, DraftKit> playerDrafts = new Dictionary<ulong, DraftKit>();
        private Dictionary<ulong, DraftShopItem> shopDrafts = new Dictionary<ulong, DraftShopItem>();
        private Dictionary<ulong, string> newTabInput = new Dictionary<ulong, string>();
        private Timer hourlyGemsTimer;

        #region Data Models

        public class ItemData
        {
            public string Shortname;
            public string DisplayName;
            public int Amount = 1;
            public ulong SkinId;
            public float Condition;
            public float MaxCondition;
            public string AmmoType;
            public int AmmoAmount;
            public List<string> Attachments = new List<string>();
            public string Container;
            public int Slot = -1;
        }

        public class KitModel
        {
            public string Id;
            public string TabName;
            public string Title;
            public string ColorHex = "0.98 0.73 0.08 1.00";
            public string Currency = "FREE";
            public int Price = 0;
            public string PriceText = "FREE";
            public string Permission = "";
            public string LockType = "NONE";
            public string CustomUrl = "";
            public float CooldownHours;
            public float WipeLockHours;
            public int MaxUsesPerWipe;
            public List<ItemData> Items = new List<ItemData>();
        }

        public class DraftKit
        {
            public string TabName;
            public string KitId;
            public string Title = "NEW KIT";
            public string ColorHex = "0.98 0.73 0.08 1.00";
            public string Currency = "FREE";
            public int Price = 0;
            public string PriceInput = "0";
            public string PriceText = "FREE";
            public string LockType = "NONE";
            public string CustomUrl = "";
            public string CooldownInput = "0";
            public string WipeLockHoursInput = "0";
            public string MaxUsesInput = "0";
            public List<ItemData> Items = new List<ItemData>();
        }

        public class DraftShopItem
        {
            public string Category = "PVP";
            public string Shortname = "rifle.ak";
            public int Amount = 1;
            public ulong SkinId = 0;
            public int Price = 100;
            public string Currency = "RP";
            public string PriceInput = "100";
            public string AmountInput = "1";
        }

        public class KitsData
        {
            public List<string> Tabs = new List<string>();
            public List<KitModel> Kits = new List<KitModel>();
        }

        public class PlayerAccount
        {
            public string Name;
            public int Gems = 0;
            public int RP = 0;
            public bool IsLinked = false;
            public bool IsBooster = false;
            public bool IsVip = false;
            public bool IsMvp = false;
            public bool IsGod = false;
            public bool IsBuilder = false;
            public bool IsGuns = false;
            public long LastGemRewardTimestamp = 0;
        }

        public class PlayerData
        {
            public long LastWipeTimestamp;
            public Dictionary<string, Dictionary<string, long>> Cooldowns = new Dictionary<string, Dictionary<string, long>>();
            public Dictionary<string, Dictionary<string, int>> ClaimCounts = new Dictionary<string, Dictionary<string, int>>();
            public Dictionary<string, PlayerAccount> Accounts = new Dictionary<string, PlayerAccount>();
        }

        public class PlayerStatEntry
        {
            public string Name;
            public int Kills;
            public int Deaths;
            public int Rockets;
            public int C4;
        }

        public class StatsData
        {
            public Dictionary<string, PlayerStatEntry> Players = new Dictionary<string, PlayerStatEntry>();
        }

        public class ClanStatSummary
        {
            public string Tag;
            public int Kills;
            public int Deaths;
            public float KD => Deaths == 0 ? Kills : (float)Math.Round((double)Kills / Deaths, 2);
            public int Rockets;
            public int C4;
        }

        public class ShopItemModel
        {
            public string Shortname;
            public int Amount = 1;
            public ulong SkinId;
            public int Price;
            public string Currency = "RP";
        }

        public class ShopData
        {
            public Dictionary<string, List<ShopItemModel>> Categories = new Dictionary<string, List<ShopItemModel>>();
        }

        public class PluginConfig
        {
            public string ServerName = "GOAT 5X";
            public int GemsPerHour = 5;
            public int RpPerKill = 6;
            public int RpPerBarrel = 1;
            public int RpPerNode = 3;
            public string WebsiteLinkUrl = "https://yourwebsite.com/link";
            public string DiscordInviteUrl = "https://discord.gg/7uRsxfknSG";
            public string ApiEndpoint = "https://rustgoat.com/api/sync-kits";
            public string ApiSecret = "goat-stats-sync-secret";
            public string LinkedPermission = "discordauth.linked";
            public string BoosterPermission = "discordbooster.boosted";
        }

        protected override void LoadDefaultConfig()
        {
            config = new PluginConfig
            {
                ServerName = "GOAT 5X",
                GemsPerHour = 5,
                RpPerKill = 6,
                RpPerBarrel = 1,
                RpPerNode = 3,
                WebsiteLinkUrl = "https://yourwebsite.com/link",
                DiscordInviteUrl = "https://discord.gg/7uRsxfknSG",
                ApiEndpoint = "https://rustgoat.com/api/sync-kits",
                ApiSecret = "goat-stats-sync-secret",
                LinkedPermission = "discordauth.linked",
                BoosterPermission = "discordbooster.boosted"
            };
            SaveConfig();
        }

        protected override void LoadConfig()
        {
            base.LoadConfig();
            try { config = Config.ReadObject<PluginConfig>(); if (config == null) LoadDefaultConfig(); }
            catch { LoadDefaultConfig(); }
        }

        protected override void SaveConfig() => Config.WriteObject(config, true);

        private void LoadPermanentKitsData()
        {
            bool exists = Interface.Oxide.DataFileSystem.ExistsDatafile("GoatKits_Kits");

            if (!exists)
            {
                kitsData = new KitsData
                {
                    Tabs = new List<string> { "ALL KITS", "VIP", "WEAPONS", "RESOURCES", "GEMS", "OWNED" },
                    Kits = BuildAtlasReferenceKits()
                };
                SaveKitsData();
                return;
            }

            try
            {
                kitsData = Interface.Oxide.DataFileSystem.ReadObject<KitsData>("GoatKits_Kits");
            }
            catch (Exception ex)
            {
                PrintError($"[GoatKitsUI] Failed to load data file GoatKits_Kits: {ex.Message}");
                kitsData = new KitsData();
            }

            if (kitsData == null) kitsData = new KitsData();
            if (kitsData.Tabs == null) kitsData.Tabs = new List<string>();
            if (kitsData.Kits == null) kitsData.Kits = new List<KitModel>();

            if (!kitsData.Tabs.Any(t => t.Equals("ALL KITS", StringComparison.OrdinalIgnoreCase)))
                kitsData.Tabs.Insert(0, "ALL KITS");
        }

        private static ItemData MakeSampleItem(string shortname, string display, int amount)
        {
            return new ItemData { Shortname = shortname, DisplayName = display, Amount = amount, Container = "main" };
        }

        private List<KitModel> BuildAtlasReferenceKits()
        {
            Func<string, string, int, ItemData> I = MakeSampleItem;
            var kits = new List<KitModel>();

            // Row 1 (Top 4 Tall Cards)
            kits.Add(new KitModel
            {
                Id = "booster", TabName = "ALL KITS", Title = "BOOSTER", ColorHex = ColorChampion,
                Currency = "FREE", Price = 0, PriceText = "BOOST DISCORD", LockType = "BOOSTER",
                Items = new List<ItemData> {
                    I("hazmatsuit","HAZMAT SUIT",1), I("syringe.medical","MEDICAL SYRINGE",2),
                    I("bandage","BANDAGE",3), I("largemedkit","LARGE MEDKIT",1),
                    I("rifle.ak","ASSAULT RIFLE",1), I("barricade.wood","WOODEN BARRICADE",4),
                    I("syringe.medical","MEDICAL SYRINGE",2), I("bandage","BANDAGE",3),
                    I("ammo.rifle","5.56 RIFLE AMMO",120), I("supply.signal","SUPPLY SIGNAL",1),
                    I("keycard_green","GREEN KEYCARD",1), I("keycard_red","RED KEYCARD",1),
                    I("workbench2","WORKBENCH LEVEL 2",1), I("pookiebears","POOKIE BEAR",1),
                    I("keycard_blue","BLUE KEYCARD",1)
                }
            });

            kits.Add(new KitModel
            {
                Id = "discord_verified", TabName = "ALL KITS", Title = "DISCORD VERIFIED", ColorHex = ColorChampion,
                Currency = "FREE", Price = 0, PriceText = "LINK ACCOUNT", LockType = "LINKED",
                Items = new List<ItemData> {
                    I("spring","METAL SPRING",5), I("rifle.body","RIFLE BODY",2),
                    I("rope","ROPE",10), I("smg.body","SMG BODY",3),
                    I("semi.body","SEMI AUTOMATIC BODY",3), I("techparts","TECH TRASH",5),
                    I("metalpipe","METAL PIPE",10), I("gears","GEARS",5),
                    I("roadsign.jacket","ROAD SIGNS",5), I("sewingkit","SEWING KIT",10)
                }
            });

            kits.Add(new KitModel
            {
                Id = "starter", TabName = "ALL KITS", Title = "STARTER", ColorHex = ColorChampion,
                Currency = "FREE", Price = 0, PriceText = "FREE", LockType = "NONE",
                Items = new List<ItemData> {
                    I("bone.armor","BONE ARMOR",1), I("bone.helmet","BONE HELMET",1),
                    I("pumpkin","PUMPKIN",5), I("bow.hunting","HUNTING BOW",1),
                    I("bandage","BANDAGE",3), I("knife.bone","BONE KNIFE",1),
                    I("arrow.wooden","WOODEN ARROW",60), I("bandage","BANDAGE",3),
                    I("stones","STONES",5000), I("wood","WOOD",5000),
                    I("sulfur.ore","SULFUR ORE",1000), I("metal.fragments","METAL FRAGMENTS",1000),
                    I("cloth","CLOTH",200), I("lowgradefuel","LOW GRADE FUEL",100)
                }
            });

            kits.Add(new KitModel
            {
                Id = "medic", TabName = "ALL KITS", Title = "MEDIC", ColorHex = ColorChampion,
                Currency = "FREE", Price = 0, PriceText = "FREE", LockType = "NONE",
                Items = new List<ItemData> {
                    I("largemedkit","LARGE MEDKIT",2), I("syringe.medical","MEDICAL SYRINGE",4),
                    I("syringe.medical","MEDICAL SYRINGE",4), I("bandage","BANDAGE",5),
                    I("blueberries","BLUEBERRIES",10)
                }
            });

            // Row 2 (Bottom 4 Short Cards)
            kits.Add(new KitModel
            {
                Id = "rebuild", TabName = "ALL KITS", Title = "REBUILD", ColorHex = ColorChampion,
                Currency = "FREE", Price = 0, PriceText = "LOCK 18h 41m", LockType = "NONE", WipeLockHours = 18.68f,
                Items = new List<ItemData> {
                    I("generator.wind","WIND TURBINE",1), I("wall.frame.garagedoor","GARAGE DOOR",4),
                    I("lock.code","CODE LOCK",5), I("autoturret","AUTO TURRET",1),
                    I("sulfur.ore","SULFUR ORE",5000), I("wood","WOOD",50000),
                    I("metal.ore","METAL ORE",15000), I("metal.ore","METAL ORE",15000),
                    I("cloth","CLOTH",2000), I("leather","LEATHER",1000),
                    I("rifle.body","RIFLE BODY",2), I("spring","METAL SPRING",4),
                    I("techparts","TECH TRASH",5), I("sewingkit","SEWING KIT",10),
                    I("rope","ROPE",15), I("scrap","SCRAP",2500),
                    I("metal.fragments","METAL FRAGMENTS",15000), I("sulfur","SULFUR",5000)
                }
            });

            kits.Add(new KitModel
            {
                Id = "bag", TabName = "ALL KITS", Title = "BAG", ColorHex = ColorChampion,
                Currency = "FREE", Price = 0, PriceText = "FREE", LockType = "NONE",
                Items = new List<ItemData> {
                    I("sleepingbag","SLEEPING BAG",1), I("sleepingbag","SLEEPING BAG",1),
                    I("bed","BED",1)
                }
            });

            kits.Add(new KitModel
            {
                Id = "roamer_t2", TabName = "ALL KITS", Title = "ROAMER T2", ColorHex = ColorChampion,
                Currency = "GEMS", Price = 25, PriceText = "25 GEMS", LockType = "NONE",
                Items = new List<ItemData> {
                    I("coffeecan.helmet","COFFEE CAN HELMET",1), I("pants","PANTS",1),
                    I("hoodie","HOODIE",1), I("tactical.gloves","ROAD SIGN GLOVES",1),
                    I("roadsign.kilt","ROAD SIGN KILT",1), I("roadsign.jacket","ROAD SIGN JACKET",1),
                    I("smg.thompson","THOMPSON",1), I("sleepingbag","SLEEPING BAG",1),
                    I("barricade.wood","WOODEN BARRICADE",2), I("syringe.medical","MEDICAL SYRINGE",4),
                    I("largemedkit","LARGE MEDKIT",1), I("largemedkit","LARGE MEDKIT",1),
                    I("ammo.pistol","PISTOL BULLET",120)
                }
            });

            kits.Add(new KitModel
            {
                Id = "roamer_t3", TabName = "ALL KITS", Title = "ROAMER T3", ColorHex = ColorChampion,
                Currency = "GEMS", Price = 50, PriceText = "50 GEMS", LockType = "NONE",
                Items = new List<ItemData> {
                    I("pants","PANTS",1), I("hoodie","HOODIE",1),
                    I("tactical.gloves","ROAD SIGN GLOVES",1), I("roadsign.kilt","ROAD SIGN KILT",1),
                    I("metal.plate.torso","METAL CHEST PLATE",1), I("metal.facemask","METAL FACEMASK",1),
                    I("sleepingbag","SLEEPING BAG",1), I("barricade.wood","WOODEN BARRICADE",2),
                    I("syringe.medical","MEDICAL SYRINGE",6), I("largemedkit","LARGE MEDKIT",1),
                    I("largemedkit","LARGE MEDKIT",1), I("rifle.ak","ASSAULT RIFLE",1),
                    I("ammo.rifle","5.56 RIFLE AMMO",150)
                }
            });

            // VIP Tiers & Discord Community Kits
            kits.Add(new KitModel
            {
                Id = "vip_kit", TabName = "VIP", Title = "VIP KIT", ColorHex = ColorChampion,
                Currency = "USD", Price = 500, PriceText = "5.00$", LockType = "VIP",
                CustomUrl = "https://discord.gg/7uRsxfknSG", CooldownHours = 2f,
                Items = new List<ItemData> {
                    I("rifle.semiauto","SAR",1), I("ammo.rifle","5.56 AMMO",120),
                    I("roadsign.jacket","ROADSIGN JACKET",1), I("roadsign.kilt","ROADSIGN KILT",1),
                    I("coffeecan.helmet","COFFEE HELMET",1), I("shoes.boots","BOOTS",1),
                    I("hoodie","HOODIE",1), I("pants","PANTS",1),
                    I("syringe.medical","SYRINGE",4), I("largemedkit","MEDKIT",1),
                    I("wood","WOOD",25000), I("stones","STONE",25000),
                    I("metal.fragments","METAL FRAG",10000), I("sulfur","SULFUR",2500)
                }
            });

            kits.Add(new KitModel
            {
                Id = "mvp_kit", TabName = "VIP", Title = "MVP KIT", ColorHex = ColorPrime,
                Currency = "USD", Price = 1000, PriceText = "10.00$", LockType = "MVP",
                CustomUrl = "https://discord.gg/7uRsxfknSG", CooldownHours = 2f,
                Items = new List<ItemData> {
                    I("rifle.ak","ASSAULT RIFLE",1), I("smg.thompson","THOMPSON",1),
                    I("ammo.rifle","5.56 AMMO",250), I("ammo.pistol","PISTOL AMMO",200),
                    I("metal.facemask","METAL MASK",1), I("metal.plate.torso","METAL CHEST",1),
                    I("roadsign.kilt","ROADSIGN KILT",1), I("tactical.gloves","TACTICAL GLOVES",1),
                    I("syringe.medical","SYRINGE",6), I("largemedkit","MEDKIT",2),
                    I("wood","WOOD",50000), I("stones","STONE",50000),
                    I("metal.fragments","METAL FRAG",20000), I("sulfur","SULFUR",5000),
                    I("metal.refined","HQM",1000)
                }
            });

            kits.Add(new KitModel
            {
                Id = "god_kit", TabName = "VIP", Title = "GOD KIT", ColorHex = ColorMythic,
                Currency = "USD", Price = 2000, PriceText = "20.00$", LockType = "GOD",
                CustomUrl = "https://discord.gg/7uRsxfknSG", CooldownHours = 1f,
                Items = new List<ItemData> {
                    I("lmg.m249","M249 LMG",1), I("rifle.l96","L96 SNIPER",1), I("rifle.ak","AK-47",1),
                    I("ammo.rifle.hv","5.56 HV AMMO",500), I("rocket.launcher","ROCKET LAUNCHER",1),
                    I("ammo.rocket.basic","ROCKETS",6), I("explosive.timed","C4 CHARGES",4),
                    I("metal.facemask","METAL MASK",2), I("metal.plate.torso","METAL CHEST",2),
                    I("syringe.medical","SYRINGE",12), I("largemedkit","MEDKIT",4),
                    I("wood","WOOD",100000), I("stones","STONE",100000),
                    I("metal.fragments","METAL FRAG",50000), I("sulfur","SULFUR",15000),
                    I("metal.refined","HQM",5000), I("supply.signal","AIRDROP FLARE",2)
                }
            });

            kits.Add(new KitModel
            {
                Id = "builder_kit", TabName = "VIP", Title = "BUILDER KIT", ColorHex = ColorSuccess,
                Currency = "USD", Price = 750, PriceText = "7.50$", LockType = "BUILDER",
                CustomUrl = "https://discord.gg/7uRsxfknSG", CooldownHours = 2f,
                Items = new List<ItemData> {
                    I("building.planner","BUILDING PLAN",1), I("hammer","HAMMER",1),
                    I("wood","WOOD",100000), I("stones","STONE",100000),
                    I("metal.fragments","METAL FRAG",50000), I("metal.refined","HQM",5000),
                    I("door.hinged.metal","SHEET DOOR",4), I("door.hinged.armored","ARMORED DOOR",4),
                    I("wall.frame.garagedoor","GARAGE DOOR",6), I("cupboard.tool","TOOL CUPBOARD",2),
                    I("box.wooden.large","LARGE BOX",10), I("autoturret","AUTO TURRET",1)
                }
            });

            kits.Add(new KitModel
            {
                Id = "guns_kit", TabName = "WEAPONS", Title = "GUNS KIT", ColorHex = ColorVanguard,
                Currency = "USD", Price = 1200, PriceText = "12.00$", LockType = "GUNS",
                CustomUrl = "https://discord.gg/7uRsxfknSG", CooldownHours = 2f,
                Items = new List<ItemData> {
                    I("rifle.ak","AK-47",2), I("smg.mp5","MP5A4",2),
                    I("rifle.bolt","BOLT ACTION",1), I("rifle.l96","L96 SNIPER",1),
                    I("weapon.mod.8x.scope","8X SCOPE",2), I("weapon.mod.silencer","SILENCER",4),
                    I("weapon.mod.holosight","HOLO SIGHT",4), I("weapon.mod.flashlight","FLASHLIGHT",4),
                    I("ammo.rifle","5.56 AMMO",600), I("ammo.pistol","PISTOL AMMO",400),
                    I("syringe.medical","SYRINGE",10)
                }
            });

            kits.Add(new KitModel
            {
                Id = "discord_linked_kit", TabName = "VIP", Title = "DISCORD VERIFIED", ColorHex = ColorActiveBlue,
                Currency = "FREE", Price = 0, PriceText = "FREE", LockType = "LINKED",
                CustomUrl = "https://discord.gg/7uRsxfknSG", CooldownHours = 2f,
                Items = new List<ItemData> {
                    I("rifle.semiauto","SAR",1), I("ammo.rifle","5.56 AMMO",60),
                    I("roadsign.jacket","ROADSIGN JACKET",1), I("roadsign.kilt","ROADSIGN KILT",1),
                    I("coffeecan.helmet","COFFEE HELMET",1), I("syringe.medical","SYRINGE",2),
                    I("wood","WOOD",10000), I("stones","STONE",10000),
                    I("metal.fragments","METAL FRAG",2500)
                }
            });

            kits.Add(new KitModel
            {
                Id = "discord_booster_kit", TabName = "VIP", Title = "DISCORD BOOSTER", ColorHex = ColorPurple,
                Currency = "FREE", Price = 0, PriceText = "FREE", LockType = "BOOSTER",
                CustomUrl = "https://discord.gg/7uRsxfknSG", CooldownHours = 3f,
                Items = new List<ItemData> {
                    I("rifle.ak","AK-47",1), I("ammo.rifle","5.56 AMMO",120),
                    I("metal.facemask","METAL MASK",1), I("metal.plate.torso","METAL CHEST",1),
                    I("syringe.medical","SYRINGE",4), I("supply.signal","AIRDROP FLARE",1),
                    I("wood","WOOD",25000), I("stones","STONE",25000),
                    I("metal.fragments","METAL FRAG",5000)
                }
            });

            return kits;
        }

        private void SaveKitsData()
        {
            if (kitsData != null)
            {
                Interface.Oxide.DataFileSystem.WriteObject("GoatKits_Kits", kitsData);
                SyncKitsToWeb();
            }
        }

        private void LoadPlayerData()
        {
            try { playerData = Interface.Oxide.DataFileSystem.ReadObject<PlayerData>("GoatKits_Players"); }
            catch { playerData = new PlayerData(); }

            if (playerData == null) playerData = new PlayerData();
            if (playerData.Cooldowns == null) playerData.Cooldowns = new Dictionary<string, Dictionary<string, long>>();
            if (playerData.ClaimCounts == null) playerData.ClaimCounts = new Dictionary<string, Dictionary<string, int>>();
            if (playerData.Accounts == null) playerData.Accounts = new Dictionary<string, PlayerAccount>();

            long realWipe = GetRealWipeTimestamp();
            if (playerData.LastWipeTimestamp == 0 || Math.Abs(playerData.LastWipeTimestamp - realWipe) > 86400 * 30)
                playerData.LastWipeTimestamp = realWipe;
        }

        private void SavePlayerData()
        {
            if (playerData != null)
                Interface.Oxide.DataFileSystem.WriteObject("GoatKits_Players", playerData);
        }

        private void LoadStatsData()
        {
            try { statsData = Interface.Oxide.DataFileSystem.ReadObject<StatsData>("GoatKits_Stats"); }
            catch { statsData = new StatsData(); }

            if (statsData == null) statsData = new StatsData();
            if (statsData.Players == null) statsData.Players = new Dictionary<string, PlayerStatEntry>();
        }

        private void SaveStatsData()
        {
            if (statsData != null)
                Interface.Oxide.DataFileSystem.WriteObject("GoatKits_Stats", statsData);
        }

        private void LoadShopData()
        {
            try { shopData = Interface.Oxide.DataFileSystem.ReadObject<ShopData>("GoatKits_Shop"); }
            catch { shopData = new ShopData(); }

            if (shopData == null) shopData = new ShopData();
            if (shopData.Categories == null) shopData.Categories = new Dictionary<string, List<ShopItemModel>>();

            string[] defaultCats = { "GEMS", "PVP", "Weapons", "Ammunition", "Component", "Construction", "Items", "Attire", "Tools", "Medical", "Food" };
            foreach (var cat in defaultCats)
            {
                if (!shopData.Categories.ContainsKey(cat))
                    shopData.Categories[cat] = new List<ShopItemModel>();
            }

            SaveShopData();
        }

        private void SaveShopData()
        {
            if (shopData != null)
                Interface.Oxide.DataFileSystem.WriteObject("GoatKits_Shop", shopData);
        }

        #endregion

        #region Helpers & Verification

        private void CloseAllGoatUI(BasePlayer player)
        {
            if (player == null) return;
            openUiPlayers.Remove(player.userID);
            CuiHelper.DestroyUi(player, LayerMain);
            CuiHelper.DestroyUi(player, LayerContent);
            CuiHelper.DestroyUi(player, LayerTopBar);
            CuiHelper.DestroyUi(player, LayerCards);
            CuiHelper.DestroyUi(player, LayerModal);
            CuiHelper.DestroyUi(player, LayerNotice);
        }

        private void ClearContentOnly(BasePlayer player)
        {
            if (player == null) return;
            CuiHelper.DestroyUi(player, LayerContent);
            CuiHelper.DestroyUi(player, LayerTopBar);
            CuiHelper.DestroyUi(player, LayerCards);
            CuiHelper.DestroyUi(player, LayerModal);
            CuiHelper.DestroyUi(player, LayerNotice);
        }

        private bool HasRank(BasePlayer player)
        {
            if (player == null || !player.IsConnected) return false;
            if (player.IsAdmin) return true;
            if (player.Connection != null && player.Connection.authLevel >= 1) return true;
            if (permission.UserHasPermission(player.UserIDString, PermAdmin)) return true;

            var userEntry = ServerUsers.Get(player.userID);
            if (userEntry != null && (userEntry.group == ServerUsers.UserGroup.Owner || userEntry.group == ServerUsers.UserGroup.Moderator))
                return true;

            return false;
        }

        private bool IsPlayerLinked(BasePlayer player)
        {
            if (player == null) return false;
            var acc = GetOrCreateAccount(player.UserIDString, player.displayName);
            if (acc.IsLinked) return true;

            if (permission.UserHasPermission(player.UserIDString, PermLinked)) return true;
            if (permission.UserHasGroup(player.UserIDString, "linked")) return true;

            if (!string.IsNullOrEmpty(config.LinkedPermission) && permission.UserHasPermission(player.UserIDString, config.LinkedPermission))
                return true;

            if (permission.UserHasPermission(player.UserIDString, "discordauth.linked") || permission.UserHasPermission(player.UserIDString, "discordcore.linked"))
                return true;

            if (DiscordAuth != null && DiscordAuth.IsLoaded)
            {
                try { var res = DiscordAuth.Call("IsLinked", player.userID); if (res is bool && (bool)res) return true; } catch { }
            }

            if (DiscordCore != null && DiscordCore.IsLoaded)
            {
                try { var res = DiscordCore.Call("IsLinked", player.userID); if (res is bool && (bool)res) return true; } catch { }
            }

            return false;
        }

        private bool IsPlayerBooster(BasePlayer player)
        {
            if (player == null) return false;
            var acc = GetOrCreateAccount(player.UserIDString, player.displayName);
            if (acc.IsBooster) return true;

            if (permission.UserHasPermission(player.UserIDString, PermBooster)) return true;
            if (permission.UserHasGroup(player.UserIDString, "booster") || permission.UserHasGroup(player.UserIDString, "boosters")) return true;

            if (!string.IsNullOrEmpty(config.BoosterPermission) && permission.UserHasPermission(player.UserIDString, config.BoosterPermission))
                return true;

            if (permission.UserHasPermission(player.UserIDString, "discordbooster.boosted") || permission.UserHasPermission(player.UserIDString, "serverbooster.boosted"))
                return true;

            if (DiscordBooster != null && DiscordBooster.IsLoaded)
            {
                try { var res = DiscordBooster.Call("IsBooster", player.userID); if (res is bool && (bool)res) return true; } catch { }
            }

            if (ServerBooster != null && ServerBooster.IsLoaded)
            {
                try { var res = ServerBooster.Call("IsBooster", player.userID); if (res is bool && (bool)res) return true; } catch { }
            }

            if (DiscordRoles != null && DiscordRoles.IsLoaded)
            {
                try { var res = DiscordRoles.Call("HasRole", player.userID, "Booster"); if (res is bool && (bool)res) return true; } catch { }
            }

            return false;
        }

        private bool IsPlayerTier(BasePlayer player, string tier)
        {
            if (player == null) return false;
            string cleanTier = tier.ToLowerInvariant().Trim();
            var acc = GetOrCreateAccount(player.UserIDString, player.displayName);

            if (cleanTier == "vip" && acc.IsVip) return true;
            if (cleanTier == "mvp" && acc.IsMvp) return true;
            if (cleanTier == "god" && acc.IsGod) return true;
            if (cleanTier == "builder" && acc.IsBuilder) return true;
            if (cleanTier == "guns" && acc.IsGuns) return true;

            string perm = $"goatkitsui.{cleanTier}";
            if (permission.UserHasPermission(player.UserIDString, perm)) return true;
            if (permission.UserHasGroup(player.UserIDString, cleanTier)) return true;
            if (permission.UserHasGroup(player.UserIDString, $"{cleanTier}s")) return true;

            if (DiscordRoles != null && DiscordRoles.IsLoaded)
            {
                try
                {
                    var res = DiscordRoles.Call("HasRole", player.userID, tier.ToUpperInvariant());
                    if (res is bool && (bool)res) return true;
                }
                catch { }
            }

            return false;
        }

        private void SyncKitsToWeb()
        {
            if (kitsData == null || kitsData.Kits == null) return;
            try
            {
                var payload = new Dictionary<string, object>
                {
                    { "secret", !string.IsNullOrEmpty(config.ApiSecret) ? config.ApiSecret : "goat-stats-sync-secret" },
                    { "tabs", kitsData.Tabs ?? new List<string>() },
                    { "kits", kitsData.Kits }
                };

                string json = JsonConvert.SerializeObject(payload);
                string endpoint = !string.IsNullOrEmpty(config.ApiEndpoint) 
                    ? config.ApiEndpoint 
                    : "https://rustgoat.com/api/sync-kits";

                webrequest.Enqueue(
                    endpoint,
                    json,
                    (code, response) =>
                    {
                        if (code == 200)
                        {
                            Puts($"[GoatKitsUI] 🚀 Successfully synced {kitsData.Kits.Count} kits & {(kitsData.Tabs?.Count ?? 0)} categories to website store!");
                        }
                        else
                        {
                            Puts($"[GoatKitsUI] Web sync warning: HTTP {code} from {endpoint}");
                        }
                    },
                    this,
                    RequestMethod.POST,
                    new Dictionary<string, string> { { "Content-Type", "application/json" } },
                    8f
                );
            }
            catch (Exception ex)
            {
                Puts($"[GoatKitsUI] Web sync exception: {ex.Message}");
            }
        }

        private void ShowNoticePopup(BasePlayer player, string title, string urlText, string subtitle, string colorHex)
        {
            if (player == null || !player.IsConnected) return;

            CuiHelper.DestroyUi(player, LayerNotice);
            Effect.server.Run("assets/prefabs/locks/keypad/effects/lock.code.denied.prefab", player.transform.position);

            var elements = new CuiElementContainer();

            elements.Add(new CuiPanel
            {
                Image = { Color = "0.06 0.08 0.11 0.98" },
                RectTransform = { AnchorMin = "0.68 0.85", AnchorMax = "0.98 0.98" }
            }, LayerMain, LayerNotice);

            elements.Add(new CuiPanel
            {
                Image = { Color = colorHex },
                RectTransform = { AnchorMin = "0 0", AnchorMax = "0.02 1" }
            }, LayerNotice);

            elements.Add(new CuiLabel
            {
                Text = { Text = title, FontSize = 11, Align = TextAnchor.MiddleLeft, Color = colorHex, Font = "robotocondensed-bold.ttf" },
                RectTransform = { AnchorMin = "0.06 0.65", AnchorMax = "0.95 0.95" }
            }, LayerNotice);

            elements.Add(new CuiLabel
            {
                Text = { Text = $"<color=#FFFFFF>{subtitle}</color>\n<color=#00A8FF><b>{urlText}</b></color>", FontSize = 9, Align = TextAnchor.MiddleLeft, Font = "robotocondensed-bold.ttf" },
                RectTransform = { AnchorMin = "0.06 0.08", AnchorMax = "0.95 0.65" }
            }, LayerNotice);

            CuiHelper.AddUi(player, elements);

            timer.Once(6f, () =>
            {
                if (player != null && player.IsConnected)
                    CuiHelper.DestroyUi(player, LayerNotice);
            });
        }

        private long GetCurrentUnix() => DateTimeOffset.UtcNow.ToUnixTimeSeconds();

        private long GetRealWipeTimestamp()
        {
            try
            {
                if (SaveRestore.SaveCreatedTime != default(DateTime))
                    return ((DateTimeOffset)SaveRestore.SaveCreatedTime.ToUniversalTime()).ToUnixTimeSeconds();
            }
            catch { }
            return playerData?.LastWipeTimestamp > 0 ? playerData.LastWipeTimestamp : DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        }

        private float ParseFloatSafe(string input, float defaultVal = 0f)
        {
            if (string.IsNullOrEmpty(input)) return defaultVal;
            input = input.Trim().Replace(',', '.');
            if (float.TryParse(input, NumberStyles.Any, CultureInfo.InvariantCulture, out float res))
                return Math.Max(0f, res);
            return defaultVal;
        }

        private int ParseIntSafe(string input, int defaultVal = 0)
        {
            if (string.IsNullOrEmpty(input)) return defaultVal;
            if (int.TryParse(input.Trim(), out int res))
                return Math.Max(0, res);
            return defaultVal;
        }

        private string FormatSeconds(long seconds)
        {
            if (seconds <= 0) return "0s";
            TimeSpan t = TimeSpan.FromSeconds(seconds);
            if (t.TotalDays >= 1) return string.Format("{0}d {1:D2}h", (int)t.TotalDays, t.Hours);
            if (t.TotalHours >= 1) return string.Format("{0:D2}h {1:D2}m", (int)t.TotalHours, t.Minutes);
            return string.Format("{0:D2}m {1:D2}s", t.Minutes, t.Seconds);
        }

        private PlayerAccount GetOrCreateAccount(string userId, string name)
        {
            if (!playerData.Accounts.ContainsKey(userId))
            {
                playerData.Accounts[userId] = new PlayerAccount
                {
                    Name = name ?? "Player",
                    Gems = 0,
                    RP = 0,
                    IsLinked = false,
                    IsBooster = false,
                    LastGemRewardTimestamp = GetCurrentUnix()
                };
            }
            if (!string.IsNullOrEmpty(name))
                playerData.Accounts[userId].Name = name;
            return playerData.Accounts[userId];
        }

        private void AddRP(string userId, int amount, BasePlayer player = null)
        {
            if (amount <= 0) return;
            var acc = GetOrCreateAccount(userId, player?.displayName);
            acc.RP += amount;
            SavePlayerData();
        }

        private void ProcessHourlyGems()
        {
            long now = GetCurrentUnix();
            foreach (var p in BasePlayer.activePlayerList)
            {
                if (p == null || !p.IsConnected) continue;

                var acc = GetOrCreateAccount(p.UserIDString, p.displayName);
                if (acc.LastGemRewardTimestamp == 0)
                    acc.LastGemRewardTimestamp = now;

                if (now - acc.LastGemRewardTimestamp >= 3600)
                {
                    acc.Gems += config.GemsPerHour;
                    acc.LastGemRewardTimestamp = now;
                    SendReply(p, $"<color=#F5A623>💎 [HOURLY REWARD]</color> You received <color=#2ECC71>+{config.GemsPerHour} GEMS</color>! Balance: <color=#0084FF>{acc.Gems}</color>");
                }
            }
            SavePlayerData();
        }

        private PlayerStatEntry GetOrCreateStat(string userId, string name)
        {
            if (!statsData.Players.ContainsKey(userId))
            {
                statsData.Players[userId] = new PlayerStatEntry
                {
                    Name = name ?? "Player",
                    Kills = 0,
                    Deaths = 0,
                    Rockets = 0,
                    C4 = 0
                };
            }
            if (!string.IsNullOrEmpty(name))
                statsData.Players[userId].Name = name;
            return statsData.Players[userId];
        }

        private string GetPlayerClanTag(string userIdString, string playerName)
        {
            ulong userId = 0;
            ulong.TryParse(userIdString, out userId);

            if (Clans != null && Clans.IsLoaded)
            {
                try
                {
                    var res = Clans.Call("GetClanOf", userId) ?? Clans.Call("GetClanOf", userIdString) ?? Clans.Call("GetClanTag", userId);
                    if (res != null && !string.IsNullOrEmpty(res.ToString())) return res.ToString().Trim().ToUpper();
                }
                catch { }
            }

            if (UniversalClans != null && UniversalClans.IsLoaded)
            {
                try
                {
                    var res = UniversalClans.Call("GetClanOf", userId);
                    if (res != null && !string.IsNullOrEmpty(res.ToString())) return res.ToString().Trim().ToUpper();
                }
                catch { }
            }

            if (RustClans != null && RustClans.IsLoaded)
            {
                try
                {
                    var res = RustClans.Call("GetClanOf", userId);
                    if (res != null && !string.IsNullOrEmpty(res.ToString())) return res.ToString().Trim().ToUpper();
                }
                catch { }
            }

            if (!string.IsNullOrEmpty(playerName))
            {
                int start = playerName.IndexOf('[');
                int end = playerName.IndexOf(']');
                if (start >= 0 && end > start + 1)
                {
                    string extracted = playerName.Substring(start + 1, end - start - 1).Trim().ToUpper();
                    if (!string.IsNullOrEmpty(extracted) && extracted.Length <= 10)
                        return extracted;
                }
            }

            if (userId > 0)
            {
                var p = BasePlayer.FindAwakeOrSleeping(userIdString);
                if (p != null && p.currentTeam != 0)
                {
                    var team = RelationshipManager.ServerInstance.FindTeam(p.currentTeam);
                    if (team != null && team.members != null && team.members.Count > 0)
                    {
                        var leader = BasePlayer.FindAwakeOrSleeping(team.teamLeader.ToString());
                        string leaderName = (leader != null) ? leader.displayName : $"TEAM_{team.teamID}";
                        int start = leaderName.IndexOf('[');
                        int end = leaderName.IndexOf(']');
                        if (start >= 0 && end > start + 1)
                            return leaderName.Substring(start + 1, end - start - 1).Trim().ToUpper();

                        return leaderName.ToUpper();
                    }
                }
            }

            return "";
        }

        private List<ItemData> CaptureFullPlayerInventory(BasePlayer player)
        {
            var captured = new List<ItemData>();
            if (player == null || player.inventory == null) return captured;

            if (player.inventory.containerWear?.itemList != null)
            {
                foreach (var item in player.inventory.containerWear.itemList)
                    if (item != null && item.info != null) captured.Add(SerializeItem(item, "wear", item.position));
            }

            if (player.inventory.containerBelt?.itemList != null)
            {
                foreach (var item in player.inventory.containerBelt.itemList)
                    if (item != null && item.info != null) captured.Add(SerializeItem(item, "belt", item.position));
            }

            if (player.inventory.containerMain?.itemList != null)
            {
                foreach (var item in player.inventory.containerMain.itemList)
                    if (item != null && item.info != null) captured.Add(SerializeItem(item, "main", item.position));
            }

            return captured;
        }

        private ItemData SerializeItem(Item item, string containerName, int slot)
        {
            var d = new ItemData
            {
                Shortname = item.info.shortname,
                DisplayName = item.info.displayName?.english?.ToUpper() ?? item.info.shortname.ToUpper(),
                Amount = item.amount,
                SkinId = item.skin,
                Condition = item.condition,
                MaxCondition = item.maxCondition,
                Container = containerName,
                Slot = slot
            };

            if (item.contents?.itemList != null)
            {
                foreach (var mod in item.contents.itemList)
                    if (mod?.info != null) d.Attachments.Add(mod.info.shortname);
            }

            var weapon = item.GetHeldEntity() as BaseProjectile;
            if (weapon != null && weapon.primaryMagazine != null)
            {
                d.AmmoAmount = weapon.primaryMagazine.contents;
                if (weapon.primaryMagazine.ammoType != null)
                    d.AmmoType = weapon.primaryMagazine.ammoType.shortname;
            }

            return d;
        }

        private void GiveItemToPlayer(BasePlayer player, ItemData itemData)
        {
            ItemDefinition def = ItemManager.FindItemDefinition(itemData.Shortname);
            if (def == null) return;

            Item item = ItemManager.Create(def, itemData.Amount, itemData.SkinId);
            if (item == null) return;

            if (itemData.Condition > 0)
            {
                item.maxCondition = itemData.MaxCondition > 0 ? itemData.MaxCondition : item.maxCondition;
                item.condition = itemData.Condition;
            }

            if (itemData.Attachments != null && itemData.Attachments.Count > 0 && item.contents != null)
            {
                foreach (var attName in itemData.Attachments)
                {
                    ItemDefinition attDef = ItemManager.FindItemDefinition(attName);
                    if (attDef != null)
                    {
                        Item attItem = ItemManager.Create(attDef, 1, 0);
                        if (attItem != null) attItem.MoveToContainer(item.contents);
                    }
                }
            }

            var weapon = item.GetHeldEntity() as BaseProjectile;
            if (weapon != null && weapon.primaryMagazine != null && !string.IsNullOrEmpty(itemData.AmmoType))
            {
                ItemDefinition ammoDef = ItemManager.FindItemDefinition(itemData.AmmoType);
                if (ammoDef != null) weapon.primaryMagazine.ammoType = ammoDef;
                weapon.primaryMagazine.contents = itemData.AmmoAmount;
            }

            bool placed = false;
            if (itemData.Container == "wear" && player.inventory.containerWear != null)
                placed = item.MoveToContainer(player.inventory.containerWear, itemData.Slot);
            else if (itemData.Container == "belt" && player.inventory.containerBelt != null)
                placed = item.MoveToContainer(player.inventory.containerBelt, itemData.Slot);
            else if (itemData.Container == "main" && player.inventory.containerMain != null)
                placed = item.MoveToContainer(player.inventory.containerMain, itemData.Slot);

            if (!placed) player.GiveItem(item);
        }

        #endregion

        #region Game Hooks

        void OnPlayerDeath(BasePlayer victim, HitInfo info)
        {
            if (victim == null || !victim.userID.IsSteamId() || victim.IsNpc) return;

            var victimStat = GetOrCreateStat(victim.UserIDString, victim.displayName);
            victimStat.Deaths++;

            BasePlayer killer = info?.InitiatorPlayer ?? (info?.Initiator as BasePlayer);

            if (killer == null && info?.Initiator != null && info.Initiator.OwnerID.IsSteamId())
            {
                killer = BasePlayer.FindAwakeOrSleeping(info.Initiator.OwnerID.ToString());
            }

            if (killer != null && killer.userID.IsSteamId() && !killer.IsNpc && killer != victim)
            {
                var killerStat = GetOrCreateStat(killer.UserIDString, killer.displayName);
                killerStat.Kills++;
                AddRP(killer.UserIDString, config.RpPerKill, killer);
            }

            SaveStatsData();
        }

        void OnEntityDeath(BaseCombatEntity entity, HitInfo info)
        {
            if (entity == null || info?.InitiatorPlayer == null || !info.InitiatorPlayer.userID.IsSteamId()) return;

            string shortname = entity.ShortPrefabName;
            if (!string.IsNullOrEmpty(shortname) && (shortname.Contains("barrel") || shortname.Contains("roadside")))
            {
                AddRP(info.InitiatorPlayer.UserIDString, config.RpPerBarrel, info.InitiatorPlayer);
            }
        }

        void OnDispenserBonus(ResourceDispenser dispenser, BasePlayer player, Item item)
        {
            if (player != null && player.userID.IsSteamId() && dispenser != null)
            {
                if (dispenser.gatherType == ResourceDispenser.GatherType.Ore)
                {
                    AddRP(player.UserIDString, config.RpPerNode, player);
                }
            }
        }

        void OnRocketLaunched(BasePlayer player, BaseEntity rocket)
        {
            if (player != null && player.userID.IsSteamId() && !player.IsNpc)
            {
                var stat = GetOrCreateStat(player.UserIDString, player.displayName);
                stat.Rockets++;
                SaveStatsData();
            }
        }

        void OnExplosiveThrown(BasePlayer player, BaseEntity entity, ThrownWeapon item)
        {
            if (player != null && player.userID.IsSteamId() && !player.IsNpc)
            {
                if (item != null && item.GetItem()?.info?.shortname == "explosive.timed")
                {
                    var stat = GetOrCreateStat(player.UserIDString, player.displayName);
                    stat.C4++;
                    SaveStatsData();
                }
            }
        }

        #endregion

        #region Initialization & Commands

        void Init()
        {
            permission.RegisterPermission(PermAdmin, this);
            permission.RegisterPermission(PermLinked, this);
            permission.RegisterPermission(PermBooster, this);
            permission.RegisterPermission(PermVip, this);
            permission.RegisterPermission(PermMvp, this);
            permission.RegisterPermission(PermGod, this);
            permission.RegisterPermission(PermBuilder, this);
            permission.RegisterPermission(PermGuns, this);

            LoadPermanentKitsData();
            LoadPlayerData();
            LoadStatsData();
            LoadShopData();

            hourlyGemsTimer = timer.Every(60f, ProcessHourlyGems);
            timer.Once(3f, SyncKitsToWeb);
        }

        void OnServerSave()
        {
            SaveKitsData();
            SavePlayerData();
            SaveStatsData();
            SaveShopData();
        }

        void Unload()
        {
            if (hourlyGemsTimer != null) hourlyGemsTimer.Destroy();
            foreach (var p in BasePlayer.activePlayerList)
                CloseAllGoatUI(p);
            SaveKitsData();
            SavePlayerData();
            SaveStatsData();
            SaveShopData();
        }

        void OnNewSave()
        {
            playerData.LastWipeTimestamp = GetCurrentUnix();
            playerData.Cooldowns.Clear();
            playerData.ClaimCounts.Clear();
            statsData.Players.Clear();
            SavePlayerData();
            SaveStatsData();
        }

        [ChatCommand("kit")]
        private void CmdKit(BasePlayer player, string cmd, string[] args) => OpenMainUI(player);

        [ChatCommand("kits")]
        private void CmdKits(BasePlayer player, string cmd, string[] args) => OpenMainUI(player);

        [ChatCommand("shop")]
        private void CmdShop(BasePlayer player, string cmd, string[] args) => OpenShopUI(player);

        [ChatCommand("stats")]
        private void CmdStats(BasePlayer player, string cmd, string[] args) => OpenStatisticsUI(player);

        [ChatCommand("leaderboard")]
        private void CmdLeaderboard(BasePlayer player, string cmd, string[] args) => OpenStatisticsUI(player);

        [ChatCommand("top")]
        private void CmdTop(BasePlayer player, string cmd, string[] args) => OpenStatisticsUI(player);

        [ChatCommand("goat")]
        private void CmdGoat(BasePlayer player, string cmd, string[] args) => OpenMainUI(player);

        #endregion

        #region Base Shell & Sidebar (Rendered Once - Zero Flicker)

        private void EnsureBaseShell(BasePlayer player, string activeNav)
        {
            if (!openUiPlayers.Contains(player.userID))
            {
                CuiHelper.DestroyUi(player, LayerMain);
                openUiPlayers.Add(player.userID);

                var baseElements = new CuiElementContainer();

                // Main Dimmer Overlay
                baseElements.Add(new CuiPanel
                {
                    Image = { Color = ColorBgDimmer },
                    RectTransform = { AnchorMin = "0 0", AnchorMax = "1 1" },
                    CursorEnabled = true
                }, "Overlay", LayerMain);

                // Left Sidebar Container
                baseElements.Add(new CuiPanel
                {
                    Image = { Color = ColorSidebar },
                    RectTransform = { AnchorMin = "0.012 0.02", AnchorMax = "0.160 0.98" }
                }, LayerMain, "SidebarPanel");

                // Big Bold GOAT Logo
                baseElements.Add(new CuiLabel
                {
                    Text = { Text = "<b>GOAT</b>", FontSize = 36, Align = TextAnchor.MiddleCenter, Color = "0.96 0.97 0.99 1.0", Font = "robotocondensed-bold.ttf" },
                    RectTransform = { AnchorMin = "0.05 0.88", AnchorMax = "0.95 0.98" }
                }, "SidebarPanel");

                baseElements.Add(new CuiLabel
                {
                    Text = { Text = "SERVER POPULATION", FontSize = 10, Align = TextAnchor.MiddleCenter, Color = ColorActiveBlue, Font = "robotocondensed-bold.ttf" },
                    RectTransform = { AnchorMin = "0.05 0.815", AnchorMax = "0.95 0.850" }
                }, "SidebarPanel");

                baseElements.Add(new CuiLabel
                {
                    Text = { Text = $"{BasePlayer.activePlayerList.Count} / {ConVar.Server.maxplayers}", FontSize = 12, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" },
                    RectTransform = { AnchorMin = "0.05 0.780", AnchorMax = "0.95 0.815" }
                }, "SidebarPanel");

                // Dynamic Navigation Buttons Container
                baseElements.Add(new CuiPanel
                {
                    Image = { Color = "0 0 0 0" },
                    RectTransform = { AnchorMin = "0.045 0.40", AnchorMax = "0.955 0.75" }
                }, "SidebarPanel", "NavButtonsContainer");

                // Balance Area
                var acc = GetOrCreateAccount(player.UserIDString, player.displayName);
                baseElements.Add(new CuiLabel
                {
                    Text = { Text = "BALANCE", FontSize = 13, Align = TextAnchor.MiddleLeft, Color = ColorActiveBlue, Font = "robotocondensed-bold.ttf" },
                    RectTransform = { AnchorMin = "0.08 0.150", AnchorMax = "0.92 0.190" }
                }, "SidebarPanel");

                baseElements.Add(new CuiLabel
                {
                    Text = { Text = $"◆ {acc.Gems:N0} (+{config.GemsPerHour}/h)", FontSize = 11, Align = TextAnchor.MiddleLeft, Color = "#F5A623" },
                    RectTransform = { AnchorMin = "0.08 0.100", AnchorMax = "0.92 0.140" }
                }, "SidebarPanel");

                baseElements.Add(new CuiLabel
                {
                    Text = { Text = $"RP\n<color=#FFFFFF>{acc.RP:N0}</color>", FontSize = 11, Align = TextAnchor.MiddleLeft, Color = ColorTextMuted },
                    RectTransform = { AnchorMin = "0.08 0.030", AnchorMax = "0.92 0.095" }
                }, "SidebarPanel");

                CuiHelper.AddUi(player, baseElements);
            }

            // Update Navigation Buttons Highlight without redrawing screen
            CuiHelper.DestroyUi(player, "NavButtonsContainer");
            var navContainer = new CuiElementContainer();
            navContainer.Add(new CuiPanel
            {
                Image = { Color = "0 0 0 0" },
                RectTransform = { AnchorMin = "0.045 0.40", AnchorMax = "0.955 0.75" }
            }, "SidebarPanel", "NavButtonsContainer");

            string[] navItems = { "KITS", "SHOP", "STATISTICS", "COMMANDS" };
            float btnH = 0.20f;
            float btnGap = 0.05f;

            for (int i = 0; i < navItems.Length; i++)
            {
                string nav = navItems[i];
                bool isActive = nav.Equals(activeNav, StringComparison.OrdinalIgnoreCase);
                float yMax = 1.0f - (i * (btnH + btnGap));
                float yMin = yMax - btnH;

                string cmd = (nav == "KITS") ? "goatui.nav.kits" : ((nav == "SHOP") ? "goatui.nav.shop" : ((nav == "STATISTICS") ? "goatui.nav.stats" : ""));

                navContainer.Add(new CuiButton
                {
                    Button = { Color = isActive ? ColorActiveBlue : ColorNavBtn, Command = cmd },
                    RectTransform = { AnchorMin = $"0 {yMin}", AnchorMax = $"1 {yMax}" },
                    Text = { Text = nav, FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
                }, "NavButtonsContainer");
            }
            CuiHelper.AddUi(player, navContainer);
        }

        #endregion

        #region UI Rendering: Seamless KITS UI (4x2 Cards Grid)

        private void OpenMainUI(BasePlayer player)
        {
            activeMenu[player.userID] = "KITS";
            EnsureBaseShell(player, "KITS");
            ClearContentOnly(player);

            var elements = new CuiElementContainer();

            // Right-Side Content Wrapper
            elements.Add(new CuiPanel
            {
                Image = { Color = "0 0 0 0" },
                RectTransform = { AnchorMin = "0.170 0.02", AnchorMax = "0.990 0.98" }
            }, LayerMain, LayerContent);

            // TopBar Header
            elements.Add(new CuiPanel
            {
                Image = { Color = "0 0 0 0" },
                RectTransform = { AnchorMin = "0 0.935", AnchorMax = "1 1.0" }
            }, LayerContent, LayerTopBar);

            if (!activePlayerTabs.ContainsKey(player.userID) || string.IsNullOrEmpty(activePlayerTabs[player.userID]) || !kitsData.Tabs.Contains(activePlayerTabs[player.userID]))
                activePlayerTabs[player.userID] = "ALL KITS";

            string currentActiveTab = activePlayerTabs[player.userID];

            float curX = 0.00f;
            for (int i = 0; i < kitsData.Tabs.Count; i++)
            {
                string tabName = kitsData.Tabs[i];
                bool isSelected = tabName.Equals(currentActiveTab, StringComparison.OrdinalIgnoreCase);

                float tabWidth = (tabName.Replace(" ", "").Length > 7) ? 0.078f : 0.065f;
                float xMin = curX;
                float xMax = xMin + tabWidth;
                curX += tabWidth + 0.006f;

                if (xMax > 0.60f) break;

                bool isGemsTab = tabName.IndexOf("GEMS", StringComparison.OrdinalIgnoreCase) >= 0;
                string tabColor = isGemsTab ? ColorTabGems : (isSelected ? ColorTabActive : ColorTabIdle);
                string tabTextColor = isGemsTab ? ColorHeaderText : (isSelected ? ColorTextWhite : ColorTabTextDim);

                elements.Add(new CuiButton
                {
                    Button = { Color = tabColor, Command = $"goatui.switchtab {i}" },
                    RectTransform = { AnchorMin = $"{xMin} 0.18", AnchorMax = $"{xMax} 0.82" },
                    Text = { Text = (isGemsTab ? "💎 " : "") + tabName.ToUpperInvariant(), FontSize = 11, Align = TextAnchor.MiddleCenter, Color = tabTextColor, Font = "robotocondensed-bold.ttf" }
                }, LayerTopBar);
            }

            if (!playerPages.ContainsKey(player.userID)) playerPages[player.userID] = 0;
            int curPage = playerPages[player.userID];

            float arrowX = curX + 0.012f;
            elements.Add(new CuiButton
            {
                Button = { Color = "0.09 0.11 0.15 0.95", Command = "goatui.prevpage" },
                RectTransform = { AnchorMin = $"{arrowX} 0.16", AnchorMax = $"{arrowX + 0.024f} 0.84" },
                Text = { Text = "◀", FontSize = 10, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite }
            }, LayerTopBar);

            elements.Add(new CuiButton
            {
                Button = { Color = "0.09 0.11 0.15 0.95", Command = "goatui.nextpage" },
                RectTransform = { AnchorMin = $"{arrowX + 0.028f} 0.16", AnchorMax = $"{arrowX + 0.052f} 0.84" },
                Text = { Text = "▶", FontSize = 10, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite }
            }, LayerTopBar);

            if (HasRank(player))
            {
                elements.Add(new CuiButton
                {
                    Button = { Color = ColorNavBtn, Command = "goatui.opentabmodal" },
                    RectTransform = { AnchorMin = "0.70 0.15", AnchorMax = "0.79 0.85" },
                    Text = { Text = "📁 + TAB", FontSize = 10, Align = TextAnchor.MiddleCenter, Color = ColorWarning, Font = "robotocondensed-bold.ttf" }
                }, LayerTopBar);

                elements.Add(new CuiButton
                {
                    Button = { Color = ColorActiveBlue, Command = "goatui.openaddmodal" },
                    RectTransform = { AnchorMin = "0.80 0.15", AnchorMax = "0.89 0.85" },
                    Text = { Text = "+ NEW KIT", FontSize = 10, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
                }, LayerTopBar);
            }

            elements.Add(new CuiButton
            {
                Button = { Color = "0.14 0.05 0.06 0.96", Command = "goatui.close" },
                RectTransform = { AnchorMin = "0.905 0.10", AnchorMax = "0.995 0.90" },
                Text = { Text = "CLOSE", FontSize = 13, Align = TextAnchor.MiddleCenter, Color = "0.94 0.30 0.30 1.00", Font = "robotocondensed-bold.ttf" }
            }, LayerTopBar);

            // Cards Area
            elements.Add(new CuiPanel
            {
                Image = { Color = "0 0 0 0" },
                RectTransform = { AnchorMin = "0 0", AnchorMax = "1 0.925" }
            }, LayerContent, LayerCards);

            List<KitModel> visibleKits;
            if (currentActiveTab.Equals("ALL KITS", StringComparison.OrdinalIgnoreCase) || currentActiveTab.Equals("ALL", StringComparison.OrdinalIgnoreCase))
            {
                visibleKits = kitsData.Kits.ToList();
            }
            else if (currentActiveTab.Equals("OWNED", StringComparison.OrdinalIgnoreCase))
            {
                visibleKits = new List<KitModel>();
                Dictionary<string, int> claims;
                if (playerData.ClaimCounts.TryGetValue(player.UserIDString, out claims))
                    visibleKits = kitsData.Kits.Where(k => claims.ContainsKey(k.Id) && claims[k.Id] > 0).ToList();
            }
            else if (currentActiveTab.Equals("GEMS", StringComparison.OrdinalIgnoreCase))
            {
                visibleKits = kitsData.Kits.Where(k => k.Currency.Equals("GEMS", StringComparison.OrdinalIgnoreCase) || k.TabName.Equals("GEMS", StringComparison.OrdinalIgnoreCase)).ToList();
            }
            else
            {
                visibleKits = kitsData.Kits.Where(k => k.TabName.Equals(currentActiveTab, StringComparison.OrdinalIgnoreCase)).ToList();
            }

            if (visibleKits.Count == 0)
            {
                string emptyMsg = currentActiveTab.Equals("OWNED", StringComparison.OrdinalIgnoreCase)
                    ? "You haven't claimed any kits yet this wipe.\n\nClaimed kits will appear here."
                    : $"No kits currently available in category [{currentActiveTab}].";

                elements.Add(new CuiLabel
                {
                    Text = { Text = emptyMsg, FontSize = 14, Align = TextAnchor.MiddleCenter, Color = ColorTextMuted, Font = "robotocondensed-bold.ttf" },
                    RectTransform = { AnchorMin = "0.1 0.3", AnchorMax = "0.9 0.7" }
                }, LayerCards);
            }
            else
            {
                const int pageSize = 8;
                int totalPages = (int)Math.Ceiling(visibleKits.Count / (float)pageSize);
                if (curPage >= totalPages) curPage = 0;
                if (curPage < 0) curPage = Math.Max(0, totalPages - 1);
                playerPages[player.userID] = curPage;

                var pageKits = visibleKits.Skip(curPage * pageSize).Take(pageSize).ToList();

                const float colW = 0.242f;
                const float colGap = 0.010f;
                const float row1YMin = 0.355f;
                const float row1YMax = 0.990f; // Row 1 Height = 0.635f (Tall - 8 items high)
                const float row2YMin = 0.010f;
                const float row2YMax = 0.335f; // Row 2 Height = 0.325f (Short - 3-4 items high)

                for (int i = 0; i < pageKits.Count; i++)
                {
                    int col = i % 4;
                    int row = i / 4;
                    bool isTopRow = (row == 0);

                    float xMin = col * (colW + colGap);
                    float xMax = xMin + colW;
                    float yMin = isTopRow ? row1YMin : row2YMin;
                    float yMax = isTopRow ? row1YMax : row2YMax;

                    BuildFastReferenceCard(elements, pageKits[i], xMin, xMax, yMin, yMax, player, isTopRow);
                }
            }

            CuiHelper.AddUi(player, elements);
        }

        private void BuildFastReferenceCard(CuiElementContainer elements, KitModel kit, float xMin, float xMax, float yMin, float yMax, BasePlayer player, bool isTopRow)
        {
            string cardName = $"Card_{kit.Id}";

            elements.Add(new CuiPanel
            {
                Image = { Color = ColorCardBg },
                RectTransform = { AnchorMin = $"{xMin} {yMin}", AnchorMax = $"{xMax} {yMax}" }
            }, LayerCards, cardName);

            float headerYMin = isTopRow ? 0.940f : 0.880f;
            elements.Add(new CuiPanel
            {
                Image = { Color = kit.ColorHex },
                RectTransform = { AnchorMin = $"0 {headerYMin}", AnchorMax = "1 1.0" }
            }, cardName, $"{cardName}_H");

            string tierWord = kit.Title.Split(' ')[0];
            elements.Add(new CuiLabel
            {
                Text = { Text = tierWord.ToUpperInvariant(), FontSize = isTopRow ? 14 : 11, Align = TextAnchor.MiddleLeft, Color = "1 1 1 0.25", Font = "robotocondensed-bold.ttf" },
                RectTransform = { AnchorMin = "0.04 0", AnchorMax = "0.42 1" }
            }, $"{cardName}_H");

            elements.Add(new CuiLabel
            {
                Text = { Text = kit.Title.ToUpperInvariant(), FontSize = isTopRow ? 11 : 10, Align = TextAnchor.MiddleCenter, Color = ColorHeaderText, Font = "robotocondensed-bold.ttf" },
                RectTransform = { AnchorMin = "0.05 0", AnchorMax = "0.95 1" }
            }, $"{cardName}_H");

            float gridYMin = isTopRow ? 0.075f : 0.150f;
            float gridYMax = isTopRow ? 0.932f : 0.865f;
            elements.Add(new CuiPanel
            {
                Image = { Color = "0 0 0 0" },
                RectTransform = { AnchorMin = $"0.025 {gridYMin}", AnchorMax = $"0.975 {gridYMax}" }
            }, cardName, $"{cardName}_G");

            int maxItems = isTopRow ? Math.Min(kit.Items.Count, 16) : Math.Min(kit.Items.Count, 8);
            int totalRows = (int)Math.Ceiling(maxItems / 2f);
            float rowH = isTopRow ? 0.108f : ((totalRows <= 3) ? 0.285f : 0.220f);
            float rowGap = isTopRow ? 0.016f : ((totalRows <= 3) ? 0.040f : 0.025f);

            for (int i = 0; i < maxItems; i++)
            {
                int row = i / 2;
                int col = i % 2;

                float slotXMin = (col == 0) ? 0.0f : 0.515f;
                float slotXMax = (col == 0) ? 0.485f : 1.0f;
                float slotYMax = 1.0f - row * (rowH + rowGap);
                float slotYMin = slotYMax - rowH;

                if (slotYMin < -0.01f) break;

                var it = kit.Items[i];
                string slotId = $"{cardName}_S{i}";

                elements.Add(new CuiPanel
                {
                    Image = { Color = ColorSlotBg },
                    RectTransform = { AnchorMin = $"{slotXMin} {Math.Max(0f, slotYMin)}", AnchorMax = $"{slotXMax} {slotYMax}" }
                }, $"{cardName}_G", slotId);

                ItemDefinition itemDef = ItemManager.FindItemDefinition(it.Shortname);
                if (itemDef != null)
                {
                    elements.Add(new CuiElement
                    {
                        Parent = slotId,
                        Components =
                        {
                            new CuiImageComponent { ItemId = itemDef.itemid, SkinId = it.SkinId, Color = "1 1 1 1" },
                            new CuiRectTransformComponent { AnchorMin = "0.04 0.10", AnchorMax = "0.32 0.90" }
                        }
                    });
                }

                string displayName = !string.IsNullOrEmpty(it.DisplayName) ? it.DisplayName : (itemDef != null ? itemDef.displayName.english : it.Shortname);
                if (displayName.Length > 12) displayName = displayName.Substring(0, 11) + "..";
                string amountStr = (it.Amount >= 1000) ? $"{it.Amount:N0}" : it.Amount.ToString();

                elements.Add(new CuiLabel
                {
                    Text = { Text = $"<size=8><color=#8E9CA8>{displayName.ToUpper()}</color></size>\n<size=9><b><color=#FFFFFF>{amountStr}</color></b></size>", Align = TextAnchor.MiddleLeft, Font = "robotocondensed-bold.ttf" },
                    RectTransform = { AnchorMin = "0.35 0.05", AnchorMax = "0.98 0.95" }
                }, slotId);
            }

            long now = GetCurrentUnix();
            long wipeTimestamp = GetRealWipeTimestamp();
            long timeSinceWipe = Math.Max(0, now - wipeTimestamp);
            long wipeLockSeconds = (long)(kit.WipeLockHours * 3600f);
            long cooldownSeconds = (long)(kit.CooldownHours * 3600f);

            long lastClaim = 0;
            if (playerData.Cooldowns.ContainsKey(player.UserIDString) && playerData.Cooldowns[player.UserIDString].ContainsKey(kit.Id))
                lastClaim = playerData.Cooldowns[player.UserIDString][kit.Id];

            int userClaimCount = 0;
            if (playerData.ClaimCounts.ContainsKey(player.UserIDString) && playerData.ClaimCounts[player.UserIDString].ContainsKey(kit.Id))
                userClaimCount = playerData.ClaimCounts[player.UserIDString][kit.Id];

            long cooldownPassed = now - lastClaim;
            bool isCooldown = cooldownSeconds > 0 && lastClaim > 0 && cooldownPassed < cooldownSeconds;
            bool isWipeLocked = wipeLockSeconds > 0 && timeSinceWipe < wipeLockSeconds;
            bool isLimitReached = kit.MaxUsesPerWipe > 0 && userClaimCount >= kit.MaxUsesPerWipe;

            string btnText = kit.PriceText;
            string btnColor = ColorActiveBlue;

            if (kit.Currency.Equals("USD", StringComparison.OrdinalIgnoreCase))
            {
                btnColor = ColorActionGreen;
            }
            else if (kit.Currency.Equals("RP", StringComparison.OrdinalIgnoreCase) && kit.Price > 0)
            {
                btnText = $"{kit.Price:N0} RP";
            }
            else if (kit.Currency.Equals("GEMS", StringComparison.OrdinalIgnoreCase) && kit.Price > 0)
            {
                btnText = $"💎 {kit.Price:N0} GEMS";
            }

            if (kit.LockType == "LINKED")
            {
                bool isLinked = IsPlayerLinked(player);
                btnText = isLinked ? "CLAIM KIT" : "LINK ACCOUNT";
                btnColor = isLinked ? ColorActionGreen : ColorTabActive;
            }
            else if (kit.LockType == "BOOSTER")
            {
                bool isBooster = IsPlayerBooster(player);
                btnText = isBooster ? "CLAIM KIT" : "BOOST DISCORD";
                btnColor = isBooster ? ColorActionGreen : ColorBoosterPurple;
            }
            else if (kit.LockType == "VIP" || kit.LockType == "MVP" || kit.LockType == "GOD" || kit.LockType == "BUILDER" || kit.LockType == "GUNS")
            {
                bool hasTier = IsPlayerTier(player, kit.LockType);
                if (hasTier)
                {
                    btnText = "CLAIM KIT";
                    btnColor = ColorActionGreen;
                }
                else
                {
                    btnText = $"{kit.PriceText}";
                    btnColor = ColorLockedRed;
                }
            }
            else if (kit.Currency.Equals("FREE", StringComparison.OrdinalIgnoreCase) || kit.Price == 0)
            {
                btnText = "FREE";
                btnColor = ColorActionGreen;
            }

            if (isLimitReached) { btnText = $"LIMIT ({userClaimCount}/{kit.MaxUsesPerWipe})"; btnColor = ColorLockedRed; }
            else if (isWipeLocked) { btnText = $"LOCK {FormatSeconds(wipeLockSeconds - timeSinceWipe)}"; btnColor = ColorLockedRed; }
            else if (isCooldown) { btnText = $"WAIT {FormatSeconds(cooldownSeconds - cooldownPassed)}"; btnColor = ColorCooldownBg; }

            float btnYMin = isTopRow ? 0.016f : 0.030f;
            float btnYMax = isTopRow ? 0.065f : 0.125f;

            bool isAdminViewer = HasRank(player);

            if (isAdminViewer)
            {
                elements.Add(new CuiButton
                {
                    Button = { Color = ColorCloseRed, Command = $"goatui.deletekit {kit.Id}" },
                    RectTransform = { AnchorMin = $"0.025 {btnYMin}", AnchorMax = $"0.080 {btnYMax}" },
                    Text = { Text = "🗑️", FontSize = 9, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite }
                }, cardName);

                elements.Add(new CuiButton
                {
                    Button = { Color = ColorActiveBlue, Command = $"goatui.openeditmodal {kit.Id}" },
                    RectTransform = { AnchorMin = $"0.085 {btnYMin}", AnchorMax = $"0.145 {btnYMax}" },
                    Text = { Text = "✏️", FontSize = 9, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite }
                }, cardName);
            }
            else
            {
                elements.Add(new CuiPanel
                {
                    Image = { Color = ColorSlotBg },
                    RectTransform = { AnchorMin = $"0.025 {btnYMin}", AnchorMax = $"0.145 {btnYMax}" }
                }, cardName, $"{cardName}_CB");

                elements.Add(new CuiLabel
                {
                    Text = { Text = "🛒", FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite },
                    RectTransform = { AnchorMin = "0 0", AnchorMax = "1 1" }
                }, $"{cardName}_CB");
            }

            elements.Add(new CuiButton
            {
                Button = { Color = btnColor, Command = $"goatui.claim {kit.Id}" },
                RectTransform = { AnchorMin = $"0.165 {btnYMin}", AnchorMax = $"0.975 {btnYMax}" },
                Text = { Text = btnText, FontSize = 10, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, cardName);
        }

        #endregion

        #region UI Rendering: Seamless SHOP UI

        private void OpenShopUI(BasePlayer player)
        {
            activeMenu[player.userID] = "SHOP";
            EnsureBaseShell(player, "SHOP");
            ClearContentOnly(player);

            var elements = new CuiElementContainer();

            elements.Add(new CuiPanel
            {
                Image = { Color = "0 0 0 0" },
                RectTransform = { AnchorMin = "0.170 0.02", AnchorMax = "0.990 0.98" }
            }, LayerMain, LayerContent);

            elements.Add(new CuiPanel
            {
                Image = { Color = "0.095 0.105 0.12 0.985" },
                RectTransform = { AnchorMin = "0.10 0.12", AnchorMax = "0.92 0.88" }
            }, LayerContent, "ShopBox");

            elements.Add(new CuiPanel
            {
                Image = { Color = "0.055 0.06 0.07 0.99" },
                RectTransform = { AnchorMin = "0 0.908", AnchorMax = "1 1" }
            }, "ShopBox", "ShopHeader");

            elements.Add(new CuiLabel
            {
                Text = { Text = $"{config.ServerName.ToUpper()} SHOP", FontSize = 14, Align = TextAnchor.MiddleLeft, Color = "0.92 0.93 0.95 1.0", Font = "robotocondensed-bold.ttf" },
                RectTransform = { AnchorMin = "0.035 0", AnchorMax = "0.5 1" }
            }, "ShopHeader");

            if (HasRank(player))
            {
                elements.Add(new CuiButton
                {
                    Button = { Color = "0.10 0.30 0.55 0.90", Command = "goatui.shop.openaddmodal" },
                    RectTransform = { AnchorMin = "0.80 0.12", AnchorMax = "0.93 0.88" },
                    Text = { Text = "+ ADD ITEM", FontSize = 10, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
                }, "ShopHeader");
            }

            elements.Add(new CuiButton
            {
                Button = { Color = "0 0 0 0", Command = "goatui.close" },
                RectTransform = { AnchorMin = "0.925 0.935", AnchorMax = "0.99 0.98" },
                Text = { Text = "CLOSE", FontSize = 14, Align = TextAnchor.MiddleCenter, Color = "0.94 0.30 0.30 1.00", Font = "robotocondensed-bold.ttf" }
            }, LayerContent);

            if (!activeShopCategory.ContainsKey(player.userID) || string.IsNullOrEmpty(activeShopCategory[player.userID]) || !shopData.Categories.ContainsKey(activeShopCategory[player.userID]))
                activeShopCategory[player.userID] = "GEMS";

            string currentCategory = activeShopCategory[player.userID];

            // Categories Sidebar inside Shop
            elements.Add(new CuiPanel
            {
                Image = { Color = "0 0 0 0" },
                RectTransform = { AnchorMin = "0.012 0.02", AnchorMax = "0.225 0.895" }
            }, "ShopBox", "ShopNavPanel");

            var categories = new List<(string key, string display, string iconShort, string emoji)>
            {
                ("GEMS", "GEMS", "", "◆"),
                ("PVP", "PVP", "skull.human", ""),
                ("Weapons", "Weapons", "rifle.ak", ""),
                ("Ammunition", "Ammunition", "ammo.rifle", ""),
                ("Component", "Component", "gear", ""),
                ("Construction", "Construction", "building.planner", ""),
                ("Items", "Items", "box.wooden.large", ""),
                ("Attire", "Attire", "hoodie", ""),
                ("Tools", "Tools", "hammer", ""),
                ("Medical", "Medical", "syringe.medical", ""),
                ("Food", "Food", "cookedmeat", "")
            };

            float catY = 1.0f;
            float catH = 0.0835f;
            float catGap = 0.0075f;

            for (int i = 0; i < categories.Count; i++)
            {
                var cat = categories[i];
                bool isSel = cat.key.Equals(currentCategory, StringComparison.OrdinalIgnoreCase);
                float yMax = catY - (i * (catH + catGap));
                float yMin = yMax - catH;

                string rowId = $"ShopCat_{i}";

                elements.Add(new CuiButton
                {
                    Button = { Color = isSel ? ColorActiveBlue : "0.11 0.12 0.15 0.95", Command = $"goatui.shop.tab {cat.key}" },
                    RectTransform = { AnchorMin = $"0 {yMin}", AnchorMax = $"1 {yMax}" },
                    Text = { Text = "" }
                }, "ShopNavPanel", rowId);

                if (!string.IsNullOrEmpty(cat.iconShort))
                {
                    ItemDefinition catDef = ItemManager.FindItemDefinition(cat.iconShort);
                    if (catDef != null)
                    {
                        elements.Add(new CuiElement
                        {
                            Parent = rowId,
                            Components =
                            {
                                new CuiImageComponent { ItemId = catDef.itemid, Color = "1 1 1 1" },
                                new CuiRectTransformComponent { AnchorMin = "0.07 0.5", AnchorMax = "0.07 0.5", OffsetMin = "0 -11", OffsetMax = "22 11" }
                            }
                        });
                    }
                }
                else
                {
                    elements.Add(new CuiLabel
                    {
                        Text = { Text = cat.emoji, FontSize = 14, Align = TextAnchor.MiddleCenter, Color = "#F5A623" },
                        RectTransform = { AnchorMin = "0.07 0", AnchorMax = "0.29 1" }
                    }, rowId);
                }

                string rowTextColor = cat.key.Equals("GEMS", StringComparison.OrdinalIgnoreCase) ? "#F5A623" : ColorTextWhite;

                elements.Add(new CuiLabel
                {
                    Text = { Text = cat.display, FontSize = 12, Align = TextAnchor.MiddleLeft, Color = rowTextColor, Font = "robotocondensed-bold.ttf" },
                    RectTransform = { AnchorMin = "0.30 0", AnchorMax = "0.97 1" }
                }, rowId);
            }

            // Items Grid
            elements.Add(new CuiPanel
            {
                Image = { Color = "0 0 0 0" },
                RectTransform = { AnchorMin = "0.237 0.05", AnchorMax = "0.985 0.892" }
            }, "ShopBox", "ShopGridArea");

            var items = shopData.Categories.ContainsKey(currentCategory) ? shopData.Categories[currentCategory] : new List<ShopItemModel>();

            if (items.Count == 0)
            {
                string emptyMsg = HasRank(player)
                    ? $"No items in [{currentCategory}] yet.\n\nClick '+ ADD ITEM' in the top-right to add items."
                    : $"No items currently available in [{currentCategory}].";

                elements.Add(new CuiLabel
                {
                    Text = { Text = emptyMsg, FontSize = 12, Align = TextAnchor.MiddleCenter, Color = ColorTextMuted, Font = "robotocondensed-bold.ttf" },
                    RectTransform = { AnchorMin = "0.1 0.3", AnchorMax = "0.9 0.7" }
                }, "ShopGridArea");
            }
            else
            {
                int cols = 6;
                int rows = 3;
                float cellW = 0.1617f;
                float cellH = 0.3253f;
                float gapX = 0.006f;
                float gapY = 0.012f;

                for (int i = 0; i < Math.Min(items.Count, cols * rows); i++)
                {
                    var item = items[i];
                    int c = i % cols;
                    int r = i / cols;

                    float xMin = c * (cellW + gapX);
                    float xMax = xMin + cellW;
                    float yMax = 1.0f - (r * (cellH + gapY));
                    float yMin = yMax - cellH;

                    string cellId = $"ShopCell_{i}";
                    bool isItemGems = item.Currency.Equals("GEMS", StringComparison.OrdinalIgnoreCase);

                    elements.Add(new CuiPanel
                    {
                        Image = { Color = "0.135 0.145 0.16 0.98" },
                        RectTransform = { AnchorMin = $"{xMin} {yMin}", AnchorMax = $"{xMax} {yMax}" }
                    }, "ShopGridArea", cellId);

                    if (isItemGems)
                    {
                        elements.Add(new CuiLabel
                        {
                            Text = { Text = "◆", FontSize = 13, Align = TextAnchor.MiddleCenter, Color = "#F5A623" },
                            RectTransform = { AnchorMin = "0.04 0.76", AnchorMax = "0.20 0.97" }
                        }, cellId);
                    }

                    ItemDefinition itemDef = ItemManager.FindItemDefinition(item.Shortname);
                    if (itemDef != null)
                    {
                        elements.Add(new CuiElement
                        {
                            Parent = cellId,
                            Components =
                            {
                                new CuiImageComponent { ItemId = itemDef.itemid, SkinId = item.SkinId, Color = "1 1 1 1" },
                                new CuiRectTransformComponent { AnchorMin = "0.5 0.53", AnchorMax = "0.5 0.53", OffsetMin = "-40 -30", OffsetMax = "40 44" }
                            }
                        });
                    }

                    string priceText = isItemGems ? $"{item.Price:N0} GEMS" : $"{item.Price:N0} RP";
                    elements.Add(new CuiLabel
                    {
                        Text = { Text = priceText, FontSize = 10, Align = TextAnchor.MiddleRight, Color = "0.92 0.93 0.95 1.0", Font = "robotocondensed-bold.ttf" },
                        RectTransform = { AnchorMin = "0.30 0.03", AnchorMax = "0.95 0.17" }
                    }, cellId);

                    if (item.Amount > 1)
                    {
                        elements.Add(new CuiLabel
                        {
                            Text = { Text = $"x{item.Amount}", FontSize = 9, Align = TextAnchor.MiddleLeft, Color = "0.62 0.66 0.72 1.0", Font = "robotocondensed-bold.ttf" },
                            RectTransform = { AnchorMin = "0.05 0.03", AnchorMax = "0.28 0.17" }
                        }, cellId);
                    }

                    elements.Add(new CuiButton
                    {
                        Button = { Color = "0 0 0 0", Command = $"goatui.shop.buy {currentCategory} {i}" },
                        RectTransform = { AnchorMin = "0 0", AnchorMax = "1 1" },
                        Text = { Text = "" }
                    }, cellId);

                    if (HasRank(player))
                    {
                        elements.Add(new CuiButton
                        {
                            Button = { Color = ColorCloseRed, Command = $"goatui.shop.delitem {currentCategory} {i}" },
                            RectTransform = { AnchorMin = "0.80 0.80", AnchorMax = "0.99 0.99" },
                            Text = { Text = "✕", FontSize = 8, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
                        }, cellId);
                    }
                }
            }

            CuiHelper.AddUi(player, elements);
        }

        #endregion

        #region UI Rendering: Seamless STATISTICS UI

        private void OpenStatisticsUI(BasePlayer player)
        {
            activeMenu[player.userID] = "STATISTICS";
            EnsureBaseShell(player, "STATISTICS");
            ClearContentOnly(player);

            var elements = new CuiElementContainer();

            elements.Add(new CuiPanel
            {
                Image = { Color = "0 0 0 0" },
                RectTransform = { AnchorMin = "0.170 0.02", AnchorMax = "0.990 0.98" }
            }, LayerMain, LayerContent);

            if (!activeStatsTabs.ContainsKey(player.userID) || string.IsNullOrEmpty(activeStatsTabs[player.userID]))
                activeStatsTabs[player.userID] = "PLAYERS";

            string currentTab = activeStatsTabs[player.userID];

            elements.Add(new CuiLabel
            {
                Text = { Text = $"<size=18><b>{config.ServerName}</b></size>\n<size=10><color=#8E9CA8>LEADERBOARD</color></size>", Align = TextAnchor.MiddleLeft, Font = "robotocondensed-bold.ttf" },
                RectTransform = { AnchorMin = "0.02 0.91", AnchorMax = "0.40 0.98" }
            }, LayerContent);

            bool isPlayers = currentTab.Equals("PLAYERS", StringComparison.OrdinalIgnoreCase);
            bool isClans = currentTab.Equals("CLANS", StringComparison.OrdinalIgnoreCase);

            elements.Add(new CuiButton
            {
                Button = { Color = isPlayers ? ColorActiveBlue : ColorNavBtn, Command = "goatui.stats.tab PLAYERS" },
                RectTransform = { AnchorMin = "0.68 0.925", AnchorMax = "0.78 0.980" },
                Text = { Text = "PLAYERS", FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, LayerContent);

            elements.Add(new CuiButton
            {
                Button = { Color = isClans ? ColorActiveBlue : ColorNavBtn, Command = "goatui.stats.tab CLANS" },
                RectTransform = { AnchorMin = "0.79 0.925", AnchorMax = "0.89 0.980" },
                Text = { Text = "CLANS", FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, LayerContent);

            elements.Add(new CuiButton
            {
                Button = { Color = ColorCloseRed, Command = "goatui.close" },
                RectTransform = { AnchorMin = "0.90 0.925", AnchorMax = "0.99 0.980" },
                Text = { Text = "CLOSE", FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, LayerContent);

            elements.Add(new CuiPanel
            {
                Image = { Color = "0 0 0 0" },
                RectTransform = { AnchorMin = "0.02 0.855", AnchorMax = "0.98 0.895" }
            }, LayerContent, "StatsHeaderRow");

            string nameColTitle = isClans ? "Clan" : "Player";

            elements.Add(new CuiLabel { Text = { Text = "<b>#</b>", FontSize = 11, Align = TextAnchor.MiddleLeft, Color = ColorTextMuted, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.01 0", AnchorMax = "0.06 1" } }, "StatsHeaderRow");
            elements.Add(new CuiLabel { Text = { Text = $"<b>{nameColTitle}</b>", FontSize = 11, Align = TextAnchor.MiddleLeft, Color = ColorTextMuted, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.08 0", AnchorMax = "0.45 1" } }, "StatsHeaderRow");

            ItemDefinition killDef = ItemManager.FindItemDefinition("weapon.mod.small.scope") ?? ItemManager.FindItemDefinition("weapon.mod.8x.scope");
            if (killDef != null)
            {
                elements.Add(new CuiElement
                {
                    Parent = "StatsHeaderRow",
                    Components =
                    {
                        new CuiImageComponent { ItemId = killDef.itemid, Color = "1 1 1 1" },
                        new CuiRectTransformComponent { AnchorMin = "0.505 0.10", AnchorMax = "0.525 0.90" }
                    }
                });
            }

            ItemDefinition skullDef = ItemManager.FindItemDefinition("skull.human");
            if (skullDef != null)
            {
                elements.Add(new CuiElement
                {
                    Parent = "StatsHeaderRow",
                    Components =
                    {
                        new CuiImageComponent { ItemId = skullDef.itemid, Color = "1 1 1 1" },
                        new CuiRectTransformComponent { AnchorMin = "0.605 0.10", AnchorMax = "0.625 0.90" }
                    }
                });
            }

            elements.Add(new CuiLabel { Text = { Text = "<b>K/D</b>", FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextMuted, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.68 0", AnchorMax = "0.75 1" } }, "StatsHeaderRow");

            ItemDefinition rocketDef = ItemManager.FindItemDefinition("ammo.rocket.basic");
            if (rocketDef != null)
            {
                elements.Add(new CuiElement
                {
                    Parent = "StatsHeaderRow",
                    Components =
                    {
                        new CuiImageComponent { ItemId = rocketDef.itemid, Color = "1 1 1 1" },
                        new CuiRectTransformComponent { AnchorMin = "0.805 0.10", AnchorMax = "0.825 0.90" }
                    }
                });
            }

            ItemDefinition c4Def = ItemManager.FindItemDefinition("explosive.timed");
            if (c4Def != null)
            {
                elements.Add(new CuiElement
                {
                    Parent = "StatsHeaderRow",
                    Components =
                    {
                        new CuiImageComponent { ItemId = c4Def.itemid, Color = "1 1 1 1" },
                        new CuiRectTransformComponent { AnchorMin = "0.905 0.10", AnchorMax = "0.925 0.90" }
                    }
                });
            }

            float rowStartY = 0.845f;
            float rowHeight = 0.051f;

            if (isPlayers)
            {
                var sortedPlayers = statsData.Players
                    .Select(p => new
                    {
                        UserId = p.Key,
                        Name = p.Value.Name,
                        Kills = p.Value.Kills,
                        Deaths = p.Value.Deaths,
                        KD = p.Value.Deaths == 0 ? p.Value.Kills : (float)Math.Round((double)p.Value.Kills / p.Value.Deaths, 2),
                        Rockets = p.Value.Rockets,
                        C4 = p.Value.C4
                    })
                    .OrderByDescending(p => p.Kills)
                    .ThenByDescending(p => p.KD)
                    .ThenByDescending(p => p.Rockets + p.C4)
                    .ThenBy(p => p.Deaths)
                    .ToList();

                int rowsCount = Math.Min(sortedPlayers.Count, 14);

                for (int i = 0; i < rowsCount; i++)
                {
                    var item = sortedPlayers[i];
                    float yMax = rowStartY - (i * rowHeight);
                    float yMin = yMax - (rowHeight - 0.006f);

                    string rowBg = (i % 2 == 0) ? ColorRowDark : ColorRowAlt;
                    string rowId = $"PRow_{i}";

                    elements.Add(new CuiPanel
                    {
                        Image = { Color = rowBg },
                        RectTransform = { AnchorMin = $"0.02 {yMin}", AnchorMax = $"0.98 {yMax}" }
                    }, LayerContent, rowId);

                    string kdColor = item.KD >= 2.0f ? "#F5A623" : (item.KD >= 1.0f ? "#2ECC71" : "#E74C3C");

                    elements.Add(new CuiLabel { Text = { Text = $"<b>{i + 1}</b>", FontSize = 11, Align = TextAnchor.MiddleLeft, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.01 0", AnchorMax = "0.06 1" } }, rowId);
                    elements.Add(new CuiLabel { Text = { Text = $"<b>{item.Name}</b>", FontSize = 11, Align = TextAnchor.MiddleLeft, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.08 0", AnchorMax = "0.45 1" } }, rowId);
                    elements.Add(new CuiLabel { Text = { Text = $"<b>{item.Kills:N0}</b>", FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.48 0", AnchorMax = "0.55 1" } }, rowId);
                    elements.Add(new CuiLabel { Text = { Text = $"<b>{item.Deaths:N0}</b>", FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.58 0", AnchorMax = "0.65 1" } }, rowId);
                    elements.Add(new CuiLabel { Text = { Text = $"<color={kdColor}><b>{item.KD:0.00}</b></color>", FontSize = 11, Align = TextAnchor.MiddleCenter, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.68 0", AnchorMax = "0.75 1" } }, rowId);
                    elements.Add(new CuiLabel { Text = { Text = $"<b>{item.Rockets:N0}</b>", FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.78 0", AnchorMax = "0.85 1" } }, rowId);
                    elements.Add(new CuiLabel { Text = { Text = $"<b>{item.C4:N0}</b>", FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.88 0", AnchorMax = "0.95 1" } }, rowId);
                }

                var selfIndex = sortedPlayers.FindIndex(p => p.UserId == player.UserIDString);
                string myRank = (selfIndex >= 0) ? (selfIndex + 1).ToString() : "N/A";
                var myStat = GetOrCreateStat(player.UserIDString, player.displayName);
                float myKD = myStat.Deaths == 0 ? myStat.Kills : (float)Math.Round((double)myStat.Kills / myStat.Deaths, 2);
                string myKdColor = myKD >= 2.0f ? "#F5A623" : (myKD >= 1.0f ? "#2ECC71" : "#E74C3C");

                elements.Add(new CuiPanel
                {
                    Image = { Color = ColorSlotBg },
                    RectTransform = { AnchorMin = "0.02 0.02", AnchorMax = "0.98 0.07" }
                }, LayerContent, "SelfRow");

                elements.Add(new CuiLabel { Text = { Text = $"<b>{myRank}</b>", FontSize = 11, Align = TextAnchor.MiddleLeft, Color = ColorActiveBlue, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.01 0", AnchorMax = "0.06 1" } }, "SelfRow");
                elements.Add(new CuiLabel { Text = { Text = $"<b>{player.displayName} (YOU)</b>", FontSize = 11, Align = TextAnchor.MiddleLeft, Color = ColorActiveBlue, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.08 0", AnchorMax = "0.45 1" } }, "SelfRow");
                elements.Add(new CuiLabel { Text = { Text = $"<b>{myStat.Kills:N0}</b>", FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.48 0", AnchorMax = "0.55 1" } }, "SelfRow");
                elements.Add(new CuiLabel { Text = { Text = $"<b>{myStat.Deaths:N0}</b>", FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.58 0", AnchorMax = "0.65 1" } }, "SelfRow");
                elements.Add(new CuiLabel { Text = { Text = $"<color={myKdColor}><b>{myKD:0.00}</b></color>", FontSize = 11, Align = TextAnchor.MiddleCenter, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.68 0", AnchorMax = "0.75 1" } }, "SelfRow");
                elements.Add(new CuiLabel { Text = { Text = $"<b>{myStat.Rockets:N0}</b>", FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.78 0", AnchorMax = "0.85 1" } }, "SelfRow");
                elements.Add(new CuiLabel { Text = { Text = $"<b>{myStat.C4:N0}</b>", FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.88 0", AnchorMax = "0.95 1" } }, "SelfRow");
            }
            else
            {
                Dictionary<string, ClanStatSummary> clanMap = new Dictionary<string, ClanStatSummary>();

                foreach (var p in statsData.Players)
                {
                    string tag = GetPlayerClanTag(p.Key, p.Value.Name);
                    if (string.IsNullOrEmpty(tag)) continue;

                    if (!clanMap.ContainsKey(tag))
                        clanMap[tag] = new ClanStatSummary { Tag = tag };

                    clanMap[tag].Kills += p.Value.Kills;
                    clanMap[tag].Deaths += p.Value.Deaths;
                    clanMap[tag].Rockets += p.Value.Rockets;
                    clanMap[tag].C4 += p.Value.C4;
                }

                var sortedClans = clanMap.Values
                    .OrderByDescending(c => c.Kills)
                    .ThenByDescending(c => c.KD)
                    .ThenByDescending(c => c.Rockets + c.C4)
                    .ThenBy(c => c.Deaths)
                    .ToList();

                int rowsCount = Math.Min(sortedClans.Count, 14);

                for (int i = 0; i < rowsCount; i++)
                {
                    var item = sortedClans[i];
                    float yMax = rowStartY - (i * rowHeight);
                    float yMin = yMax - (rowHeight - 0.006f);

                    string rowBg = (i % 2 == 0) ? ColorRowDark : ColorRowAlt;
                    string rowId = $"CRow_{i}";

                    elements.Add(new CuiPanel
                    {
                        Image = { Color = rowBg },
                        RectTransform = { AnchorMin = $"0.02 {yMin}", AnchorMax = $"0.98 {yMax}" }
                    }, LayerContent, rowId);

                    string kdColor = item.KD >= 2.0f ? "#F5A623" : (item.KD >= 1.0f ? "#2ECC71" : "#E74C3C");

                    elements.Add(new CuiLabel { Text = { Text = $"<b>{i + 1}</b>", FontSize = 11, Align = TextAnchor.MiddleLeft, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.01 0", AnchorMax = "0.06 1" } }, rowId);
                    elements.Add(new CuiLabel { Text = { Text = $"<b>{item.Tag}</b>", FontSize = 11, Align = TextAnchor.MiddleLeft, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.08 0", AnchorMax = "0.45 1" } }, rowId);
                    elements.Add(new CuiLabel { Text = { Text = $"<b>{item.Kills:N0}</b>", FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.48 0", AnchorMax = "0.55 1" } }, rowId);
                    elements.Add(new CuiLabel { Text = { Text = $"<b>{item.Deaths:N0}</b>", FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.58 0", AnchorMax = "0.65 1" } }, rowId);
                    elements.Add(new CuiLabel { Text = { Text = $"<color={kdColor}><b>{item.KD:0.00}</b></color>", FontSize = 11, Align = TextAnchor.MiddleCenter, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.68 0", AnchorMax = "0.75 1" } }, rowId);
                    elements.Add(new CuiLabel { Text = { Text = $"<b>{item.Rockets:N0}</b>", FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.78 0", AnchorMax = "0.85 1" } }, rowId);
                    elements.Add(new CuiLabel { Text = { Text = $"<b>{item.C4:N0}</b>", FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.88 0", AnchorMax = "0.95 1" } }, rowId);
                }

                string myClanTag = GetPlayerClanTag(player.UserIDString, player.displayName);
                var clanIndex = sortedClans.FindIndex(c => c.Tag == myClanTag);
                string myClanRank = (clanIndex >= 0) ? (clanIndex + 1).ToString() : "N/A";

                ClanStatSummary myClanStat = (!string.IsNullOrEmpty(myClanTag) && clanMap.ContainsKey(myClanTag)) ? clanMap[myClanTag] : new ClanStatSummary { Tag = string.IsNullOrEmpty(myClanTag) ? "N/A" : myClanTag };
                string myClanKdColor = myClanStat.KD >= 2.0f ? "#F5A623" : (myClanStat.KD >= 1.0f ? "#2ECC71" : "#E74C3C");

                elements.Add(new CuiPanel
                {
                    Image = { Color = ColorSlotBg },
                    RectTransform = { AnchorMin = "0.02 0.02", AnchorMax = "0.98 0.07" }
                }, LayerContent, "SelfClanRow");

                elements.Add(new CuiLabel { Text = { Text = $"<b>{myClanRank}</b>", FontSize = 11, Align = TextAnchor.MiddleLeft, Color = ColorActiveBlue, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.01 0", AnchorMax = "0.06 1" } }, "SelfClanRow");
                elements.Add(new CuiLabel { Text = { Text = $"<b>{myClanStat.Tag} (YOUR CLAN)</b>", FontSize = 11, Align = TextAnchor.MiddleLeft, Color = ColorActiveBlue, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.08 0", AnchorMax = "0.45 1" } }, "SelfClanRow");
                elements.Add(new CuiLabel { Text = { Text = $"<b>{myClanStat.Kills:N0}</b>", FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.48 0", AnchorMax = "0.55 1" } }, "SelfClanRow");
                elements.Add(new CuiLabel { Text = { Text = $"<b>{myClanStat.Deaths:N0}</b>", FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.58 0", AnchorMax = "0.65 1" } }, "SelfClanRow");
                elements.Add(new CuiLabel { Text = { Text = $"<color={myClanKdColor}><b>{myClanStat.KD:0.00}</b></color>", FontSize = 11, Align = TextAnchor.MiddleCenter, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.68 0", AnchorMax = "0.75 1" } }, "SelfClanRow");
                elements.Add(new CuiLabel { Text = { Text = $"<b>{myClanStat.Rockets:N0}</b>", FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.78 0", AnchorMax = "0.85 1" } }, "SelfClanRow");
                elements.Add(new CuiLabel { Text = { Text = $"<b>{myClanStat.C4:N0}</b>", FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }, RectTransform = { AnchorMin = "0.88 0", AnchorMax = "0.95 1" } }, "SelfClanRow");
            }

            CuiHelper.AddUi(player, elements);
        }

        #endregion

        #region UI Rendering: Modals

        private void OpenCreatorModal(BasePlayer player)
        {
            if (!HasRank(player) || !playerDrafts.ContainsKey(player.userID)) return;
            var draft = playerDrafts[player.userID];

            CuiHelper.DestroyUi(player, LayerModal);
            var elements = new CuiElementContainer();

            elements.Add(new CuiPanel
            {
                Image = { Color = ColorBgDimmer },
                RectTransform = { AnchorMin = "0 0", AnchorMax = "1 1" },
                CursorEnabled = true
            }, LayerMain, LayerModal);

            elements.Add(new CuiPanel
            {
                Image = { Color = ColorModalBg },
                RectTransform = { AnchorMin = "0.15 0.02", AnchorMax = "0.85 0.98" }
            }, LayerModal, "ModalBox");

            elements.Add(new CuiPanel
            {
                Image = { Color = draft.ColorHex },
                RectTransform = { AnchorMin = "0 0.95", AnchorMax = "1 1" }
            }, "ModalBox", "ModalHeader");

            elements.Add(new CuiLabel
            {
                Text = { Text = $"⚡ KIT BUILDER — CATEGORY: [{draft.TabName}]", FontSize = 13, Align = TextAnchor.MiddleCenter, Color = "0.05 0.05 0.05 1.0", Font = "robotocondensed-bold.ttf" },
                RectTransform = { AnchorMin = "0 0", AnchorMax = "1 1" }
            }, "ModalHeader");

            elements.Add(new CuiLabel
            {
                Text = { Text = "CATEGORY / TAB:", FontSize = 10, Align = TextAnchor.MiddleLeft, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" },
                RectTransform = { AnchorMin = "0.05 0.90", AnchorMax = "0.48 0.94" }
            }, "ModalBox");

            float tabBtnW = 0.08f;
            for (int i = 0; i < Math.Min(kitsData.Tabs.Count, 5); i++)
            {
                string tName = kitsData.Tabs[i];
                bool isSel = tName.Equals(draft.TabName, StringComparison.OrdinalIgnoreCase);
                float xMin = 0.05f + (i * (tabBtnW + 0.008f));

                elements.Add(new CuiButton
                {
                    Button = { Color = isSel ? ColorActiveBlue : ColorNavBtn, Command = $"goatui.modal.settab {i}" },
                    RectTransform = { AnchorMin = $"{xMin} 0.86", AnchorMax = $"{xMin + tabBtnW} 0.895" },
                    Text = { Text = tName, FontSize = 9, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
                }, "ModalBox");
            }

            elements.Add(new CuiLabel
            {
                Text = { Text = "HEADER COLOR:", FontSize = 10, Align = TextAnchor.MiddleLeft, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" },
                RectTransform = { AnchorMin = "0.52 0.90", AnchorMax = "0.95 0.94" }
            }, "ModalBox");

            string[] colorNames = { "GOLD", "RED", "PURPLE", "TEAL", "GREEN", "BLUE" };
            string[] colorHexes = { "0.98 0.73 0.08 1.00", "0.92 0.18 0.18 1.00", "0.65 0.25 1.00 1.00", "0.18 0.88 0.65 1.00", "0.15 0.72 0.38 1.00", "0.00 0.52 1.00 1.00" };
            float colBtnW = 0.065f;

            for (int i = 0; i < colorNames.Length; i++)
            {
                float xMin = 0.52f + (i * (colBtnW + 0.007f));
                elements.Add(new CuiButton
                {
                    Button = { Color = colorHexes[i], Command = $"goatui.modal.setcolor {i}" },
                    RectTransform = { AnchorMin = $"{xMin} 0.86", AnchorMax = $"{xMin + colBtnW} 0.895" },
                    Text = { Text = colorNames[i], FontSize = 9, Align = TextAnchor.MiddleCenter, Color = "0.05 0.05 0.05 1.0", Font = "robotocondensed-bold.ttf" }
                }, "ModalBox");
            }

            elements.Add(new CuiLabel
            {
                Text = { Text = $"KIT DISPLAY TITLE:  [ <color=#2ECC71>{draft.Title}</color> ]", FontSize = 10, Align = TextAnchor.MiddleLeft, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" },
                RectTransform = { AnchorMin = "0.05 0.81", AnchorMax = "0.48 0.85" }
            }, "ModalBox");

            elements.Add(new CuiPanel
            {
                Image = { Color = ColorInputBg },
                RectTransform = { AnchorMin = "0.05 0.765", AnchorMax = "0.48 0.805" }
            }, "ModalBox", "InputTitlePanel");

            elements.Add(new CuiElement
            {
                Parent = "InputTitlePanel",
                Components =
                {
                    new CuiInputFieldComponent { Text = draft.Title, FontSize = 11, Align = TextAnchor.MiddleLeft, Color = ColorTextWhite, CharsLimit = 28, Command = "goatui.modal.settitle " },
                    new CuiRectTransformComponent { AnchorMin = "0.04 0", AnchorMax = "0.96 1" }
                }
            });

            elements.Add(new CuiLabel
            {
                Text = { Text = $"CURRENCY TYPE:  [ CURRENT: <color=#2ECC71>{draft.Currency}</color> ]", FontSize = 10, Align = TextAnchor.MiddleLeft, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" },
                RectTransform = { AnchorMin = "0.52 0.81", AnchorMax = "0.95 0.85" }
            }, "ModalBox");

            bool isFree = draft.Currency == "FREE";
            bool isRP = draft.Currency == "RP";
            bool isGems = draft.Currency == "GEMS";
            bool isUSD = draft.Currency == "USD";

            elements.Add(new CuiButton
            {
                Button = { Color = isFree ? ColorSuccess : ColorNavBtn, Command = "goatui.modal.setcurrency FREE" },
                RectTransform = { AnchorMin = "0.52 0.765", AnchorMax = "0.615 0.805" },
                Text = { Text = "FREE", FontSize = 9, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, "ModalBox");

            elements.Add(new CuiButton
            {
                Button = { Color = isRP ? ColorActiveBlue : ColorNavBtn, Command = "goatui.modal.setcurrency RP" },
                RectTransform = { AnchorMin = "0.625 0.765", AnchorMax = "0.72 0.805" },
                Text = { Text = "RP (Points)", FontSize = 8, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, "ModalBox");

            elements.Add(new CuiButton
            {
                Button = { Color = isGems ? "#F5A623" : ColorNavBtn, Command = "goatui.modal.setcurrency GEMS" },
                RectTransform = { AnchorMin = "0.73 0.765", AnchorMax = "0.835 0.805" },
                Text = { Text = "💎 GEMS", FontSize = 8, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, "ModalBox");

            elements.Add(new CuiButton
            {
                Button = { Color = isUSD ? ColorActionGreen : ColorNavBtn, Command = "goatui.modal.setcurrency USD" },
                RectTransform = { AnchorMin = "0.845 0.765", AnchorMax = "0.95 0.805" },
                Text = { Text = "💵 USD ($)", FontSize = 8, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, "ModalBox");

            elements.Add(new CuiLabel
            {
                Text = { Text = $"ACCESS LOCK:  [ CURRENT: <color=#2ECC71>{draft.LockType}</color> ]", FontSize = 10, Align = TextAnchor.MiddleLeft, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" },
                RectTransform = { AnchorMin = "0.05 0.715", AnchorMax = "0.48 0.755" }
            }, "ModalBox");

            // Row 1: NONE, LINKED, BOOSTER, VIP
            elements.Add(new CuiButton
            {
                Button = { Color = (draft.LockType == "NONE") ? ColorSuccess : ColorNavBtn, Command = "goatui.modal.setlock NONE" },
                RectTransform = { AnchorMin = "0.05 0.67", AnchorMax = "0.14 0.71" },
                Text = { Text = "NONE", FontSize = 9, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, "ModalBox");

            elements.Add(new CuiButton
            {
                Button = { Color = (draft.LockType == "LINKED") ? ColorActiveBlue : ColorNavBtn, Command = "goatui.modal.setlock LINKED" },
                RectTransform = { AnchorMin = "0.15 0.67", AnchorMax = "0.25 0.71" },
                Text = { Text = "LINKED", FontSize = 9, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, "ModalBox");

            elements.Add(new CuiButton
            {
                Button = { Color = (draft.LockType == "BOOSTER") ? ColorPurple : ColorNavBtn, Command = "goatui.modal.setlock BOOSTER" },
                RectTransform = { AnchorMin = "0.26 0.67", AnchorMax = "0.36 0.71" },
                Text = { Text = "BOOSTER", FontSize = 9, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, "ModalBox");

            elements.Add(new CuiButton
            {
                Button = { Color = (draft.LockType == "VIP") ? ColorWarning : ColorNavBtn, Command = "goatui.modal.setlock VIP" },
                RectTransform = { AnchorMin = "0.37 0.67", AnchorMax = "0.48 0.71" },
                Text = { Text = "⭐ VIP", FontSize = 9, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, "ModalBox");

            // Row 2: MVP, GOD, BUILDER, GUNS
            elements.Add(new CuiButton
            {
                Button = { Color = (draft.LockType == "MVP") ? ColorActiveBlue : ColorNavBtn, Command = "goatui.modal.setlock MVP" },
                RectTransform = { AnchorMin = "0.05 0.625", AnchorMax = "0.14 0.665" },
                Text = { Text = "💎 MVP", FontSize = 9, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, "ModalBox");

            elements.Add(new CuiButton
            {
                Button = { Color = (draft.LockType == "GOD") ? ColorPurple : ColorNavBtn, Command = "goatui.modal.setlock GOD" },
                RectTransform = { AnchorMin = "0.15 0.625", AnchorMax = "0.25 0.665" },
                Text = { Text = "⚡ GOD", FontSize = 9, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, "ModalBox");

            elements.Add(new CuiButton
            {
                Button = { Color = (draft.LockType == "BUILDER") ? ColorSuccess : ColorNavBtn, Command = "goatui.modal.setlock BUILDER" },
                RectTransform = { AnchorMin = "0.26 0.625", AnchorMax = "0.36 0.665" },
                Text = { Text = "🏗️ BUILD", FontSize = 9, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, "ModalBox");

            elements.Add(new CuiButton
            {
                Button = { Color = (draft.LockType == "GUNS") ? ColorCloseRed : ColorNavBtn, Command = "goatui.modal.setlock GUNS" },
                RectTransform = { AnchorMin = "0.37 0.625", AnchorMax = "0.48 0.665" },
                Text = { Text = "🔫 GUNS", FontSize = 9, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, "ModalBox");

            if (!isFree)
            {
                string currLabel = isUSD ? "💵 ENTER US PRICE ($):" : (isGems ? "💎 ENTER GEMS PRICE:" : "⚡ ENTER RP PRICE:");
                string currColor = isUSD ? "#2ECC71" : (isGems ? "#F5A623" : "#00AAFF");
                string borderCol = isUSD ? "0.15 0.72 0.38 0.8" : (isGems ? "0.96 0.65 0.10 0.8" : "0.00 0.52 1.00 0.8");
                string displayCurrent = isUSD ? (draft.PriceInput.Contains("$") ? draft.PriceInput : $"{draft.PriceInput}$") : draft.PriceInput;

                // Label
                elements.Add(new CuiLabel
                {
                    Text = { Text = $"<color={currColor}>{currLabel}</color>  <color=#2ECC71>[  {displayCurrent}  ]</color>", FontSize = 11, Align = TextAnchor.MiddleLeft, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" },
                    RectTransform = { AnchorMin = "0.52 0.718", AnchorMax = "0.95 0.755" }
                }, "ModalBox");

                // Bright border panel
                elements.Add(new CuiPanel
                {
                    Image = { Color = borderCol },
                    RectTransform = { AnchorMin = "0.52 0.668", AnchorMax = "0.95 0.712" }
                }, "ModalBox", "InputKitPriceBorder");

                // Inner input panel
                elements.Add(new CuiPanel
                {
                    Image = { Color = "0.05 0.06 0.09 1.00" },
                    RectTransform = { AnchorMin = "0.003 0.06", AnchorMax = "0.997 0.94" }
                }, "InputKitPriceBorder", "InputKitPricePanel");

                elements.Add(new CuiElement
                {
                    Parent = "InputKitPricePanel",
                    Components =
                    {
                        new CuiInputFieldComponent { Text = draft.PriceInput == "0" ? "" : draft.PriceInput, FontSize = 13, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, CharsLimit = 10, Command = "goatui.modal.setkitprice " },
                        new CuiRectTransformComponent { AnchorMin = "0.02 0", AnchorMax = "0.98 1" }
                    }
                });
            }


            string urlHint = draft.LockType == "LINKED" ? "WEBSITE LINK" : (draft.LockType == "BOOSTER" ? "DISCORD INVITE" : "DISCORD TICKET / STORE");
            string currentUrlDisplay = string.IsNullOrEmpty(draft.CustomUrl) ? "(DEFAULT URL)" : draft.CustomUrl;
            if (currentUrlDisplay.Length > 45) currentUrlDisplay = currentUrlDisplay.Substring(0, 44) + "..";

            elements.Add(new CuiLabel
            {
                Text = { Text = $"🔗 CUSTOM URL ({urlHint}):  [ <color=#00AAFF>{currentUrlDisplay}</color> ]", FontSize = 10, Align = TextAnchor.MiddleLeft, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" },
                RectTransform = { AnchorMin = "0.05 0.565", AnchorMax = "0.95 0.605" }
            }, "ModalBox");

            elements.Add(new CuiPanel
            {
                Image = { Color = ColorInputBg },
                RectTransform = { AnchorMin = "0.05 0.515", AnchorMax = "0.95 0.560" }
            }, "ModalBox", "InputUrlPanel");

            elements.Add(new CuiElement
            {
                Parent = "InputUrlPanel",
                Components =
                {
                    new CuiInputFieldComponent { Text = string.IsNullOrEmpty(draft.CustomUrl) ? "" : draft.CustomUrl, FontSize = 11, Align = TextAnchor.MiddleLeft, Color = ColorTextWhite, CharsLimit = 150, Command = "goatui.modal.setcustomurl " },
                    new CuiRectTransformComponent { AnchorMin = "0.02 0", AnchorMax = "0.98 1" }
                }
            });

            // ── TIMING ROW: Cooldown │ Wipe Lock │ Max Uses ──────────────────────────────
            elements.Add(new CuiLabel
            {
                Text = { Text = "⏱ COOLDOWN (HRS)", FontSize = 9, Align = TextAnchor.MiddleLeft, Color = "#8E9CA8", Font = "robotocondensed-bold.ttf" },
                RectTransform = { AnchorMin = "0.05 0.468", AnchorMax = "0.36 0.500" }
            }, "ModalBox");

            elements.Add(new CuiLabel
            {
                Text = { Text = "🔒 WIPE LOCK (HRS)", FontSize = 9, Align = TextAnchor.MiddleLeft, Color = "#8E9CA8", Font = "robotocondensed-bold.ttf" },
                RectTransform = { AnchorMin = "0.37 0.468", AnchorMax = "0.67 0.500" }
            }, "ModalBox");

            elements.Add(new CuiLabel
            {
                Text = { Text = "🎯 MAX USES / WIPE", FontSize = 9, Align = TextAnchor.MiddleLeft, Color = "#8E9CA8", Font = "robotocondensed-bold.ttf" },
                RectTransform = { AnchorMin = "0.68 0.468", AnchorMax = "0.95 0.500" }
            }, "ModalBox");

            // Cooldown input
            elements.Add(new CuiPanel
            {
                Image = { Color = ColorInputBg },
                RectTransform = { AnchorMin = "0.05 0.425", AnchorMax = "0.35 0.462" }
            }, "ModalBox", "InputCooldownPanel");
            elements.Add(new CuiElement
            {
                Parent = "InputCooldownPanel",
                Components =
                {
                    new CuiInputFieldComponent { Text = draft.CooldownInput == "0" ? "" : draft.CooldownInput, FontSize = 12, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, CharsLimit = 6, Command = "goatui.modal.setcooldown " },
                    new CuiRectTransformComponent { AnchorMin = "0.02 0", AnchorMax = "0.98 1" }
                }
            });

            // Wipe Lock input
            elements.Add(new CuiPanel
            {
                Image = { Color = ColorInputBg },
                RectTransform = { AnchorMin = "0.37 0.425", AnchorMax = "0.66 0.462" }
            }, "ModalBox", "InputWipeLockPanel");
            elements.Add(new CuiElement
            {
                Parent = "InputWipeLockPanel",
                Components =
                {
                    new CuiInputFieldComponent { Text = draft.WipeLockHoursInput == "0" ? "" : draft.WipeLockHoursInput, FontSize = 12, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, CharsLimit = 6, Command = "goatui.modal.setwipelock " },
                    new CuiRectTransformComponent { AnchorMin = "0.02 0", AnchorMax = "0.98 1" }
                }
            });

            // Max Uses input
            elements.Add(new CuiPanel
            {
                Image = { Color = ColorInputBg },
                RectTransform = { AnchorMin = "0.68 0.425", AnchorMax = "0.95 0.462" }
            }, "ModalBox", "InputMaxUsesPanel");
            elements.Add(new CuiElement
            {
                Parent = "InputMaxUsesPanel",
                Components =
                {
                    new CuiInputFieldComponent { Text = draft.MaxUsesInput == "0" ? "" : draft.MaxUsesInput, FontSize = 12, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, CharsLimit = 4, Command = "goatui.modal.setmaxuses " },
                    new CuiRectTransformComponent { AnchorMin = "0.02 0", AnchorMax = "0.98 1" }
                }
            });
            // ─────────────────────────────────────────────────────────────────────────────

            elements.Add(new CuiButton
            {
                Button = { Color = ColorActiveBlue, Command = "goatui.modal.grabitems" },
                RectTransform = { AnchorMin = "0.05 0.375", AnchorMax = "0.95 0.418" },
                Text = { Text = $"🎒 CLICK TO COPY ALL INVENTORY ITEMS (LOADED: {draft.Items.Count} ITEMS)", FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, "ModalBox");

            elements.Add(new CuiPanel
            {
                Image = { Color = "0.035 0.045 0.06 0.95" },
                RectTransform = { AnchorMin = "0.05 0.095", AnchorMax = "0.95 0.360" }
            }, "ModalBox", "ItemsPreviewContainer");

            elements.Add(new CuiLabel
            {
                Text = { Text = $"📦 KIT ITEMS PREVIEW  [ TOTAL: <color=#2ECC71>{draft.Items.Count}</color> ITEMS LOADED ]", FontSize = 10, Align = TextAnchor.MiddleLeft, Color = "#8E9CA8", Font = "robotocondensed-bold.ttf" },
                RectTransform = { AnchorMin = "0.015 0.89", AnchorMax = "0.985 0.98" }
            }, "ItemsPreviewContainer");

            if (draft.Items.Count == 0)
            {
                elements.Add(new CuiLabel
                {
                    Text = { Text = "⚠️ NO ITEMS CAPTURED YET\n<size=10><color=#8E9CA8>Put the weapons, armor, and resources in your character inventory,\nthen click the blue button above to copy them into this kit.</color></size>", FontSize = 12, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" },
                    RectTransform = { AnchorMin = "0.02 0.10", AnchorMax = "0.98 0.88" }
                }, "ItemsPreviewContainer");
            }
            else
            {
                int maxPreview = Math.Min(draft.Items.Count, 24);
                bool use3Rows = maxPreview > 16;

                for (int i = 0; i < maxPreview; i++)
                {
                    int row = i / 8;
                    int col = i % 8;

                    float colW = 0.114f;
                    float colGap = 0.010f;
                    float xMin = 0.012f + col * (colW + colGap);
                    float xMax = xMin + colW;

                    float yMin, yMax;
                    if (use3Rows)
                    {
                        yMax = 0.86f - row * 0.27f;
                        yMin = yMax - 0.25f;
                    }
                    else
                    {
                        yMax = 0.86f - row * 0.41f;
                        yMin = yMax - 0.38f;
                    }

                    var it = draft.Items[i];
                    string slotId = $"PreviewSlot_{i}";

                    elements.Add(new CuiPanel
                    {
                        Image = { Color = ColorSlotBg },
                        RectTransform = { AnchorMin = $"{xMin} {yMin}", AnchorMax = $"{xMax} {yMax}" }
                    }, "ItemsPreviewContainer", slotId);

                    ItemDefinition itemDef = ItemManager.FindItemDefinition(it.Shortname);
                    if (itemDef != null)
                    {
                        elements.Add(new CuiElement
                        {
                            Parent = slotId,
                            Components =
                            {
                                new CuiImageComponent { ItemId = itemDef.itemid, SkinId = it.SkinId, Color = "1 1 1 1" },
                                new CuiRectTransformComponent { AnchorMin = "0.04 0.10", AnchorMax = "0.36 0.90" }
                            }
                        });
                    }

                    string dName = !string.IsNullOrEmpty(it.DisplayName) ? it.DisplayName : (itemDef != null ? itemDef.displayName.english : it.Shortname);
                    if (dName.Length > 9) dName = dName.Substring(0, 8) + "..";
                    string amtStr = (it.Amount >= 1000) ? $"{it.Amount:N0}" : it.Amount.ToString();

                    elements.Add(new CuiLabel
                    {
                        Text = { Text = $"<size=8><color=#8E9CA8>{dName.ToUpper()}</color></size>\n<size=9><b><color=#2ECC71>x{amtStr}</color></b></size>", Align = TextAnchor.MiddleLeft, Font = "robotocondensed-bold.ttf" },
                        RectTransform = { AnchorMin = "0.38 0.05", AnchorMax = "0.98 0.95" }
                    }, slotId);
                }
            }

            elements.Add(new CuiButton
            {
                Button = { Color = ColorSuccess, Command = "goatui.modal.save" },
                RectTransform = { AnchorMin = "0.05 0.025", AnchorMax = "0.58 0.080" },
                Text = { Text = "💾 SAVE & PUBLISH KIT", FontSize = 12, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, "ModalBox");

            elements.Add(new CuiButton
            {
                Button = { Color = ColorCloseRed, Command = "goatui.modal.cancel" },
                RectTransform = { AnchorMin = "0.62 0.025", AnchorMax = "0.95 0.080" },
                Text = { Text = "✕ CANCEL", FontSize = 12, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, "ModalBox");

            CuiHelper.AddUi(player, elements);
        }

        private void OpenShopCreatorModal(BasePlayer player)
        {
            if (!HasRank(player) || !shopDrafts.ContainsKey(player.userID)) return;
            var draft = shopDrafts[player.userID];

            CuiHelper.DestroyUi(player, LayerModal);
            var elements = new CuiElementContainer();

            elements.Add(new CuiPanel
            {
                Image = { Color = ColorBgDimmer },
                RectTransform = { AnchorMin = "0 0", AnchorMax = "1 1" },
                CursorEnabled = true
            }, LayerMain, LayerModal);

            elements.Add(new CuiPanel
            {
                Image = { Color = ColorModalBg },
                RectTransform = { AnchorMin = "0.25 0.16", AnchorMax = "0.75 0.84" }
            }, LayerModal, "ShopModalBox");

            elements.Add(new CuiPanel
            {
                Image = { Color = ColorActiveBlue },
                RectTransform = { AnchorMin = "0 0.92", AnchorMax = "1 1" }
            }, "ShopModalBox", "ShopModalHeader");

            elements.Add(new CuiLabel
            {
                Text = { Text = "🛒 SHOP ITEM BUILDER (ADD TO SHOP)", FontSize = 13, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" },
                RectTransform = { AnchorMin = "0 0", AnchorMax = "1 1" }
            }, "ShopModalHeader");

            elements.Add(new CuiLabel
            {
                Text = { Text = $"1. TARGET CATEGORY:  [ <color=#2ECC71>{draft.Category}</color> ]", FontSize = 10, Align = TextAnchor.MiddleLeft, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" },
                RectTransform = { AnchorMin = "0.05 0.84", AnchorMax = "0.95 0.89" }
            }, "ShopModalBox");

            string[] catKeys = { "GEMS", "PVP", "Weapons", "Ammunition", "Component", "Construction", "Items", "Attire", "Tools", "Medical", "Food" };
            float catBW = 0.082f;
            for (int i = 0; i < catKeys.Length; i++)
            {
                string cKey = catKeys[i];
                bool isSel = cKey.Equals(draft.Category, StringComparison.OrdinalIgnoreCase);
                float xMin = 0.05f + (i * (catBW + 0.004f));

                elements.Add(new CuiButton
                {
                    Button = { Color = isSel ? ColorActiveBlue : ColorNavBtn, Command = $"goatui.shop.modal.setcat {cKey}" },
                    RectTransform = { AnchorMin = $"{xMin} 0.77", AnchorMax = $"{xMin + catBW} 0.83" },
                    Text = { Text = cKey, FontSize = 8, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
                }, "ShopModalBox");
            }

            elements.Add(new CuiLabel
            {
                Text = { Text = $"2. CURRENCY TYPE:  [ <color=#2ECC71>{draft.Currency}</color> ]", FontSize = 10, Align = TextAnchor.MiddleLeft, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" },
                RectTransform = { AnchorMin = "0.05 0.69", AnchorMax = "0.45 0.74" }
            }, "ShopModalBox");

            bool isRP = draft.Currency == "RP";
            elements.Add(new CuiButton
            {
                Button = { Color = isRP ? ColorActiveBlue : ColorNavBtn, Command = "goatui.shop.modal.setcurr RP" },
                RectTransform = { AnchorMin = "0.05 0.63", AnchorMax = "0.24 0.68" },
                Text = { Text = "RP (Points)", FontSize = 10, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, "ShopModalBox");

            elements.Add(new CuiButton
            {
                Button = { Color = !isRP ? "#F5A623" : ColorNavBtn, Command = "goatui.shop.modal.setcurr GEMS" },
                RectTransform = { AnchorMin = "0.26 0.63", AnchorMax = "0.45 0.68" },
                Text = { Text = "💎 GEMS", FontSize = 10, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, "ShopModalBox");

            elements.Add(new CuiLabel
            {
                Text = { Text = $"3. PRICE: [ <color=#2ECC71>{draft.PriceInput}</color> ]", FontSize = 10, Align = TextAnchor.MiddleLeft, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" },
                RectTransform = { AnchorMin = "0.52 0.69", AnchorMax = "0.72 0.74" }
            }, "ShopModalBox");

            elements.Add(new CuiPanel
            {
                Image = { Color = ColorInputBg },
                RectTransform = { AnchorMin = "0.52 0.63", AnchorMax = "0.72 0.68" }
            }, "ShopModalBox", "PriceInputBox");

            elements.Add(new CuiElement
            {
                Parent = "PriceInputBox",
                Components =
                {
                    new CuiInputFieldComponent { Text = draft.PriceInput, FontSize = 11, Align = TextAnchor.MiddleLeft, Color = ColorTextWhite, Command = "goatui.shop.modal.setprice " },
                    new CuiRectTransformComponent { AnchorMin = "0.05 0", AnchorMax = "0.95 1" }
                }
            });

            elements.Add(new CuiLabel
            {
                Text = { Text = $"4. AMOUNT: [ <color=#2ECC71>{draft.AmountInput}</color> ]", FontSize = 10, Align = TextAnchor.MiddleLeft, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" },
                RectTransform = { AnchorMin = "0.75 0.69", AnchorMax = "0.95 0.74" }
            }, "ShopModalBox");

            elements.Add(new CuiPanel
            {
                Image = { Color = ColorInputBg },
                RectTransform = { AnchorMin = "0.75 0.63", AnchorMax = "0.95 0.68" }
            }, "ShopModalBox", "AmountInputBox");

            elements.Add(new CuiElement
            {
                Parent = "AmountInputBox",
                Components =
                {
                    new CuiInputFieldComponent { Text = draft.AmountInput, FontSize = 11, Align = TextAnchor.MiddleLeft, Color = ColorTextWhite, Command = "goatui.shop.modal.setamount " },
                    new CuiRectTransformComponent { AnchorMin = "0.05 0", AnchorMax = "0.95 1" }
                }
            });

            elements.Add(new CuiButton
            {
                Button = { Color = ColorActiveBlue, Command = "goatui.shop.modal.grabitem" },
                RectTransform = { AnchorMin = "0.05 0.52", AnchorMax = "0.95 0.59" },
                Text = { Text = $"🎒 CLICK TO COPY HELD / SELECTED ITEM (CURRENT: {draft.Shortname.ToUpper()})", FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, "ShopModalBox");

            elements.Add(new CuiButton
            {
                Button = { Color = ColorSuccess, Command = "goatui.shop.modal.save" },
                RectTransform = { AnchorMin = "0.05 0.04", AnchorMax = "0.58 0.12" },
                Text = { Text = "💾 SAVE TO SHOP", FontSize = 12, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, "ShopModalBox");

            elements.Add(new CuiButton
            {
                Button = { Color = ColorCloseRed, Command = "goatui.shop.modal.cancel" },
                RectTransform = { AnchorMin = "0.62 0.04", AnchorMax = "0.95 0.12" },
                Text = { Text = "✕ CANCEL", FontSize = 12, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, "ShopModalBox");

            CuiHelper.AddUi(player, elements);
        }

        private void OpenTabManagerModal(BasePlayer player)
        {
            if (!HasRank(player)) return;

            CuiHelper.DestroyUi(player, LayerModal);
            var elements = new CuiElementContainer();

            elements.Add(new CuiPanel
            {
                Image = { Color = ColorBgDimmer },
                RectTransform = { AnchorMin = "0 0", AnchorMax = "1 1" },
                CursorEnabled = true
            }, LayerMain, LayerModal);

            elements.Add(new CuiPanel
            {
                Image = { Color = ColorModalBg },
                RectTransform = { AnchorMin = "0.28 0.20", AnchorMax = "0.72 0.80" }
            }, LayerModal, "TabBox");

            elements.Add(new CuiPanel
            {
                Image = { Color = ColorWarning },
                RectTransform = { AnchorMin = "0 0.88", AnchorMax = "1 1" }
            }, "TabBox", "TabHeader");

            elements.Add(new CuiLabel
            {
                Text = { Text = "📁 CATEGORY / TAB MANAGER", FontSize = 13, Align = TextAnchor.MiddleCenter, Color = "0.05 0.05 0.05 1.0", Font = "robotocondensed-bold.ttf" },
                RectTransform = { AnchorMin = "0 0", AnchorMax = "1 1" }
            }, "TabHeader");

            elements.Add(new CuiLabel
            {
                Text = { Text = "NEW CATEGORY NAME:", FontSize = 11, Align = TextAnchor.MiddleLeft, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" },
                RectTransform = { AnchorMin = "0.08 0.76", AnchorMax = "0.92 0.82" }
            }, "TabBox");

            elements.Add(new CuiPanel
            {
                Image = { Color = ColorSlotBg },
                RectTransform = { AnchorMin = "0.08 0.68", AnchorMax = "0.68 0.75" }
            }, "TabBox", "InputPanel");

            elements.Add(new CuiElement
            {
                Parent = "InputPanel",
                Components =
                {
                    new CuiInputFieldComponent { Text = newTabInput.ContainsKey(player.userID) ? newTabInput[player.userID] : "NEW TAB", FontSize = 12, Align = TextAnchor.MiddleLeft, Color = ColorTextWhite, Command = "goatui.settabinput " },
                    new CuiRectTransformComponent { AnchorMin = "0.05 0", AnchorMax = "0.95 1" }
                }
            });

            elements.Add(new CuiButton
            {
                Button = { Color = ColorSuccess, Command = "goatui.submittab" },
                RectTransform = { AnchorMin = "0.71 0.68", AnchorMax = "0.92 0.75" },
                Text = { Text = "+ CREATE", FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, "TabBox");

            elements.Add(new CuiLabel
            {
                Text = { Text = "EXISTING CATEGORIES:", FontSize = 11, Align = TextAnchor.MiddleLeft, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" },
                RectTransform = { AnchorMin = "0.08 0.58", AnchorMax = "0.92 0.64" }
            }, "TabBox");

            for (int i = 0; i < kitsData.Tabs.Count; i++)
            {
                string t = kitsData.Tabs[i];
                float yMax = 0.55f - (i * 0.08f);
                float yMin = yMax - 0.065f;
                if (yMin < 0.15f) break;

                elements.Add(new CuiPanel
                {
                    Image = { Color = ColorSlotBg },
                    RectTransform = { AnchorMin = $"0.06 {yMin}", AnchorMax = $"0.94 {yMax}" }
                }, "TabBox", $"TRow_{i}");

                elements.Add(new CuiLabel
                {
                    Text = { Text = $"●  {t}", FontSize = 11, Align = TextAnchor.MiddleLeft, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" },
                    RectTransform = { AnchorMin = "0.04 0", AnchorMax = "0.75 1" }
                }, $"TRow_{i}");

                if (!t.Equals("ALL KITS", StringComparison.OrdinalIgnoreCase))
                {
                    elements.Add(new CuiButton
                    {
                        Button = { Color = ColorCloseRed, Command = $"goatui.deltab {i}" },
                        RectTransform = { AnchorMin = "0.80 0.15", AnchorMax = "0.96 0.85" },
                        Text = { Text = "DELETE", FontSize = 10, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
                    }, $"TRow_{i}");
                }
            }

            elements.Add(new CuiButton
            {
                Button = { Color = ColorNavBtn, Command = "goatui.modal.cancel" },
                RectTransform = { AnchorMin = "0.08 0.04", AnchorMax = "0.92 0.12" },
                Text = { Text = "CLOSE CATEGORY MANAGER", FontSize = 11, Align = TextAnchor.MiddleCenter, Color = ColorTextWhite, Font = "robotocondensed-bold.ttf" }
            }, "TabBox");

            CuiHelper.AddUi(player, elements);
        }

        #endregion

        #region Console Commands & Actions

        [ConsoleCommand("goatui.setlinked")]
        private void CmdSetLinked(ConsoleSystem.Arg arg)
        {
            if (arg.Player() != null && !HasRank(arg.Player())) return;
            string targetId = arg.GetString(0, "");
            bool status = arg.GetBool(1, true);
            if (string.IsNullOrEmpty(targetId)) return;

            var acc = GetOrCreateAccount(targetId, null);
            acc.IsLinked = status;
            SavePlayerData();

            var targetPlayer = BasePlayer.Find(targetId);
            if (targetPlayer != null && targetPlayer.IsConnected)
            {
                SendReply(targetPlayer, $"<color=#2ECC71>[ACCOUNT LINK]</color> Your account has been verified successfully! Linked kits are now unlocked.");
                Effect.server.Run("assets/prefabs/locks/keypad/effects/lock.code.updated.prefab", targetPlayer.transform.position);
                OpenMainUI(targetPlayer);
            }
        }

        [ConsoleCommand("goatui.setbooster")]
        private void CmdSetBooster(ConsoleSystem.Arg arg)
        {
            if (arg.Player() != null && !HasRank(arg.Player())) return;
            string targetId = arg.GetString(0, "");
            bool status = arg.GetBool(1, true);
            if (string.IsNullOrEmpty(targetId)) return;

            var acc = GetOrCreateAccount(targetId, null);
            acc.IsBooster = status;
            SavePlayerData();

            var targetPlayer = BasePlayer.Find(targetId);
            if (targetPlayer != null && targetPlayer.IsConnected)
            {
                SendReply(targetPlayer, $"<color=#F5A623>[DISCORD BOOSTER]</color> Thank you for boosting our Discord! Booster kits are now unlocked.");
                Effect.server.Run("assets/prefabs/locks/keypad/effects/lock.code.updated.prefab", targetPlayer.transform.position);
                OpenMainUI(targetPlayer);
            }
        }

        [ConsoleCommand("goatui.setrole")]
        private void CmdSetRole(ConsoleSystem.Arg arg)
        {
            if (arg.Player() != null && !HasRank(arg.Player())) return;
            string targetId = arg.GetString(0, "");
            string tier = arg.GetString(1, "vip").ToLowerInvariant().Trim();
            bool status = arg.GetBool(2, true);
            if (string.IsNullOrEmpty(targetId)) return;

            var acc = GetOrCreateAccount(targetId, null);
            if (tier == "vip") acc.IsVip = status;
            else if (tier == "mvp") acc.IsMvp = status;
            else if (tier == "god") acc.IsGod = status;
            else if (tier == "builder") acc.IsBuilder = status;
            else if (tier == "guns") acc.IsGuns = status;
            SavePlayerData();

            string perm = $"goatkitsui.{tier}";
            if (status)
            {
                permission.GrantUserPermission(targetId, perm, this);
                permission.AddUserGroup(targetId, tier);
            }
            else
            {
                permission.RevokeUserPermission(targetId, perm);
                permission.RemoveUserGroup(targetId, tier);
            }

            var targetPlayer = BasePlayer.Find(targetId);
            if (targetPlayer != null && targetPlayer.IsConnected)
            {
                if (status)
                {
                    SendReply(targetPlayer, $"<color=#2ECC71>[RANK UNLOCKED]</color> Your <color=#F5A623>{tier.ToUpperInvariant()}</color> rank perks & /kit are now active!");
                    Effect.server.Run("assets/prefabs/locks/keypad/effects/lock.code.updated.prefab", targetPlayer.transform.position);
                }
                else
                {
                    SendReply(targetPlayer, $"<color=#E74C3C>[RANK EXPIRED]</color> Your <color=#888888>{tier.ToUpperInvariant()}</color> rank perks have ended.");
                    Effect.server.Run("assets/prefabs/locks/keypad/effects/lock.code.denied.prefab", targetPlayer.transform.position);
                }
                OpenMainUI(targetPlayer);
            }
        }

        [ConsoleCommand("goatui.synckits")]
        private void CmdSyncKits(ConsoleSystem.Arg arg)
        {
            if (arg.Player() != null && !HasRank(arg.Player())) return;
            SyncKitsToWeb();
            if (arg.Player() != null)
                SendReply(arg.Player(), $"<color=#2ECC71>[GoatKitsUI]</color> Dispatched {kitsData?.Kits?.Count ?? 0} kits to website store!");
        }

        [ConsoleCommand("goatui.nav.kits")]
        private void CmdNavKits(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p != null) OpenMainUI(p);
        }

        [ConsoleCommand("goatui.nav.shop")]
        private void CmdNavShop(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p != null) OpenShopUI(p);
        }

        [ConsoleCommand("goatui.nav.stats")]
        private void CmdNavStats(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p != null) OpenStatisticsUI(p);
        }

        [ConsoleCommand("goatui.shop.tab")]
        private void CmdShopTab(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null) return;
            string category = arg.GetString(0, "PVP");
            activeShopCategory[p.userID] = category;
            OpenShopUI(p);
        }

        [ConsoleCommand("goatui.shop.buy")]
        private void CmdShopBuy(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null) return;

            string category = arg.GetString(0, "");
            int index = arg.GetInt(1, -1);

            if (string.IsNullOrEmpty(category) || !shopData.Categories.ContainsKey(category)) return;
            if (index < 0 || index >= shopData.Categories[category].Count) return;

            var item = shopData.Categories[category][index];
            var acc = GetOrCreateAccount(p.UserIDString, p.displayName);

            bool isGems = item.Currency.Equals("GEMS", StringComparison.OrdinalIgnoreCase);

            if (isGems)
            {
                if (acc.Gems < item.Price)
                {
                    SendReply(p, $"<color=#E74C3C>[SHOP]</color> You don't have enough GEMS! (Required: {item.Price} GEMS, Balance: {acc.Gems})");
                    return;
                }
                acc.Gems -= item.Price;
            }
            else
            {
                if (acc.RP < item.Price)
                {
                    SendReply(p, $"<color=#E74C3C>[SHOP]</color> You don't have enough RP! (Required: {item.Price} RP, Balance: {acc.RP})");
                    return;
                }
                acc.RP -= item.Price;
            }

            SavePlayerData();

            ItemDefinition def = ItemManager.FindItemDefinition(item.Shortname);
            if (def != null)
            {
                Item gameItem = ItemManager.Create(def, item.Amount, item.SkinId);
                if (gameItem != null)
                {
                    p.GiveItem(gameItem);
                    SendReply(p, $"<color=#2ECC71>[SHOP]</color> Successfully purchased <color=#0084FF>{def.displayName.english.ToUpper()} (x{item.Amount})</color>!");
                }
            }

            OpenShopUI(p);
        }

        [ConsoleCommand("goatui.shop.delitem")]
        private void CmdShopDelItem(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p)) return;

            string category = arg.GetString(0, "");
            int index = arg.GetInt(1, -1);

            if (string.IsNullOrEmpty(category) || !shopData.Categories.ContainsKey(category)) return;
            if (index >= 0 && index < shopData.Categories[category].Count)
            {
                var removed = shopData.Categories[category][index];
                shopData.Categories[category].RemoveAt(index);
                SaveShopData();
                SendReply(p, $"<color=#E74C3C>✓ Deleted item ({removed.Shortname} x{removed.Amount}) from category [{category}]!</color>");
            }
            OpenShopUI(p);
        }

        [ConsoleCommand("goatui.shop.openaddmodal")]
        private void CmdShopOpenAddModal(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p)) return;

            string currentCat = activeShopCategory.ContainsKey(p.userID) ? activeShopCategory[p.userID] : "PVP";
            var held = p.GetActiveItem();
            string sName = (held != null && held.info != null) ? held.info.shortname : "rifle.ak";
            ulong sSkin = (held != null) ? held.skin : 0;
            int sAmt = (held != null) ? held.amount : 1;

            shopDrafts[p.userID] = new DraftShopItem
            {
                Category = currentCat,
                Shortname = sName,
                SkinId = sSkin,
                Amount = sAmt,
                AmountInput = sAmt.ToString(),
                Price = 50,
                PriceInput = "50",
                Currency = currentCat == "GEMS" ? "GEMS" : "RP"
            };

            OpenShopCreatorModal(p);
        }

        [ConsoleCommand("goatui.shop.modal.setcat")]
        private void CmdShopModalSetCat(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p)) return;
            string cat = arg.GetString(0, "PVP");
            shopDrafts[p.userID].Category = cat;
            if (cat == "GEMS") shopDrafts[p.userID].Currency = "GEMS";
            OpenShopCreatorModal(p);
        }

        [ConsoleCommand("goatui.shop.modal.setcurr")]
        private void CmdShopModalSetCurr(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p)) return;
            string curr = arg.GetString(0, "RP").ToUpper();
            shopDrafts[p.userID].Currency = curr;
            OpenShopCreatorModal(p);
        }

        [ConsoleCommand("goatui.shop.modal.setprice")]
        private void CmdShopModalSetPrice(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p)) return;
            string text = arg.FullString.ToString().Trim();
            if (!string.IsNullOrEmpty(text))
            {
                shopDrafts[p.userID].PriceInput = text;
                shopDrafts[p.userID].Price = ParseIntSafe(text, 10);
            }
            OpenShopCreatorModal(p);
        }

        [ConsoleCommand("goatui.shop.modal.setamount")]
        private void CmdShopModalSetAmount(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p)) return;
            string text = arg.FullString.ToString().Trim();
            if (!string.IsNullOrEmpty(text))
            {
                shopDrafts[p.userID].AmountInput = text;
                shopDrafts[p.userID].Amount = ParseIntSafe(text, 1);
            }
            OpenShopCreatorModal(p);
        }

        [ConsoleCommand("goatui.shop.modal.grabitem")]
        private void CmdShopModalGrabItem(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p)) return;

            var held = p.GetActiveItem() ?? p.inventory.containerBelt?.itemList?.FirstOrDefault() ?? p.inventory.containerMain?.itemList?.FirstOrDefault();
            if (held != null && held.info != null)
            {
                shopDrafts[p.userID].Shortname = held.info.shortname;
                shopDrafts[p.userID].SkinId = held.skin;
                shopDrafts[p.userID].Amount = held.amount;
                shopDrafts[p.userID].AmountInput = held.amount.ToString();
                SendReply(p, $"<color=#2ECC71>✓ Cloned ({held.info.displayName.english}) (x{held.amount}) from your hands!</color>");
            }
            OpenShopCreatorModal(p);
        }

        [ConsoleCommand("goatui.shop.modal.save")]
        private void CmdShopModalSave(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p)) return;

            var draft = shopDrafts[p.userID];
            if (!shopData.Categories.ContainsKey(draft.Category))
                shopData.Categories[draft.Category] = new List<ShopItemModel>();

            int finalPrice = ParseIntSafe(draft.PriceInput, 10);
            int finalAmount = ParseIntSafe(draft.AmountInput, 1);

            shopData.Categories[draft.Category].Add(new ShopItemModel
            {
                Shortname = draft.Shortname,
                SkinId = draft.SkinId,
                Amount = finalAmount,
                Price = finalPrice,
                Currency = draft.Currency
            });

            SaveShopData();
            activeShopCategory[p.userID] = draft.Category;
            shopDrafts.Remove(p.userID);

            CuiHelper.DestroyUi(p, LayerModal);
            SendReply(p, $"<color=#2ECC71>✓ Added {draft.Shortname} (x{finalAmount}) for {finalPrice} {draft.Currency} to [{draft.Category}]!</color>");
            OpenShopUI(p);
        }

        [ConsoleCommand("goatui.shop.modal.cancel")]
        private void CmdShopModalCancel(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p != null)
            {
                shopDrafts.Remove(p.userID);
                CuiHelper.DestroyUi(p, LayerModal);
                OpenShopUI(p);
            }
        }

        [ConsoleCommand("goatui.modal.setcurrency")]
        private void CmdModalSetCurrency(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p) || !playerDrafts.ContainsKey(p.userID)) return;
            string curr = arg.GetString(0, "FREE").ToUpper();
            playerDrafts[p.userID].Currency = curr;
            if (curr == "FREE")
            {
                playerDrafts[p.userID].Price = 0;
                playerDrafts[p.userID].PriceInput = "0";
                playerDrafts[p.userID].PriceText = "FREE";
            }
            else if (curr == "USD")
            {
                if (string.IsNullOrEmpty(playerDrafts[p.userID].PriceInput) || playerDrafts[p.userID].PriceInput == "0")
                {
                    playerDrafts[p.userID].PriceInput = "5.00";
                    playerDrafts[p.userID].PriceText = "5.00$";
                    playerDrafts[p.userID].Price = 500;
                }
            }
            OpenCreatorModal(p);
        }

        [ConsoleCommand("goatui.modal.setlock")]
        private void CmdModalSetLock(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p)) return;
            string lockType = arg.GetString(0, "NONE").ToUpper();
            playerDrafts[p.userID].LockType = lockType;

            if (lockType == "VIP" || lockType == "MVP" || lockType == "GOD" || lockType == "BUILDER" || lockType == "GUNS")
            {
                if (playerDrafts[p.userID].Currency == "FREE")
                {
                    playerDrafts[p.userID].Currency = "USD";
                    if (string.IsNullOrEmpty(playerDrafts[p.userID].PriceInput) || playerDrafts[p.userID].PriceInput == "0")
                    {
                        if (lockType == "VIP") playerDrafts[p.userID].PriceInput = "5.00";
                        else if (lockType == "MVP") playerDrafts[p.userID].PriceInput = "10.00";
                        else if (lockType == "GOD") playerDrafts[p.userID].PriceInput = "20.00";
                        else if (lockType == "BUILDER") playerDrafts[p.userID].PriceInput = "7.50";
                        else if (lockType == "GUNS") playerDrafts[p.userID].PriceInput = "12.00";
                        playerDrafts[p.userID].PriceText = $"{playerDrafts[p.userID].PriceInput}$";
                    }
                }
            }

            if (lockType == "LINKED")
                playerDrafts[p.userID].CustomUrl = config.WebsiteLinkUrl;
            else if (lockType == "BOOSTER")
                playerDrafts[p.userID].CustomUrl = config.DiscordInviteUrl;
            else if (string.IsNullOrEmpty(playerDrafts[p.userID].CustomUrl))
                playerDrafts[p.userID].CustomUrl = config.DiscordInviteUrl;

            OpenCreatorModal(p);
        }

        [ConsoleCommand("goatui.modal.setcustomurl")]
        private void CmdModalSetCustomUrl(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p) || !playerDrafts.ContainsKey(p.userID)) return;
            string text = arg.FullString.ToString().Trim();
            playerDrafts[p.userID].CustomUrl = text;
            OpenCreatorModal(p);
        }

        [ConsoleCommand("goatui.modal.setcooldown")]
        private void CmdModalSetCooldown(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p) || !playerDrafts.ContainsKey(p.userID)) return;
            string text = arg.FullString.ToString().Trim();
            if (!string.IsNullOrEmpty(text))
                playerDrafts[p.userID].CooldownInput = text;
            OpenCreatorModal(p);
        }

        [ConsoleCommand("goatui.modal.setwipelock")]
        private void CmdModalSetWipeLock(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p) || !playerDrafts.ContainsKey(p.userID)) return;
            string text = arg.FullString.ToString().Trim();
            if (!string.IsNullOrEmpty(text))
                playerDrafts[p.userID].WipeLockHoursInput = text;
            OpenCreatorModal(p);
        }

        [ConsoleCommand("goatui.modal.setmaxuses")]
        private void CmdModalSetMaxUses(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p) || !playerDrafts.ContainsKey(p.userID)) return;
            string text = arg.FullString.ToString().Trim();
            if (!string.IsNullOrEmpty(text))
                playerDrafts[p.userID].MaxUsesInput = text;
            OpenCreatorModal(p);
        }

        [ConsoleCommand("goatui.modal.setkitprice")]
        private void CmdModalSetKitPrice(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p)) return;
            string text = arg.FullString.ToString().Trim();
            if (!string.IsNullOrEmpty(text))
            {
                playerDrafts[p.userID].PriceInput = text;
                if (playerDrafts[p.userID].Currency == "USD")
                {
                    string clean = text.Replace("$", "").Trim();
                    playerDrafts[p.userID].PriceText = $"{clean}$";
                    playerDrafts[p.userID].Price = (int)(ParseFloatSafe(clean, 0f) * 100);
                }
                else
                {
                    playerDrafts[p.userID].Price = ParseIntSafe(text, 0);
                }
            }
            OpenCreatorModal(p);
        }

        [ConsoleCommand("goatui.openeditmodal")]
        private void CmdOpenEditModal(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p)) return;
            string kitId = arg.GetString(0, "");
            var kit = kitsData.Kits.FirstOrDefault(k => k.Id == kitId);
            if (kit == null) return;

            string pInput = kit.Currency == "USD" ? kit.PriceText.Replace("$", "").Trim() : kit.Price.ToString();
            playerDrafts[p.userID] = new DraftKit
            {
                TabName = kit.TabName,
                KitId = kit.Id,
                Title = kit.Title,
                ColorHex = kit.ColorHex,
                Currency = kit.Currency,
                Price = kit.Price,
                PriceInput = string.IsNullOrEmpty(pInput) ? "0" : pInput,
                PriceText = kit.PriceText,
                LockType = kit.LockType,
                CustomUrl = kit.CustomUrl,
                CooldownInput = kit.CooldownHours.ToString(CultureInfo.InvariantCulture),
                WipeLockHoursInput = kit.WipeLockHours.ToString(CultureInfo.InvariantCulture),
                MaxUsesInput = kit.MaxUsesPerWipe.ToString(),
                Items = new List<ItemData>(kit.Items)
            };
            OpenCreatorModal(p);
        }

        [ConsoleCommand("goatui.stats.tab")]
        private void CmdStatsTab(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null) return;
            string tab = arg.GetString(0, "PLAYERS").ToUpper();
            activeStatsTabs[p.userID] = tab;
            OpenStatisticsUI(p);
        }

        [ConsoleCommand("goatui.openaddmodal")]
        private void CmdOpenAddModal(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p)) return;

            string currentTab = activePlayerTabs.ContainsKey(p.userID) ? activePlayerTabs[p.userID] : (kitsData.Tabs.Count > 0 ? kitsData.Tabs[0] : "ALL KITS");
            if (currentTab.Equals("ALL KITS", StringComparison.OrdinalIgnoreCase) || currentTab.Equals("OWNED", StringComparison.OrdinalIgnoreCase))
                currentTab = kitsData.Tabs.FirstOrDefault(t => !t.Equals("ALL KITS", StringComparison.OrdinalIgnoreCase) && !t.Equals("OWNED", StringComparison.OrdinalIgnoreCase)) ?? "RESOURCES";

            string uniqueKitId = "kit_" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();

            playerDrafts[p.userID] = new DraftKit
            {
                TabName = currentTab,
                KitId = uniqueKitId,
                Title = $"{currentTab} KIT {kitsData.Kits.Count + 1}",
                Currency = "FREE",
                Price = 0,
                PriceInput = "0",
                PriceText = "FREE",
                LockType = "NONE",
                CustomUrl = config.WebsiteLinkUrl,
                CooldownInput = "0",
                WipeLockHoursInput = "0",
                MaxUsesInput = "0"
            };
            OpenCreatorModal(p);
        }

        [ConsoleCommand("goatui.modal.settitle")]
        private void CmdModalSetTitle(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p)) return;
            string text = arg.FullString.ToString().Trim();
            if (!string.IsNullOrEmpty(text))
            {
                playerDrafts[p.userID].Title = text.ToUpper();
                OpenCreatorModal(p);
            }
        }

        [ConsoleCommand("goatui.opentabmodal")]
        private void CmdOpenTabModal(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p)) return;
            OpenTabManagerModal(p);
        }

        [ConsoleCommand("goatui.settabinput")]
        private void CmdSetTabInput(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p)) return;
            string text = arg.FullString.ToString().Trim().ToUpper();
            if (!string.IsNullOrEmpty(text)) newTabInput[p.userID] = text;
        }

        [ConsoleCommand("goatui.submittab")]
        private void CmdSubmitTab(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p)) return;
            string tab = newTabInput.ContainsKey(p.userID) ? newTabInput[p.userID] : "NEW CATEGORY";
            tab = tab.Trim().ToUpper();

            if (!string.IsNullOrEmpty(tab) && !kitsData.Tabs.Any(t => t.Equals(tab, StringComparison.OrdinalIgnoreCase)))
            {
                kitsData.Tabs.Add(tab);
                SaveKitsData();
                SendReply(p, $"<color=#2ECC71>✓ Successfully created category:</color> {tab}");
            }
            OpenTabManagerModal(p);
        }

        [ConsoleCommand("goatui.deltab")]
        private void CmdDelTab(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p)) return;
            int idx = arg.GetInt(0, -1);
            if (idx >= 0 && idx < kitsData.Tabs.Count)
            {
                string removed = kitsData.Tabs[idx];
                if (!removed.Equals("ALL KITS", StringComparison.OrdinalIgnoreCase))
                {
                    kitsData.Tabs.RemoveAt(idx);
                    SaveKitsData();
                    SendReply(p, $"<color=#E74C3C>✓ Deleted category:</color> {removed}");
                }
            }
            OpenTabManagerModal(p);
        }

        [ConsoleCommand("goatui.modal.settab")]
        private void CmdModalSetTab(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p)) return;
            int idx = arg.GetInt(0, 0);
            if (idx >= 0 && idx < kitsData.Tabs.Count)
            {
                playerDrafts[p.userID].TabName = kitsData.Tabs[idx];
                playerDrafts[p.userID].Title = $"{kitsData.Tabs[idx]} KIT {kitsData.Kits.Count + 1}";
            }
            OpenCreatorModal(p);
        }

        [ConsoleCommand("goatui.modal.setcolor")]
        private void CmdModalSetColor(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p)) return;
            int idx = arg.GetInt(0, 0);
            string[] colorHexes = { "0.98 0.73 0.08 1.00", "0.92 0.18 0.18 1.00", "0.65 0.25 1.00 1.00", "0.18 0.88 0.65 1.00", "0.15 0.72 0.38 1.00", "0.00 0.52 1.00 1.00" };
            if (idx >= 0 && idx < colorHexes.Length)
                playerDrafts[p.userID].ColorHex = colorHexes[idx];
            OpenCreatorModal(p);
        }

        [ConsoleCommand("goatui.modal.grabitems")]
        private void CmdModalGrab(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p)) return;

            var draft = playerDrafts[p.userID];
            draft.Items.Clear();
            draft.Items = CaptureFullPlayerInventory(p);

            SendReply(p, $"<color=#2ECC71>✓ Cloned ({draft.Items.Count}) items from your inventory!</color>");
            OpenCreatorModal(p);
        }

        [ConsoleCommand("goatui.modal.save")]
        private void CmdModalSave(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p)) return;

            var draft = playerDrafts[p.userID];
            if (draft.Items.Count == 0)
            {
                SendReply(p, "<color=#E74C3C>⚠️ You must capture items from your inventory before saving!</color>");
                return;
            }

            float cd = ParseFloatSafe(draft.CooldownInput, 0f);
            float wipeHours = ParseFloatSafe(draft.WipeLockHoursInput, 0f);
            int maxUses = ParseIntSafe(draft.MaxUsesInput, 0);
            int finalPrice = ParseIntSafe(draft.PriceInput, 0);

            bool isFreeKit = draft.Currency == "FREE";
            string targetCustomUrl = draft.CustomUrl;
            if (string.IsNullOrEmpty(targetCustomUrl))
                targetCustomUrl = draft.LockType == "LINKED" ? config.WebsiteLinkUrl : (draft.LockType != "NONE" ? config.DiscordInviteUrl : "");

            string finalPriceText = "FREE";
            if (!isFreeKit)
            {
                if (draft.Currency == "USD")
                {
                    string clean = draft.PriceInput.Replace("$", "").Trim();
                    if (string.IsNullOrEmpty(clean) || clean == "0") clean = "5.00";
                    finalPriceText = $"{clean}$";
                    finalPrice = (int)(ParseFloatSafe(clean, 0f) * 100);
                }
                else if (draft.Currency == "GEMS")
                {
                    finalPriceText = $"💎 {finalPrice} GEMS";
                }
                else
                {
                    finalPriceText = $"{finalPrice} RP";
                }
            }

            int existingIndex = kitsData.Kits.FindIndex(k => k.Id == draft.KitId);
            var kitModel = new KitModel
            {
                Id = draft.KitId,
                TabName = draft.TabName,
                Title = draft.Title,
                ColorHex = draft.ColorHex,
                Currency = isFreeKit ? "FREE" : draft.Currency,
                Price = finalPrice,
                PriceText = finalPriceText,
                Permission = "",
                LockType = draft.LockType,
                CustomUrl = targetCustomUrl,
                CooldownHours = cd,
                WipeLockHours = wipeHours,
                MaxUsesPerWipe = maxUses,
                Items = new List<ItemData>(draft.Items)
            };

            if (existingIndex >= 0)
                kitsData.Kits[existingIndex] = kitModel;
            else
                kitsData.Kits.Add(kitModel);

            SaveKitsData();

            activePlayerTabs[p.userID] = draft.TabName;
            playerDrafts.Remove(p.userID);
            CuiHelper.DestroyUi(p, LayerModal);
            SendReply(p, $"<color=#2ECC71>✓ Kit '{draft.Title}' saved successfully!</color>");
            OpenMainUI(p);
        }

        [ConsoleCommand("goatui.modal.cancel")]
        private void CmdModalCancel(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p != null)
            {
                playerDrafts.Remove(p.userID);
                CuiHelper.DestroyUi(p, LayerModal);
                OpenMainUI(p);
            }
        }

        [ConsoleCommand("goatui.switchtab")]
        private void CmdSwitchTab(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null) return;
            int idx = arg.GetInt(0, 0);
            if (idx >= 0 && idx < kitsData.Tabs.Count)
            {
                activePlayerTabs[p.userID] = kitsData.Tabs[idx];
                playerPages[p.userID] = 0;
            }
            OpenMainUI(p);
        }

        [ConsoleCommand("goatui.prevpage")]
        private void CmdPrevPage(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null) return;
            if (!playerPages.ContainsKey(p.userID)) playerPages[p.userID] = 0;
            playerPages[p.userID]--;
            OpenMainUI(p);
        }

        [ConsoleCommand("goatui.nextpage")]
        private void CmdNextPage(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null) return;
            if (!playerPages.ContainsKey(p.userID)) playerPages[p.userID] = 0;
            playerPages[p.userID]++;
            OpenMainUI(p);
        }

        [ConsoleCommand("goatui.deletekit")]
        private void CmdDeleteKit(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p == null || !HasRank(p)) return;
            string kitId = arg.GetString(0, "");
            var k = kitsData.Kits.FirstOrDefault(x => x.Id == kitId);
            if (k != null)
            {
                kitsData.Kits.Remove(k);
                SaveKitsData();
                SendReply(p, $"<color=#E74C3C>✓ Deleted kit: {k.Title}</color>");
            }
            OpenMainUI(p);
        }

        [ConsoleCommand("goatui.close")]
        private void CmdClose(ConsoleSystem.Arg arg)
        {
            var p = arg.Player();
            if (p != null) CloseAllGoatUI(p);
        }

        [ConsoleCommand("goatui.claim")]
        private void CmdClaim(ConsoleSystem.Arg arg)
        {
            var player = arg.Player();
            if (player == null) return;

            string kitId = arg.GetString(0, "");
            var kit = kitsData.Kits.FirstOrDefault(k => k.Id == kitId);
            if (kit == null) return;

            long now = GetCurrentUnix();
            long wipeTimestamp = GetRealWipeTimestamp();
            long timeSinceWipe = Math.Max(0, now - wipeTimestamp);
            long wipeLockSeconds = (long)(kit.WipeLockHours * 3600f);
            long cooldownSeconds = (long)(kit.CooldownHours * 3600f);

            string effectiveUrl = !string.IsNullOrEmpty(kit.CustomUrl) ? kit.CustomUrl : (kit.LockType == "LINKED" ? config.WebsiteLinkUrl : config.DiscordInviteUrl);

            // 1. Account Linking Lock
            if (kit.LockType == "LINKED" && !IsPlayerLinked(player))
            {
                ShowNoticePopup(player, "🌐 LINKED ACCOUNT REQUIRED", effectiveUrl, "Link your Steam & Discord accounts to unlock:", "#00A8FF");
                SendReply(player, $"<color=#E74C3C>[{config.ServerName}]</color> You must link your account on our website to claim this kit!");
                SendReply(player, $"<color=#00A8FF>👉 Link Account URL:</color> {effectiveUrl}");
                return;
            }

            // 2. Discord Booster Lock
            if (kit.LockType == "BOOSTER" && !IsPlayerBooster(player))
            {
                ShowNoticePopup(player, "🚀 DISCORD BOOSTER REQUIRED", effectiveUrl, "Boost our Discord Server to unlock:", "#9B59B6");
                SendReply(player, $"<color=#E74C3C>[{config.ServerName}]</color> This kit is exclusive to Discord Server Boosters!");
                SendReply(player, $"<color=#F5A623>👉 Discord Invite URL:</color> {effectiveUrl}");
                return;
            }

            // 3. VIP / MVP / GOD / BUILDER / GUNS Role Locks
            string[] tierLocks = { "VIP", "MVP", "GOD", "BUILDER", "GUNS" };
            if (tierLocks.Contains(kit.LockType) && !IsPlayerTier(player, kit.LockType))
            {
                string ticketUrl = "https://discord.gg/7uRsxfknSG";
                ShowNoticePopup(player, $"💎 {kit.LockType} RANK REQUIRED", ticketUrl, "Open a ticket on Discord to purchase & unlock:", "#F5A623");
                SendReply(player, $"<color=#E74C3C>[{config.ServerName}]</color> This kit requires the <color=#F5A623>{kit.LockType}</color> rank! Price: <color=#2ECC71>{kit.PriceText}</color>");
                SendReply(player, $"<color=#00A8FF>👉 Open a ticket on Discord to purchase & unlock:</color> {ticketUrl}");
                player.SendConsoleCommand("open.url", ticketUrl);
                return;
            }

            if (!playerData.ClaimCounts.ContainsKey(player.UserIDString))
                playerData.ClaimCounts[player.UserIDString] = new Dictionary<string, int>();

            int userClaimCount = playerData.ClaimCounts[player.UserIDString].ContainsKey(kitId) ? playerData.ClaimCounts[player.UserIDString][kitId] : 0;
            if (kit.MaxUsesPerWipe > 0 && userClaimCount >= kit.MaxUsesPerWipe)
            {
                SendReply(player, $"<color=#E74C3C>[{config.ServerName}]</color> You have reached the maximum allowed uses for this kit this wipe ({userClaimCount}/{kit.MaxUsesPerWipe})!");
                return;
            }

            if (wipeLockSeconds > 0 && timeSinceWipe < wipeLockSeconds)
            {
                SendReply(player, $"<color=#E74C3C>[{config.ServerName}]</color> This kit is locked after wipe! Unlocks in: <color=#F5A623>{FormatSeconds(wipeLockSeconds - timeSinceWipe)}</color>");
                return;
            }

            if (!string.IsNullOrEmpty(kit.Permission) && !permission.UserHasPermission(player.UserIDString, kit.Permission) && !HasRank(player))
            {
                SendReply(player, $"<color=#E74C3C>[{config.ServerName}]</color> You don't have permission to claim this kit!");
                return;
            }

            if (!playerData.Cooldowns.ContainsKey(player.UserIDString))
                playerData.Cooldowns[player.UserIDString] = new Dictionary<string, long>();

            long lastClaim = playerData.Cooldowns[player.UserIDString].ContainsKey(kitId) ? playerData.Cooldowns[player.UserIDString][kitId] : 0;
            long cooldownPassed = now - lastClaim;

            if (cooldownSeconds > 0 && lastClaim > 0 && cooldownPassed < cooldownSeconds)
            {
                SendReply(player, $"<color=#E74C3C>[{config.ServerName}]</color> Please wait for cooldown: <color=#F5A623>{FormatSeconds(cooldownSeconds - cooldownPassed)}</color>");
                return;
            }

            if (kit.Currency.Equals("USD", StringComparison.OrdinalIgnoreCase) && !tierLocks.Contains(kit.LockType))
            {
                string storeUrl = !string.IsNullOrEmpty(kit.CustomUrl) ? kit.CustomUrl : "https://discord.gg/7uRsxfknSG";
                SendReply(player, $"<color=#2ECC71>[{config.ServerName}]</color> Open a ticket on Discord to purchase <color=#0084FF>{kit.Title}</color> ({kit.PriceText})...");
                SendReply(player, $"<color=#F5A623>👉 Discord Ticket URL:</color> {storeUrl}");
                player.SendConsoleCommand("open.url", storeUrl);
                return;
            }

            var acc = GetOrCreateAccount(player.UserIDString, player.displayName);
            if (kit.Currency.Equals("RP", StringComparison.OrdinalIgnoreCase) && kit.Price > 0)
            {
                if (acc.RP < kit.Price)
                {
                    SendReply(player, $"<color=#E74C3C>[{config.ServerName}]</color> You don't have enough RP! (Required: {kit.Price} RP, Balance: {acc.RP})");
                    return;
                }
                acc.RP -= kit.Price;
            }
            else if (kit.Currency.Equals("GEMS", StringComparison.OrdinalIgnoreCase) && kit.Price > 0)
            {
                if (acc.Gems < kit.Price)
                {
                    SendReply(player, $"<color=#E74C3C>[{config.ServerName}]</color> You don't have enough GEMS! (Required: {kit.Price} GEMS, Balance: {acc.Gems})");
                    return;
                }
                acc.Gems -= kit.Price;
            }

            foreach (var itemData in kit.Items)
            {
                GiveItemToPlayer(player, itemData);
            }

            playerData.Cooldowns[player.UserIDString][kitId] = now;
            playerData.ClaimCounts[player.UserIDString][kitId] = userClaimCount + 1;
            SavePlayerData();

            SendReply(player, $"<color=#2ECC71>[{config.ServerName}]</color> Successfully claimed kit: <color=#0084FF>{kit.Title}</color>!");
            OpenMainUI(player);
        }

        #endregion
    }
}