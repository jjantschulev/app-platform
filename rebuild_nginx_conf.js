const nginx = require("./src/nginx");

nginx.updateNginxConfig()
    .then(() => {
        console.log("updateNginxConfig() finished.")
        process.exit();
    });

