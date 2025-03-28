const playerImage = new Image();
playerImage.src = "./images/carro_preto.png";
playerImage.onload = () => {
  // Se desejar, ajuste as dimensões do player após o carregamento.
};

const carObstacleImage = new Image();
carObstacleImage.src = "./images/car_down.png";

const holeObstacleImage = new Image();
holeObstacleImage.src = "./images/buraco.png";

// Imagens de fundo para cada fase
const backgroundImage1 = new Image();
backgroundImage1.src = "./images/background.png";

const backgroundImage2 = new Image();
backgroundImage2.src = "./images/background_phase2.jpg";

const backgroundImage3 = new Image();
backgroundImage3.src = "./images/background_phase3.png";

class Player {
  constructor(x, y, width, height, speed) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.dx = 0;
    this.dy = 0; // Adicionado para controlar movimento vertical
  }

  update(canvasWidth, canvasHeight) {
    this.x += this.dx;
    this.y += this.dy; // Atualiza a posição vertical

    // Limites horizontais
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvasWidth) this.x = canvasWidth - this.width;

    // Limites verticais (para evitar que o carro saia da pista)
    if (this.y < 0) this.y = 0;
    if (this.y + this.height > canvasHeight) this.y = canvasHeight - this.height;
  }

  draw(ctx) {
    if (playerImage.complete && playerImage.naturalWidth !== 0) {
      ctx.drawImage(playerImage, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = "#0f0";
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}


// Classe que representa um obstáculo (tipo "car" ou "hole")
class Obstacle {
  constructor(x, y, width, height, speed, type) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.type = type;
  }

  update() {
    this.y += this.speed;
  }

  draw(ctx) {
    if (this.type === "car") {
      if (carObstacleImage.complete && carObstacleImage.naturalWidth !== 0) {
        ctx.drawImage(carObstacleImage, this.x, this.y, this.width, this.height);
      } else {
        ctx.fillStyle = "#f90";
        ctx.fillRect(this.x, this.y, this.width, this.height);
      }
    } else if (this.type === "hole") {
      if (holeObstacleImage.complete && holeObstacleImage.naturalWidth !== 0) {
        ctx.drawImage(holeObstacleImage, this.x, this.y, this.width, this.height);
      } else {
        ctx.fillStyle = "#000";
        ctx.fillRect(this.x, this.y, this.width, this.height);
      }
    }
  }

  getBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}

// Classe principal do jogo com sistema de fases
class Game {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.fase = 1;
    this.pontos = 0;
    this.config = this.getConfigForFase(this.fase);
    this.bgY = 0;
    this.player = new Player(
      this.canvas.width / 2 - this.config.playerWidth / 2,
      this.canvas.height - this.config.playerHeight - 10,
      this.config.playerWidth,
      this.config.playerHeight,
      this.config.playerSpeed
    );
    this.obstacles = [];
    this.lastSpawnTime = 0;
    this.gameOver = false;
    this.initControls();
  }

  getConfigForFase(fase) {
    const baseConfig = {
      playerWidth: 60,
      playerHeight: 100,
      playerSpeed: 5,
      obstacleSpeed: 3,
      spawnInterval: 1500,
      maxObstacles: 5,
      spawnMargin: 10,
      obstacleCarWidth: 60,
      obstacleCarHeight: 100,
      obstacleHoleWidth: 50,
      obstacleHoleHeight: 50,
      backgroundSpeed: 2,
      backgroundImage: backgroundImage1
    };
    if (fase === 2) {
      baseConfig.obstacleSpeed = 4;
      baseConfig.spawnInterval = 1200;
      baseConfig.backgroundSpeed = 3;
      baseConfig.backgroundImage = backgroundImage2;
    } else if (fase === 3) {
      baseConfig.obstacleSpeed = 5;
      baseConfig.spawnInterval = 900;
      baseConfig.backgroundSpeed = 4;
      baseConfig.backgroundImage = backgroundImage3;
    }
    return baseConfig;
  }

  initControls() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft" || e.key === "a") {
        this.player.dx = -this.config.playerSpeed;
      } else if (e.key === "ArrowRight" || e.key === "d") {
        this.player.dx = this.config.playerSpeed;
      } else if (e.key === "ArrowUp" || e.key === "w") {
        this.player.dy = -this.config.playerSpeed; // Mover para cima
      } else if (e.key === "ArrowDown" || e.key === "s") {
        this.player.dy = this.config.playerSpeed; // Mover para baixo
      }
    });
  
    document.addEventListener("keyup", (e) => {
      if (
        e.key === "ArrowLeft" || e.key === "a" ||
        e.key === "ArrowRight" || e.key === "d"
      ) {
        this.player.dx = 0;
      }
  
      if (
        e.key === "ArrowUp" || e.key === "w" ||
        e.key === "ArrowDown" || e.key === "s"
      ) {
        this.player.dy = 0;
      }
    });
  }
  

  drawBackground() {
    const bgImg = this.config.backgroundImage;
    if (bgImg.complete && bgImg.naturalWidth !== 0) {
      this.ctx.drawImage(bgImg, 0, this.bgY, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(bgImg, 0, this.bgY - this.canvas.height, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.fillStyle = "#333";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  updateBackground() {
    this.bgY += this.config.backgroundSpeed;
    if (this.bgY >= this.canvas.height) {
      this.bgY = 0;
    }
  }

  checkCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  spawnObstacle() {
    if (this.obstacles.length >= this.config.maxObstacles) return;
    const maxTentativas = 10;
    let attempts = 0;
    let newObstacle = null;
    const types = ["car", "hole"];
    while (attempts < maxTentativas && !newObstacle) {
      attempts++;
      const type = types[Math.floor(Math.random() * types.length)];
      let width, height;
      if (type === "car") {
        width = this.config.obstacleCarWidth;
        height = this.config.obstacleCarHeight;
      } else {
        width = this.config.obstacleHoleWidth;
        height = this.config.obstacleHoleHeight;
      }
      const x = Math.random() * (this.canvas.width - width);
      const y = -height;
      let colidiu = false;
      for (let obs of this.obstacles) {
        if (obs.y < height + this.config.spawnMargin) {
          const distanciaX = Math.abs(obs.x - x);
          if (distanciaX < width + this.config.spawnMargin) {
            colidiu = true;
            break;
          }
        }
      }
      if (!colidiu) {
        newObstacle = new Obstacle(x, y, width, height, this.config.obstacleSpeed, type);
      }
    }
    if (newObstacle) {
      this.obstacles.push(newObstacle);
    }
  }

  update() {
    if (this.gameOver) return;
    this.updateBackground();
    this.player.update(this.canvas.width);
    for (let obs of this.obstacles) {
      obs.update();
      if (this.checkCollision(this.player.getBounds(), obs.getBounds())) {
        this.gameOver = true;
      }
    }
    this.obstacles = this.obstacles.filter(obs => obs.y <= this.canvas.height);
    if (performance.now() - this.lastSpawnTime > this.config.spawnInterval) {
      this.spawnObstacle();
      this.lastSpawnTime = performance.now();
    }
    this.pontos++;
    if (this.pontos > 1000 && this.fase === 1) {
      this.fase = 2;
      this.config = this.getConfigForFase(this.fase);
    } else if (this.pontos > 2500 && this.fase === 2) {
      this.fase = 3;
      this.config = this.getConfigForFase(this.fase);
    }
  }

  draw() {
    this.drawBackground();
    this.player.draw(this.ctx);
    for (let obs of this.obstacles) {
      obs.draw(this.ctx);
    }
    this.ctx.fillStyle = "#fff";
    this.ctx.font = "20px Arial";
    this.ctx.fillText(`Fase: ${this.fase}`, 10, 30);
    this.ctx.fillText(`Pontos: ${this.pontos}`, 10, 60);
  }

  run() {
    const loop = () => {
      if (!this.gameOver) {
        this.update();
        this.draw();
        requestAnimationFrame(loop);
      } else {
        this.showGameOver();
      }
    };
    loop();
  }

  showGameOver() {
    // Exibe a tela de Game Over e mostra a pontuação final
    const gameOverScreen = document.getElementById("gameOverScreen");
    const finalScore = document.getElementById("finalScore");
    finalScore.textContent = `Pontuação: ${this.pontos}`;
    gameOverScreen.style.display = "flex";
  }
}

// Eventos para iniciar e reiniciar o jogo
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

startButton.addEventListener("click", () => {
  document.getElementById("startScreen").style.display = "none";
  document.getElementById("gameOverScreen").style.display = "none";
  const canvas = document.getElementById("gameCanvas");
  canvas.style.display = "block";
  const ctx = canvas.getContext("2d");
  const game = new Game(canvas, ctx);
  game.run();
});

restartButton.addEventListener("click", () => {
  // Reinicia o jogo ocultando a tela de Game Over e iniciando novamente
  document.getElementById("gameOverScreen").style.display = "none";
  const canvas = document.getElementById("gameCanvas");
  canvas.style.display = "block";
  const ctx = canvas.getContext("2d");
  const game = new Game(canvas, ctx);
  game.run();
});