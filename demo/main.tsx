import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LevelCard,
  listCategories,
  LEVEL_CARD_PRESETS,
  type CardCategoryId,
  type LevelCardName,
} from "@amirnaeem/artifact-card";
import "../src/styles.css";
import "./demo.css";

function App() {
  const categories = listCategories();
  const [category, setCategory] = useState<CardCategoryId>(categories[0]!.id);
  const cat = categories.find((c) => c.id === category) ?? categories[0]!;
  const order = cat.order;
  const [level, setLevel] = useState<LevelCardName>(order[0]!);
  const [flipped, setFlipped] = useState(false);
  const [msg, setMsg] = useState("");
  const active = LEVEL_CARD_PRESETS[level];

  const selectCategory = (id: CardCategoryId) => {
    setCategory(id);
    const next = listCategories().find((c) => c.id === id);
    setLevel((next?.order[0] ?? order[0]!) as LevelCardName);
  };

  return (
    <div className="demo">
      <header className="demo__header">
        <p className="demo__eyebrow">Demo</p>
        <h1>Artifact Card</h1>
        <p className="demo__lede">
          Pick a category and award level, or flip the card to see the back.
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
        </div>

        <div className="demo__cats" role="tablist" aria-label="Award categories">
          {categories.map((c) => {
            const selected = c.id === category;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={selected ? "demo__cat demo__cat--on" : "demo__cat"}
                onClick={() => selectCategory(c.id)}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <div className="demo__ladder" role="listbox" aria-label="Award levels">
          {order.map((name, i) => {
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
          category={category}
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
          <p>Same painters as the glass textures.</p>
        </header>
        <div className="demo__row">
          <figure className="demo__sample">
            <div className="demo__sample-slot">
              <LevelCard category={category} level={level} side="front" size={200} />
            </div>
            <figcaption>Front</figcaption>
          </figure>
          <figure className="demo__sample">
            <div className="demo__sample-slot">
              <LevelCard
                category={category}
                level={level}
                side="back"
                size={200}
                fullName="Ada Lovelace"
                memberSince="2023"
              />
            </div>
            <figcaption>Back</figcaption>
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
