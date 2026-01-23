// src/world/stadium.js
import * as THREE from "three";

import { createPitchLines } from "./pitchLines.js";
import { createGoals } from "./goals.js";
import { createScoreboard } from "./scoreboard.js";
import { createFloodlights } from "./floodlights.js";

import { createAssets } from "./stadiumAssets.js";
import { createGroundAndPitch } from "./stadiumPitch.js";
import { createLongStands } from "./stadiumStands.js";
import { addDugouts } from "./stadiumModels.js";
import { addWallsAndRoad } from "./stadiumEnvironment.js";
import { createCornerFlags } from "./cornerFlags.js";
import { createPlayers } from "./players.js";
import { createCity } from "./city.js";


export async function createStadium() {
  const stadium = new THREE.Group();
  stadium.name = "ChairStadium";

  

  // =========================
  // TOGGLES
  // =========================
  const USE_STAND_TEXTURE = true;
  const USE_PITCH_TEXTURE = true;
  const USE_ROOF_TEXTURE = true;

  const pitchW = 105;
  const pitchD = 68;

  const margin = 18;
  const standH = 14;

  const standXLen = pitchW + 12;
  const standD = 15;
  const standGapFromPitch = 7;

  // =========================
  // ASSETS
  // =========================
  const assets = await createAssets({
    USE_STAND_TEXTURE,
    USE_PITCH_TEXTURE,
    USE_ROOF_TEXTURE,
  });

  // =========================
  // GROUND + PITCH
  // =========================
  createGroundAndPitch({
    stadium,
    pitchW,
    pitchD,
    margin,
    USE_PITCH_TEXTURE,
    grassMap: assets.grassMap,
  });

  stadium.add(createPitchLines(pitchW, pitchD));
  stadium.add(createGoals(pitchW, pitchD));

  // =========================
  // CORNER FLAGS
  // =========================
  const flags = createCornerFlags(pitchW, pitchD);
  stadium.add(flags);
  stadium.userData.flags = flags;

  // =========================
  // SCOREBOARD
  // =========================
  const scoreboard = createScoreboard(pitchW, pitchD);
  stadium.add(scoreboard);
  stadium.userData.scoreboard = scoreboard;

  // =========================
  // STANDS + ROOF
  // =========================
  const standsGroup = await createLongStands({
    pitchW,
    pitchD,
    standH,
    standXLen,
    standD,
    standGapFromPitch,
    USE_STAND_TEXTURE,
    concrete: assets.concrete,
    USE_ROOF_TEXTURE,
    roofDiff: assets.roofDiff,
  });
  stadium.add(standsGroup);

  // =========================
  // FLOODLIGHTS
  // =========================
  const floods = createFloodlights({ pitchW, pitchD });
  floods.position.y = 0;
  stadium.add(floods);
  stadium.userData.floodlights = floods;
  floods.userData.setOn(false);

  // =========================
  // DUGOUTS
  // =========================
  await addDugouts({ stadium, pitchD });

  // =========================
  // WALLS + ROAD
  // =========================
  addWallsAndRoad({ stadium, pitchW, pitchD, margin });

  // =========================
  // PLAYERS (FBX + anim)
  // =========================
  const players = await createPlayers({ pitchW, pitchD });
  stadium.add(players);
  stadium.userData.players = players;

  // =========================
  // GLOBAL UPDATE (FLAGS + PLAYERS)
  // =========================
  stadium.userData.update = (dt) => {
    stadium.userData.flags?.userData?.update?.(dt);
    stadium.userData.players?.userData?.update?.(dt);
  };

    // =========================
  // CITY (assets rreth stadiumit)
  // =========================
  const city = await createCity({ pitchW, pitchD });
  stadium.add(city);


  return stadium;
}
