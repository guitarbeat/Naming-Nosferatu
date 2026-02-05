import { Card } from "./Card";
import { CardName } from "./CardName";
import { CardStats } from "./CardStats";

export { Card };
;
;
export { CardName } from "./CardName";
;
;

const CardWithStats = Object.assign(Card, { Stats: CardStats, Name: CardName });

export default CardWithStats;
