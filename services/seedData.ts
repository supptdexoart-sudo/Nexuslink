
import { GameEvent, GameEventType } from "../types";

// Tyto karty budou dostupné VŽDY, i bez prvního připojení k internetu.
export const NEXUS_SEED_DATA: GameEvent[] = [
  {
    id: "ITEM-01",
    title: "Základní Lékárnička",
    description: "Stará plechová krabička s nápisem 'První pomoc'. Obsahuje čisté obvazy.",
    type: GameEventType.ITEM,
    rarity: "Common",
    isConsumable: true,
    stats: [{ label: "HP", value: "+20" }],
    price: 15
  },
  {
    id: "ITEM-02",
    title: "Energetický Článek",
    description: "Standardní baterie pro Nexus zařízení. Trochu jiskří.",
    type: GameEventType.ITEM,
    rarity: "Common",
    isConsumable: true,
    stats: [{ label: "MANA", value: "+25" }],
    price: 25
  },
  {
    id: "BOSS-01",
    title: "Strážce Brány",
    description: "Masivní mechanický konstrukt, který nepustí nikoho bez propustky.",
    type: GameEventType.BOSS,
    rarity: "Legendary",
    stats: [
        { label: "HP", value: "500" },
        { label: "ATK", value: "25" }
    ],
    bossPhases: [
        { name: "Obranný režim", triggerType: "HP_PERCENT", triggerValue: 50, description: "Strážce aktivuje štíty.", damageBonus: 10 }
    ]
  },
  {
    id: "DILEMA-01",
    title: "Rezavé Dveře",
    description: "Stojíš před dveřmi, které vedou do neznáma. Slyšíš z nich podivné škrábání.",
    type: GameEventType.DILEMA,
    rarity: "Common",
    dilemmaOptions: [
        { label: "Vykopnout dveře", consequenceText: "Dveře povolí, ale hluk přilákal nepřátele!", effectType: "hp", effectValue: -10 },
        { label: "Opatrně otevřít", consequenceText: "Podařilo se ti vklouznout dovnitř tiše.", effectType: "none", effectValue: 0 }
    ]
  },
  {
    id: "TRAP-01",
    title: "Elektrický Oblouk",
    description: "Ze stěny šlehají blesky. Musíš proběhnout ve správný moment!",
    type: GameEventType.TRAP,
    rarity: "Rare",
    trapConfig: {
        difficulty: 12,
        damage: 30,
        disarmClass: "Zloděj" as any,
        successMessage: "Proklouzl jsi bez škrábnutí!",
        failMessage: "Dostal jsi ránu proudem!"
    }
  }
];
