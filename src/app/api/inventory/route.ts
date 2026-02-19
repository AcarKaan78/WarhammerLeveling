import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createContainer } from '@/infrastructure/di/container';
import { AddItemUseCase } from '@/application/use-cases/inventory/add-item';
import { EquipItemUseCase } from '@/application/use-cases/inventory/equip-item';
import { UseConsumableUseCase } from '@/application/use-cases/inventory/use-consumable';
import { BuyItemUseCase } from '@/application/use-cases/inventory/buy-item';
import { SellItemUseCase } from '@/application/use-cases/inventory/sell-item';
import { getItemById } from '@/infrastructure/data-loader';

const AddItemSchema = z.object({
  characterId: z.number().int(),
  itemId: z.string(),
  quantity: z.number().int().min(1).default(1),
  gameDay: z.number().int().default(1),
  saveName: z.string().default('current'),
});

const EquipSchema = z.object({
  characterId: z.number().int(),
  instanceId: z.number().int(),
  slot: z.enum(['main_hand', 'off_hand', 'armor', 'head', 'accessory_1', 'accessory_2']),
  saveName: z.string().default('current'),
});

const UseSchema = z.object({
  characterId: z.number().int(),
  instanceId: z.number().int(),
  gameDay: z.number().int().default(1),
  saveName: z.string().default('current'),
});

const BuySchema = z.object({
  characterId: z.number().int(),
  itemId: z.string(),
  quantity: z.number().int().min(1).default(1),
  gameDay: z.number().int().default(1),
  saveName: z.string().default('current'),
});

const SellSchema = z.object({
  characterId: z.number().int(),
  instanceId: z.number().int(),
  quantity: z.number().int().min(1).default(1),
  gameDay: z.number().int().default(1),
  saveName: z.string().default('current'),
});

export async function GET(request: NextRequest) {
  try {
    const saveName = request.nextUrl.searchParams.get('save') ?? 'current';
    const characterId = parseInt(request.nextUrl.searchParams.get('characterId') ?? '0');
    const container = createContainer(saveName);

    const items = await container.repos.inventory.getAll(characterId);
    return NextResponse.json(items);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action as string;
    const container = createContainer(body.saveName ?? 'current');

    if (action === 'add') {
      const data = AddItemSchema.parse(body);
      const item = getItemById(data.itemId);
      if (!item) {
        return NextResponse.json({ error: 'Item not found in data' }, { status: 404 });
      }
      const useCase = new AddItemUseCase(container.repos.inventory, container.repos.event);
      const result = await useCase.execute({
        characterId: data.characterId,
        item,
        quantity: data.quantity,
        gameDay: data.gameDay,
      });
      return NextResponse.json(result);
    }

    if (action === 'equip') {
      const data = EquipSchema.parse(body);
      const useCase = new EquipItemUseCase(container.repos.inventory, container.repos.character);
      const result = await useCase.execute({
        characterId: data.characterId,
        instanceId: data.instanceId,
        slot: data.slot,
      });
      return NextResponse.json(result);
    }

    if (action === 'unequip') {
      const instanceId = z.number().int().parse(body.instanceId);
      await container.repos.inventory.unequip(instanceId);
      return NextResponse.json({ success: true });
    }

    if (action === 'use') {
      const data = UseSchema.parse(body);
      const useCase = new UseConsumableUseCase(
        container.repos.inventory,
        container.repos.character,
        container.repos.event,
      );
      const result = await useCase.execute({
        characterId: data.characterId,
        instanceId: data.instanceId,
        gameDay: data.gameDay,
      });
      return NextResponse.json(result);
    }

    if (action === 'buy') {
      const data = BuySchema.parse(body);
      const item = getItemById(data.itemId);
      if (!item) {
        return NextResponse.json({ error: 'Item not found in data' }, { status: 404 });
      }
      const useCase = new BuyItemUseCase(
        container.repos.inventory,
        container.repos.character,
        container.repos.event,
      );
      const result = await useCase.execute({
        characterId: data.characterId,
        item,
        quantity: data.quantity,
        merchantRelationship: 0,
        factionRep: 0,
        gameDay: data.gameDay,
      });
      return NextResponse.json(result);
    }

    if (action === 'sell') {
      const data = SellSchema.parse(body);
      const useCase = new SellItemUseCase(
        container.repos.inventory,
        container.repos.character,
        container.repos.event,
      );
      const result = await useCase.execute({
        characterId: data.characterId,
        instanceId: data.instanceId,
        quantity: data.quantity,
        merchantMod: 0,
        gameDay: data.gameDay,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Unknown action. Use: add, equip, unequip, use, buy, sell' }, { status: 400 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
