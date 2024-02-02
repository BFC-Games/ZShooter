var inGame = false;

document.zoomFactor = 1;
document.screenHeight = 1080;
document.screenWidth = 1920;
document.screenY = null;
document.screenX = null;

var int = window.setInterval(function () {
  //reduce lag
  if (window.input != null) {
    window.clearInterval(int);
    onready();
  }
}, 100);
function onready() {
  let ping = false;
  let t;
  let samples = new Array(500);
  let m;
  let h = 0;
  function getMax() {
    let max = 0;
    for (let i = 0; i < 500; ++i) {
      if (samples[i] != null) {
        if (samples[i] > max) {
          max = samples[i];
        }
      } else {
        break;
      }
    }
    m = max;
  }
  function sleep(time) {
    return new Promise(function (resolve) {
      setTimeout(resolve, time);
    });
  }
  WebSocket = class extends WebSocket {
    constructor(ip) {
      super(ip);
      if (ip.match(/\.m28n\./) != null) {
        samples = new Array(500);
        h = 0;
        ping = false;
        this.send = new Proxy(this.send, {
          apply: function (to, what, args) {
            if (args[0].length == 1) {
              ping = true;
              t = new Date().getTime();
            }
            return to.apply(what, args);
          },
        });
        let a = window.setInterval(
          function () {
            if (this.onmessage != null) {
              window.clearInterval(a);
              this.onmessage = new Proxy(this.onmessage, {
                apply: function (to, what, args) {
                  if (
                    new Uint8Array(args[0].data).length == 1 &&
                    ping == true
                  ) {
                    ping = false;
                    samples[h] = new Date().getTime() - t;
                    h = (h + 1) % 501;
                    getMax();
                  }
                  return to.apply(what, args);
                },
              });
            }
          }.bind(this),
          100
        );
      }
    }
  };
  window.m28.pow.solve = new Proxy(window.m28.pow.solve, {
    apply: function (to, what, args) {
      const time = new Date().getTime();
      const f = args[2];
      return to.apply(what, [
        args[0],
        args[1],
        async function (...g) {
          if (
            args[1] == 17 &&
            10000 - m * 3 - new Date().getTime() + time > 0
          ) {
            await sleep(10000 - m * 3 - new Date().getTime() + time);
          }
          return f(...g);
        },
      ]);
    },
  });
}
window.Function = new Proxy(window.Function, {
  construct: function (to, args) {
    //faster game play
    let a = args[0].match(/(\w+)=function\(\)/)[1];
    let b = args[0].match(/function\(\w+,(\w+)\){var (\w+)/);
    return new to(
      args[0]
        .replace(
          /if\(!window\).*(\w{1,2}\[\w{1,2}\(-?'.{1,5}','.{1,5}'\)(?:\+'.{1,3}')?\])\((\w{1,2}),(\w{1,2}\[\w{1,2}\(-?'.{1,5}','.{1,5}'\)(?:\+'.{1,3}')?\])\);};.*/,
          `$1($2,$3)};`
        )
        .replace(
          /function \w+\(\w+\){.*?}(?=\w)(?!else)(?!continue)(?!break)/,
          ""
        )
        .replace(/,window.*?\(\)(?=;)/, "")
        .replace(
          new RegExp(`,${a}=function.*?${a}\\(\\);?}\\(`),
          `;${b[2]}(${b[1]}+1)}(`
        )
    );
  },
});

// STORAGE:
var canStore;
if (typeof Storage !== "undefined") {
  canStore = true;
}

function saveVal(name, val) {
  if (canStore) localStorage.setItem(name, val);
}

function deleteVal(name) {
  if (canStore) localStorage.removeItem(name);
}

function getSavedVal(name) {
  if (canStore) return localStorage.getItem(name);
  return null;
}

function enterGame() {
  saveVal("player_name", playerName);
  if (!inGame) {
    inGame = true;
  }
}

// START GAME:
function startGame() {
  playerName = getSavedVal("player_name") || "";
}

startGame();

var playerName = "ZShooter Player";
var cvs = document.getElementById("canvas");
var ctx = cvs.getContext("2d");

function resizeCanvas() {
  cvs.height = window.innerHeight;
  cvs.width = window.innerWidth;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function toRad(degree) {
  return (Math.PI / 180) * degree;
}

cvs.addEventListener("mousemove", function (e) {
  if (window.mouseX != e.clientX || window.mouseY != e.clientY) {
    window.mouseX = e.clientX;
    window.mouseY = e.clientY;
  }
});
window.mouseX = cvs.width / 2;
window.mouseY = cvs.height / 2;

var weaponStatScale = [300, 100];
var weaponStatHovered = [false, false];
var upgrades = [
  ["#97e683", 0, "Health", false, false],
  ["#97e683", 0, "Regeneration", false, false],
  ["#97e683", 0, "Strength", false, false],
  ["#97e683", 0, "Player Speed", false, false],
  ["#97e683", 0, "Firerate", false, false],
  ["#97e683", 0, "Bullet Speed", false, false],
  ["#97e683", 0, "Bullet Pierce", false, false],
  ["#97e683", 0, "Radar", false, false],
];

cvs.addEventListener("mousedown", function (e) {
  if (e.button == 0) {
    for (let i in upgrades) {
      if (
        window.mouseX > 255 - 7.5 &&
        window.mouseX < 255 + 7.5 &&
        window.mouseY > 67.5 + i * 20 - 7.5 &&
        window.mouseY < 67.5 + i * 20 + 7.5
      ) {
        upgrades[i][4] = true;
      }
    }
    if (
      window.mouseX > 20 &&
      window.mouseX < weaponStatScale[0] + 20 &&
      window.mouseY < cvs.height - 20 &&
      window.mouseY > cvs.height - weaponStatScale[1] - 20
    ) {
      player.weapon = "Hands";
    } else if (
      window.mouseX > 20 &&
      window.mouseX < weaponStatScale[0] + 20 &&
      window.mouseY < cvs.height - weaponStatScale[1] - 40 &&
      window.mouseY > cvs.height - weaponStatScale[1] * 2 - 40
    ) {
      player.weapon = "Pistol";
    } else if (
      window.mouseX > 20 &&
      window.mouseX < weaponStatScale[0] + 20 &&
      window.mouseY < cvs.height - weaponStatScale[1] - 165 &&
      window.mouseY > cvs.height - weaponStatScale[1] * 2 - 165
    ) {
      player.weapon = "Machine Gun";
    } else if (
      window.mouseX > 20 &&
      window.mouseX < weaponStatScale[0] + 20 &&
      window.mouseY < cvs.height - weaponStatScale[1] - 165 &&
      window.mouseY > cvs.height - weaponStatScale[1] * 2 - 165
    ) {
      player.weapon = "Minigun";
    } else {
      player.shooting = true;
    }
    player.updateWeapons();
  }
});

cvs.addEventListener("mouseup", function (e) {
  if (e.button == 0) {
    player.shooting = false;
    for (let i in upgrades) {
      upgrades[i][4] = false;
      if (
        window.mouseX > 255 - 7.5 &&
        window.mouseX < 255 + 7.5 &&
        window.mouseY > 67.5 + i * 20 - 7.5 &&
        window.mouseY < 67.5 + i * 20 + 7.5 &&
        player.upgradePoints > 0 &&
        upgrades[i][1] < 10
      ) {
        player.upgradePoints--;
        upgrades[i][1]++;
        if (i == 0) {
          player.upgrades.healthMultiplier *= 1.2;
          player.maxHealth = 10 * player.upgrades.healthMultiplier;
          player.health *= 1.2;
        }
        if (i == 1) {
          player.upgrades.regenerateSpeed += 1;
        }
        if (i == 2) {
          player.upgrades.strengthMultiplier *= 1.1;
          player.updateWeapons();
        }
        if (i == 3) {
          player.upgrades.playerSpeedMultiplier += 0.05;
          player.updateWeapons();
        }
        if (i == 4) {
          player.upgrades.firerateMultiplier *= 1.05;
          player.updateWeapons();
        }
        if (i == 5) {
          player.upgrades.bulletSpeedMultiplier *= 1.1;
          player.updateWeapons();
        }
        if (i == 6) {
          player.upgrades.piercing += 1;
        }
        if (i == 7) {
          if (
            (e.deltaY > 0 && document.screenWidth < 200 * 3) ||
            (e.deltaY < 0 && document.screenHeight > 1920)
          ) {
            document.zoomFactor *= 0.95 ** (e.deltaY > 0 ? -1 : 1);
            document.screenWidth = Math.floor(1920 * document.zoomFactor) + 1;
            document.screenHeight = Math.floor(1080 * document.zoomFactor) + 1;
            cvs.width = 1920 * document.zoomFactor;
            cvs.height = 1080 * document.zoomFactor;
          }
        }
      }
    }
  }
});

document.addEventListener("keydown", function (e) {
  if (e.keyCode == 52) {
    player.weapon = "Minigun";
    player.updateWeapons();
  }
  if (e.keyCode == 51) {
    player.weapon = "Machine Gun";
    player.updateWeapons();
  }
  if (e.keyCode == 50) {
    player.weapon = "Pistol";
    player.updateWeapons();
  }
  if (e.keyCode == 49) {
    player.weapon = "Hands";
    player.updateWeapons();
  }
});

Math.RAND_NUMBER = (max, min) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

function levelPlayer() {
  if (player.xp >= player.maxXp) {
    player.lvl++;
    player.xp -= player.maxXp;
    player.maxXp *= 1.05;
    player.upgradePoints++;
    if (player.remainingXp >= player.maxXp) {
      levelPlayer();
    }
  }
}

function checkEnemy(index) {
  if (allEnemies[index].health <= 0) {
    for (let i = 0; i < 20; i++) {
      addParticle(
        Math.RAND_NUMBER(allEnemies[index].x - 40, allEnemies[index].x + 40),
        Math.RAND_NUMBER(allEnemies[index].y - 40, allEnemies[index].y + 40),
        Math.RAND_NUMBER(10, 20),
        "rgba(100, 0, 0, 1)",
        0.1,
        1
      );
    }
    player.xp += allEnemies[index].xp;
    levelPlayer();
    allEnemies.splice(index, 1);
  }
}

function mouseCoord() {
  return Math.atan2(
    window.mouseY - cvs.height / 2,
    window.mouseX - cvs.width / 2
  );
}

function gameOver() {
  player.health = player.maxHealth;
  player.shooting = false;
  player.weapon = "Hands";
  player.updateWeapons();
  player.x = Math.RAND_NUMBER(
    player.scale / 2,
    map.scale[0] - player.scale / 2
  );
  player.y = Math.RAND_NUMBER(
    player.scale / 2,
    map.scale[1] - player.scale / 2
  );
}

function shoot() {
  if (player.canShoot) {
    if (player.weapon == "Pistol") {
      addProjectile(
        player.x + Math.cos(mouseCoord()) * player.scale,
        player.y + Math.sin(mouseCoord()) * player.scale,
        mouseCoord() +
          toRad(
            Math.RAND_NUMBER(-player.spreadPower / 2, player.spreadPower / 2)
          ),
        player.bullet,
        player.bulletSpeed,
        player.bulletDamage,
        Math.RAND_NUMBER(0, player.upgrades.piercing)
      );
      player.canShoot = false;
      setTimeout(function () {
        player.canShoot = true;
      }, 1000 / player.fireRate);
      let c = Math.RAND_NUMBER(200, 255);
      for (let i = 0; i < 20; i++) {
        addParticle(
          Math.RAND_NUMBER(player.x - 20, player.x + 20) +
            Math.cos(mouseCoord()) * 70,
          Math.RAND_NUMBER(player.y - 20, player.y + 20) +
            Math.sin(mouseCoord()) * 70,
          Math.RAND_NUMBER(5, 10),
          `rgba(${c}, ${c}, ${c}, ${Math.RAND_NUMBER(0, 0.5)})`,
          Math.RAND_NUMBER(10, 20),
          1,
          0
        );
      }
    } else if (player.weapon == "Machine Gun") {
      addProjectile(
        player.x + Math.cos(mouseCoord()) * player.scale,
        player.y + Math.sin(mouseCoord()) * player.scale,
        mouseCoord() +
          toRad(
            Math.RAND_NUMBER(-player.spreadPower * 2, player.spreadPower * 2)
          ),
        player.bullet,
        player.bulletSpeed,
        player.bulletDamage * 0.75,
        Math.RAND_NUMBER(0, player.upgrades.piercing)
      );
      player.canShoot = false;
      setTimeout(function () {
        player.canShoot = true;
      }, 1000 / player.fireRate);
      let c = Math.RAND_NUMBER(255, 300);
      for (let i = 0; i < 20; i++) {
        addParticle(
          Math.RAND_NUMBER(player.x - 20, player.x + 20) +
            Math.cos(mouseCoord()) * 70,
          Math.RAND_NUMBER(player.y - 20, player.y + 20) +
            Math.sin(mouseCoord()) * 70,
          Math.RAND_NUMBER(5, 10),
          `rgba(${c}, ${c}, ${c}, ${Math.RAND_NUMBER(0, 0.5)})`,
          Math.RAND_NUMBER(10, 20),
          1,
          0
        );
      }
    } else if (player.weapon == "Hands") {
      player.canShoot = false;
      for (let i in allEnemies) {
        if (
          Math.sqrt(
            Math.pow(allEnemies[i].y - player.y, 2) +
              Math.pow(allEnemies[i].x - player.x, 2)
          ) < 100 &&
          Math.atan2(allEnemies[i].y - player.y, allEnemies[i].x - player.x) +
            toRad(30) >
            mouseCoord() &&
          Math.atan2(allEnemies[i].y - player.y, allEnemies[i].x - player.x) -
            toRad(30) <
            mouseCoord()
        ) {
          allEnemies[i].health -= player.bulletDamage;
          checkEnemy(i);
        }
      }
      setTimeout(() => {
        player.canShoot = true;
        player.armHit = (player.armHit + 1) % 2;
      }, 1000 / player.fireRate);
      for (
        let i = 0,
          t = 1000 / player.fireRate > 250 ? 250 : 1000 / player.fireRate;
        i < t;
        i++
      ) {
        setTimeout(() => {
          if (i < t / 2 && player.weapon == "Hands") {
            player.arms[player.armHit == 0 ? "_1" : "_2"].x +=
              player.armHit == 1 ? 0.05 : -0.05;
            player.arms[player.armHit == 0 ? "_1" : "_2"].y += 0.3;
          } else if (player.weapon == "Hands") {
            player.arms[player.armHit == 0 ? "_1" : "_2"].x -=
              player.armHit == 1 ? 0.05 : -0.05;
            player.arms[player.armHit == 0 ? "_1" : "_2"].y -= 0.3;
          } else if (player.weapon == "Machine Gun") {
            player.arms[player.armHit == 0 ? "_1" : "_2"].x -=
              player.armHit == 1 ? 0.05 : -0.05;
            player.arms[player.armHit == 0 ? "_1" : "_2"].y -= 0.3;
          }
        }, i);
      }
    }
  }
}

CanvasRenderingContext2D.prototype.roundRect = function (
  x,
  y,
  width,
  height,
  radius
) {
  return (
    width < 2 * radius && (radius = width / 2),
    height < 2 * radius && (radius = height / 2),
    radius < 0 && (radius = 0),
    this.beginPath(),
    this.moveTo(x + radius, y),
    this.arcTo(x + width, y, x + width, y + height, radius),
    this.arcTo(x + width, y + height, x, y + height, radius),
    this.arcTo(x, y + height, x, y, radius),
    this.arcTo(x, y, x + width, y, radius),
    this.closePath(),
    this
  );
};

CanvasRenderingContext2D.prototype.drawIMG = function (
  image,
  x,
  y,
  height,
  width
) {
  let elem = document.createElement("img");
  elem.src = image;
  this.drawImage(elem, x, y, height, width);
};

Math.RAND_NUMBER = (max, min) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

var enemies;

var tiles = [];
var map = {
  scale: [50000, 50000],
  x: 0,
  y: 0,
  color: "#465942",
};

for (let i = 0; i < map.scale[0] / 1000; i++) {
  for (let i1 = 0; i1 < map.scale[1] / 1000; i1++) {
    tiles.push({
      x: (map.scale[0] / (map.scale[0] / 1000)) * i,
      y: (map.scale[1] / (map.scale[1] / 1000)) * i1,
      scale: [map.scale[0] / 50, map.scale[1] / 50],
    });
  }
}

var player = {
  camera: {
    x: 0,
    y: 0,
  },
  x: cvs.width / 2,
  y: cvs.height / 2,
  vel_x: 0,
  vel_y: 0,
  speed: 0,
  scale: 50,
  bulletDamage: 0,
  fireRate: 0,
  bulletSpeed: 0,
  spreadPower: 5,
  weapons: ["Hands", "Pistol", "Machine Gun", "Minigun"],
  weapon: "Pistol",
  bullet: "Bullet",
  shooting: false,
  canShoot: true,
  health: 10,
  maxHealth: 10,
  canHeal: true,
  healTimer: null,
  updateWeapons: function () {
    switch (this.weapon) {
      case "Hands":
        this.speed = 0.6 * player.upgrades.playerSpeedMultiplier;
        this.fireRate = 2 * player.upgrades.firerateMultiplier;
        this.bulletDamage = 0.15 * player.upgrades.strengthMultiplier;
        break;
      case "Pistol":
        this.speed = 0.5 * player.upgrades.playerSpeedMultiplier;
        this.fireRate = 3 * player.upgrades.firerateMultiplier;
        this.bulletDamage = 0.1 * player.upgrades.strengthMultiplier;
        this.bulletSpeed = 10 * player.upgrades.bulletSpeedMultiplier;
        this.bullet = "Bullet";
        break;
      case "Machine Gun":
        this.speed = 0.4 * player.upgrades.playerSpeedMultiplier;
        this.fireRate = 6 * player.upgrades.firerateMultiplier;
        this.bulletDamage = 0.1 * player.upgrades.strengthMultiplier;
        this.bulletSpeed = 15 * player.upgrades.bulletSpeedMultiplier;
        this.bullet = "Bullet";
        break;
      case "Minigun":
        this.speed = 0.3 * player.upgrades.playerSpeedMultiplier;
        this.fireRate = 9 * player.upgrades.firerateMultiplier;
        this.bulletDamage = 0.15 * player.upgrades.strengthMultiplier;
        this.bulletSpeed = 20 * player.upgrades.bulletSpeedMultiplier;
        this.bullet = "Bullet";
        break;
    }
    this.arms._1.x = player.weapon == "Hands" ? 15 : 10;
    this.arms._1.y = player.weapon == "Hands" ? 20 : 22;
    this.arms._2.x = player.weapon == "Hands" ? -15 : -10;
    this.arms._2.y = player.weapon == "Hands" ? 20 : 22;
  },
  armHit: 0,
  arms: {
    _1: {
      x: 15,
      y: 20,
    },
    _2: {
      x: -15,
      y: 20,
    },
  },
  xp: 0,
  maxXp: 100,
  lvl: 1,
  maxLvl: 100,
  upgradePoints: 1,
  upgrades: {
    healthMultiplier: 1,
    regenerateSpeed: 0,
    strengthMultiplier: 1,
    meleeDamageMultiplier: 1,
    playerSpeedMultiplier: 1,
    firerateMultiplier: 1,
    bulletSpeedMultiplier: 1,
    piercing: 0,
  },
};
player.updateWeapons();

var allProjectiles = [];

function addProjectile(x, y, dir, type, speed, damage, pierce) {
  allProjectiles.push({
    x: x,
    y: y,
    vel_x: 0,
    vel_y: 0,
    dir: dir,
    type: type,
    speed: speed,
    damage: damage,
    pierce: pierce,
  });
}

var allEnemies = [];

function addEnemy(x, y, scale, speed, health, xp) {
  let letters =
    "abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let id = "";

  function changeId() {
    for (let i in allEnemies) {
      if (id == allEnemies[i].id) {
        id = "";
        for (let i = 0; i < 10; i++) {
          id += letters[Math.floor(Math.random() * letters.length)];
        }
        changeId();
      }
    }
  }
  changeId();

  allEnemies.push({
    x: x,
    y: y,
    vel_x: 0,
    vel_y: 0,
    scale: scale,
    speed: speed,
    canHit: true,
    hitDamage: 1,
    health: health,
    maxHealth: health,
    xp: xp,
    isDamagable: true,
    id: id,
  });
  let c = Math.RAND_NUMBER(200, 255);
  for (let i = 0; i < 20; i++) {
    addParticle(
      Math.RAND_NUMBER(
        allEnemies[allEnemies.length - 1].x - 40,
        allEnemies[allEnemies.length - 1].x + 40
      ),
      Math.RAND_NUMBER(
        allEnemies[allEnemies.length - 1].y - 40,
        allEnemies[allEnemies.length - 1].y + 40
      ),
      Math.RAND_NUMBER(5, 10),
      `rgba(${c}, ${c}, ${c}, ${Math.RAND_NUMBER(0, 0.5)})`,
      1,
      0
    );
  }
}

var allParticles = [];

function addParticle(x, y, scale, color, life_span, layer) {
  allParticles.push({
    x: x,
    y: y,
    scale: scale,
    maxScale: scale,
    color: color,
    dir: toRad(Math.RAND_NUMBER(0, 359)),
    lifeSpan: 1,
    speed: life_span / 100,
    layer: layer,
  });
}

setInterval(() => {
  let area =
    Math.RAND_NUMBER(0, 3) == 0
      ? "top"
      : Math.RAND_NUMBER(0, 3) == 1
      ? "left"
      : Math.RAND_NUMBER(0, 3) == 2
      ? "right"
      : "bottom";
  addEnemy(
    area == "top" || area == "bottom"
      ? Math.RAND_NUMBER(25, map.scale[0] - 25)
      : area == "left"
      ? 25
      : map.scale[0] - 25,
    area == "left" || area == "right"
      ? Math.RAND_NUMBER(25, map.scale[1] - 25)
      : 0,
    50,
    0.1,
    0.25,
    45
  );
}, 2000);

var control = {
  top: false,
  left: false,
  bottom: false,
  right: false,
  eventListener: function (e) {
    let key_state = e.type == "keydown" ? true : false;

    switch (event.keyCode) {
      case 87:
        control.top = key_state;
        break;
      case 65:
        control.left = key_state;
        break;
      case 83:
        control.bottom = key_state;
        break;
      case 68:
        control.right = key_state;
    }
  },
};
document.addEventListener("keydown", control.eventListener);
document.addEventListener("keyup", control.eventListener);

function refresh() {
  // Movement
  if (control.top || control.left || control.bottom || control.right) {
    let angle =
      control.top && control.left
        ? 315
        : control.left && control.bottom
        ? 225
        : control.bottom && control.right
        ? 135
        : control.right && control.top
        ? 45
        : control.top
        ? 0
        : control.left
        ? 270
        : control.bottom
        ? 180
        : 90;
    player.vel_x += Math.cos(toRad(angle - 90)) * player.speed;
    player.vel_y += Math.sin(toRad(angle - 90)) * player.speed;
  }

  player.x += player.vel_x;
  player.y += player.vel_y;

  // Friction & Screen Tracker
  player.vel_x *= 0.9;
  player.vel_y *= 0.9;

  let distance = Math.sqrt(
    Math.pow(player.y - player.camera.y - cvs.height / 2, 2) +
      Math.pow(player.x - player.camera.x - cvs.width / 2, 2)
  );

  player.camera.x =
    player.x -
    cvs.width / 2 +
    (Math.cos(mouseCoord()) *
      Math.sqrt(
        Math.pow(cvs.width / 2 - window.mouseX, 2) +
          Math.pow(cvs.height / 2 - window.mouseY, 2)
      )) /
      10 +
    player.vel_x;
  player.camera.y =
    player.y -
    cvs.height / 2 +
    (Math.sin(mouseCoord()) *
      Math.sqrt(
        Math.pow(cvs.width / 2 - window.mouseX, 2) +
          Math.pow(cvs.height / 2 - window.mouseY, 2)
      )) /
      10 +
    player.vel_y;

  // Projectiles
  if (allProjectiles) {
    for (let i in allProjectiles) {
      if (allProjectiles[i].vel_x != allProjectiles[i].speed) {
        allProjectiles[i].vel_x += Math.cos(allProjectiles[i].dir);
      }
      if (allProjectiles[i].vel_y != allProjectiles[i].speed) {
        allProjectiles[i].vel_y += Math.sin(allProjectiles[i].dir);
      }
      allProjectiles[i].x += allProjectiles[i].vel_x;
      allProjectiles[i].y += allProjectiles[i].vel_y;
      if (
        allProjectiles[i].x < map.x ||
        allProjectiles[i].y < map.y ||
        allProjectiles[i].x > map.scale[0] ||
        allProjectiles[i].y > map.scale[1]
      ) {
        for (let i1 = 0; i1 < 10; i1++) {
          let c = Math.RAND_NUMBER(200, 255);
          addParticle(
            Math.RAND_NUMBER(
              allProjectiles[i].x - 20,
              allProjectiles[i].x + 20
            ),
            Math.RAND_NUMBER(
              allProjectiles[i].y - 20,
              allProjectiles[i].y + 20
            ),
            Math.RAND_NUMBER(10, 15),
            `rgba(${c}, ${c}, ${c}, ${Math.RAND_NUMBER(0, 0.5)})`,
            0.5,
            0
          );
        }
        allProjectiles.splice(i, 1);
      } else if (allEnemies) {
        for (let i1 in allEnemies) {
          if (
            Math.sqrt(
              Math.pow(allEnemies[i1].y - allProjectiles[i].y, 2) +
                Math.pow(allEnemies[i1].x - allProjectiles[i].x, 2)
            ) <
            allEnemies[i1].scale / 2
          ) {
            if (allEnemies[i1].isDamagable == true) {
              allEnemies[i1].health =
                (allEnemies[i1].health * 10 - allProjectiles[i].damage * 10) /
                10;
              checkEnemy(i1);

              allEnemies[i1].isDamagable = false;
              clearTimeout(allEnemies[i1].timeout1);
              let id = allEnemies[i1].id;
              setTimeout(() => {
                let i = 0;
                let can = true;
                while (i != allEnemies.length - 1 && can) {
                  if (allEnemies[i].id == id) {
                    allEnemies[i].isDamagable = true;
                    can = false;
                  }
                  i++;
                }
              }, 100);
            }
            for (let i1 = 0; i1 < 10; i1++) {
              let c = Math.RAND_NUMBER(200, 255);
              addParticle(
                Math.RAND_NUMBER(
                  allProjectiles[i].x - 20,
                  allProjectiles[i].x + 20
                ),
                Math.RAND_NUMBER(
                  allProjectiles[i].y - 20,
                  allProjectiles[i].y + 20
                ),
                Math.RAND_NUMBER(10, 15),
                `rgba(${c}, ${c}, ${c}, ${Math.RAND_NUMBER(0, 0.5)})`,
                0.5,
                0
              );
            }
            if (allProjectiles[i].pierce <= 0 && !allEnemies[i1].isDamagable) {
              allProjectiles.splice(i, 1);
            } else if (!allEnemies[i1].isDamagable) {
              allProjectiles[i].pierce--;
            }
          }
        }
      }
      let c = Math.RAND_NUMBER(200, 255);
      addParticle(
        Math.RAND_NUMBER(allProjectiles[i].x - 10, allProjectiles[i].x + 10),
        Math.RAND_NUMBER(allProjectiles[i].y - 10, allProjectiles[i].y + 10),
        Math.RAND_NUMBER(5, 10),
        `rgba(${c}, ${c}, ${c}, ${Math.RAND_NUMBER(0, 0.5)})`,
        1,
        0
      );
    }
  }

  // Zombies
  for (let i in allEnemies) {
    if (
      Math.sqrt(
        Math.pow(allEnemies[i].y - player.y, 2) +
          Math.pow(allEnemies[i].x - player.x, 2)
      ) >
      (allEnemies[i].scale + player.scale) / 1.5
    ) {
      allEnemies[i].vel_x +=
        Math.cos(
          Math.atan2(player.y - allEnemies[i].y, player.x - allEnemies[i].x)
        ) * allEnemies[i].speed;
      allEnemies[i].vel_y +=
        Math.sin(
          Math.atan2(player.y - allEnemies[i].y, player.x - allEnemies[i].x)
        ) * allEnemies[i].speed;
    } else if (allEnemies[i].canHit) {
      clearTimeout(player.healTimer);
      allEnemies[i].canHit = false;
      player.canHeal = false;
      player.healTimer = setTimeout(function () {
        player.canHeal = true;
      }, 10000);
      player.health = (player.health * 10 - allEnemies[i].hitDamage * 10) / 10;
      setTimeout(function () {
        allEnemies[i].canHit = true;
      }, 1000);
    }
    allEnemies[i].x += allEnemies[i].vel_x;
    allEnemies[i].y += allEnemies[i].vel_y;

    allEnemies[i].vel_x *= 0.9;
    allEnemies[i].vel_y *= 0.9;

    if (allEnemies[i].x < map.x + allEnemies[i].scale / 2) {
      allEnemies[i].x = map.x + allEnemies[i].scale / 2;
    }
    if (allEnemies[i].y < map.y + allEnemies[i].scale / 2) {
      allEnemies[i].y = map.y + allEnemies[i].scale / 2;
    }
    if (allEnemies[i].x > map.scale[0] - allEnemies[i].scale / 2) {
      allEnemies[i].x = map.scale[0] - allEnemies[i].scale / 2;
    }
    if (allEnemies[i].y > map.scale[1] - allEnemies[i].scale / 2) {
      allEnemies[i].y = map.scale[1] - allEnemies[i].scale / 2;
    }

    for (let i1 in allEnemies) {
      if (
        Math.sqrt(
          Math.pow(allEnemies[i].y - allEnemies[i1].y, 2) +
            Math.pow(allEnemies[i].x - allEnemies[i1].x, 2)
        ) <
          (allEnemies[i].scale + allEnemies[i1].scale) / 2 &&
        i1 != i
      ) {
        allEnemies[i].x =
          allEnemies[i].x +
          Math.cos(
            Math.atan2(
              allEnemies[i].y - allEnemies[i1].y,
              allEnemies[i].x - allEnemies[i1].x
            )
          );
        allEnemies[i].y =
          allEnemies[i].y +
          Math.sin(
            Math.atan2(
              allEnemies[i].y - allEnemies[i1].y,
              allEnemies[i].x - allEnemies[i1].x
            )
          );
        allEnemies[i1].x =
          allEnemies[i1].x +
          Math.cos(
            Math.atan2(
              allEnemies[i1].y - allEnemies[i].y,
              allEnemies[i1].x - allEnemies[i].x
            )
          );
        allEnemies[i1].y =
          allEnemies[i1].y +
          Math.sin(
            Math.atan2(
              allEnemies[i1].y - allEnemies[i].y,
              allEnemies[i1].x - allEnemies[i].x
            )
          );
      }
    }
    if (
      Math.sqrt(
        Math.pow(allEnemies[i].y - player.y, 2) +
          Math.pow(allEnemies[i].x - player.x, 2)
      ) <
      (allEnemies[i].scale + player.scale) / 2
    ) {
      allEnemies[i].x =
        allEnemies[i].x +
        Math.cos(
          Math.atan2(allEnemies[i].y - player.y, allEnemies[i].x - player.x)
        );
      allEnemies[i].y =
        allEnemies[i].y +
        Math.sin(
          Math.atan2(allEnemies[i].y - player.y, allEnemies[i].x - player.x)
        );
      player.x =
        player.x +
        Math.cos(
          Math.atan2(player.y - allEnemies[i].y, player.x - allEnemies[i].x)
        );
      player.y =
        player.y +
        Math.sin(
          Math.atan2(player.y - allEnemies[i].y, player.x - allEnemies[i].x)
        );
    }
  }

  //To make PLAYER things fixed to screen
  let f = player.x - player.camera.x;
  let d = player.y - player.camera.y + player.scale;

  //To make ZOMBIES things fixed to screen
  let f1;
  let d1;
  for (let i in enemies) {
    f1 = enemies[i].x - player.camera.x;
    d1 = enemies[i].y - player.camera.y;
  }

  // Particles
  for (let i in allParticles) {
    allParticles[i].lifeSpan -= allParticles[i].speed;
    allParticles[i].scale = allParticles[i].maxScale * allParticles[i].lifeSpan;
    if (allParticles[i].lifeSpan <= 0) {
      allParticles.splice(i, 1);
    }
  }

  // Map Collision
  if (player.x < map.x + player.scale / 2) {
    player.x = map.x + player.scale / 2;
  }
  if (player.y < map.y + player.scale / 2) {
    player.y = map.y + player.scale / 2;
  }
  if (player.x > map.scale[0] - player.scale / 2) {
    player.x = map.scale[0] - player.scale / 2;
  }
  if (player.y > map.scale[1] - player.scale / 2) {
    player.y = map.scale[1] - player.scale / 2;
  }

  // Shooting
  if (player.shooting && player.canShoot) {
    shoot();
  }

  // Player Health
  if (player.health <= 0) {
    gameOver();
  }
  if (player.health < player.maxHealth && player.canHeal) {
    player.health += 0.005 * player.upgrades.healthMultiplier;
    if (player.health > player.maxHealth) {
      player.health = player.maxHealth;
    }
  } else if (player.health < player.maxHealth) {
    player.health +=
      0.00005 *
      player.upgrades.regenerateSpeed *
      player.upgrades.healthMultiplier;
    if (player.health > player.maxHealth) {
      player.health = player.maxHealth;
    }
  }

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, cvs.width, cvs.height);
  ctx.fillStyle = map.color;
  let availableTiles = tiles.filter(
    (e) =>
      e.x < player.camera.x + cvs.width + e.scale[0] / 2 &&
      e.y < player.camera.y + cvs.height + e.scale[1] / 2 &&
      e.x > player.camera.x - e.scale[0] &&
      e.y > player.camera.y - e.scale[1]
  );
  for (let i in availableTiles) {
    ctx.drawIMG(
      "https://cdn.glitch.com/aa34e651-fc51-45ca-879c-6c98719ac8cb%2FMap%20Tile.png?v=1630479316266",
      availableTiles[i].x - player.camera.x,
      availableTiles[i].y - player.camera.y,
      availableTiles[i].scale[0],
      availableTiles[i].scale[1]
    );
  }

  let particles = allParticles.filter(
    (e) =>
      e.x < player.camera.x + cvs.width / 2 + cvs.width / 2 + e.scale / 2 &&
      e.y < player.camera.y + cvs.height / 2 + cvs.height / 2 + e.scale / 2 &&
      e.x > player.camera.x + cvs.width / 2 - cvs.width / 2 - e.scale / 2 &&
      e.y > player.camera.y + cvs.height / 2 - cvs.height / 2 - e.scale / 2 &&
      e.layer == 1
  );
  for (let i in particles) {
    if (particles[i].layer == 1) {
      ctx.beginPath();
      ctx.arc(
        particles[i].x - player.camera.x,
        particles[i].y - player.camera.y,
        particles[i].scale,
        0,
        toRad(360)
      );
      ctx.fillStyle = particles[i].color;
      ctx.fill();
    }
  }
  
  if (player.weapon == "Minigun") {
    ctx.fillStyle = "#2e2e2e";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
      player.x -
        player.camera.x +
        (Math.cos(mouseCoord()) * player.scale) / 1.5,
      player.y -
        player.camera.y +
        (Math.sin(mouseCoord()) * player.scale) / 1.5,
      10 / 2,
      0,
      toRad(360)
    );

    ctx.fillStyle = "#2e2e2e";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
      player.x -
        player.camera.x +
        ((Math.cos(mouseCoord()) * player.scale) / 1.5) * 1.5,
      player.y -
        player.camera.y +
        ((Math.sin(mouseCoord()) * player.scale) / 1.5) * 1.5,
      10 / 2,
      0,
      toRad(360)
    );

    ctx.fillStyle = "#2e2e2e";
    ctx.fill();
    ctx.beginPath();
    ctx.lineWidth = 20;
    ctx.moveTo(
      player.x -
        player.camera.x +
        (Math.cos(mouseCoord()) * player.scale) / 1.5,
      player.y - player.camera.y + (Math.sin(mouseCoord()) * player.scale) / 1.5
    );
    ctx.lineTo(
      player.x -
        player.camera.x +
        ((Math.cos(mouseCoord()) * player.scale) / 1.5) * 1.5,
      player.y -
        player.camera.y +
        ((Math.sin(mouseCoord()) * player.scale) / 1.5) * 1.5
    );
    ctx.strokeStyle = "#2e2e2e";
    ctx.stroke();
  }

  if (player.weapon == "Machine Gun") {
    ctx.fillStyle = "#2e2e2e";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
      player.x -
        player.camera.x +
        (Math.cos(mouseCoord()) * player.scale) / 1.5,
      player.y -
        player.camera.y +
        (Math.sin(mouseCoord()) * player.scale) / 1.5,
      10 / 2,
      0,
      toRad(360)
    );

    ctx.fillStyle = "#2e2e2e";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
      player.x -
        player.camera.x +
        ((Math.cos(mouseCoord()) * player.scale) / 1.5) * 1.5,
      player.y -
        player.camera.y +
        ((Math.sin(mouseCoord()) * player.scale) / 1.5) * 1.5,
      10 / 2,
      0,
      toRad(360)
    );

    ctx.fillStyle = "#2e2e2e";
    ctx.fill();
    ctx.beginPath();
    ctx.lineWidth = 15;
    ctx.moveTo(
      player.x -
        player.camera.x +
        (Math.cos(mouseCoord()) * player.scale) / 1.5,
      player.y - player.camera.y + (Math.sin(mouseCoord()) * player.scale) / 1.5
    );
    ctx.lineTo(
      player.x -
        player.camera.x +
        ((Math.cos(mouseCoord()) * player.scale) / 1.5) * 1.5,
      player.y -
        player.camera.y +
        ((Math.sin(mouseCoord()) * player.scale) / 1.5) * 1.5
    );
    ctx.strokeStyle = "#2e2e2e";
    ctx.stroke();
  }

  if (player.weapon == "Pistol") {
    ctx.fillStyle = "#2e2e2e";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
      player.x -
        player.camera.x +
        (Math.cos(mouseCoord()) * player.scale) / 1.5,
      player.y -
        player.camera.y +
        (Math.sin(mouseCoord()) * player.scale) / 1.5,
      10 / 2,
      0,
      toRad(360)
    );

    ctx.fillStyle = "#2e2e2e";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
      player.x -
        player.camera.x +
        ((Math.cos(mouseCoord()) * player.scale) / 1.5) * 1.5,
      player.y -
        player.camera.y +
        ((Math.sin(mouseCoord()) * player.scale) / 1.5) * 1.5,
      10 / 2,
      0,
      toRad(360)
    );

    ctx.fillStyle = "#2e2e2e";
    ctx.fill();
    ctx.beginPath();
    ctx.lineWidth = 10;
    ctx.moveTo(
      player.x -
        player.camera.x +
        (Math.cos(mouseCoord()) * player.scale) / 1.5,
      player.y - player.camera.y + (Math.sin(mouseCoord()) * player.scale) / 1.5
    );
    ctx.lineTo(
      player.x -
        player.camera.x +
        ((Math.cos(mouseCoord()) * player.scale) / 1.5) * 1.5,
      player.y -
        player.camera.y +
        ((Math.sin(mouseCoord()) * player.scale) / 1.5) * 1.5
    );
    ctx.strokeStyle = "#2e2e2e";
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.lineWidth = 5;
  ctx.arc(
    player.x -
      player.camera.x +
      Math.cos(mouseCoord()) * player.arms._2.y +
      Math.cos(mouseCoord() + toRad(90)) * player.arms._2.x,
    player.y -
      player.camera.y +
      Math.sin(mouseCoord()) * player.arms._2.y +
      Math.sin(mouseCoord() + toRad(90)) * player.arms._2.x,
    player.scale / 5,
    0,
    toRad(360)
  );
  ctx.fillStyle = "#edddbe";
  ctx.fill();
  ctx.strokeStyle = "#bdb097";
  ctx.stroke();

  ctx.beginPath();
  ctx.lineWidth = 7.5;
  ctx.arc(
    player.x -
      player.camera.x +
      Math.cos(mouseCoord()) * player.arms._1.y +
      Math.cos(mouseCoord() + toRad(90)) * player.arms._1.x,
    player.y -
      player.camera.y +
      Math.sin(mouseCoord()) * player.arms._1.y +
      Math.sin(mouseCoord() + toRad(90)) * player.arms._1.x,
    player.scale / 5,
    0,
    toRad(360)
  );
  ctx.fillStyle = "#edddbe";
  ctx.fill();
  ctx.strokeStyle = "#bdb097";
  ctx.stroke();

  ctx.beginPath();
  ctx.lineWidth = 5;
  ctx.arc(
    player.x - player.camera.x,
    player.y - player.camera.y,
    player.scale / 2 - ctx.lineWidth / 2,
    0,
    toRad(360)
  );
  ctx.fillStyle = "#edddbe";
  ctx.fill();
  ctx.strokeStyle = "#bdb097";
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(
    player.x - player.camera.x + (Math.cos(mouseCoord()) * player.scale) / 1.5,
    player.y - player.camera.y + (Math.sin(mouseCoord()) * player.scale) / 1.5,
    10 / 2,
    0,
    toRad(360)
  );

  let barWidth = 30;
  let barPad = 7;

  //Player Namedisplay
  ctx.font = 20 + "px Forte";
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#2e2e2e";
  ctx.lineWidth = 11;
  ctx.lineJoin = "round";
  ctx.strokeText(
    playerName,
    f - player.scale - player.scale / 3,
    d - player.scale - 50
  );
  ctx.fillText(
    playerName,
    f - player.scale - player.scale / 3,
    d - player.scale - 50
  );

  /* ctx.fillStyle = "black";
    ctx.roundRect(
      player.x - f - barWidth - barPad,
      player.y - d + player.scale + 34 + 20,
      2 * barWidth + 2 * barPad - (barWidth + barPad + 1.5),
      17,
      8
    );
    ctx.fill();
    ctx.fillStyle = "#c6f7f7";
    ctx.roundRect(
      player.x - f - barWidth,
      player.y - d + player.scale + 34 + barPad + 20,
      (2 * barWidth - (barWidth + barPad + 1.5)) * (player.firerate / 1000),
      17 - 2 * barPad,
      7
    );*/

  ctx.font = "10px Forte";
  ctx.fillStyle = "#292c30";
  ctx.roundRect(
    player.x -
      player.camera.x -
      barWidth -
      barPad -
      ctx.measureText(
        Math.floor(Math.round(player.health)) +
          "/" +
          Math.floor(player.maxHealth)
      ).width /
        2,
    player.y - player.camera.y + player.scale,
    2 * barWidth +
      2 * barPad +
      ctx.measureText(
        Math.floor(Math.round(player.health)) +
          "/" +
          Math.floor(player.maxHealth)
      ).width +
      parseInt(ctx.font.slice(0, ctx.font.indexOf("px"))) / 5,
    17,
    8
  );
  ctx.fill();
  ctx.fillStyle = "#0f0f0f";
  ctx.roundRect(
    player.x -
      player.camera.x -
      barWidth -
      ctx.measureText(
        Math.floor(Math.round(player.health)) +
          "/" +
          Math.floor(player.maxHealth)
      ).width /
        2,
    player.y - player.camera.y + player.scale + barPad,
    2 * barWidth,
    17 - 2 * barPad,
    7
  );
  ctx.fill();
  ctx.fillStyle = "#d9d9d9";
  ctx.roundRect(
    player.x -
      player.camera.x -
      barWidth -
      ctx.measureText(
        Math.floor(Math.round(player.health)) +
          "/" +
          Math.floor(player.maxHealth)
      ).width /
        2,
    player.y - player.camera.y + player.scale + barPad,
    2 * barWidth * (player.health / player.maxHealth),
    17 - 2 * barPad,
    7
  );
  ctx.fill();
  ctx.fillText(
    Math.floor(Math.round(player.health)) + "/" + Math.floor(player.maxHealth),
    player.x -
      player.camera.x -
      barWidth -
      ctx.measureText(
        Math.floor(Math.round(player.health)) +
          "/" +
          Math.floor(player.maxHealth)
      ).width /
        2 +
      barWidth * 2.15,
    player.y -
      player.camera.y +
      player.scale +
      barPad +
      parseInt(ctx.font.slice(0, ctx.font.indexOf("px"))) / 2
  );

  let projectiles = allProjectiles.filter(
    (e) =>
      e.x < player.camera.x + cvs.width &&
      e.y < player.camera.y + cvs.height &&
      e.x > player.camera.x - cvs.width / 2 &&
      e.y > player.camera.y - cvs.height / 2
  );
  for (let i in projectiles) {
    if (projectiles[i].type == "Bullet") {
      ctx.beginPath();
      ctx.arc(
        projectiles[i].x + Math.cos(projectiles[i].dir) * 5 - player.camera.x,
        projectiles[i].y + Math.sin(projectiles[i].dir) * 5 - player.camera.y,
        2.5,
        0,
        toRad(360)
      );
      ctx.fillStyle = "#fff48d";
      ctx.fill();
      ctx.beginPath();
      ctx.lineWidth = 5;
      ctx.moveTo(
        projectiles[i].x +
          Math.cos(projectiles[i].dir - toRad(180)) * 5 -
          player.camera.x,
        projectiles[i].y +
          Math.sin(projectiles[i].dir - toRad(180)) * 5 -
          player.camera.y
      );
      ctx.lineTo(
        projectiles[i].x + Math.cos(projectiles[i].dir) * 5 - player.camera.x,
        projectiles[i].y + Math.sin(projectiles[i].dir) * 5 - player.camera.y
      );
      ctx.strokeStyle = "#ffb88d";
      ctx.stroke();
    }
  }

  enemies = allEnemies.filter(
    (e) =>
      e.x < player.camera.x + cvs.width / 2 + cvs.width / 2 + e.scale / 2 &&
      e.y < player.camera.y + cvs.height / 2 + cvs.height / 2 + e.scale / 2 &&
      e.x > player.camera.x + cvs.width / 2 - cvs.width / 2 - e.scale / 2 &&
      e.y > player.camera.y + cvs.height / 2 - cvs.height / 2 - e.scale / 2
  );
  for (let i in enemies) {
    //Zombie Namedisplay
    ctx.font = 20 + "px Forte";
    ctx.fillStyle = "#F47174";
    ctx.strokeStyle = "#2e2e2e";
    ctx.lineWidth = 11;
    ctx.lineJoin = "round";
    ctx.strokeText("Zombie", f1 - 27.5, d1 - 100);
    ctx.fillText("Zombie", f1 - 27.5, d1 - 100);

    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.arc(
      enemies[i].x - player.camera.x,
      enemies[i].y - player.camera.y,
      enemies[i].scale / 2 - ctx.lineWidth / 2,
      0,
      toRad(360)
    );
    ctx.fillStyle = "#92b391";
    ctx.fill();
    ctx.strokeStyle = "#637561";
    ctx.stroke();
    if (!enemies[i].isDamagable) {
      ctx.beginPath();
      ctx.arc(
        enemies[i].x - player.camera.x,
        enemies[i].y - player.camera.y,
        enemies[i].scale / 2,
        0,
        toRad(360)
      );
      ctx.fillStyle = "rgba(100, 0, 0, 0.2)";
      ctx.fill();
    }
    ctx.font = "10px Forte";
    ctx.fillStyle = "#292c30";
    ctx.roundRect(
      enemies[i].x -
        player.camera.x -
        barWidth -
        barPad -
        ctx.measureText(
          (player.health < 1 ? player.health.toFixed(1) : player.health) +
            "/" +
            player.maxHealth
        ).width /
          2,
      enemies[i].y - player.camera.y + player.scale,
      2 * barWidth +
        2 * barPad +
        ctx.measureText(
          (player.health < 1 ? player.health.toFixed(1) : player.health) +
            "/" +
            player.maxHealth
        ).width +
        parseInt(ctx.font.slice(0, ctx.font.indexOf("px"))) / 5,
      17,
      8
    );

    ctx.font = "10px Peace Sans";
    ctx.fillStyle = "#292c30";
    ctx.roundRect(
      enemies[i].x -
        player.camera.x -
        barWidth -
        barPad -
        ctx.measureText(
          (enemies[i].health < 1 ? enemies[i].health : enemies[i].health) +
            "/" +
            enemies[i].maxHealth
        ).width /
          2,
      enemies[i].y - player.camera.y + enemies[i].scale,
      2 * barWidth +
        2 * barPad +
        ctx.measureText(
          (enemies[i].health < 1 ? enemies[i].health : enemies[i].health) +
            "/" +
            enemies[i].maxHealth
        ).width +
        parseInt(ctx.font.slice(0, ctx.font.indexOf("px"))) / 5,
      17,
      8
    );
    ctx.fill();
    ctx.fillStyle = "#0f0f0f";
    ctx.roundRect(
      enemies[i].x -
        player.camera.x -
        barWidth -
        ctx.measureText(
          (enemies[i].health < 1 ? enemies[i].health : enemies[i].health) +
            "/" +
            enemies[i].maxHealth
        ).width /
          2,
      enemies[i].y - player.camera.y + enemies[i].scale + barPad,
      2 * barWidth,
      17 - 2 * barPad,
      7
    );
    ctx.fill();
    ctx.fillStyle = "#d9d9d9";
    ctx.roundRect(
      enemies[i].x -
        player.camera.x -
        barWidth -
        ctx.measureText(
          (enemies[i].health < 1 ? enemies[i].health : enemies[i].health) +
            "/" +
            enemies[i].maxHealth
        ).width /
          2,
      enemies[i].y - player.camera.y + enemies[i].scale + barPad,
      2 *
        barWidth *
        ((enemies[i].health < 1 ? enemies[i].health : enemies[i].health) /
          enemies[i].maxHealth),
      17 - 2 * barPad,
      7
    );
    ctx.fill();
    ctx.fillText(
      (enemies[i].health < 1
        ? Math.round(enemies[i].health * 100)
        : Math.round(enemies[i].health * 100)) +
        "/" +
        enemies[i].maxHealth * 100,
      enemies[i].x -
        player.camera.x -
        barWidth -
        ctx.measureText(
          (enemies[i].health < 1
            ? Math.round(enemies[i].health * 100)
            : Math.round(enemies[i].health * 100)) +
            "/" +
            enemies[i].maxHealth * 100
        ).width /
          2 +
        barWidth * 2.15,
      enemies[i].y -
        player.camera.y +
        enemies[i].scale +
        barPad +
        parseInt(ctx.font.slice(0, ctx.font.indexOf("px"))) / 2
    );
  }

  particles = allParticles.filter(
    (e) =>
      e.x < player.camera.x + cvs.width / 2 + cvs.width / 2 + e.scale / 2 &&
      e.y < player.camera.y + cvs.height / 2 + cvs.height / 2 + e.scale / 2 &&
      e.x > player.camera.x + cvs.width / 2 - cvs.width / 2 - e.scale / 2 &&
      e.y > player.camera.y + cvs.height / 2 - cvs.height / 2 - e.scale / 2 &&
      e.layer == 0
  );
  for (let i in particles) {
    if (particles[i].layer == 0) {
      ctx.beginPath();
      ctx.arc(
        particles[i].x - player.camera.x,
        particles[i].y - player.camera.y,
        particles[i].scale,
        0,
        toRad(360)
      );
      ctx.fillStyle = particles[i].color;
      ctx.fill();
    }
  }

  let mapScale = 200;
  let pointerScale = 2;
  ctx.globalAlpha = 0.2;
  ctx.drawIMG(
    "https://cdn.glitch.com/aa34e651-fc51-45ca-879c-6c98719ac8cb%2FMap.png?v=1629954794270",
    cvs.width - mapScale - 20,
    cvs.height - mapScale - 20,
    mapScale,
    mapScale
  );
  ctx.globalAlpha = 1;
  for (let i = 0; i < allEnemies.length + 1; i++) {
    ctx.beginPath();
    ctx.arc(
      ((i == allEnemies.length ? player.x : allEnemies[i].x) / map.scale[0]) *
        (mapScale - pointerScale) +
        cvs.width -
        mapScale -
        20 +
        pointerScale / 2,
      ((i == allEnemies.length ? player.y : allEnemies[i].y) / map.scale[1]) *
        (mapScale - pointerScale) +
        cvs.height -
        mapScale -
        20 +
        pointerScale / 2,
      pointerScale,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = i == allEnemies.length ? "#FFFFFF" : "#FF0000";
    ctx.fill();
  }

  let weaponStatImage = [
    [
      "https://cdn.glitch.com/aa34e651-fc51-45ca-879c-6c98719ac8cb%2FPistol%20Black.png?v=1630254540859",
      "https://cdn.glitch.com/aa34e651-fc51-45ca-879c-6c98719ac8cb%2FPistol%20White.png?v=1630254531062",
    ],
  ];

  let weaponStatImage2 = [
    [
      "https://cdn.glitch.global/b973d872-284a-493a-8507-ab2a6d555d59/vecteezy_machine-gun_1198866.png?v=1644614435670",
      "https://cdn.glitch.global/b973d872-284a-493a-8507-ab2a6d555d59/vecteezy_machine-gun_white_1198866.png?v=1644616249598",
    ],
  ];

  let pointer = false;
  for (let i in upgrades) {
    if (
      window.mouseX > 255 - 7.5 &&
      window.mouseX < 255 + 7.5 &&
      window.mouseY > 67.5 + i * 20 - 7.5 &&
      window.mouseY < 67.5 + i * 20 + 7.5
    ) {
      upgrades[i][3] = true;
      pointer = true;
    } else {
      upgrades[i][3] = false;
    }
  }
  if (pointer && cvs.style.cursor != "pointer") {
    cvs.style.cursor = "pointer";
  } else if (!pointer && cvs.style.cursor != "default") {
    cvs.style.cursor = "default";
  }

  if (pointer && cvs.style.cursor != "pointer") {
    cvs.style.cursor = "pointer";
  } else if (!pointer && cvs.style.cursor != "default") {
    cvs.style.cursor = "default";
  }

  if (
    window.mouseX > 20 &&
    window.mouseX < weaponStatScale[0] + 20 &&
    window.mouseY < cvs.height - 20 &&
    window.mouseY > cvs.height - weaponStatScale[1] - 20
  ) {
    weaponStatHovered[0] = true;
    cvs.style.cursor = "pointer";
  } else if (
    window.mouseX > 20 &&
    window.mouseX < weaponStatScale[0] + 20 &&
    window.mouseY < cvs.height - weaponStatScale[1] - 40 &&
    window.mouseY > cvs.height - weaponStatScale[1] * 2 - 40
  ) {
    weaponStatHovered[1] = true;
    cvs.style.cursor = "pointer";
  } else if (
    window.mouseX > 20 &&
    window.mouseX < weaponStatScale[0] + 20 &&
    window.mouseY < cvs.height - weaponStatScale[1] - 165 &&
    window.mouseY > cvs.height - weaponStatScale[1] * 2 - 165
  ) {
    weaponStatHovered[2] = true;
    cvs.style.cursor = "pointer";
  } else {
    weaponStatHovered[2] = false;
    weaponStatHovered[1] = false;
    weaponStatHovered[0] = false;
    if (!pointer) {
      cvs.style.cursor = "default";
    }
  }
  ctx.globalAlpha = 0.2;
  ctx.drawIMG(
    weaponStatHovered[0]
      ? "https://cdn.glitch.com/aa34e651-fc51-45ca-879c-6c98719ac8cb%2FWeapon%20Stats%20White.png?v=1630250292975"
      : "https://cdn.glitch.com/aa34e651-fc51-45ca-879c-6c98719ac8cb%2FWeapon%20Stats%20Black.png?v=1630250291901",
    20,
    cvs.height - weaponStatScale[1] - 20,
    weaponStatScale[0],
    weaponStatScale[1]
  );
  ctx.drawIMG(
    weaponStatHovered[1]
      ? "https://cdn.glitch.com/aa34e651-fc51-45ca-879c-6c98719ac8cb%2FWeapon%20Stats%20White.png?v=1630250292975"
      : "https://cdn.glitch.com/aa34e651-fc51-45ca-879c-6c98719ac8cb%2FWeapon%20Stats%20Black.png?v=1630250291901",
    20,
    cvs.height - weaponStatScale[1] * 2 - 40,
    weaponStatScale[0],
    weaponStatScale[1]
  );
  ctx.drawIMG(
    weaponStatHovered[2]
      ? "https://cdn.glitch.com/aa34e651-fc51-45ca-879c-6c98719ac8cb%2FWeapon%20Stats%20White.png?v=1630250292975"
      : "https://cdn.glitch.com/aa34e651-fc51-45ca-879c-6c98719ac8cb%2FWeapon%20Stats%20Black.png?v=1630250291901",
    20,
    cvs.height - weaponStatScale[1] * 2 - 165,
    weaponStatScale[0],
    weaponStatScale[1]
  );
  ctx.drawIMG(
    weaponStatHovered[1] ? weaponStatImage[0][1] : weaponStatImage[0][0],
    20 + weaponStatScale[0] / 30 + weaponStatScale[0] / 10 / 2,
    cvs.height -
      weaponStatScale[1] * 2 -
      40 +
      weaponStatScale[1] / 10 +
      (weaponStatScale[1] * 0.3) / 2,
    weaponStatScale[0] / 5 / 2,
    (weaponStatScale[1] * 0.6) / 2
  );

  ctx.font = "20px Forte";
  ctx.fillStyle = weaponStatHovered[2]
    ? "rgba(255, 255, 255)"
    : "rgba(0, 0, 0)";
  ctx.fillText(
    "      Machine Gun",
    weaponStatScale[0] / 2 +
      25 +
      weaponStatScale[0] / 10 +
      weaponStatScale[0] / 60 +
      20 -
      ctx.measureText(player.weapons[2]).width,
    cvs.height - weaponStatScale[1] * 2 - 165 + weaponStatScale[1] / 4
  );

  ctx.fillStyle = weaponStatHovered[1]
    ? "rgba(255, 255, 255)"
    : "rgba(0, 0, 0)";
  ctx.fillText(
    player.weapons[1],
    weaponStatScale[0] / 2 +
      weaponStatScale[0] / 10 +
      weaponStatScale[0] / 60 +
      20 -
      ctx.measureText(player.weapons[1]).width / 2,
    cvs.height - weaponStatScale[1] * 2 - 40 + weaponStatScale[1] / 4
  );
  ctx.fillStyle = weaponStatHovered[0]
    ? "rgba(255, 255, 255)"
    : "rgba(0, 0, 0)";
  ctx.fillText(
    player.weapons[0],
    weaponStatScale[0] / 2 +
      weaponStatScale[0] / 10 +
      weaponStatScale[0] / 60 +
      20 -
      ctx.measureText(player.weapons[0]).width / 2,
    cvs.height - weaponStatScale[1] - 20 + weaponStatScale[1] / 4
  );
  ctx.drawIMG(
    weaponStatHovered[1] ? weaponStatImage[0][1] : weaponStatImage[0][0],
    20 + weaponStatScale[0] / 30 + weaponStatScale[0] / 10 / 2,
    cvs.height -
      weaponStatScale[1] * 2 -
      40 +
      weaponStatScale[1] / 10 +
      (weaponStatScale[1] * 0.3) / 2,
    weaponStatScale[0] / 5 / 2,
    (weaponStatScale[1] * 0.6) / 2
  );
  ctx.drawIMG(
    weaponStatHovered[2] ? weaponStatImage2[0][1] : weaponStatImage2[0][0],
    20 + weaponStatScale[0] / 30 + weaponStatScale[0] / 10 / 2,
    cvs.height -
      weaponStatScale[1] * 2 -
      165 +
      weaponStatScale[1] / 10 +
      (weaponStatScale[1] * 0.3) / 2,
    weaponStatScale[0] / 5 / 2,
    (weaponStatScale[1] * 0.6) / 2
  );

  ctx.drawIMG(
    "https://cdn.glitch.com/aa34e651-fc51-45ca-879c-6c98719ac8cb%2FBar%20Black.png?v=1630307378446",
    20,
    20,
    225,
    15
  );
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#e6d48c";
  ctx.roundRect(
    20,
    20,
    player.lvl < player.maxLvl ? (225 * player.xp) / player.maxXp : 255,
    15,
    7.5
  );
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "10px Forte";
  ctx.fillText(
    Math.floor(player.xp) + " / " + Math.floor(player.maxXp),
    225 / 2,
    31.5
  );
  ctx.font = "20px Forte";
  ctx.fillText(player.lvl, 255, 35);
  ctx.fillText(
    "Skill Points: " + player.upgradePoints,
    225 / 2 +
      20 -
      ctx.measureText("Skill Points: " + player.upgradePoints).width / 2,
    55
  );

  for (let i = 0; i < upgrades.length; i++) {
    ctx.roundRect(20, 60 + i * 20, 225, 15, 7.5);
    ctx.fillStyle = "#292c30";
    ctx.fill();
    ctx.roundRect(20, 60 + i * 20, (225 * upgrades[i][1]) / 10, 15, 7.5);
    ctx.fillStyle = upgrades[i][0];
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "10px Forte";
    ctx.fillText(
      upgrades[i][2],
      225 / 2 + 20 - ctx.measureText(upgrades[i][2]).width / 2,
      60 + i * 20 + 11.5
    );
    ctx.font = "10px Forte";
    ctx.fillText(
      upgrades[i][1] + "/10",
      225 - ctx.measureText(upgrades[i][1] + "/10").width / 2,
      60 + i * 20 + 11.5
    );
    ctx.beginPath();
    ctx.arc(255, 67.5 + i * 20, 7.5, 0, toRad(360));
    ctx.fillStyle =
      player.upgradePoints <= 0 || upgrades[i][1] >= 10
        ? "#808080"
        : upgrades[i][4]
        ? "#aaaaaa"
        : upgrades[i][3]
        ? "#FFFFFF"
        : upgrades[i][0];
    ctx.fill();
  }
}
refresh();
setInterval(refresh);
