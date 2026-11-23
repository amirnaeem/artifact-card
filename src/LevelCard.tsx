import { clampCardSize } from "./lib/canvas";
import { LevelCardBack } from "./LevelCardBack";
import { LevelCardFace } from "./LevelCardFace";
import { LevelCardGl } from "./LevelCardGl";
import { resolveCard } from "./resolve";
import type { LevelCardProps } from "./types";

/**
 * Award level card — GLTF glass shell by default; pass `side` / `mini` for flat canvas.
 * Bring your own ladder with `defineCategory` / `definePresets`, or use built-in Reading / Ninja.
 */
export function LevelCard(props: LevelCardProps) {
  const resolved = resolveCard(props);
  const flat = props.mini || props.side === "front" || props.side === "back";

  if (flat) {
    const size = clampCardSize(props.size ?? (props.mini ? 56 : 320), props.mini ? 56 : 320);
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
                  resolved={resolved}
                  level={props.level}
                  mini={props.mini}
                  size={size}
                />
              ) : (
                <LevelCardBack resolved={resolved} size={size} />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <LevelCardGl {...props} />;
}
