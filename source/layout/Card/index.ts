import { Card } from "./Card";
import { CardName } from "./CardName";
import { CardStats } from "./CardStats";

export { Card };
export type {
	CardBackground,
	CardPadding,
	CardProps,
	CardShadow,
	CardVariant,
	GlassConfig,
} from "./Card";
export { CardName } from "./CardName";
export type { CardNameProps } from "./CardName";
export { CardStats } from "./CardStats";
export type { CardStatsProps } from "./CardStats";

const CardWithStats = Object.assign(Card, { Stats: CardStats, Name: CardName });

export default CardWithStats;
