import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LevelCard,
  LEVEL_CARD_ORDER,
  type LevelCardName,
} from "@amirnaeem/artifact-card";
import "@amirnaeem/artifact-card/styles.css";
import "./demo.css";

function App() {
  const [level, setLevel] = useState<LevelCardName>("Learner");
  const [flipped, setFlipped] = useState(false);
  const [msg, setMsg] = useState("");

  return (
    <div className="demo">
      <header className="demo__header">
        <h1>@amirnaeem/artifact-card</h1>
        <p>GLTF glass shell · flat SVG faces · theme presets</p>
      </header>

      <label className="demo__control">
        Level
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value as LevelCardName)}
        >
          {LEVEL_CARD_ORDER.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>

      <section className="demo__stage" aria-label="3D card">
        <LevelCard
          level={level}
          fullName="Ada Lovelace"
          memberSince="2023"
          flipped={flipped}
          onFlip={setFlipped}
          onNotify={setMsg}
        />
        {msg ? <p className="demo__msg">{msg}</p> : null}
      </section>

      <section className="demo__row" aria-label="Flat faces">
        <LevelCard level={level} side="front" size={220} />
        <LevelCard
          level={level}
          side="back"
          size={220}
          fullName="Ada Lovelace"
          memberSince="2023"
        />
        <LevelCard level={level} mini size={72} />
      </section>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
