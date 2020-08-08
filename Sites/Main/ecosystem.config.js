module.exports = {
  apps : [
      {
        name: "mmc-web",
        script: "./src/server/index.js",
        watch: true,
        env: {
            PORT: 7885,
            NODE_ENV: "kostya-dev-local"
        },
        env_kostya: {
            PORT: 7885,
            NODE_ENV: "kostya-dev-local"
        },
        env_dima: {
            PORT: 7885,
            NODE_ENV: "dima-dev-local"
        },
        env_stage: {
            PORT: 7885,
            NODE_ENV: "aro-dev"
         },
        env_production: {
            PORT: 7885,
            NODE_ENV: "san-jose-dev"
        }
      }
  ]
}
