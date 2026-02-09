import { Card } from "./Card";
import { CardName } from "./CardName";
import { CardStats } from "./CardStats";

export { Card };
export type {





	GlassConfig,
} from "./Card";
;
export { CardName } from "./CardName";
;
export { CardStats } from "./CardStats";

const CardWithStats = Object.assign(Card, { Stats: CardStats, Name: CardName });

export default CardWithStats;
