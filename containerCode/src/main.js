
const express = require('express')
var cors = require('cors')
const app = express()
const port = 3000

const { exec } = require("child_process");

app.use(cors());

app.get('/', (req, res) => {

    exec("python3 -c '" + req.query.code + "'", (error, stdout, stderr) => {
        if (error) {
            res.send(`error: ${error.message}`);
	        return;
        }
        if (stderr) {
            res.send(`stderr: ${stderr}`);
	        return;
        }
        res.send(`${stdout}`);
    });
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
