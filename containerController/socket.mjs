import express from "express";
const app = express();
import http from "http";
const server = http.createServer(app);
import { Server } from "socket.io";
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

import { Docker } from "node-docker-api";
import fetch from "node-fetch";

class taskHandler {
  constructor() {
    this.tasks = [];
    this.docker = new Docker({ socketPath: "/var/run/docker.sock" });
    this.nodes = [];

    this.updateNodes();

    setInterval(() => {
      this.doWork();
    }, 1);  
  }

  addTask(work, userID, callback) {
    this.tasks = [
      {
        work,
        userID,
        callback,
      },
      ...this.tasks,
    ];
  }

  async updateNodes() {
    var containers = await this.docker.container.list();

    for (var i = 0; i < containers.length; i++) {
      var status = await containers[i].status();

      if (status.data.Name.includes("/containercode")) {
        this.nodes.push({
          url: `http://${status.data.NetworkSettings.Networks.containercode_default.IPAddress}:3000`,
          working: false,
        });
      }
    }
  }

  async doWork() {
    if (this.tasks.length > 0) {
      var searching = true;
      var i = 0;
      while (searching && i < this.nodes.length) {
        if (!this.nodes[i].working) {
          searching = false;

          console.log("work issued to", this.nodes[i].url)

          this.nodes[i].working = true;
          var task = this.tasks.pop();

          var response = await fetch(`${this.nodes[i].url}?code=${encodeURI(task.work)}`);
          response = await response.text();
          this.nodes[i].working = false;
          task.callback(response);
        }
        i++;
      }
    }
  }

  printTasks() {
    console.log(this.tasks);
  }
}

app.get("/", (req, res) => {
  res.sendFile(
    "/home/ben/Documents/SpeedCodeNode/containerController/index.html"
  );
});

var handler = new taskHandler();

io.on("connection", (socket) => {

  socket.emit("result", "You are connected to SpeedCode!")

  socket.on("work", (msg) => {
    handler.addTask(msg, socket.id, function (result) {
      socket.emit("result", result);
    });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
