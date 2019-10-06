import color from 'color;'
import Konva from 'konva';
import Character from './Character';

const colors: string[] = ['880000', 'FF0000', '008800', '00FF00', '000088', '0000FF'];
getRandomEasing();

const oscillator = 1

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
export default function GameStage(props): Konva.Stage {
  const dimensions = {width: 600, height: 400};
  const stage = new Konva.Stage({
    ...dimensions,
    container: 'game',
    key: 'GameStage'
  });

  const backdrop = createBackdrop(stage);
  const player = Player({}, stage);
  const container = stage.container();

  npcs.forEach((node) => layer.add(node));
  stage.add(backdrop);
  stage.add(layer);
  backdrop.draw();

  // Craete the player shape. 
  container.tabIndex = 1;
  container.focus();
  container.addEventListener('keydown', function(event) {
    event.preventDefault();
    // @ts-ignore

    updatePosition(event, player);
    // @ts-ignore;

    const bounds = player.getClientRect();
    layer.children.each(function(defender) {
      // @ts-ignore 
      if (defender == player) // Do not collide with self.
        return;
      // @ts-ignore
      const bounds2 = defender.getClientRect();
      if (hasIntersection(bounds, bounds2)) {
        return handleIntersection(player, defender);
      }
    });

    layer.batchDraw();
  });

  return stage;
}

const scene(stage, player, color, level): Konva.Layer {
  const layer = new Konva.Layer();
  const npcs = createFoes(stage, color, level);
  layer.add(player);
  layer.draw();
}

function createFoes(stage, color, level): Konva.Rect[] {
  const numFoes = Math.pow(level, 2) + randomNumber(level, level * 2);
  const npcs = [];
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
    width: 40,
    height: 40,
    stroke: 'white',
    // @ts-ignore,
    fill: "#" + props.color,
    name: 'fillShape'
  }, props);

  if ((rect.x - rect.width) < 0)
    rect.x += rect.width/2

  if ((rect.x + rect.width) > stage.width())
    rect.x -= rect.width/2

  if ((rect.y - rect.height) < 0)
    rect.y += rect.height/2

  if ((rect.y + rect.height) > stage.height())
    rect.y -= rect.height/2

  if (isNearPlayer(player, rect)) // Create a safe space around the player. 
    return createNPC(props, stage, player);
 
  const npc = new Konva.Rect(rect);
  npc.cache();

  const velocity = randomNumber(50, 150);
  const anim = new Konva.Animation(function(frame) {
    const dist = velocity * (frame.timeDiff / 1000);
    // @ts-ignore
    const direction = (parseInt(npc.id()) + player.numPoints()) % 2 ? 'x' : 'y';
    npc[direction](dist); // Repositions the element, affects collision.

    if (npc.x() + npc.width() > stage.width())
      npc.x(-npc.width()); // horizontal overflow

    if (npc.y() + npc.height() > stage.height())
      npc.y(-npc.height()); // vertical overflow
  });

  anim.start();

  return npc;
}

function isNearPlayer(playerBounds: Bounds, item: Bounds): boolean {
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
function handleIntersection(attacker, defender): boolean {
 const approved = checkAttack(attacker, defender);
  if (approved) {
    destroy(defender);
    updateBackground(attacker);
    // updatePlayerColor(attacker);
    attacker.numPoints(attacker.numPoints() + 1);
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
  setTimeout(() => window.location.reload(), 1100);
}

/** Parse an attacker for victory or defeat. */
function checkAttack(player, defender): boolean {
  if (defender.id() == 'destroyed') 
    return true; 
  /**
   * The Konva.Shape.Star has a default member #numPoints.
   * To play nice with Konva out of the box, use this getter/setter
   * for auto updates. #numPoints starts at 4 by default. 
   */ 
  const numWins = player.numPoints() - 4;
  
  // Colors must be attackered in order of the rainbow (same order as colors array);
  return numWins == defender.id();
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
    shadowColor: '#ddd',
    shadowOffset: {x: 2, y:3},
    shadowBlur: 2
  });

  const player = new Konva.Star(star); 

  const anim = new Konva.Animation(function(frame) {
    const rotation = frame.frameRate / 1000 || 0;
    // @ts-ignore
    player.rotate(rotation);
    player.draw()
  });

  anim.start()

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