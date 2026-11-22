import { LevelCardBack } from "./LevelCardBack";
import { LevelCardFace } from "./LevelCardFace";
import { LevelCardGl } from "./LevelCardGl";
import { resolveCard } from "./resolve";
import type { LevelCardProps } from "./types";

/** GLTF glass by default; `side` / `mini` for flat canvas faces (lab, thumbs). */
export function LevelCard(props: LevelCardProps) {
  const resolved = resolveCard(props);
  const flat = props.mini || props.side === "front" || props.side === "back";

  if (flat) {
    const size = props.size ?? (props.mini ? 56 : 320);
    const wrapStyle = { ["--level-card-size" as string]: `${size}px` };
    const face = props.side !== "back";
    return (
      <div
        className={[
          "level-card__wrap",
          "level-card__wrap--flat",
          props.mini ? "level-card__wrap--mini" : "",
          props.className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={wrapStyle}
      >
        <div
          className={["level-card", "level-card--flat", props.mini ? "level-card--mini" : ""]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="level-card__stage">
            <div className="level-card__side level-card__side--solo">
              {face ? (
                <LevelCardFace
                  theme={resolved.theme}
                  title={resolved.title}
                  caption={resolved.caption}
                  level={props.level}
                  mini={props.mini}
                  size={size}
                />
              ) : (
                <LevelCardBack
                  theme={resolved.theme}
                  brand={resolved.brand}
                  fullName={resolved.fullName}
                  memberSince={resolved.memberSince}
                  showMark={resolved.showMark}
                  size={size}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <LevelCardGl {...props} />;
}
