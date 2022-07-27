const express = require("express");
const socketIo = require("socket.io");
const http = require("http");
const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
  },
}); //in case server and client run on different urls

let players = [];

io.on("connection", (socket) => {
  console.log("new connexion:", socket.id);
  socket.join("room");

  socket.on("setupPlayer", (data) => {
    console.log("setupPlayer data :", data);
    const newPlayer = {
      id: socket.id,
      position: data.position,
      anim: data.anim,
      flipX: false,
    };
    players.push(newPlayer);
    console.log("added player :", newPlayer);
    const otherPlayers = players.filter((player) => {
      return player.id !== socket.id;
    });
    socket.emit("initialPlayers", otherPlayers);
    socket.broadcast.to("room").emit("playerJoin", newPlayer);
  });

  socket.on("disconnect", () => {
    players = [...players].filter((player) => player.id !== socket.id);
    io.to("room").emit("playerLeave", socket.id);
  });

  socket.on("updatePlayer", (data) => {
    const updatedPlayer = { ...data, id: socket.id };
    //console.log("player ask for update:", updatedPlayer);
    players.forEach((player) => {
      if (player.id === updatedPlayer.id) {
        player.position = updatedPlayer.position;
        player.anim = updatedPlayer.anim;
        player.flipX = updatedPlayer.flipX;
      }
    });
    //console.log("Updated players : ", players);
    socket.broadcast.to("room").emit("updatePlayer", updatedPlayer);
  });

  socket.on("newMessage", (data) => {
    io.to("room").emit("newMessage", data);
  });
});

server.listen(PORT, (err) => {
  if (err) console.log(err);
  console.log("Server running on Port ", PORT);
});
