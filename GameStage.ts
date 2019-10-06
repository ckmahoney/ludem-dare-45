import Konva from 'konva';
import Character from './Character';

const colors: string[] = ['880000', 'FF0000', '008800', '00FF00', '000088', '0000FF'];
getRandomEasing();

/** Create a square color enemy. */
function createNPC(props = {}, stage, players: any[] = []): Konva.Rect {
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

  const npc = new Konva.Rect(rect);

  // @ts-ignore 
  if (players.some((p) => hasIntersection(p.getClientRect(), npc.getClientRect()))) {
    // change the starting location.
    return createNPC(props, stage, players); 
  }

  return npc;
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
export default function GameStage(props): Konva.Stage {
  const dimensions = {width: 600, height: 400};
  const stage = new Konva.Stage({
    ...dimensions,
    container: 'game',
    key: 'GameStage'
  });

  const backdrop = createBackdrop(stage);
  const layer = new Konva.Layer();
  const player = Player({}, stage);
  const container = stage.container();
  const npcs = colors.map((color, id) => createNPC({color, id}, stage, [player]));

  npcs.forEach((node) => layer.add(node));
  stage.add(backdrop);
  stage.add(layer);
  backdrop.draw();

  // Craete the player shape. 
  layer.add(player);
  layer.draw();
  
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
  console.log("Player: " , player);
  console.log("defender", defender);
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
  });

  const player = new Konva.Star(star); 

  const anim = new Konva.Animation(function(frame) {
    console.log('rotation', frame)
    const rotation = frame.frameRate / 1000 || 0;
    console.log("rotation", rotation);
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
  console.log(r1, r2)
  // @ts-ignore
  let r = parseInt(r1 + r2).toString(16);
  // @ts-ignore
  let g = parseInt(g1 + g2).toString(16);
  // @ts-ignore
  let b = parseInt(b1 + b2).toString(16);

  console.log("r, g, b, ", r, g, b);

  // Use `|| '00'` because 0 + 0 to.string() is 0 and results in too few characters.
  return `#${pad(r)}${pad(g)}${pad(b)}`; 
}