import { useRef } from "react";
import "./CatBackground.css";

export default function CatBackground() {
  const containerRef = useRef(null);

  return (
    <div className="cat-background" ref={containerRef}>
      <div className="cat-background__stars" />
      <div className="cat-background__nebula" />
    </div>
  );
}
