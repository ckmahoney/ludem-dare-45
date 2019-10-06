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

GameStage(initGame);