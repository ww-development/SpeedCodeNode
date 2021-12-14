import {Docker} from 'node-docker-api';
import fetch from 'node-fetch';
 
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
 

async function getContainers() {
    var containers = await docker.container.list();
    var IPs = [];

    for(var i = 0; i < containers.length; i++) {
        var status = await containers[i].status();
        
        if(status.data.Name.includes("/pythonapi")) {
            IPs.push(status.data.NetworkSettings.Networks.pythonapi_default.IPAddress);
        }
    }

    return IPs;
}

async function sendWork(ip, work) {
    const response = await fetch(`http://${ip}:3000?code=${work}`);
    const body = await response.text();
    return body
}

async function main() {
    var IPs = await getContainers();

    console.log(await sendWork(IPs[0], 'print("hello world")'));
}

main()

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