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

/** Setup and display the Konva.Stage. */
export default function GameStage(props): Konva.Stage {
  const dimensions = {width: 600, height: 400};
  const stage = new Konva.Stage({
    ...dimensions,
    container: 'game',
    key: 'GameStage',
    onClick: (e) => {console.log("click", e)}
  });

  const init: any[] = props.data.filter(d => d.type == 'character');
  const characters = [];
  const layer = new Konva.Layer();
  const outline = new Konva.Layer();
  const player = Player({}, stage);
  const container = stage.container();
  const npcs = colors.map((color, id) => createNPC({color, id}, stage, [player]));

  npcs.forEach((node) => layer.add(node));
  
  // Create the visible bounding box for the canvas. 
  outline.add(new Konva.Rect({...dimensions, stroke: 'black', strokeWidth: 1}))
  stage.add(layer);
  stage.add(outline);
  outline.draw();

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
    layer.children.each(function(defense) {
      // @ts-ignore 
      if (defense == player) // Do not collide with self.
        return;
      // @ts-ignore
      const bounds2 = defense.getClientRect();
      if (hasIntersection(bounds, bounds2)) {
        return handleIntersection(player, defense);
      }
    });

    layer.batchDraw();
  });

  return stage;
}

/** Animate the background from dark to light. */
function updateBackground(player): void {
  const stage = player.getStage();
  const fill = colors[player.numPoints() - 4];
  const tween = getRandomTween(stage, 2, {fill});
  tween.play();
}

/** Controller for player collision. */
function handleIntersection(attack, defense): boolean {
 const approved = checkAttack(attack, defense);
  if (approved) {
    destroy(defense);
    updateBackground(attack);
    attack.numPoints(attack.numPoints() + 1);
  }
  else {
    endGame(attack, defense);
  }

  return approved;
}

/** Trigger endgame for the player. */
function endGame(player, defense): void {
  console.log("Player: " , player);
  console.log("defense", defense);
  alert("You lose.");
  destroy(player);
  setTimeout(() => window.location.reload(), 1100);
}

/** Parse an attack for victory or defeat. */
function checkAttack(player, defense): boolean {
  if (defense.id() == 'destroyed') 
    return true; 
  /**
   * The Konva.Shape.Star has a default member #numPoints.
   * To play nice with Konva out of the box, use this getter/setter
   * for auto updates. #numPoints starts at 4 by default. 
   */ 
  const numWins = player.numPoints() - 4;
  
  // Colors must be attacked in order of the rainbow (same order as colors array);
  return numWins == defense.id();
}

/** Remove a node from gameplay. */
function destroy(node): void {
  const duration = 0.3; // seconds
  const tween = getRandomTween(node, duration);
  tween.play();
  setTimeout(() => node.destroy(), duration * 1000);
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
  const circle = Object.assign(props, {
    x: stage.width() / 2,
    y: stage.height() / 2,
    innerRadius: 10,
    outerRadius: 30,
    numPoints: 4,
    fill: '#fff',
    stroke: '#000',
    strokeWidth: 4,
    name: 'fillShape',
  });

  const player = new Konva.Star(circle); 
  return player;
}

/** Combine two hex color values to a new hex color. */
function addHexColor(c1, c2): string {
  let num = (parseInt(c1, 16) + parseInt(c2, 16)).toString();
  while (num.length < 6) { num = '0' + num; }
  return num;
}