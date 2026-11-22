import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LevelCard,
  LEVEL_CARD_ORDER,
  LEVEL_CARD_PRESETS,
  type LevelCardName,
} from "@amirnaeem/artifact-card";
import "../src/styles.css";
import "./demo.css";

function App() {
  const [level, setLevel] = useState<LevelCardName>("Learner");
  const [flicker, setFlicker] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [msg, setMsg] = useState("");
  const active = LEVEL_CARD_PRESETS[level];

  return (
    <div className="demo">
      <header className="demo__header">
        <p className="demo__eyebrow">Demo</p>
        <h1>Artifact Card</h1>
        <p className="demo__lede">
          Pick an award level, flip the card, or turn on flicker to watch the
          accent tiles move.
        </p>
      </header>

      <section className="demo__panel demo__awards" aria-labelledby="demo-awards-label">
        <div className="demo__awards-bar">
          <div>
            <p id="demo-awards-label" className="demo__label">
              Award level
            </p>
            <p className="demo__awards-current">
              <span>{level}</span>
              <span className="demo__awards-cap">{active?.caption}</span>
            </p>
          </div>
          <label className="demo__switch">
            <input
              type="checkbox"
              checked={flicker}
              onChange={(e) => setFlicker(e.target.checked)}
            />
            <span>Flicker</span>
          </label>
        </div>

        <div className="demo__ladder" role="listbox" aria-label="Award levels">
          {LEVEL_CARD_ORDER.map((name, i) => {
            const preset = LEVEL_CARD_PRESETS[name];
            const selected = name === level;
            return (
              <button
                key={name}
                type="button"
                role="option"
                aria-selected={selected}
                className={selected ? "demo__rung demo__rung--on" : "demo__rung"}
                onClick={() => setLevel(name)}
              >
                <span className="demo__rung-idx">{String(i + 1).padStart(2, "0")}</span>
                <span className="demo__rung-name">{name}</span>
                <span className="demo__rung-cap">{preset?.caption}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="demo__panel demo__stage" aria-label="3D card">
        <span className="demo__label demo__stage-label">Glass shell</span>
        <LevelCard
          level={level}
          flicker={flicker}
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
          <p>Same painters as the glass textures.</p>
        </header>
        <div className="demo__row">
          <figure className="demo__sample">
            <div className="demo__sample-slot">
              <LevelCard level={level} flicker={flicker} side="front" size={200} />
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
              <LevelCard level={level} flicker={flicker} mini size={72} />
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
