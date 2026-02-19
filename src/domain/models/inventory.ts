export type ItemCategory =
  | 'weapon_melee'
  | 'weapon_ranged'
  | 'weapon_psychic'
  | 'armor_light'
  | 'armor_medium'
  | 'armor_heavy'
  | 'consumable'
  | 'key_item'
  | 'ammo'
  | 'accessory'
  | 'decoration';

export type EquipmentSlot =
  | 'main_hand'
  | 'off_hand'
  | 'armor'
  | 'head'
  | 'accessory_1'
  | 'accessory_2';

export type ItemRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'very_rare'
  | 'legendary';

export interface Item {
  id: string;
  name: string;
  description: string;
  category: ItemCategory;
  weight: number;
  basePrice: number;
  rarity: ItemRarity;
  stackable: boolean;
  maxStack: number;
  requirements: Record<string, number>;
  properties: Record<string, unknown>;
}

export interface InventoryItem {
  instanceId: number;
  item: Item;
  quantity: number;
  condition: number;
  conditionMax: number;
  equipped: boolean;
  slot: EquipmentSlot | null;
  characterId: number;
}

export interface WeaponProperties {
  damage: number;
  accuracy: number;
  armorPenetration: number;
  range: 'melee' | 'close' | 'medium' | 'long';
  rateOfFire: number;
  ammoType: string | null;
  special: string[];
}

export interface ArmorProperties {
  protection: number;
  agilityPenalty: number;
  special: string[];
}

export interface ConsumableProperties {
  effectType: 'heal' | 'buff' | 'restore' | 'special';
  stat?: string;
  amount?: number;
  duration?: number;
  sideEffects: string[];
  addictionRisk: number;
}
