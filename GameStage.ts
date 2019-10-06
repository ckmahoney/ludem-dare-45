const color = require('color');
import Konva from 'konva';
import Character from './Character';

const colors: string[] = ['880000', 'FF0000', '008800', '00FF00', '000088', '0000FF'];
const frameRate = 1/60;

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
  complete: boolean
  layer: null | Konva.Layer
  start: Function
  onComplete?: Function
}

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
  const dimensions = {width: 600, height: 400};
  const stage = new Konva.Stage({
    ...dimensions,
    container: 'game',
    key: 'GameStage'
  });

  const backdrop = createBackdrop(stage);
  const container = stage.container();

  stage.add(backdrop);
  backdrop.draw();

  return stage;
}

/** Start a new instance of the game. */
function initializeGame(stage): Konva.Stage {
  const player = Player({}, stage); 
  // @ts-ignore
  const Scenes = colors.reduce((scenes: Scene[], color, index) => {
    const scene: Scene = {
      color,
      level: index + 1,
      numFoes: 0,
      layer: null,
      complete: false,
      // @ts-ignore
      start: function() {
        this.layer = createScene(stage, player, color, this.level);
        this.layer.add(player);
        initLayerListeners(stage, this.layer, player)
        this.layer.draw()
      },
      onComplete:  function() {
        // Make the player's Star more pointy.
        player.numPoints(player.numPoints() + 1);

        if (Scenes[index - 1]) {
          // @ts-ignore object is possibly null
          Scenes[index - 1].layer.destroy();
        }

        if (Scenes[index + 1]) {
          // @ts-ignore
          Scenes[index + 1].start()
        }
        else {
          alert('You won!');
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

export default function startGame(): void {
  const stage = createStage();
  console.log("Started with stage", stage)
  const layer = new Konva.Layer();
  const titlecard = new Konva.Text({
    text: 'Starlight',
    x: 130,
    y: 130,
    fill: 'white',
    sroke: 'cyan', 
    fontSize: 60,
    shadowColor: '#aaa',
    shadowOffset: {x: 3, y: 5}
  });

  const instructions = new Konva.Text({
    text: getInstructionText(),
    x: 30,
    y: 200,
    fill: 'white',
    fontSize: 16
  });

  layer.add(titlecard);
  layer.add(instructions);
  stage.add(layer);
  layer.draw();

  // @ts-ignore
  const container = stage.getContainer();
  console.log("container", container)
  container.addEventListener('keydown click', function(event) {
    console.log("keydown")
    layer.destroy();
    initializeGame(stage);
  });
}

function getInstructionText(): string {
  return `
    You are a galactic empire condensed into a single star.\n
    The arch nemesis, COLOR, has split itself into thousands of pieces.\n
    It is your noble duty to DESTROY ALL COLOR\n
    use the arrow keys to move your starship\n
    press 'e' or 'f' to fire your lazzer\n
    spin your starship using 'w' or 'r'
  `;
}

/** Assign keydown listeners for movement. */
function initLayerListeners(stage: Konva.Stage, layer: Konva.Layer, player: Konva.Star) {
  // @ts-ignore
  const container = stage.getContainer();
  container.tabIndex = 1;
  container.focus();
  container.addEventListener('keydown', function(event) {
    event.preventDefault();
    updatePosition(event, player);

    if (event.keyCode == 18 || event.key == 'r') {
      // @ts-ignore
      const rotation = parseInt(player.rotation()) + 2;
      player.rotation(rotation).draw();
    }

    if (event.keyCode == 87 || event.key == 'w') { 
      // @ts-ignore
      const rotation = parseInt(player.rotation()) - 2;
      player.rotation(rotation);
    }

    const FIRE = [69, 70, 'e', 'f'];
    if (FIRE.includes(event.keyCode) || FIRE.includes(event.key)) {
      createLazzer(player, layer);
    }

    // @ts-ignore
    const bounds = player.getClientRect();
    layer.children.each(function(child) {
      if (child.name() != 'npc') 
        return;

      checkCollision(player, child);
    });

    layer.batchDraw();
  });
}


/** Shoots a lazzerbeam from teh head of teh player. */
function createLazzer(player: Konva.Star, layer: Konva.Layer): Konva.Circle {
  const theta = player.rotation();
  const circle = {
    radius: 1,
    x: player.x(),
    y: player.y(),
    name: 'lazzer',
    width: 2,
    height: 10,
    fill: 'white',
    stroke: 'white'
  }

  const lazzer = new Konva.Circle(circle);
  layer.add(lazzer);

  const speed = player.numPoints() - 3;
  setInterval(function moveLazzer() {
     if (isOutOfBounds(lazzer, layer.getStage())) {
        return lazzer.destroy();
     }

     let x = lazzer.x();
     let y = lazzer.y();

     if (theta == 0) 
       lazzer.y(y - speed);
     if (theta == 90)
       lazzer.x(x - speed);
     if (theta == 180)
       lazzer.y(y + speed);
     if (theta == 270)
       lazzer.x(x + speed);

     lazzer.draw();

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

  // const velocity = randomNumber(50, 150);
  // const anim = new Konva.Animation(function(frame) {
  //   const dist = velocity * (frame.timeDiff / 1000);
  //   // @ts-ignore
  //   const direction = (parseInt(npc.id()) + player.numPoints()) % 2 ? 'x' : 'y';
  //   npc[direction](dist); // Repositions the element, affects collision.

  //   maintainBounds(npc, stage);

  //   if (npc.x() + npc.width() > stage.width())
  //     npc.x(-npc.width()); // horizontal overflow

  //   if (npc.y() + npc.height() > stage.height())
  //     npc.y(-npc.height()); // vertical overflow
  // });

  // anim.start();

  return npc;
}

function isOutOfBounds(node, stage): boolean {
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
  playerBounds.width += item.width;
  playerBounds.height += item.height;
  playerBounds.x -= item.width/2;
  playerBounds.y -= item.height/2;

  return hasIntersection(playerBounds, item);
}

/** Animate the background from dark to light. */
function updateBackground(player): void {
  const stage = player.getStage();
  const backdrop = stage.find('#backdrop')[0];
  const fill = "#" + colors[player.numPoints() - 4];
  const tween = getTween(backdrop, 4, {fill});
  tween.play();
}

/** Animate the player's fill to reflect game progress. */
function updatePlayerColor(player): void {
  // const c1 = player.fill().replace('#', '');
  // const c2 = colors[player.numPoints() - 4];
  // const fill = "#" + addHexColor(c1, c2);
  // const tween = getTween(player, 4, {fill});
  // tween.play();
  // console.log("player.fill()", player.fill());
}

/** Controller for player collision. */
function handleCollision(attacker, defender): boolean {
 const approved = checkAttack(attacker, defender);

  if (approved) {
    destroy(defender);
    if (attacker.name() == 'lazzer')
      attacker.destroy();

    updateBackground(attacker);
    // updatePlayerColor(attacker);
  }
  else {
    endGame(attacker, defender);
  }

  return approved;
}

/** Trigger endgame for the player. */
function endGame(player, defender): void {
  alert("You lose.");
  destroy(player);
  debugger;
  setTimeout(() => window.location.reload(), 1100);
}

/** Parse an attacker for victory or defeat. */
function checkAttack(attacker, defender): boolean {
  return attacker.name() !== 'npc';

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
function Player(props = {}, stage): Konva.Star {
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

  const player = new Konva.Star(star); 

  // const anim = new Konva.Animation(function(frame) {
  //   const rotation = frame.frameRate / 1000 || 0;
  //   // @ts-ignore
  //   player.rotate(rotation);
  //   player.draw()
  // });

  // anim.start()

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