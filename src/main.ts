//// c:/programming/exGraph/src/main.ts
//// Main entry point for Excalibur

import "./style.css";
import { UI } from "@peasy-lib/peasy-ui";
import { Engine, DisplayMode, TileMap, ImageSource, SpriteSheet, Camera, Vector, Actor, EasingFunctions, Loader } from "excalibur";
//import { AdjacencyList, GraphTileMap } from "./graphs";
import { ExcaliburGraph, GraphTileMap } from "@excaliburjs/excalibur-graph";
import { Resources, rlSS } from "./resourcses";
import { Tree, tiles } from "./tiledata";
import { player } from "./player";

// setup Peasy-UI for dom rendering
// data model
export const model = {
  hudWidth: 800,
  hudHeight: 600,
  currentTileIndex: 0,
  targetTileIndex: 0,
  movesRemaining: 0,
  showHUD: false,
  showWarning: false,
  warningColor: "white",
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
        pointer-events: none;
          
    }
    hud-flex {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        pointer-events: none;
    }
    #current, #target, #remaining {
        font-size: 30px;
        margin: 5px;
    }
    #target {
      color: \${warningColor};
    }
    #warning {
        color: red;
        width: 100%;
        text-align: center;
        font-size: 30px;
        position: fixed;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        pointer-events: none;
      }
</style> 
<div> 
    <canvas id='cnv'> </canvas> 
    <hud-layer>
        <hud-flex>
          <div id='current' \${===showHUD}>Current Tile: \${currentTileIndex} </div>
          <div id='target' \${===showHUD}>Target Tile: \${targetTileIndex} </div>
          <div id='remaining' \${===showHUD}>Moves Remaining: \${movesRemaining} </div>
        </hud-flex>
        <div id='warning' \${===showWarning}>CLICKING A TREE WILL BE IGNORED</div>
    </hud-layer>
    
</div>`;
await UI.create(document.body, model, template).attached;

//create Excalibur game
export const game = new Engine({
  width: 800, // the width of the canvas
  height: 600, // the height of the canvas
  canvasElementId: "cnv", // the DOM canvas element ID, if you are providing your own
  displayMode: DisplayMode.Fixed, // the display mode
  pixelArt: true,
});

const loader = new Loader();
for (const resource of Object.values(Resources)) loader.addResource(resource);

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
let myGraph = new ExcaliburGraph();
let myGraphTileMap: GraphTileMap = {
  name: "myGraph",
  tiles: [...tiles],
  rows: 10,
  cols: 10,
};
myGraph.addTileMap(myGraphTileMap);

// start game, add tilemap, and actor
await game.start(loader);
//show HUD layer, hidden by default
model.showHUD = true;
game.add(tilemap);
game.currentScene.camera.pos = new Vector(80, 80);
game.currentScene.camera.zoom = 3;
game.add(player);

// setup click event for each tile
game.input.pointers.primary.on("down", evt => {
  // gaurd conditions----------------------------------------
  // if you click outside of the tilemap, bail
  // if you click while moving, bail
  // if you click a tree, warn user and bail
  if (evt.worldPos == undefined) return;
  if (player.playerActionStatus == "moving") return;

  //get tile that was clicked
  const tile = game.currentScene.tileMaps[0].getTileByPoint(evt.worldPos);
  if (tile) model.targetTileIndex = tile.x + tile.y * 10;

  // gaurd condition
  if (tiles[model.targetTileIndex] instanceof Tree) {
    showWarning();
    return;
  }

  //get player tile
  const playerTile = game.currentScene.tileMaps[0].getTileByPoint(player.pos);
  let playerTileIndex = 0;
  if (playerTile) playerTileIndex = playerTile.x + playerTile.y * 10;
  let targetTileIndex = 0;
  if (tile) targetTileIndex = tile.x + tile.y * 10;
  const path = myGraph.shortestPath(myGraph.nodes.get(`${playerTileIndex}`)!, myGraph.nodes.get(`${targetTileIndex}`)!);

  // set the HUD data for moves remaining
  model.movesRemaining = path.length - 1;
  // don't push the player's current tile, so we start at index 1
  for (let i = 1; i < path.length; i++) {
    const nxtPath = path[i];
    player.playerActionBuffer.push(parseInt(nxtPath.name));
  }
});

// Utility function that manages the data model
// for peasy to flash the warning on the HUD
function showWarning() {
  model.showWarning = true;
  model.warningColor = "red";
  setTimeout(() => {
    model.showWarning = false;
    model.warningColor = "white";
  }, 2000);
}
