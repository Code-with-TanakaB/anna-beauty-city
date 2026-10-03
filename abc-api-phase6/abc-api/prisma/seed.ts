import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
// [slug, name, category, priceCents, isService]. Satin prices, and all "from" nail-art prices, are samples for Anna to confirm.
const P: [string, string, string, number, boolean][] = [
  ["moon-dot-stiletto-french", "Moon-Dot Stiletto French", "nails", 26000, true],
  ["midnight-stiletto-set", "Midnight Stiletto Set", "nails", 24000, true],
  ["silver-swirl-stilettos", "Silver Swirl Stilettos", "nails", 32000, true],
  ["milk-white-square-set", "Milk White Square Set", "nails", 20000, true],
  ["soft-nude-almond-sculpt", "Soft Nude Almond Sculpt", "nails", 22000, true],
  ["pearl-chrome-almond", "Pearl Chrome Almond", "nails", 28000, true],
  ["powder-blue-chiffon-pair", "Powder Blue Chiffon Pair", "scrunchies", 5000, false],
  ["baby-pink-chiffon-pair", "Baby Pink Chiffon Pair", "scrunchies", 5000, false],
  ["peach-chiffon-pair", "Peach Chiffon Pair", "scrunchies", 5000, false],
  ["mint-satin-scrunchie", "Mint Satin Scrunchie", "scrunchies", 4000, false],
  ["lilac-satin-scrunchie", "Lilac Satin Scrunchie", "scrunchies", 4000, false],
  ["marigold-satin-scrunchie", "Marigold Satin Scrunchie", "scrunchies", 4000, false],
  ["hot-pink-satin-scrunchie", "Hot Pink Satin Scrunchie", "scrunchies", 4000, false],
];
async function main() {
  for (const [slug, name, category, priceCents, isService] of P)
    await db.product.upsert({ where: { slug }, update: {}, create: { slug, name, category, priceCents, isService, stock: isService ? 0 : 20 } });
}
main().finally(() => db.$disconnect());
