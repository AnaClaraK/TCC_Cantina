module.exports = {
  apps: [{
    name: "cantina-backend",
    script: "app.js", // Troque para o seu arquivo principal se for app.js
    env: {
      NODE_ENV: "production",
    }
  }]
};