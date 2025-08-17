import { z } from "zod";

// South Africa's 11 official languages
const SOUTH_AFRICAN_LANGUAGES = [
  "english",
  "afrikaans",
  "zulu",
  "xhosa",
  "sotho",
  "tswana",
  "pedi",
  "venda",
  "tsonga",
  "swazi",
  "ndebele",
];

// Activation context menu: enforce menu item shapes
const MenuItemsSchema = z.object({
  menuItem1: z.string().min(3).max(50),
  menuItem2: z.string().min(3).max(50),
  menuItem3: z.string().min(3).max(50),
  // Optional, allow empty string 0-50 when provided
  menuItem4: z.string().min(0).max(50).optional(),
  menuItem5: z.string().min(0).max(50).optional(),
});

// Schema that requires all 11 South African official languages
const ActivationContextMenuSchema = z.object({
  english: MenuItemsSchema,
  afrikaans: MenuItemsSchema,
  zulu: MenuItemsSchema,
  xhosa: MenuItemsSchema,
  sotho: MenuItemsSchema,
  tswana: MenuItemsSchema,
  pedi: MenuItemsSchema,
  venda: MenuItemsSchema,
  tsonga: MenuItemsSchema,
  swazi: MenuItemsSchema,
  ndebele: MenuItemsSchema,
});

export const TenantSchema = z.object({
  // ussdRefId is server-managed; accept optional and override server-side
  ussdRefId: z.number().int().positive().optional(),
  activationResponseBlockName: z.string().min(3).max(50),
  address: z.object({
    locality: z.string().min(3).max(50),
    province: z.string().min(2).max(50),
    country: z.literal("South Africa"),
    postalCode: z.string().regex(/^\d{4,5}$/),
  }),
  activationContextMenu: ActivationContextMenuSchema,
  account: z
    .object({
      isActive: z.object({
        value: z.boolean().default(true),
        changes: z.array(z.any()).default([]),
      }),
    })
    .default({ isActive: { value: true, changes: [] } }),
});

export const TenantUpdateSchema = TenantSchema.partial();

export function newTenantId() {
  return `TNNT${Date.now()}`;
}
