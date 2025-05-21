const socket = io();
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const MAP_SIZE = 800;
canvas.width = MAP_SIZE;
canvas.height = MAP_SIZE;

const colors = ['red','green','blue','orange','purple','brown','pink','grey','gold','navy'];
let playerId = null;
let players = {};
let bullets = [];

function draw(){
  ctx.clearRect(0,0,MAP_SIZE,MAP_SIZE);
  for(const id in players){
    const p = players[id];
    ctx.fillStyle = colors[id.length % colors.length];
    ctx.fillRect(p.x-10, p.y-10, 20, 20);
    ctx.fillStyle = 'black';
    ctx.fillText(p.kills, p.x-5, p.y-15);
  }
  ctx.fillStyle = 'black';
  for(const b of bullets){
    ctx.fillRect(b.x-2, b.y-2, 4, 4);
  }
}

socket.on('init', (data) => {
  playerId = data.id;
  players = data.players;
  bullets = data.bullets;
  window.requestAnimationFrame(gameLoop);
});

socket.on('state', (data) => {
  players = data.players;
  bullets = data.bullets;
});

socket.on('playerJoined', (player) => {
  players[player.id] = player;
});

socket.on('playerLeft', (id) => {
  delete players[id];
});

function gameLoop(){
  draw();
  window.requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
  if(e.key === 'ArrowLeft' || e.key === 'a') socket.emit('move','left');
  if(e.key === 'ArrowRight' || e.key === 'd') socket.emit('move','right');
  if(e.key === 'ArrowUp' || e.key === 'w') socket.emit('move','up');
  if(e.key === 'ArrowDown' || e.key === 's') socket.emit('move','down');
  if(e.key === ' ' || e.key === 'Spacebar') socket.emit('shoot');
});
