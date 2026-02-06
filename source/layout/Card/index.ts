import { Card } from "./Card";
import { CardName } from "./CardName";

export { Card };
export { CardName } from "./CardName";

const CardWithStats = Object.assign(Card, { Name: CardName });

export default CardWithStats;
