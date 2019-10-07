const color = require('color');
import Konva from 'konva';

type Bounds = {
  width: number
  height: number
  x: number
  y: number
}

type Scene = {
  color: string
  level: number
  numFoes: number
  layer: null | Konva.Layer
  start: Function
  onComplete?: Function
}

type Player = Konva.Star & {
  scenes: any
  ref: any
  score: number
  kills: number
  level: number
  scene: any
}

const colors: string[] = ['880000', 'FF0000', '008800', '00FF00', '000088', '0000FF'];
// const colors: string[] = ['FF0000',  '00FF00', '0000FF'];
const frameRate = 1/60;
let started = false;
// @ts-ignore
let _player = {}

function resetPlayer(): Player {
  for (var i in _player) 
    delete _player[i];

  _player = {};

  // @ts-ignore
  _player = {
    scenes: null,
    ref: null,
    score: 0,
    kills: 0,
    level: 0, 
    scene: null
  };

  // @ts-ignore
  return _player;
} // use a quickfix global for referencing the Player. 

function createBackdrop(stage): Konva.Layer {
  const backdrop = new Konva.Layer();
  backdrop.add(new Konva.Rect({
    id: 'backdrop',
    fill: '#000000',
    width: stage.width(),
    height: stage.height(),
    stroke: 'black', strokeWidth: 1
  }));

  return backdrop;
}

/** Setup and display the Konva.Stage. */
function createStage(): Konva.Stage {
  const container = <HTMLDivElement>document.querySelector("#game");
  const bounds = container.getBoundingClientRect();
  const dimensions = {width: 0, height: 0};

  if (bounds.width < 900) {
    dimensions.width = 600;
    dimensions.height = 400;
  }
  else {
    dimensions.width = 900
    dimensions.height = 600;
  }

  const stage = new Konva.Stage({
    ...dimensions,
    container,
    key: 'GameStage'
  });

  const backdrop = createBackdrop(stage);
  stage.add(backdrop);
  backdrop.draw();

  return stage;
}

/** Start a new instance of the game. */
function initializeGame(stage): Konva.Stage {
  const player = Player({}, stage); 
  // @ts-ignore
  const Scenes = _player.scenes = colors.reduce((scenes: Scene[], color, index) => {
    const scene: Scene = {
      color,
      level: index + 1,
      numFoes: 0,
      layer: null,
      // @ts-ignore
      start: function() {
        // @ts-ignore
        _player.level = index;
        this.layer = createScene(stage, player, color, this.level);
        this.layer.add(player);
        // debugger;
        initLayerListeners(stage, this.layer, player);
        this.layer.draw();
        this.numFoes = this.layer.children.length - 1
        // @ts-ignore
        _player.scene = this;
      },
      onComplete: function() {
        // @ts-ignore
        _player.score += player.kills;
        // @ts-ignore
        _player.kills = 0;

        if (Scenes[index - 1]) {
          // @ts-ignore object is possibly null
          Scenes[index - 1].layer.destroy();
        }

        if (Scenes[index + 1]) {
          // @ts-ignore
          Scenes[index + 1].start()
        }
        else {
          // @ts-ignore
          this.layer.destroy();
          showVictory(stage);
        }
      }
    }

    scenes.push(scene);
    return scenes;
  }, []);

  stage.draw();

  Scenes[0].start();
  return stage;
}

function showVictory(stage) {
  const text = new Konva.Text({
    text: 'The universe is safe now\n thanks to you',
    fill: 'white',
    width: stage.width(),
    align: 'center',
    fontSize: 40
  });

  const win = new Konva.Text({
    text: 'YOU WIN',
    fill: 'cyan',
    width: stage.width(),
    align: 'center',
    fontSize: 75
  });

  const layer = new Konva.Layer();
  layer.add(text);
  layer.add(win);
  stage.add(layer);
  layer.draw();
  stage.batchDraw();
}

/** Show a title card, then the first scene. */
export default function startGame(audio): void {
  const stage = createStage();
  const layer = new Konva.Layer();
  const titlecard = new Konva.Text({
    text: 'Starlight',
    width: stage.width(),
    y: 30,
    align: 'center',
    fill: 'white',
    sroke: 'cyan', 
    fontFamily: 'Impact',
    letterSpacing: 15,
    fontSize: 90,
    shadowColor: '#aaa',
    shadowOffset: {x: 3, y: 5}
  });

  const instructions = new Konva.Text({
    text: getInstructionText(),
    width: stage.width(),
    fontFamily: 'Tahoma',
    letterSpacing: 3,
    align: 'center',
    fill: 'white',
    y: 60 + titlecard.height(),
    fontSize: 22
  });

  layer.add(titlecard);
  layer.add(instructions);
  stage.add(layer);
  layer.draw();

  stage.on('keydown click', function(event) {
    // @ts-ignore
    if (started)
      return;

    initializeAudio(audio);

    // @ts-ignore
    started = true;
    layer.destroyChildren();
    layer.destroy();
    stage.draw();
    initializeGame(stage);
  });
}

/** Start the music for the game if compatible with Browser. */
function initializeAudio(audio) {
  if (audio)
    // @ts-ignore;
    window.audio = audio

  if (!audio.playing && typeof audio.play == 'function')
    audio.play();
}

/** Display the text on titlecard for how to play. */
function getInstructionText(): string {
  return `
    You are a galactic empire condensed into a single star.\n
    The arch nemesis, COLOR, has split itself into thousands of pieces.\n
    It is your noble duty to DESTROY ALL COLOR\n
    use the Arrow keys to move your starship\n
    press Spacebar to fire your lazer\n
    CLICK TO START
  `;
}

/** Assign keydown listeners for movement. */
function initLayerListeners(stage: Konva.Stage, layer: Konva.Layer, player: Player) {
  // @ts-ignore
  const container = stage.getContainer();
  container.tabIndex = 1;
  container.focus();
  container.addEventListener('keydown', function(event) {
    event.preventDefault();
    // debugger;

    const ARROWS = [37, 38, 39, 40];
    if (ARROWS.includes(event.keyCode))
      updatePosition(event, player);
    else if (event.keyCode == 32) // spacebar
      createLazzer(player, layer);
    
    // @ts-ignore
    const bounds = player.getClientRect();
    layer.children.each(function(child) {
      if (child.name() != 'npc' || !player || !child) 
        return;

      checkCollision(player, child);
    });

    layer.batchDraw();
  });
}

/** Shoots a lazzerbeam from teh head of teh player. */
function createLazzer(player: Player, layer: Konva.Layer): Konva.Circle {
    // @ts-ignore
  const theta = player.rotation();
  // @ts-ignore
  const fill = _player.level > 0 ? '#' + colors[_player.level - 1] : '#ffffff;'
  const circle = {
    radius: 1,
    x: player.x(),
    y: player.y(),
    name: 'lazzer',
    width: 2,
    height: 10,
    fill: fill,
    stroke: 'white'
  }

  const lazzer = new Konva.Circle(circle);
  layer.add(lazzer);

  const speed = 10;

  const clearLazzer = setInterval(function moveLazzer() {
      // @ts-ignore;
     if (isOutOfBounds(lazzer, layer.getStage())) {
        // @ts-ignore
        lazzer.destroyed = true;
        clearTimeout(clearLazzer)
        return lazzer.destroy();
     }

     let x = lazzer.x();
     let y = lazzer.y();

     if (theta <= 0 && theta < 90)
       lazzer.y(y - speed);
     if (theta <= 90 && theta < 180)
       lazzer.x(x - speed);
     if (theta <= 180 && theta < 270)
       lazzer.y(y + speed);
     if (theta <= 270 && theta < 360)
       lazzer.x(x + speed);

     layer.draw();

     layer.children.each(function(child) {
      if (child == lazzer || child == player)
        return;
 
      checkCollision(lazzer, child);
     });
  }, frameRate * 1000);

  layer.draw();

  return lazzer;
}

function checkCollision(node1, node2) {
   if (hasIntersection(node1.getClientRect(), node2.getClientRect())) {
     handleCollision(node1, node2);
   }
 }

/** Creates opponents for a new scene based on color. */
function createScene(stage, player, color, level): Konva.Layer {
  const layer = new Konva.Layer();
  const npcs = createFoes(stage, player, color, level);
  npcs.forEach((n) => layer.add(n));
  stage.add(layer);
  layer.draw();
  return layer;
}

function createFoes(stage, player, color, level): Konva.Rect[] {
  const qty = Math.pow(level, 2) + randomNumber(level, level * 2);
  const npcs: Konva.Rect[] = [];
  for (var id = 0; id < qty; id++)
    npcs.push(createNPC({color, id}, stage, player));

  return npcs;
}

/** Create a square color Foe. */
function createNPC(props = {}, stage, player): Konva.Rect {
  const x = randomNumber(0, stage.width());
  const y = randomNumber(0, stage.height());
  const rect = Object.assign({
    // @ts-ignore
    id: props.id,
    x, 
    y,
    name: 'npc',
    width: 40,
    height: 40,
    stroke: 'white',
    // @ts-ignore,
    fill: "#" + props.color,
  }, props);

  if (isNearPlayer(player, rect)) // Create a safe space around the player. 
    return createNPC(props, stage, player);
 
  const npc = new Konva.Rect(rect);
  maintainBounds(npc, stage);
  npc.cache();

  // setTimeout(() => teleport(npc, player), randomNumber(3000,6000));
  setTimeout(() => maybeTeleport(npc, player), randomNumber(1000,4000))

  return npc;
}

/** Change the location of the node. */
function teleport(node, player, x, y, layer, stage) {
  const duration = 0.5
  const move = new Konva.Tween({
    node, 
    x,
    y,
    duration
  });

  move.play();
  setTimeout(() => maybeTeleport(node, player), duration + randomNumber(3000,6000));
}

function maybeTeleport(node, player) {
  const layer =node.getLayer()
  const stage = layer.getStage();
  const x = randomNumber(0, stage.width());
  const y = randomNumber(0, stage.height());
  const bounds = {
    x,
    y,
    width: node.width(),
    height: node.height()
  }

  if (isNearPlayer(player, bounds))
    return maybeTeleport(node, player);
  else 
    return teleport(node, player, x, y, layer, stage)
}

/** Determines if the target node is off the visible portion of stage */
function isOutOfBounds(node, stage): boolean {
  if (!node || !stage)
    return true;

  const x = node.x();
  const y =  node.y();
  const width = node.width();
  const height = node.height();

  return (
    x - width < 0 || 
    x + width > stage.width() ||
    y - height < 0 ||
    y + height > stage.height())
}

/** Updates node bounds in place to stay on canvas. */
function maintainBounds(node, stage): Konva.Node {
  if (!stage || !node) 
    return node; // resetting the game;


  if (!isOutOfBounds(node, stage))
    return node;

  const x = node.x();
  const y =  node.y();
  const width = node.width();
  const height = node.height();
  if (x - width < 0)
    node.x(x + width/2);

  if (x + width > stage.width())
    node.x(x - node.width/2);

  if (y - height < 0)
    node.y(y + node.height/2);

  if (y + height > stage.height())
    node.y(y - node.height/2);

  return node;
}

function isNearPlayer(player, item: Bounds): boolean {
  const playerBounds = player.getClientRect();
  playerBounds.width += item.width * 2;
  playerBounds.height += item.height * 2;
  playerBounds.x -= item.width;
  playerBounds.y -= item.height;

  return hasIntersection(playerBounds, item);
}

/** Animate the background from dark to light. */
function updateBackground(player): void {
  const stage = player.getStage();
  if (!stage)
    return; // quickfix
  const backdrop = stage.find('#backdrop')[0];
  const fill = "#" + colors[player.numPoints() - 4];
  const tween = getTween(backdrop, 4, {fill});
  tween.play();
}

function checkStageComplete() {
  // @ts-ignore;
  if (_player.kills == _player.scene.numFoes) {
    // @ts-ignore
    _player.scene.onComplete();
  }
}

/** Controller for player collision. */
function handleCollision(attacker, defender): void {
  if (attacker.name() == 'lazzer' || attacker.name() == 'player') {
    destroy(defender);

    if (!defender.destroyed) {
      defender.destroyed = true;

      if (attacker.name() == 'lazzer') {
        attacker.destroy();
      }
      
      // @ts-ignore;
      _player.kills++;
      checkStageComplete();
      updateBackground(attacker);
    }
  }
}

/** Trigger endgame for the player. */
function endGame(player, defender): void {
  const stage = player.getStage();
  player.destroy();
  resetPlayer();
  setTimeout(() => {
    started = false;
    stage.destroy();
    // @ts-ignore
    startGame(window.audio);

  }, 1200);
}

/** Parse an attacker for victory or defeat. */
function checkAttack(attacker, defender): boolean {
  if (defender.destroyed)
    return false;

  return attacker.name() == 'lazzer';

  if (defender.id() == 'destroyed') 
    return true; 
  /**
   * The Konva.Shape.Star has a default getter/setter #numPoints.
   * To play nice with Konva out of the box, use this method
   * to update on draw callbacks. numPoints() starts at 4 by default. 
   */ 
  // const numWins = player.numPoints() - 4;
  
  // Colors must be attackered in order of the rainbow (same order as colors array);
  // return numWins == defender.id();
}

/** Remove a node from gameplay. */
function destroy(node): void {
  const duration = 0.3; // seconds
  const tween = getRandomTween(node, duration);
  tween.play();
  setTimeout(() => node.destroy(), duration * 1000);
}

/** Provides a tween with intentional props. */
function getTween(node, duration, props): Konva.Tween {
  return getRandomTween(node, duration, Object.assign({
    width: node.width(),
    height: node.height(),
    x: node.x(),
    y: node.y()
  }, props));
}

/** Get parameters for an objects kill animation. */
function getRandomTween(node, duration = 0.3, props = {}): Konva.Tween {
  const stage = node.getStage();
  const x = randomNumber(0, stage.width());
  const y = randomNumber(0, stage.height());
  const tween = new Konva.Tween(Object.assign({
    x, 
    y,
    duration,
    node,
    width: 0,
    height: 0,
    easing: Konva.Easings[getRandomEasing()]
  }, props));

  return tween;
}

/** Fetch one of Konva's easings. */
function getRandomEasing(): string {
  const easings = Object.keys(Konva.Easings);
  return easings[randomNumber(0, easings.length)];
}

/** Detect collision between Bounds of two objects. */
function hasIntersection(rect1, rect2): boolean {
  return !(
    rect2.x > rect1.x + rect1.width ||
    rect2.x + rect2.width < rect1.x ||
    rect2.y > rect1.y + rect1.height ||
    rect2.y + rect2.height < rect1.y
  );
}
/** Parse a keystroke into a player movement; update the player position. */
function updatePosition(event, object): void {
  const MOTION = 10;
  if (event.keyCode === 37) {
    object.x(object.x() - MOTION);
  } else if (event.keyCode === 38) {
    object.y(object.y() - MOTION);
  } else if (event.keyCode === 39) {
    object.x(object.x() + MOTION);
  } else if (event.keyCode === 40) {
    object.y(object.y() + MOTION);
  } else {
    return;
  }
}

/** Generate a random integer between min and max. */
function randomNumber(min = 0, max = 1): number {
  const num = Math.random() * (max - min) + min;
  return Math.floor(num);
}

/** Create the player Star. */
function Player(props = {}, stage): any {
  resetPlayer();
  const star = Object.assign(props, {
    x: stage.width() / 2,
    y: stage.height() / 2,
    innerRadius: 10,
    outerRadius: 30,
    numPoints: 4,
    fill: '#000000',
    stroke: '#ffffff',
    strokeWidth: 4,
    name: 'fillShape',
    rotate: 0,
    shadowColor: '#ddd',
    shadowOffset: {x: 2, y:3},
    shadowBlur: 2
  });

  // @ts-ignore
  const player = new Konva.Star(star);
  _player = Object.assign({}, player, _player);
  return player;
}

/** Combine two hex color values to a new hex color. */
function addHexColor(c1, c2): string {
  c1 = c1.replace('#', '');
  c2 = c2.replace('#', '');

  if (c1.length == 3)
    c1 += c1

  if (c2.length == 3)
    c2 += c2

  const extract = (str, start) => parseInt(str.slice(start, start + 2));
  const pad = (num) => num.length < 2 ? '0' + num : num;
  const r1 = extract(c1, 0);
  const r2 = extract(c2, 0);
  const g1 = extract(c1, 2);
  const g2 = extract(c2, 2);
  const b1 = extract(c1, 4);
  const b2 = extract(c2, 4);
  // @ts-ignore
  let r = parseInt(r1 + r2).toString(16);
  // @ts-ignore
  let g = parseInt(g1 + g2).toString(16);
  // @ts-ignore
  let b = parseInt(b1 + b2).toString(16);

  // Use `|| '00'` because 0 + 0 to.string() is 0 and results in too few characters.
  return `#${pad(r)}${pad(g)}${pad(b)}`; 
}