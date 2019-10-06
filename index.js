import GameStage from './GameStage';

console.log("Initializing the game: ");
const initGame = {
  data: [
    {
      type: 'character',
      x: 60, 
      y: 60
    }
  ]
}

function updateStyle() {
  const style = document.createElement('style');
  style.innerText = `
    body {
      background: black;
    }
    .konvajs-content {
      margin: 0 auto;
    }
  `

  document.body.appendChild(style)
}

updateStyle();
GameStage(initGame);
