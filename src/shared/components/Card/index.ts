import CardWithStats from "./Card";
import CardName from "./components/CardName";

const Card = Object.assign(CardWithStats, {
    Name: CardName,
});

export default Card;
