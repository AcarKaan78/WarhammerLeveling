export interface CrossFactionEffect {
  targetFaction: string;
  multiplier: number; // e.g., -0.5 means losing 50% of the gain as a negative to this faction
}

export interface FactionTippingPoint {
  reputation: number;
  event: string;
  description: string;
}

export interface Faction {
  id: string;
  name: string;
  description: string;
  reputation: number; // -100 to 100
  standing: string; // descriptive label based on reputation
  crossEffects: CrossFactionEffect[];
  tippingPoints: FactionTippingPoint[];
  availableQuests: string[];
  benefits: Record<number, string[]>; // reputation threshold => benefits unlocked
}

export interface FactionReputation {
  characterId: number;
  factionId: string;
  reputation: number;
  standing: string;
  lastChange: Date;
}
