//// c:/programming/exGraph/src/main.ts
//// Main entry point for Excalibur

import "./style.css";
import { UI } from "@peasy-lib/peasy-ui";
import { Engine, DisplayMode, TileMap, ImageSource, SpriteSheet, Camera, Vector, Actor, EasingFunctions } from "excalibur";
import roguelikess from "./assets/roguelike.png";
import dude from "./assets/dude.png";
import { AdjacencyList, GraphTileMap } from "./graphs";

// import assets and load into Excalibur
const kennyRougeLikePack = new ImageSource(roguelikess);
await kennyRougeLikePack.load();
const rlSS = SpriteSheet.fromImageSource({
  image: kennyRougeLikePack,
  grid: { columns: 57, rows: 31, spriteHeight: 16, spriteWidth: 16 },
  spacing: { margin: { x: 1, y: 1 } },
});

const plrImage = new ImageSource(dude);
await plrImage.load();

// setup Peasy-UI for dom rendering
// data model
const model = {
  hudWidth: 800,
  hudHeight: 600,
  currentTileIndex: 0,
  targetTileIndex: 0,
  movesRemaining: 0,
};

// dom template with bindings
const template = `
<style> 
    canvas{ 
        position: fixed; 
        top:50%; 
        left:50%; 
        transform: translate(-50% , -50%); 
    }
    hud-layer{
        position: fixed;
        top:50%;
        left:50%;
        transform: translate(-50%,-50%);
        width: \${hudWidth}px;
        height: \${hudHeight}px;
        border: 1px solid black; 
        display: flex;
        justify-content: space-between;
        pointer-events: none;
        gap: 10px;   
    }
    #current, #target, #remaining {
        font-size: 30px;
        margin: 5px;
    }
</style> 
<div> 
    <canvas id='cnv'> </canvas> 
    <hud-layer>
        <div id='current'>Current Tile: \${currentTileIndex} </div>
        <div id='target'>Target Tile: \${targetTileIndex} </div>
        <div id='remaining'>Moves Remaining: \${movesRemaining} </div>
    </hud-layer>
</div>`;
await UI.create(document.body, model, template).attached;

//create Excalibur game
const game = new Engine({
  width: 800, // the width of the canvas
  height: 600, // the height of the canvas
  canvasElementId: "cnv", // the DOM canvas element ID, if you are providing your own
  displayMode: DisplayMode.Fixed, // the display mode
  pixelArt: true,
});

// for tilemap creation, create tiles with a sprite info and
// a collider setting for Graph parsing
class Grass {
  sprite = [5, 0];
  collider: boolean = false;
}

class Tree {
  sprite = [13, 9];
  collider: boolean = true;
}

// create and configure player, and his action buffer
const playerActionBuffer: any = [];
let playerActionStatus = "idle"; //"moving"

let player = new Actor({
  pos: new Vector(8, 8),
  width: 16,
  height: 16,
});

player.graphics.use(plrImage.toSprite());

// post update routine that cycles through action buffer and exectues moves
player._postupdate = () => {
  if (playerActionBuffer.length > 0) {
    if (playerActionStatus == "idle") {
      playerActionStatus = "moving";

      // monitor player move completion from
      // game events
      game.events.on("playerMoveComplete", () => {
        // this updates the HUD with the next tile data
        model.currentTileIndex = nextTile;
        playerActionStatus = "idle";
      });

      // get next tile off action buffer and moveTo
      const nextTile = playerActionBuffer.shift();
      moveToTile(nextTile);
    }
  } else {
    // action buffer empty, reset
    playerActionStatus = "idle";
  }
};

// load tiles array with tiles, doing this separately so that i can
// a-> use it for Excalibur's tilemap
// and b-> pass it to Graph for pathfinding
const tiles = [
  new Grass(),
  new Grass(),
  new Grass(),
  new Tree(),
  new Grass(),
  new Tree(),
  new Tree(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Tree(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Tree(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Tree(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Tree(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Tree(),
  new Grass(),
  new Tree(),
  new Tree(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Tree(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Tree(),
  new Grass(),
  new Tree(),
  new Grass(),
  new Grass(),
  new Tree(),
  new Grass(),
  new Tree(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Tree(),
  new Grass(),
  new Tree(),
  new Tree(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Tree(),
  new Grass(),
  new Grass(),
  new Grass(),
  new Grass(),
];

// Create a tilemap
const tilemap = new TileMap({
  rows: 10,
  columns: 10,
  tileWidth: 16,
  tileHeight: 16,
});

// loop through tilemap cells
let tileIndex = 0;
for (let tile of tilemap.tiles) {
  // get sprite
  const sprite = rlSS.getSprite(tiles[tileIndex].sprite[0], tiles[tileIndex].sprite[1]);
  if (sprite) {
    // all spots gets grass, then if tree, gets tree
    tile.addGraphic(rlSS.getSprite(tiles[0].sprite[0], tiles[0].sprite[1]));
    if (tiles[tileIndex] instanceof Tree) {
      tile.addGraphic(sprite);
    }
  }
  tileIndex++;
}

// create graph
// configure graph tilemap size and pass in tiles
let myGraph = new AdjacencyList();
let myGraphTileMap: GraphTileMap = {
  name: "myGraph",
  tiles: [...tiles],
  rows: 10,
  cols: 10,
};
myGraph.addTileMap(myGraphTileMap);

// start game, add tilemap, and actor
await game.start();
game.add(tilemap);
game.currentScene.camera.pos = new Vector(80, 80);
game.currentScene.camera.zoom = 3;
game.add(player);

// setup click event for each tile
game.input.pointers.primary.on("down", evt => {
  if (evt.worldPos == undefined) return;
  if (playerActionStatus == "moving") return;

  const tile = game.currentScene.tileMaps[0].getTileByPoint(evt.worldPos);
  if (tile) model.targetTileIndex = tile.x + tile.y * 10;

  //get player tile
  const playerTile = game.currentScene.tileMaps[0].getTileByPoint(player.pos);
  let playerTileIndex = 0;
  if (playerTile) playerTileIndex = playerTile.x + playerTile.y * 10;
  let targetTileIndex = 0;
  if (tile) targetTileIndex = tile.x + tile.y * 10;
  const path = myGraph.shortestPath(myGraph.nodes.get(`${playerTileIndex}`)!, myGraph.nodes.get(`${targetTileIndex}`)!);

  model.movesRemaining = path.length - 1;
  for (let i = 1; i < path.length; i++) {
    const nxtPath = path[i];
    playerActionBuffer.push(parseInt(nxtPath.name));
  }
});

// this action event is triggered when user clics on tile,
// it accepts the next 'node' in the graph to move to
// and moves the player over time, and at end,
// emits the 'playerMoveComplete' event
function moveToTile(node: number) {
  //convert node, which is flat array index into x and y
  let x = node % 10;
  let y = Math.floor(node / 10);
  //get vector between player and tile
  let target = new Vector(x * 16 + 8, y * 16 + 8);
  player.actions.easeTo(target, 500, EasingFunctions.EaseInOutCubic);
  //delay 500 ms and then emit event for end of move
  setTimeout(() => {
    model.movesRemaining--; // this updates HUD with moves remaining data
    game.events.emit("playerMoveComplete");
  }, 500);
}
