const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

const players = {};
const bullets = [];
const BULLET_SPEED = 5;
const PLAYER_SPEED = 3;
const MAP_SIZE = 800;

function newPlayer(id) {
  return { id, x: Math.random() * MAP_SIZE, y: Math.random() * MAP_SIZE, dir: 'down', health: 3, kills: 0 };
}

io.on('connection', (socket) => {
  players[socket.id] = newPlayer(socket.id);
  socket.emit('init', { id: socket.id, players, bullets });
  socket.broadcast.emit('playerJoined', players[socket.id]);

  socket.on('move', (dir) => {
    const player = players[socket.id];
    if (!player) return;
    player.dir = dir;
    switch (dir) {
      case 'left': player.x -= PLAYER_SPEED; break;
      case 'right': player.x += PLAYER_SPEED; break;
      case 'up': player.y -= PLAYER_SPEED; break;
      case 'down': player.y += PLAYER_SPEED; break;
    }
    player.x = Math.max(0, Math.min(MAP_SIZE, player.x));
    player.y = Math.max(0, Math.min(MAP_SIZE, player.y));
  });

  socket.on('shoot', () => {
    const player = players[socket.id];
    if (!player) return;
    bullets.push({ x: player.x, y: player.y, dir: player.dir, owner: socket.id });
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    io.emit('playerLeft', socket.id);
  });
});

setInterval(() => {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    switch (bullet.dir) {
      case 'left': bullet.x -= BULLET_SPEED; break;
      case 'right': bullet.x += BULLET_SPEED; break;
      case 'up': bullet.y -= BULLET_SPEED; break;
      case 'down': bullet.y += BULLET_SPEED; break;
    }
    if (bullet.x < 0 || bullet.x > MAP_SIZE || bullet.y < 0 || bullet.y > MAP_SIZE) {
      bullets.splice(i, 1);
      continue;
    }
    for (const id in players) {
      if (id === bullet.owner) continue;
      const p = players[id];
      if (Math.abs(bullet.x - p.x) < 10 && Math.abs(bullet.y - p.y) < 10) {
        p.health -= 1;
        if (p.health <= 0) {
          if (players[bullet.owner]) players[bullet.owner].kills += 1;
          p.health = 3;
          p.x = Math.random() * MAP_SIZE;
          p.y = Math.random() * MAP_SIZE;
        }
        bullets.splice(i, 1);
        break;
      }
    }
  }
  io.emit('state', { players, bullets });
}, 1000 / 30);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('listening on ' + PORT));
