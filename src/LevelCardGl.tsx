import { useEffect, useRef, useState } from "react";
import {
  attachDeviceTilt,
  needsMotionPermission,
  requestMotionPermission,
  wantsDeviceTilt,
} from "./lib/device-tilt";
import { CrosshairIcon, FlipIcon, PhoneIcon } from "./ActionIcons";
import { CARD_GLTF_URL } from "./assets";
import { ACCENT_FLICKER_MS, contentPad, stepAccentCells } from "./grid";
import { LevelCardFace } from "./LevelCardFace";
import {
  buildFaceModel,
  flickerFillsFor,
  paintBack,
  paintFaceChrome,
  paintFaceMosaic,
} from "./paint";
import { resolveCard } from "./resolve";
import type { LevelCardProps } from "./types";
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Hairline lifts above glass — embossed metal, not floating decks. */
const LAYER_MOSAIC_WORLD = 0.006;
const LAYER_CHROME_WORLD = 0.014;

type Api = {
  setLevel: (name: string, spin: boolean) => void;
  setIdentity: () => void;
  setFlip: (f: boolean) => void;
  enableMotion: () => Promise<void>;
  resetTilt: () => void;
};

/** RankCard GLTF shell + canvas-painted faces. */
export function LevelCardGl(props: LevelCardProps) {
  const resolved = resolveCard(props);
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  const controlled = props.flipped !== undefined;
  const [failed, setFailed] = useState(false);
  const [uncontrolled, setUncontrolled] = useState(!!props.defaultFlipped);
  const flipped = controlled ? !!props.flipped : uncontrolled;
  const flippedRef = useRef(flipped);
  const requestFlip = useRef((next: boolean) => {
    if (!controlled) setUncontrolled(next);
    props.onFlip?.(next);
  });
  const [askMotion, setAskMotion] = useState(false);
  const [motionOn, setMotionOn] = useState(false);
  const api = useRef<Api | null>(null);
  const levelName = props.level ?? resolved.title;
  const flickerOn = !!props.flicker;
  const flickerRef = useRef(flickerOn);

  useEffect(() => {
    latest.current = props;
    flippedRef.current = flipped;
    requestFlip.current = (next: boolean) => {
      if (props.flipped === undefined) setUncontrolled(next);
      props.onFlip?.(next);
    };
  }, [props, flipped]);

  useEffect(() => {
    api.current?.setFlip(flipped);
  }, [flipped]);

  useEffect(() => {
    flickerRef.current = flickerOn;
    api.current?.setLevel(levelName, false);
  }, [
    levelName,
    flickerOn,
    resolved.title,
    resolved.caption,
    resolved.theme.primary,
    resolved.theme.background,
  ]);

  useEffect(() => {
    api.current?.setIdentity();
  }, [
    resolved.brand,
    resolved.fullName,
    resolved.memberSince,
    resolved.showMark,
    resolved.theme.background,
  ]);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    (async () => {
      const THREE = await import("three");
      const [{ GLTFLoader }, { RoomEnvironment }] = await Promise.all([
        import("three/examples/jsm/loaders/GLTFLoader.js"),
        import("three/examples/jsm/environments/RoomEnvironment.js"),
      ]);
      if (disposed || !host.current) return;
      const el = host.current;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        });
      } catch {
        setFailed(true);
        return;
      }

      let gltf: Awaited<ReturnType<InstanceType<typeof GLTFLoader>["loadAsync"]>>;
      try {
        gltf = await new GLTFLoader().loadAsync(CARD_GLTF_URL);
      } catch {
        renderer.dispose();
        if (!disposed) setFailed(true);
        return;
      }
      if (disposed) {
        renderer.dispose();
        return;
      }

      try {
        await document.fonts.ready;
      } catch {
        /* system fonts */
      }

      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      const size = () => ({ w: Math.max(240, el.clientWidth), h: 440 });
      let { w, h } = size();
      renderer.setSize(w, h);
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.style.touchAction = "pan-y";
      renderer.domElement.style.cursor = "grab";
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "440px";
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTex;
      const cam = new THREE.PerspectiveCamera(32, w / h, 0.1, 30);
      cam.position.set(0, 0, 5.6);
      const key = new THREE.DirectionalLight(0xffffff, 1.2);
      key.position.set(2, 3, 4);
      scene.add(key);
      scene.add(new THREE.AmbientLight(0xffffff, 0.5));

      const model = gltf.scene;
      model.traverse((o) => {
        if (o.name === "Fill") {
          o.position.set(0, 0, 0);
          o.quaternion.identity();
          o.scale.set(1, 1, 1);
        }
      });
      const box = new THREE.Box3().setFromObject(model);
      const ctr = box.getCenter(new THREE.Vector3());
      const sz = box.getSize(new THREE.Vector3());
      const fit = 2.6 / sz.y;
      model.position.sub(ctr);
      const pivot = new THREE.Group();
      pivot.add(model);
      pivot.scale.setScalar(fit);
      const card = new THREE.Group();
      card.add(pivot);
      scene.add(card);

      const faces = { front: null as import("three").Mesh | null, back: null as import("three").Mesh | null };
      const maxAniso = renderer.capabilities.getMaxAnisotropy();
      model.traverse((o) => {
        const m = o as import("three").Mesh;
        if (!m.isMesh) return;
        const mat = m.material as import("three").MeshStandardMaterial;
        mat.envMapIntensity = 0.9;
        if (m.name.includes("Front") || m.name.includes("Back")) {
          mat.polygonOffset = true;
          mat.polygonOffsetFactor = -2;
          mat.polygonOffsetUnits = -2;
        }
        if (mat.map) {
          mat.map.anisotropy = maxAniso;
          mat.map.needsUpdate = true;
        }
        if (m.name.includes("Front")) faces.front = m;
        if (m.name.includes("Back")) faces.back = m;
      });

      let raf = 0;
      let running = false;
      let onScreen = true;
      let last = performance.now();
      let t = 0;

      const faceTexPx = Math.min(renderer.capabilities.maxTextureSize, 1024);
      const mkCanvas = () => {
        const cv = document.createElement("canvas");
        cv.width = cv.height = faceTexPx;
        return cv;
      };
      const mosaicCanvas = mkCanvas();
      const chromeCanvas = mkCanvas();
      const backCanvas = mkCanvas();

      const mkTex = (cv: HTMLCanvasElement) => {
        const tex = new THREE.CanvasTexture(cv);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.flipY = false;
        tex.anisotropy = Math.min(4, maxAniso);
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        return tex;
      };
      const mosaicTex = mkTex(mosaicCanvas);
      const chromeTex = mkTex(chromeCanvas);
      const backTex = mkTex(backCanvas);

      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let currentLevel = levelName;
      const raised: InstanceType<typeof THREE.Mesh>[] = [];

      const paintFrontMosaic = (level: string) => {
        const r = resolveCard({ ...latest.current, level });
        const fills = flickerRef.current ? flickerFillsFor(r.theme, level) : null;
        const { contentCols } = contentPad(r.theme.grid);
        const accentCells = fills
          ? stepAccentCells(fills, r.theme.grid.voidCells, contentCols, r.theme.grid.rows)
          : undefined;
        paintFaceMosaic(
          mosaicCanvas,
          buildFaceModel(r.theme, r.title, r.caption, level, { accentCells }),
        );
        mosaicTex.needsUpdate = true;
      };

      const paintFrontChrome = (level: string) => {
        const r = resolveCard({ ...latest.current, level });
        paintFaceChrome(chromeCanvas, buildFaceModel(r.theme, r.title, r.caption, level));
        chromeTex.needsUpdate = true;
      };

      const paintFrontNow = (level: string) => {
        currentLevel = level;
        paintFrontMosaic(level);
        paintFrontChrome(level);
      };

      const paintBackNow = () => {
        const r = resolveCard(latest.current);
        paintBack(backCanvas, {
          theme: r.theme,
          brand: r.brand,
          fullName: r.fullName,
          memberSince: r.memberSince,
          showMark: r.showMark,
        });
        backTex.needsUpdate = true;
      };

      paintFrontNow(levelName);
      paintBackNow();
      let flickerTimer = 0;
      if (disposed) return;

      const faceOutward = (mesh: InstanceType<typeof THREE.Mesh>) => {
        const attr = mesh.geometry.getAttribute("normal");
        return new THREE.Vector3(attr.getX(0), attr.getY(0), attr.getZ(0)).normalize();
      };

      const flushGlass = (mesh: InstanceType<typeof THREE.Mesh>) => {
        const mat = mesh.material as import("three").MeshStandardMaterial;
        mat.map?.dispose();
        mat.map = null;
        mat.color.set("#050505");
        mat.transparent = false;
        mat.needsUpdate = true;
      };

      /** Hairline emboss deck above glass. Geometry is shared with the face — don't dispose it. */
      const raiseDeck = (
        face: InstanceType<typeof THREE.Mesh>,
        map: InstanceType<typeof THREE.CanvasTexture>,
        liftWorld: number,
        opts: { name: string; transparent?: boolean; renderOrder: number },
      ) => {
        const n = faceOutward(face);
        const mat = new THREE.MeshStandardMaterial({
          map,
          transparent: !!opts.transparent,
          depthWrite: !opts.transparent,
          roughness: opts.transparent ? 0.18 : 0.28,
          metalness: opts.transparent ? 0.85 : 0.62,
          envMapIntensity: opts.transparent ? 1.35 : 1.15,
          side: THREE.FrontSide,
          polygonOffset: true,
          polygonOffsetFactor: opts.transparent ? -4 : -2,
          polygonOffsetUnits: opts.transparent ? -4 : -2,
        });
        const deck = new THREE.Mesh(face.geometry, mat);
        deck.name = opts.name;
        deck.position.copy(face.position).addScaledVector(n, liftWorld / fit);
        deck.quaternion.copy(face.quaternion);
        deck.scale.copy(face.scale);
        deck.renderOrder = opts.renderOrder;
        face.parent?.add(deck);
        raised.push(deck);
        return deck;
      };

      if (faces.front) {
        flushGlass(faces.front);
        raiseDeck(faces.front, mosaicTex, LAYER_MOSAIC_WORLD, {
          name: "Fill-Front-Mosaic",
          renderOrder: 1,
        });
        raiseDeck(faces.front, chromeTex, LAYER_CHROME_WORLD, {
          name: "Fill-Front-Chrome",
          transparent: true,
          renderOrder: 2,
        });
      }
      if (faces.back) {
        flushGlass(faces.back);
        raiseDeck(faces.back, backTex, LAYER_CHROME_WORLD, {
          name: "Fill-Back-Plate",
          renderOrder: 1,
        });
      }

      let spinLeft = 0;
      let spinAngle = 0;
      let pendingLevel: string | null = null;
      let flipTarget = flipped ? Math.PI : 0;
      let flip = flipTarget;
      const gyro = { x: 0, y: 0 };
      let tiltCtl: ReturnType<typeof attachDeviceTilt> | null = null;

      function listenMotion() {
        if (tiltCtl) return;
        tiltCtl = attachDeviceTilt((s) => {
          gyro.x = s.x;
          gyro.y = s.y;
          wake();
        });
        setMotionOn(true);
        setAskMotion(false);
      }

      api.current = {
        setLevel: (name, spin) => {
          paintFrontNow(name);
          if (spin && !reduce) {
            pendingLevel = name;
            spinLeft = Math.PI * 2;
          }
          wake();
        },
        setIdentity: () => {
          paintBackNow();
          wake();
        },
        setFlip: (f) => {
          flipTarget = f ? Math.PI : 0;
          wake();
        },
        enableMotion: async () => {
          const r = await requestMotionPermission();
          if (r === "granted") {
            tiltCtl?.resetBaseline();
            listenMotion();
            return;
          }
          if (r === "insecure") latest.current.onNotify?.("Tilt needs HTTPS.");
          else latest.current.onNotify?.("Motion access denied.");
        },
        resetTilt: () => tiltCtl?.resetBaseline(),
      };

      if (wantsDeviceTilt()) {
        if (needsMotionPermission()) setAskMotion(true);
        else listenMotion();
      }

      let dragging = false;
      let moved = 0;
      let px = 0;
      let py = 0;
      let vx = 0;
      let vy = 0;
      let dragYaw = 0;
      let dragPitch = 0;
      const hover = { x: 0, y: 0 };

      const down = (e: PointerEvent) => {
        dragging = true;
        moved = 0;
        px = e.clientX;
        py = e.clientY;
        vx = vy = 0;
        renderer.domElement.setPointerCapture(e.pointerId);
        renderer.domElement.style.cursor = "grabbing";
        wake();
      };
      const move = (e: PointerEvent) => {
        const b = el.getBoundingClientRect();
        if (!dragging) {
          hover.x = ((e.clientX - b.left) / b.width - 0.5) * 2;
          hover.y = ((e.clientY - b.top) / b.height - 0.5) * 2;
          wake();
          return;
        }
        const dx = e.clientX - px;
        const dy = e.clientY - py;
        px = e.clientX;
        py = e.clientY;
        moved += Math.abs(dx) + Math.abs(dy);
        vx = dx * 0.012;
        vy = dy * 0.009;
        dragYaw = clamp(dragYaw + vx, -Math.PI, Math.PI);
        dragPitch = clamp(dragPitch + vy, -0.8, 0.8);
      };
      const up = (e: PointerEvent) => {
        if (!dragging) return;
        dragging = false;
        renderer.domElement.style.cursor = "grab";
        try {
          renderer.domElement.releasePointerCapture(e.pointerId);
        } catch {
          /* already released */
        }
        if (moved < 6) requestFlip.current(!flippedRef.current);
      };
      const leave = () => {
        hover.x = hover.y = 0;
      };
      const cv = renderer.domElement;
      cv.addEventListener("pointerdown", down);
      cv.addEventListener("pointermove", move);
      cv.addEventListener("pointerup", up);
      cv.addEventListener("pointercancel", up);
      cv.addEventListener("pointerleave", leave);

      function frame(now: number) {
        raf = 0;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        t += dt;

        if (!dragging) {
          dragYaw += vx;
          dragPitch += vy;
          vx *= 0.92;
          vy *= 0.92;
          dragYaw *= 0.9;
          dragPitch *= 0.9;
        }
        if (spinLeft > 0) {
          const step = Math.min(spinLeft, dt * 5.5);
          spinLeft -= step;
          spinAngle += step;
          if (pendingLevel && spinAngle >= Math.PI) pendingLevel = null;
          if (spinLeft === 0) {
            card.rotation.y -= spinAngle;
            spinAngle = 0;
          }
        }
        flip += (flipTarget - flip) * Math.min(1, dt * 7);
        const sway = reduce ? 0 : Math.sin(t * 0.7) * 0.12;
        const targetY =
          dragYaw + sway + flip + spinAngle + hover.x * 0.3 + gyro.x * 0.65;
        const targetX =
          dragPitch + hover.y * 0.22 + gyro.y * 0.5 + (reduce ? 0 : Math.sin(t * 0.5) * 0.03);
        card.rotation.y += (targetY - card.rotation.y) * Math.min(1, dt * 10);
        card.rotation.x += (targetX - card.rotation.x) * Math.min(1, dt * 10);
        card.position.y = reduce ? 0 : Math.sin(t * 1.1) * 0.03;
        renderer.render(scene, cam);
        const calm =
          !dragging &&
          spinLeft === 0 &&
          Math.abs(vx) + Math.abs(vy) < 0.0005 &&
          Math.abs(flipTarget - flip) < 0.002 &&
          Math.abs(targetY - card.rotation.y) < 0.002 &&
          Math.abs(targetX - card.rotation.x) < 0.002;
        if ((!reduce || !calm) && onScreen && !document.hidden) {
          raf = requestAnimationFrame(frame);
        } else running = false;
      }
      function wake() {
        if (disposed || running || !onScreen || document.hidden) return;
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
      const io = new IntersectionObserver(
        (e) => {
          onScreen = e[0].isIntersecting;
          if (onScreen) wake();
        },
        { threshold: 0.05 },
      );
      io.observe(el);
      const vis = () => {
        if (!document.hidden) wake();
      };
      document.addEventListener("visibilitychange", vis);
      const ro = new ResizeObserver(() => {
        ({ w, h } = size());
        renderer.setSize(w, h);
        cam.aspect = w / h;
        cam.updateProjectionMatrix();
        wake();
      });
      ro.observe(el);
      cv.addEventListener("webglcontextlost", (e) => e.preventDefault());
      if (!reduce) {
        flickerTimer = window.setInterval(() => {
          if (disposed || !onScreen || document.hidden || !flickerRef.current) return;
          if (!flickerFillsFor(resolveCard({ ...latest.current, level: currentLevel }).theme, currentLevel)) {
            return;
          }
          paintFrontMosaic(currentLevel);
          wake();
        }, ACCENT_FLICKER_MS);
      }
      wake();

      cleanup = () => {
        cancelAnimationFrame(raf);
        if (flickerTimer) window.clearInterval(flickerTimer);
        running = false;
        io.disconnect();
        ro.disconnect();
        document.removeEventListener("visibilitychange", vis);
        tiltCtl?.stop();
        cv.removeEventListener("pointerdown", down);
        cv.removeEventListener("pointermove", move);
        cv.removeEventListener("pointerup", up);
        cv.removeEventListener("pointercancel", up);
        cv.removeEventListener("pointerleave", leave);
        // Raised decks share face geometry — remove + dispose materials only.
        for (const deck of raised) {
          deck.parent?.remove(deck);
          (deck.material as import("three").Material).dispose();
        }
        raised.length = 0;
        model.traverse((o) => {
          const m = o as import("three").Mesh;
          if (!m.isMesh) return;
          m.geometry.dispose();
          (Array.isArray(m.material) ? m.material : [m.material]).forEach((mt) => mt.dispose());
        });
        mosaicTex.dispose();
        chromeTex.dispose();
        backTex.dispose();
        envTex.dispose();
        pmrem.dispose();
        renderer.dispose();
        cv.remove();
        api.current = null;
      };
    })();
    return () => {
      disposed = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) {
    return (
      <div className="level-card__wrap">
        <div className="rankcard" role="img" aria-label={`${resolved.title} level card`}>
          <LevelCardFace
            theme={resolved.theme}
            title={resolved.title}
            caption={resolved.caption}
            level={props.level}
            flicker={props.flicker}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="level-card__wrap">
      <div ref={host} role="img" aria-label={`Reading level: ${resolved.title}`} className="rankcard" />
      <div className="level-card__actions">
        <button
          type="button"
          className="iconbtn rankflip"
          aria-label={flipped ? "Show front" : "Flip card"}
          aria-pressed={flipped}
          onClick={() => requestFlip.current(!flipped)}
        >
          <FlipIcon size={22} />
        </button>
        {askMotion ? (
          <button
            type="button"
            className="iconbtn rankflip"
            aria-label="Tilt with your phone"
            onClick={() => void api.current?.enableMotion()}
          >
            <PhoneIcon size={22} />
          </button>
        ) : null}
        {motionOn ? (
          <button
            type="button"
            className="iconbtn rankflip"
            aria-label="Recalibrate tilt"
            onClick={() => api.current?.resetTilt()}
          >
            <CrosshairIcon size={22} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
