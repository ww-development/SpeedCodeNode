import { Docker } from "node-docker-api";
import fetch from "node-fetch";

class taskHandler {
  constructor() {
    this.tasks = [];
    this.docker = new Docker({ socketPath: "/var/run/docker.sock" });
    this.nodes = [];
  }

  addTask(work, userID, callback) {
    this.tasks = [{
      work,
      userID,
      callback,
    }, ...this.tasks];
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

          this.nodes[i].working = true;
          var task = this.tasks.pop();
          var response = await fetch(`${this.nodes[i].url}?code=${task.work}`);
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

var handler = new taskHandler();

async function main() {
  await handler.updateNodes();

  handler.addTask('import time; time.sleep(1); print("hi")', 1, function (result) {console.log(result)});

  setInterval(() => {
    handler.doWork();
  }, 1);
}

main();

// handler.addTask("print(1)", 12345);

// async function getContainers() {
//     var containers = await docker.container.list();
//     var IPs = [];

//     for(var i = 0; i < containers.length; i++) {
//         var status = await containers[i].status();

//         if(status.data.Name.includes("/containercode")) {
//             IPs.push(status.data.NetworkSettings.Networks.containercode_default.IPAddress);
//         }
//     }

//     return IPs;
// }

// async function sendWork(ip, work) {
//     const response = await fetch(`http://${ip}:3000?code=${work}`);
//     const body = await response.text();
//     return body
// }

// async function main() {
//     var IPs = await getContainers();

//     console.log(IPs);

//     console.log(await sendWork(IPs[0], 'print("hello world")'));
// }

// main()

// List
// docker.container.list()
//    // Inspect
//   .then(containers => containers[4].status()).then(container => {
//     // console.log(container.data.NetworkSettings.Networks.pythonapi_default.IPAddress);
//     // console.log(container.data.Name);
//   })
// //   .then(container => container.stats())
// //   .then(stats => {
// //     stats.on('data', stat => console.log('Stats: ', stat.toString()))
// //     stats.on('error', err => console.log('Error: ', err))
// //   })
//   .catch(error => console.log(error));
