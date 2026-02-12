import { Card, CardName, CardStats } from "./Card";

export { Card, CardName, CardStats };
export type {
	CardBackground,
	CardPadding,
	CardProps,
	CardShadow,
	CardVariant,
	GlassConfig,
	CardNameProps,
	CardStatsProps,
} from "./Card";

const CardWithStats = Object.assign(Card, { Stats: CardStats, Name: CardName });

export default CardWithStats;
