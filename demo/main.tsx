import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LevelCard,
  LEVEL_CARD_ORDER,
  type LevelCardName,
} from "@amirnaeem/artifact-card";
import "../src/styles.css";
import "./demo.css";

function App() {
  const [level, setLevel] = useState<LevelCardName>("Learner");
  const [flipped, setFlipped] = useState(false);
  const [msg, setMsg] = useState("");

  return (
    <div className="demo">
      <header className="demo__header">
        <h1>Artifact Card</h1>
        <p>
          Themeable reading-level profile card — GLTF glass shell, canvas faces,
          and level presets from Beginner to Oracle.
        </p>
      </header>

      <div
        className="demo__panel demo__control"
        role="group"
        aria-labelledby="demo-level-label"
      >
        <span id="demo-level-label" className="demo__control-label">
          Level
        </span>
        <div className="demo__levels">
          {LEVEL_CARD_ORDER.map((name) => (
            <button
              key={name}
              type="button"
              className={
                name === level ? "demo__level demo__level--active" : "demo__level"
              }
              aria-pressed={name === level}
              onClick={() => setLevel(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <section className="demo__panel demo__stage" aria-label="3D card">
        <span className="demo__stage-label">Glass shell</span>
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

      <section className="demo__panel demo__labs" aria-label="Flat faces">
        <header className="demo__labs-head">
          <h2>Flat faces</h2>
          <p>Same canvas painters as the glass textures — front, back, and mini.</p>
        </header>
        <div className="demo__row">
          <figure className="demo__sample">
            <div className="demo__sample-slot">
              <LevelCard level={level} side="front" size={200} />
            </div>
            <figcaption>Front</figcaption>
          </figure>
          <figure className="demo__sample">
            <div className="demo__sample-slot">
              <LevelCard
                level={level}
                side="back"
                size={200}
                fullName="Ada Lovelace"
                memberSince="2023"
              />
            </div>
            <figcaption>Back</figcaption>
          </figure>
          <figure className="demo__sample">
            <div className="demo__sample-slot">
              <LevelCard level={level} mini size={72} />
            </div>
            <figcaption>Mini</figcaption>
          </figure>
        </div>
      </section>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
