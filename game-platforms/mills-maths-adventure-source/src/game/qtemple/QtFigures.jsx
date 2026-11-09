import React, { useMemo } from "react";
import * as THREE from "three";

import { QBox, QCyl, QSphere, QLathe, mat } from "./qtKit.jsx";

/**
 * QUOTIENT TEMPLE FIGURES — the carved + golden things that give each room
 * its character (all built from primitives, origin at the floor):
 *   GoldenHead     the Hall of Heads' wall faces (Mario RPG)
 *   GuardianHead   the Guardians' Court's great stone heads (Gobi's Valley)
 *   OwlStatue      the watchers on the Grand Descent's landings
 *   CobraStatue    the coiled cobra on the throne dais
 *   CobraPillar    the throne room's cobra-headed columns
 *   Urn, Chest, CoinPile, Idol, Lectern, Scroll …
 */

/** A golden face on a wall plaque (faces +z; origin = the plaque's foot on the wall). */
export function GoldenHead({ s = 1 }) {
  return (
    <group scale={s}>
      {/* Plaque */}
      <QBox p={[0, 0, 0.15]} s={[2.6, 3.0, 0.3]} m="darkBricks" />
      <QBox p={[0, -1.45, 0.3]} s={[2.9, 0.3, 0.6]} m="gold" />
      <QBox p={[0, 1.45, 0.3]} s={[2.9, 0.3, 0.6]} m="gold" />
      {/* Face */}
      <QSphere p={[0, 0, 0.6]} r={1.05} s={[1, 1.12, 0.62]} m="gold" seg={24} />
      {/* Brows */}
      {[-1, 1].map((k) => (
        <group key={k}>
          <QBox p={[0.42 * k, 0.5, 1.14]} s={[0.62, 0.2, 0.24]} rot={[0, 0, -0.22 * k]} m="goldDark" />
          {/* Eyes: white + dark pupil */}
          <QSphere p={[0.38 * k, 0.18, 1.07]} r={0.2} s={[1, 1.3, 0.55]} m="#f4ecd8" seg={12} />
          <QSphere p={[0.38 * k, 0.15, 1.17]} r={0.1} s={[1, 1.4, 0.5]} m="#1a120a" seg={10} />
          {/* Ears */}
          <QSphere p={[1.0 * k, 0.05, 0.55]} r={0.28} s={[0.5, 1, 0.6]} m="gold" seg={10} />
          {/* Moustache */}
          <QSphere p={[0.32 * k, -0.42, 1.08]} r={0.3} s={[1.4, 0.55, 0.6]} rot={[0, 0, 0.25 * k]} m="goldDark" seg={12} />
        </group>
      ))}
      {/* Nose + mouth */}
      <QSphere p={[0, -0.12, 1.22]} r={0.2} s={[0.9, 1.15, 1]} m="gold" seg={12} />
      <QBox p={[0, -0.72, 1.0]} s={[0.5, 0.1, 0.2]} m="#3a2408" />
    </group>
  );
}

/** A great stone guardian head on a plinth (faces +z). */
export function GuardianHead({ s = 1, eyes = true }) {
  const eyeM = mat("eye");
  return (
    <group scale={s}>
      <QBox p={[0, 0.6, 0]} s={[3.6, 1.2, 3.2]} m="darkStone" tile={2} />
      <QBox p={[0, 1.28, 0]} s={[3.9, 0.16, 3.5]} m="goldDark" />
      {/* Headdress (nemes): a wide block + striped side flaps */}
      <QBox p={[0, 3.6, -0.2]} s={[3.1, 4.4, 2.4]} m="darkStone" tile={2} />
      {[-1, 1].map((k) => (
        <group key={k}>
          <QBox p={[1.55 * k, 2.9, 0.55]} s={[0.55, 3.0, 1.1]} rot={[0, 0, 0.08 * k]} m="clothBlue" />
          {[0, 1, 2, 3].map((i) => <QBox key={i} p={[1.83 * k, 1.8 + i * 0.72, 0.55]} s={[0.04, 0.22, 1.12]} rot={[0, 0, 0.08 * k]} m="gold" />)}
        </group>
      ))}
      <QBox p={[0, 5.9, -0.2]} s={[2.4, 0.4, 2.0]} m="gold" />
      {/* Face */}
      <QBox p={[0, 3.4, 1.05]} s={[2.4, 3.4, 0.5]} m="statue" />
      <QBox p={[0, 4.35, 1.38]} s={[2.4, 0.38, 0.4]} m="stoneDark" />
      {[-1, 1].map((k) => (
        <group key={k}>
          <QBox p={[0.6 * k, 3.95, 1.32]} s={[0.66, 0.34, 0.12]} m="#120c08" />
          {eyes && <mesh position={[0.6 * k, 3.95, 1.39]} material={eyeM}><boxGeometry args={[0.36, 0.16, 0.04]} /></mesh>}
        </group>
      ))}
      <QBox p={[0, 3.25, 1.48]} s={[0.46, 1.0, 0.5]} m="statue" />
      <QBox p={[0, 2.3, 1.38]} s={[1.0, 0.14, 0.12]} m="#2a1d14" />
      {/* Beard */}
      <QBox p={[0, 1.6, 1.15]} s={[0.6, 0.9, 0.5]} m="darkStone" />
      <QBox p={[0, 1.6, 1.42]} s={[0.66, 0.08, 0.05]} m="gold" />
    </group>
  );
}

/** A stone owl on a pedestal (faces +z). */
export function OwlStatue() {
  return (
    <group>
      <QBox p={[0, 0.6, 0]} s={[1.5, 1.2, 1.5]} m="marblePale" />
      <QBox p={[0, 1.25, 0]} s={[1.7, 0.1, 1.7]} m="gold" />
      <QSphere p={[0, 2.2, 0]} r={0.75} s={[1, 1.3, 0.9]} m="statue" seg={18} />
      <QSphere p={[0, 3.25, 0.05]} r={0.55} s={[1.15, 0.95, 1]} m="statue" seg={18} />
      {[-1, 1].map((k) => (
        <group key={k}>
          <mesh position={[0.32 * k, 3.75, 0]} rotation={[0, 0, -0.5 * k]} material={mat("statue")}><coneGeometry args={[0.14, 0.5, 6]} /></mesh>
          <QSphere p={[0.24 * k, 3.3, 0.5]} r={0.2} s={[1, 1, 0.4]} m="#e6dcc6" seg={12} />
          <QSphere p={[0.24 * k, 3.3, 0.58]} r={0.09} s={[1, 1, 0.4]} m="eye" seg={8} />
          <QSphere p={[0.72 * k, 2.1, -0.05]} r={0.4} s={[0.4, 1.3, 0.9]} m="stoneDark" seg={10} />
        </group>
      ))}
      <mesh position={[0, 3.12, 0.6]} rotation={[Math.PI / 2, 0, 0]} material={mat("gold")}><coneGeometry args={[0.08, 0.24, 6]} /></mesh>
    </group>
  );
}

/** The coiled golden cobra on the throne dais, rearing up to face the room (−x). */
export function CobraStatue() {
  const neck = useMemo(() => {
    const pts = [[0, 1.6, 0], [-0.3, 3.0, 0], [-0.9, 4.6, 0], [-1.2, 6.0, 0], [-1.1, 7.0, 0]].map((p) => new THREE.Vector3(...p));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.55, 12, false);
  }, []);
  const hood = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, -1.4);
    s.bezierCurveTo(1.6, -0.6, 1.5, 1.6, 0, 2.0);
    s.bezierCurveTo(-1.5, 1.6, -1.6, -0.6, 0, -1.4);
    return new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 2 });
  }, []);
  return (
    <group rotation={[0, -Math.PI / 2, 0]}>
      {/* Plinth */}
      <QBox p={[0, 0.5, 0]} s={[5, 1, 5]} m="darkStone" tile={2} />
      <QBox p={[0, 1.05, 0]} s={[5.3, 0.12, 5.3]} m="gold" />
      {/* Coils */}
      {[[1.7, 0.42, 1.45], [1.35, 0.4, 2.15], [0.95, 0.38, 2.8]].map(([r, t, y], i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat(i % 2 ? "jade" : "gold")}>
          <torusGeometry args={[r, t, 10, 28]} />
        </mesh>
      ))}
      <mesh geometry={neck} position={[0, 1.6, 0]} material={mat("gold")} />
      {/* Hood (faces −x after the group's turn → +z here) */}
      <group position={[-1.15, 8.3, 0.3]} rotation={[0.05, 0, 0]}>
        <mesh geometry={hood} position={[0, 0, -0.55]} material={mat("gold")} />
        <mesh position={[0, 0.2, -0.24]} material={mat("jade")} scale={[0.55, 0.6, 1]}>
          <circleGeometry args={[1.2, 20]} />
        </mesh>
      </group>
      {/* Head */}
      <QSphere p={[-1.15, 9.6, 0.55]} r={0.62} s={[1, 0.7, 1.35]} m="gold" seg={18} />
      {[-1, 1].map((k) => <QSphere key={k} p={[-1.15 + 0.32 * k, 9.78, 1.0]} r={0.12} m="eye" seg={8} />)}
      <QBox p={[-1.15, 9.38, 1.42]} s={[0.06, 0.04, 0.5]} m="#b0201a" />
    </group>
  );
}

/** A square dark column with a gold cobra rearing from its top (hood faces +z). */
export function CobraPillar({ h = 12, r = 1.3 }) {
  const w = r * 1.5;
  return (
    <group>
      <QBox p={[0, 0.4, 0]} s={[w + 0.8, 0.8, w + 0.8]} m="goldDark" />
      <QBox p={[0, h / 2, 0]} s={[w, h, w]} m="darkStone" tile={2} />
      {/* Glowing glyph strips down each face */}
      {[0, 1, 2, 3].map((i) => (
        <group key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
          <mesh position={[0, h * 0.48, w / 2 + 0.01]} material={mat("glyphsGreen")}><planeGeometry args={[w * 0.6, h * 0.5]} /></mesh>
        </group>
      ))}
      <QBox p={[0, h - 1.6, 0]} s={[w + 0.4, 0.4, w + 0.4]} m="gold" />
      {/* The cobra: a curling neck + a flared hood just under the ceiling */}
      <group position={[0, h - 4.6, w / 2 + 0.35]} scale={1.9}>
        <QSphere p={[0, 0.2, 0]} r={0.55} s={[1.5, 1.7, 0.42]} m="gold" seg={16} />
        <QSphere p={[0, 0.25, 0.18]} r={0.4} s={[0.9, 1.1, 0.3]} m="jade" seg={12} />
        <QSphere p={[0, 1.05, 0.3]} r={0.26} s={[1, 0.7, 1.3]} m="gold" seg={12} />
        {[-1, 1].map((k) => <QSphere key={k} p={[0.13 * k, 1.12, 0.6]} r={0.06} m="eye" seg={6} />)}
      </group>
    </group>
  );
}

/** A clay / gold urn. */
export function Urn({ s = 1, m = "#a8643a", band = "gold" }) {
  return (
    <group scale={s}>
      <QLathe p={[0, 0, 0]} pts={[[0.25, 0], [0.45, 0.15], [0.55, 0.55], [0.48, 0.95], [0.25, 1.15], [0.22, 1.3], [0.32, 1.38]]} m={m} seg={16} />
      <mesh position={[0, 0.6, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat(band)}><torusGeometry args={[0.55, 0.04, 5, 18]} /></mesh>
    </group>
  );
}

/** A treasure chest (faces +z); `open` lifts the lid. */
export function Chest({ open = false, s = 1 }) {
  return (
    <group scale={s}>
      <QBox p={[0, 0.35, 0]} s={[1.2, 0.7, 0.8]} m="wood" />
      <group position={[0, 0.7, -0.4]} rotation={[open ? -1.9 : 0, 0, 0]}>
        <mesh position={[0, 0.02, 0.4]} rotation={[0, 0, Math.PI / 2]} material={mat("wood")}><cylinderGeometry args={[0.4, 0.4, 1.2, 12, 1, false, 0, Math.PI]} /></mesh>
        <QBox p={[0, 0.2, 0.8]} s={[0.24, 0.3, 0.06]} m="gold" />
      </group>
      {[-0.45, 0.45].map((x) => <QBox key={x} p={[x, 0.55, 0]} s={[0.1, 1.0, 0.84]} m="gold" />)}
      {open && <QSphere p={[0, 0.72, 0]} r={0.38} s={[1.3, 0.4, 0.9]} m="gold" seg={12} />}
    </group>
  );
}

/** A heap of gold coins with a few scattered round it. */
export function CoinPile({ r = 1.5, seed = 1 }) {
  const coins = useMemo(() => {
    let k = seed * 9301 + 49297;
    const R = () => { k = (k * 9301 + 49297) % 233280; return k / 233280; };
    return Array.from({ length: 22 }, () => {
      const a = R() * Math.PI * 2, d = r * (0.9 + R() * 0.8);
      return [Math.cos(a) * d, 0.03, Math.sin(a) * d, R() * 3];
    });
  }, [r, seed]);
  return (
    <group>
      <mesh position={[0, 0, 0]} material={mat("gold")} scale={[1, 0.55, 1]}>
        <sphereGeometry args={[r, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {coins.map(([x, y, z, a], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0.1 * a, a, 0]} material={mat("gold")}>
          <cylinderGeometry args={[0.13, 0.13, 0.04, 10]} />
        </mesh>
      ))}
      <group position={[r * 0.2, r * 0.5, r * 0.1]}><Urn s={0.55} m="gold" band="goldDark" /></group>
    </group>
  );
}

/** The treasury's golden idol — a seated figure holding a glowing ÷ (faces +z). */
export function Idol() {
  return (
    <group>
      <QLathe p={[0, 0, 0]} pts={[[1.5, 0], [1.5, 0.5], [1.25, 0.6], [1.15, 1.2], [1.35, 1.3], [1.35, 1.5]]} m="darkStone" seg={8} />
      <QBox p={[0, 2.3, -0.1]} s={[1.3, 1.6, 1.0]} m="gold" />
      <QBox p={[0, 1.75, 0.45]} s={[1.3, 0.5, 1.1]} m="gold" />
      <QSphere p={[0, 3.5, 0]} r={0.5} s={[1, 1.15, 1]} m="gold" seg={16} />
      <QBox p={[0, 3.7, -0.15]} s={[1.15, 1.0, 0.8]} m="clothBlue" />
      <QBox p={[0, 4.25, -0.1]} s={[0.9, 0.18, 0.7]} m="gold" />
      {[-1, 1].map((k) => <QSphere key={k} p={[0.18 * k, 3.55, 0.45]} r={0.07} m="eye" seg={6} />)}
      {/* Arms forward, holding the ÷ disc */}
      {[-1, 1].map((k) => <QBox key={k} p={[0.5 * k, 2.4, 0.55]} s={[0.26, 0.26, 0.9]} m="gold" />)}
      <mesh position={[0, 2.45, 1.05]} material={mat("eye")}><circleGeometry args={[0.36, 20]} /></mesh>
      <QBox p={[0, 2.45, 1.08]} s={[0.4, 0.07, 0.02]} m="#5a3a08" />
      <QSphere p={[0, 2.6, 1.08]} r={0.05} m="#5a3a08" seg={6} />
      <QSphere p={[0, 2.3, 1.08]} r={0.05} m="#5a3a08" seg={6} />
    </group>
  );
}

/** A tall bookcase (faces +z). */
export function Bookcase({ w = 6, d = 1.2, h = 4.4 }) {
  return (
    <group>
      <QBox p={[0, h / 2, 0]} s={[w, h, d]} m="woodSide" />
      <mesh position={[0, h / 2 - 0.1, d / 2 + 0.01]} material={mat("books")}>
        <planeGeometry args={[w - 0.4, h - 0.6]} />
      </mesh>
      <QBox p={[0, h + 0.1, 0.05]} s={[w + 0.3, 0.2, d + 0.2]} m="wood" />
    </group>
  );
}

/** A long reading table with scrolls + a candle. */
export function ReadingTable() {
  return (
    <group>
      <QBox p={[0, 0.95, 0]} s={[4.4, 0.14, 2]} m="wood" />
      {[[-2, -0.85], [2, -0.85], [-2, 0.85], [2, 0.85]].map(([x, z], i) => <QBox key={i} p={[x, 0.45, z]} s={[0.16, 0.9, 0.16]} m="woodSide" />)}
      {[[-1.2, 0.2, 0.3], [0.4, -0.4, -0.2], [1.3, 0.3, 1.2]].map(([x, z, a], i) => (
        <group key={i} position={[x, 1.08, z]} rotation={[0, a, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} material={mat("#e9dcb8")}><cylinderGeometry args={[0.07, 0.07, 0.9, 8]} /></mesh>
          <QBox p={[0, -0.04, 0.3]} s={[0.84, 0.01, 0.6]} m="#efe3c2" />
        </group>
      ))}
      <QCyl p={[-0.4, 1.2, 0.5]} rt={0.05} h={0.36} m="#f4ecd8" seg={8} />
    </group>
  );
}

/** A lectern with a big open book (faces +z). */
export function Lectern() {
  return (
    <group>
      <QCyl p={[0, 0.6, 0]} rt={0.12} rb={0.3} h={1.2} m="woodSide" seg={10} />
      <QBox p={[0, 1.3, 0]} s={[1.0, 0.1, 0.8]} rot={[0.4, 0, 0]} m="wood" />
      {[-1, 1].map((k) => <QBox key={k} p={[0.24 * k, 1.38, 0.02]} s={[0.46, 0.04, 0.64]} rot={[0.4, 0, 0.06 * k]} m="#efe3c2" />)}
    </group>
  );
}

/** A colossal seated king on his throne (faces +z), ~11 m tall — Abu Simbel style. */
export function SeatedColossus() {
  return (
    <group>
      <QBox p={[0, 0.5, 0]} s={[5.4, 1, 6.4]} m="sandstone" tile={2} />
      <QBox p={[0, 1.08, 0]} s={[5.6, 0.16, 6.6]} m="goldDark" />
      {/* The throne: seat block + tall back */}
      <QBox p={[0, 3.2, -0.6]} s={[4.6, 4.2, 4.2]} m="marbleWall" tile={3} />
      <QBox p={[0, 7.2, -2.4]} s={[4.6, 8.2, 0.9]} m="marbleWall" tile={3} />
      {/* Lower legs + feet */}
      {[-1, 1].map((k) => (
        <group key={k}>
          <QBox p={[0.95 * k, 3.1, 1.95]} s={[1.3, 4.0, 1.2]} m="stone" />
          <QBox p={[0.95 * k, 1.35, 2.45]} s={[1.3, 0.5, 2.0]} m="stone" />
          {/* Thighs */}
          <QBox p={[0.95 * k, 5.55, 0.9]} s={[1.4, 1.0, 3.4]} m="stone" />
          {/* Forearms resting on the thighs, hands on the knees */}
          <QBox p={[1.75 * k, 6.45, 0.8]} s={[0.75, 0.8, 3.0]} m="stone" />
          <QBox p={[1.75 * k, 6.35, 2.45]} s={[0.85, 0.7, 0.7]} m="stone" />
          {/* Upper arms */}
          <QBox p={[1.85 * k, 8.0, -0.55]} s={[0.8, 2.6, 0.9]} m="stone" />
        </group>
      ))}
      {/* Kilt (gold) + torso + broad collar */}
      <QBox p={[0, 5.75, 0.4]} s={[3.0, 1.3, 2.4]} m="gold" />
      <QBox p={[0, 8.0, -0.6]} s={[2.9, 3.4, 1.7]} m="stone" />
      <QBox p={[0, 9.35, -0.35]} s={[3.1, 0.6, 1.5]} m="gold" />
      {/* Head: the guardian's face, a little smaller */}
      <group position={[0, 8.6, -0.8]}>
        <group scale={0.62} position={[0, 0, 0]}>
          <QBox p={[0, 3.6, -0.2]} s={[3.1, 4.4, 2.4]} m="marbleWall" tile={2} />
          {[-1, 1].map((k) => (
            <group key={k}>
              <QBox p={[1.55 * k, 2.6, 0.55]} s={[0.55, 3.0, 1.1]} rot={[0, 0, 0.08 * k]} m="clothBlue" />
              {[0, 1, 2, 3].map((i) => <QBox key={i} p={[1.83 * k, 1.5 + i * 0.72, 0.55]} s={[0.04, 0.22, 1.12]} rot={[0, 0, 0.08 * k]} m="gold" />)}
              <QBox p={[0.6 * k, 3.95, 1.32]} s={[0.66, 0.3, 0.12]} m="#2a1d14" />
            </group>
          ))}
          <QBox p={[0, 3.4, 1.05]} s={[2.4, 3.4, 0.5]} m="stone" />
          <QBox p={[0, 3.25, 1.48]} s={[0.46, 1.0, 0.5]} m="stone" />
          <QBox p={[0, 2.3, 1.38]} s={[1.0, 0.14, 0.12]} m="#6a5038" />
          <QBox p={[0, 1.5, 1.1]} s={[0.6, 1.0, 0.5]} m="gold" />
          <QBox p={[0, 6.1, -0.2]} s={[2.0, 0.9, 1.8]} m="gold" />
        </group>
      </group>
    </group>
  );
}

/** A colossal standing guardian holding a staff (faces +z), ~13 m tall. */
export function StandingColossus() {
  return (
    <group>
      <QBox p={[0, 0.6, 0]} s={[4.4, 1.2, 4.4]} m="sandstone" tile={2} />
      <QBox p={[0, 1.28, 0]} s={[4.6, 0.16, 4.6]} m="goldDark" />
      {[-1, 1].map((k) => (
        <group key={k}>
          <QBox p={[0.6 * k, 1.75, 0.55 * k]} s={[0.9, 0.7, 2.0]} m="stone" />
          <QBox p={[0.6 * k, 4.3, 0.55 * k]} s={[0.9, 4.4, 0.95]} m="stone" />
          <QBox p={[1.6 * k, 8.4, 0]} s={[0.8, 3.6, 0.9]} m="stone" />
        </group>
      ))}
      {/* Back pillar (they're carved from it) */}
      <QBox p={[0, 6.5, -1.2]} s={[2.6, 13, 0.8]} m="marbleWall" tile={3} />
      <QBox p={[0, 7.0, 0]} s={[2.4, 1.6, 1.6]} m="gold" />
      <QBox p={[0, 9.0, 0]} s={[2.4, 2.6, 1.4]} m="stone" />
      <QBox p={[0, 10.4, 0.05]} s={[2.6, 0.5, 1.5]} m="gold" />
      {/* Staff in the right hand */}
      <QCyl p={[1.75, 6.5, 0.9]} rt={0.12} h={11} m="gold" seg={8} />
      <mesh position={[1.75, 12.3, 0.9]} material={mat("eye")}><octahedronGeometry args={[0.45]} /></mesh>
      <group position={[0, 9.6, -0.2]} scale={0.6}>
        <QBox p={[0, 3.6, -0.2]} s={[3.1, 4.4, 2.4]} m="marbleWall" tile={2} />
        {[-1, 1].map((k) => (
          <group key={k}>
            <QBox p={[1.55 * k, 2.6, 0.55]} s={[0.55, 3.0, 1.1]} rot={[0, 0, 0.08 * k]} m="cloth" />
            <QBox p={[0.6 * k, 3.95, 1.32]} s={[0.66, 0.3, 0.12]} m="#120c08" />
            <mesh position={[0.6 * k, 3.95, 1.39]} material={mat("eye")}><boxGeometry args={[0.36, 0.14, 0.04]} /></mesh>
          </group>
        ))}
        <QBox p={[0, 3.4, 1.05]} s={[2.4, 3.4, 0.5]} m="stone" />
        <QBox p={[0, 3.25, 1.48]} s={[0.46, 1.0, 0.5]} m="stone" />
        <QBox p={[0, 1.5, 1.1]} s={[0.6, 1.0, 0.5]} m="gold" />
        <QBox p={[0, 6.1, -0.2]} s={[2.0, 0.9, 1.8]} m="gold" />
      </group>
    </group>
  );
}

/** A winged sun disc (faces +z) — over the great doorways. */
export function WingedSun({ s = 1 }) {
  const wing = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(0, 0.5);
    sh.bezierCurveTo(2.5, 1.4, 5.0, 1.0, 6.5, 0.4);
    sh.lineTo(6.2, 0.0);
    sh.bezierCurveTo(4.8, -0.2, 2.6, -0.6, 0, -0.5);
    sh.closePath();
    return new THREE.ExtrudeGeometry(sh, { depth: 0.2, bevelEnabled: false });
  }, []);
  return (
    <group scale={s}>
      {[-1, 1].map((k) => (
        <group key={k} scale={[k, 1, 1]}>
          <mesh geometry={wing} position={[0.9, 0, 0]} material={mat("gold")} />
          {[0, 1, 2, 3].map((i) => <QBox key={i} p={[1.8 + i * 1.2, 0.02 - i * 0.05, 0.22]} s={[0.08, 0.7, 0.04]} m="clothBlue" />)}
        </group>
      ))}
      <mesh position={[0, 0, 0.15]} material={mat("eye")}><circleGeometry args={[1.0, 28]} /></mesh>
      <mesh position={[0, 0, 0.1]} material={mat("gold")}><torusGeometry args={[1.05, 0.14, 6, 28]} /></mesh>
      {[-1, 1].map((k) => <mesh key={k} position={[1.15 * k, -0.4, 0.12]} rotation={[0, 0, 0.3 * k]} material={mat("jade")}><capsuleGeometry args={[0.16, 0.8, 4, 8]} /></mesh>)}
    </group>
  );
}
