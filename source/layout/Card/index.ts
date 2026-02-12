<<<<<<< HEAD
import { Card } from "./Card";
import { CardName } from "./CardName";
import { CardStats } from "./CardStats";

export { Card };
=======
import { Card, CardName, CardStats } from "./Card";

export { Card, CardName, CardStats };
>>>>>>> origin/main
export type {
	CardBackground,
	CardPadding,
	CardProps,
	CardShadow,
	CardVariant,
	GlassConfig,
<<<<<<< HEAD
} from "./Card";
export type { CardNameProps } from "./CardName";
export { CardName } from "./CardName";
export type { CardStatsProps } from "./CardStats";
export { CardStats } from "./CardStats";
=======
	CardNameProps,
	CardStatsProps,
} from "./Card";
>>>>>>> origin/main

const CardWithStats = Object.assign(Card, { Stats: CardStats, Name: CardName });

export default CardWithStats;
