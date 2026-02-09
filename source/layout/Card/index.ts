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
export type { CardNameProps } from "./CardName";
export { CardName } from "./CardName";
export type { CardStatsProps } from "./CardStats";
export { CardStats } from "./CardStats";

const CardWithStats = Object.assign(Card, { Stats: CardStats, Name: CardName });

export default CardWithStats;
