// ==========================================
// TRẠNG THÁI GAME
// ==========================================
let playDeck = [];

let score = 0,
  hp = GAME_CONFIG.player.initialHp,
  streak = 0,
  maxStreak = 0,
  evolutionLevel = 0,
  bonusSpeed = 0,
  currentEvoColor = 0xffffff,
  timeRemaining = 0;

let isInvulnerable = false,
  hasShield = false,
  shieldTimeRemaining = 0;
let hasMagnet = false,
  magnetTimeRemaining = 0,
  passiveMagnet = false;
let isGameRunning = false,
  isQuizOpen = false,
  isGamePaused = false,
  isHelpOpen = false,
  gameSpeed = 1;

let spawnTimerEvent,
  rewardTimerEvent,
  bossSpawnTimer = null;
let meteorShowerActive = false,
  bossAvailable = false;
let uiShieldTimer, uiBuffTimer, uiBuffStatus, uiShieldStatus;
let lastShieldSec = -1,
  lastMagnetSec = -1;

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: "100%",
    height: "100%",
  },
  physics: { default: "arcade", arcade: { debug: false } },
  render: { pixelArt: false, powerPreference: "high-performance" },
  fps: { panicMax: 120 },
  scene: { preload, create, update },
};

const game = new Phaser.Game(config);
let player, cursors, wasd, meteorGroup, quizGroup, itemGroup, bossGroup;
let bgSpace, bgStars, shieldRing1, shieldRing2, magnetEffect, jetpack;

function startGame(setId) {
  window.currentLevel = setId;

  const selectedSet = typeof quizSets !== "undefined" ? quizSets[setId] : null;

  if (
    !selectedSet ||
    !selectedSet.questions ||
    selectedSet.questions.length === 0
  ) {
    return;
  }

  GAME_CONFIG.game.totalQuestions = selectedSet.questions.length;

  const percentages = [0.15, 0.3, 0.45, 0.6, 0.75, 0.9];
  GAME_CONFIG.game.meteorStormTriggers = [
    ...new Set(
      percentages.map((p) => Math.floor(p * GAME_CONFIG.game.totalQuestions)),
    ),
  ].filter((v) => v > 0);

  playDeck = JSON.parse(JSON.stringify(selectedSet.questions))
    .sort(() => Math.random() - 0.5)
    .slice(0, GAME_CONFIG.game.totalQuestions);

  // 🌟 DÁN THÊM ĐOẠN NÀY: Ép mỗi câu hỏi có 1 ID ảo (Thẻ căn cước)
  playDeck.forEach((q, index) => {
    q._uniqueKey = "key_" + Date.now() + "_" + index;
  });

  document.getElementById("set-title-text").innerText =
    selectedSet.title || `KIẾN THỨC TỔNG HỢP - PHẦN ${setId}`;
  document.getElementById("set-title-display").style.display = "block";

  const markersContainer = document.getElementById("boss-markers");
  markersContainer.innerHTML = "";
  GAME_CONFIG.game.meteorStormTriggers.forEach((triggerScore) => {
    const percent = (triggerScore / GAME_CONFIG.game.totalQuestions) * 100;
    const marker = document.createElement("div");
    marker.className = "boss-marker";
    marker.id = `boss-marker-${triggerScore}`;
    marker.innerText = "☠️";
    marker.style.left = `${percent}%`;
    markersContainer.appendChild(marker);
  });

  document.getElementById("hud-container").style.display = "flex";
  document.getElementById("progress-container").style.display = "block";
  document.getElementById("total-questions-display").innerText =
    GAME_CONFIG.game.totalQuestions;
  document.getElementById("hp").innerText = "❤️".repeat(hp);
  maxStreak = 0;
  document.getElementById("level").innerText = evolutionLevel;
  document.getElementById("fullscreen-btn").style.display = "flex";
  document.getElementById("help-btn").style.display = "flex";

  timeRemaining = GAME_CONFIG.game.timeLimit;
  document.getElementById("time-remaining").innerText = "15:00";

  isGameRunning = false;
  document.getElementById("start-screen").style.display = "none";

  const countdownScreen = document.getElementById("countdown-screen");
  const countdownText = document.getElementById("countdown-text");
  countdownScreen.style.display = "flex";

  const loadingMsg = document.getElementById("loading-msg");
  loadingMsg.classList.remove("run-anim");
  void loadingMsg.offsetWidth;
  loadingMsg.classList.add("run-anim");

  let count = 5;
  countdownText.innerText = count;
  countdownText.style.color = "#00d2d3";

  const countInterval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownText.innerText = count;
      if (count === 3) countdownText.style.color = "#f1c40f";
      if (count === 1) countdownText.style.color = "#ff4757";
    } else {
      clearInterval(countInterval);
      countdownText.innerText = "BẮT ĐẦU!";
      countdownText.style.color = "#2ecc71";

      countdownText.style.animation = "none";
      countdownText.style.transform = "scale(1.2)";

      setTimeout(() => {
        countdownScreen.style.display = "none";
        isGameRunning = true;

        countdownText.style.animation = "";
        countdownText.style.transform = "";

        if (game.scene.scenes[0]) {
          game.scene.scenes[0].physics.resume();
        }
      }, 1500);
    }
  }, 1000);
}

function preload() {
  // Stars
  this.load.image(
    "stars",
    "../assets/images/space/Starfields/Starfield-7-1024x1024.png",
  );

  // Bối cảnh Seamless
  this.load.image(
    "space",
    "../assets/images/space/BlueNebula/Blue-Nebula-6-1024x1024.png",
  );
  this.load.image(
    "bg-evo-1",
    "../assets/images/space/GreenNebula/Green-Nebula-6-1024x1024.png",
  );
  this.load.image(
    "bg-evo-2",
    "../assets/images/space/PurpleNebula/Purple-Nebula-6-1024x1024.png",
  );
  this.load.image(
    "bg-evo-3",
    "../assets/images/space/BlueNebula/Blue-Nebula-8-1024x1024.png",
  );
  this.load.image(
    "bg-evo-4",
    "../assets/images/space/GreenNebula/Green-Nebula-8-1024x1024.png",
  );
  this.load.image(
    "bg-evo-5",
    "../assets/images/space/PurpleNebula/Purple-Nebula-8-1024x1024.png",
  );

  this.load.image(
    "player-ship",
    "../assets/images/character/playerShip1_blue.png",
  );
  this.load.image("meteor", "../assets/images/items/asteroid1.png");
  this.load.image("gem", "../assets/images/items/gem.png");
  this.load.image("boss-gem", "../assets/images/items/diamond.png");
  this.load.image("item-apple", "../assets/images/items/apple.png");
  this.load.image("item-shield", "../assets/images/items/blue_ball.png");
  this.load.image("item-bomb", "../assets/images/items/mine.png");
  this.load.image("item-magnet", "../assets/images/items/diamond.png");
  this.load.image("blue-flare", "../assets/images/items/blue.png");
  this.load.image("ring", "../assets/images/items/ring.png");
}

function create() {
  this.physics.pause();
  this.physics.world.setBounds(0, 0, window.innerWidth, window.innerHeight);

  bgSpace = this.add
    .tileSprite(0, 0, window.innerWidth, window.innerHeight, "space")
    .setOrigin(0, 0);
  let spaceImg = this.textures.get("space").getSourceImage();
  if (spaceImg) {
    let finalScale = Math.max(
      window.innerWidth / spaceImg.width,
      window.innerHeight / spaceImg.height,
    );
    bgSpace.tileScaleX = finalScale;
    bgSpace.tileScaleY = finalScale;
  }

  bgStars = this.add
    .tileSprite(0, 0, window.innerWidth, window.innerHeight, "stars")
    .setOrigin(0, 0)
    .setAlpha(0.6);
  let starsImg = this.textures.get("stars").getSourceImage();
  if (starsImg) {
    let scaleY = window.innerHeight / starsImg.height;
    bgStars.tileScaleY = scaleY;
    bgStars.tileScaleX = scaleY;
  }

  jetpack = this.add.particles("blue-flare").createEmitter({
    speed: 150,
    scale: { start: 0.5, end: 0 },
    lifespan: 300,
    quantity: 1,
    frequency: 50,
    angle: { min: 160, max: 200 },
    followOffset: { x: -40, y: 0 },
  });

  player = this.physics.add
    .sprite(150, window.innerHeight / 2, "player-ship")
    .setCollideWorldBounds(true)
    .setScale(1)
    .setAngle(90)
    .setDrag(800)
    .setDepth(10);

  player.body.setSize(40, 20, true);
  jetpack.startFollow(player);

  shieldRing1 = this.add
    .image(0, 0, "ring")
    .setScale(0.8 * (GAME_CONFIG.player.scale / 1.5))
    .setTint(0x00ccff)
    .setAlpha(0.8)
    .setVisible(false);
  shieldRing2 = this.add
    .image(0, 0, "ring")
    .setScale(1.2 * (GAME_CONFIG.player.scale / 1.5))
    .setTint(0x00d2d3)
    .setAlpha(0.5)
    .setVisible(false);
  magnetEffect = this.add
    .image(0, 0, "ring")
    .setScale(2.5)
    .setTint(0xf1c40f)
    .setAlpha(0.5)
    .setVisible(false);

  meteorGroup = this.physics.add.group({
    defaultKey: "meteor",
    maxSize: GAME_CONFIG.meteor.maxCount + 25,
  });
  meteorGroup.createMultiple({
    key: "meteor",
    quantity: GAME_CONFIG.meteor.maxCount + 25,
    active: false,
    visible: false,
  });
  meteorGroup.children.iterate((m) => {
    if (m && m.body) m.body.enable = false;
  });

  quizGroup = this.physics.add.group();
  bossGroup = this.physics.add.group();
  itemGroup = this.physics.add.group();

  cursors = this.input.keyboard.createCursorKeys();
  wasd = this.input.keyboard.addKeys({
    up: "W",
    down: "S",
    left: "A",
    right: "D",
  });

  spawnTimerEvent = this.time.addEvent({
    delay: GAME_CONFIG.meteor.spawnDelay,
    callback: spawnMeteor,
    callbackScope: this,
    loop: true,
  });
  this.time.addEvent({
    delay: GAME_CONFIG.items.quizSpawnDelay,
    callback: spawnQuizItem,
    callbackScope: this,
    loop: true,
  });
  rewardTimerEvent = this.time.addEvent({
    delay: GAME_CONFIG.items.rewardSpawnDelay,
    callback: spawnRewardItem,
    callbackScope: this,
    loop: true,
  });

  this.physics.add.collider(player, meteorGroup, hitMeteor, null, this);
  this.physics.add.overlap(player, quizGroup, openQuiz, null, this);
  this.physics.add.overlap(player, bossGroup, openBossQuiz, null, this);
  this.physics.add.overlap(player, itemGroup, collectItem, null, this);
  this.physics.add.collider(
    meteorGroup,
    meteorGroup,
    meteorVsMeteor,
    null,
    this,
  );
  this.textures.get("deep-space").setFilter(Phaser.Textures.FilterMode.LINEAR);

  uiShieldTimer = document.getElementById("shield-timer");
  uiBuffTimer = document.getElementById("buff-timer");
  uiBuffStatus = document.getElementById("buff-status");
  uiShieldStatus = document.getElementById("shield-status");
}

function update(time, delta) {
  if (!isGameRunning || isQuizOpen || isGamePaused || isHelpOpen) return;

  if (timeRemaining > 0) {
    timeRemaining -= delta / 1000;
    let m = Math.floor(timeRemaining / 60);
    let s = Math.floor(timeRemaining % 60);
    document.getElementById("time-remaining").innerText =
      (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);

    if (timeRemaining <= 0) {
      timeRemaining = 0;
      document.getElementById("time-remaining").innerText = "00:00";
      game.scene.scenes[0].physics.pause();
      isGameRunning = false;
      clearTimeout(bossSpawnTimer);
      document.getElementById("end-score-text").innerHTML =
        `HẾT GIỜ! ĐIỂM SỐ CỦA <span class="player-name">${window.currentPlayer.fullname}</span>`;
      document.getElementById("end-score").innerText = score;
      // 🌟 In kỷ lục ra màn hình Game Over (Hết giờ)
      let endMaxStreakEl = document.getElementById("end-max-streak");
      if (endMaxStreakEl) endMaxStreakEl.innerText = maxStreak;
      document.getElementById("game-over-screen").style.display = "flex";
      return;
    }
  }

  bgSpace.tilePositionX += 0.5 * gameSpeed;
  bgStars.tilePositionX += meteorShowerActive ? 8 : 2 * gameSpeed;

  updateBuffs(time, delta);
  handleMovement();

  meteorGroup.children.iterate((m) => {
    if (m && m.active) {
      m.rotation += 0.05;
      if (
        m.x < -200 ||
        m.x > window.innerWidth + 200 ||
        m.y < -200 ||
        m.y > window.innerHeight + 200
      ) {
        destroyMeteorSafely(m);
      }
    }
  });
  quizGroup.children.iterate((item) => {
    if (item && item.active && item.x < -200) item.destroy();
  });
  itemGroup.children.iterate((item) => {
    if (item && item.active && item.x < -200) item.destroy();
  });
}

function updateBuffs(time, delta) {
  if (hasShield) {
    shieldRing1
      .setPosition(player.x, player.y)
      .setRotation(shieldRing1.rotation + 0.05);
    shieldRing2
      .setPosition(player.x, player.y)
      .setRotation(shieldRing2.rotation - 0.05);

    if (shieldTimeRemaining < 9999) {
      shieldTimeRemaining -= delta / 1000;
      let currentShieldSec = Math.ceil(shieldTimeRemaining);
      if (currentShieldSec !== lastShieldSec) {
        uiShieldTimer.innerText = currentShieldSec + "s";
        lastShieldSec = currentShieldSec;
      }
      if (shieldTimeRemaining <= 0) deactivateShield();
    } else {
      uiShieldTimer.innerText = "∞";
    }
  }

  let activeRadius = hasMagnet
    ? GAME_CONFIG.items.magnetRadius
    : passiveMagnet
      ? 180
      : 0;

  // 🌟 Gộp lệnh ẩn/hiện Nam châm
  if (hasMagnet) {
    magnetEffect
      .setPosition(player.x, player.y)
      .setRotation(magnetEffect.rotation - 0.02)
      .setScale(2.5 + Math.sin(time / 150) * 0.1)
      .setVisible(true);

    magnetTimeRemaining -= delta / 1000;
    let currentMagnetSec = Math.ceil(magnetTimeRemaining);
    if (currentMagnetSec !== lastMagnetSec) {
      uiBuffTimer.innerText = currentMagnetSec + "s";
      lastMagnetSec = currentMagnetSec;
    }
    if (magnetTimeRemaining <= 0) {
      hasMagnet = false;
      uiBuffStatus.style.display = "none";
    }
  } else {
    magnetEffect.setVisible(false);
  }

  if (activeRadius > 0) {
    itemGroup.children.iterate((item) => {
      if (
        item &&
        item.active &&
        Phaser.Math.Distance.Between(player.x, player.y, item.x, item.y) <
          activeRadius
      ) {
        game.scene.scenes[0].physics.moveToObject(item, player, 600);
      }
    });
  }
}

function handleMovement() {
  player.setVelocity(0);
  let moveX =
    cursors.left.isDown || wasd.left.isDown
      ? -1
      : cursors.right.isDown || wasd.right.isDown
        ? 1
        : 0;
  let moveY =
    cursors.up.isDown || wasd.up.isDown
      ? -1
      : cursors.down.isDown || wasd.down.isDown
        ? 1
        : 0;

  if (moveX !== 0 || moveY !== 0) {
    let vec = new Phaser.Math.Vector2(moveX, moveY)
      .normalize()
      .scale(GAME_CONFIG.player.speed);
    player.setVelocity(vec.x, vec.y);
  }
  player.setAngle(moveY < 0 ? 75 : moveY > 0 ? 105 : 90);
}

function evolvePlayer() {
  evolutionLevel++;
  document.getElementById("level").innerText = evolutionLevel;

  bonusSpeed += 20;
  GAME_CONFIG.player.speed += 20;

  let color = 0xffffff,
    message = "",
    msgColor = "#ffffff",
    shortSkill = "";
  let newScale = 0.8;
  let newBgKey = "space";

  switch (evolutionLevel) {
    case 1:
      color = 0x00ffff;
      message = "🚀 CẤP 1: TĂNG TỐC!";
      msgColor = "#00ffff";
      newBgKey = "bg-evo-1";
      break;
    case 2:
      color = 0xffff00;
      passiveMagnet = true;
      message = "🧲 CẤP 2: TỪ TRƯỜNG!";
      msgColor = "#ffff00";
      shortSkill = "🧲 Nam châm tự động";
      newScale = 1.0;
      newBgKey = "bg-evo-2";
      break;
    case 3:
      color = 0xff9f43;
      message = "🦋 CẤP 3: LINH HOẠT!";
      msgColor = "#ff9f43";
      shortSkill = "🦋 Né tránh siêu việt";
      newScale = 0.45;
      newBgKey = "bg-evo-3";
      break;
    case 4:
      color = 0x2ecc71;
      GAME_CONFIG.player.initialHp += 3;
      hp += 3;
      document.getElementById("hp").innerText = "❤️".repeat(hp);
      message = "💚 CẤP 4: SINH MỆNH!";
      msgColor = "#2ecc71";
      shortSkill = "💚 Máu tối đa +3";
      newScale = 1.1;
      newBgKey = "bg-evo-4";
      break;
    case 5:
      color = 0x9b59b6;
      activateShield(20);
      message = "🛡️ CẤP 5: HỘ THỂ SIÊU CẤP!";
      msgColor = "#9b59b6";
      shortSkill = "🛡️ Khiên siêu cấp 20s";
      newScale = 1.2;
      newBgKey = "bg-evo-5";
      break;
    default:
      color = 0xff4757;
      activateShield(9999);
      message = "🔥 CẤP CUỐI: BẤT TỬ!";
      msgColor = "#ff4757";
      shortSkill = "🔥 Bất tử vĩnh viễn";
      newScale = 1.3;
      newBgKey = "bg-evo-5";
      break;
  }

  const skillsRow = document.getElementById("skills-row");
  const skillsList = document.getElementById("skills-list");

  if (skillsRow && skillsList) {
    skillsRow.style.display = "flex";

    let speedTag = document.getElementById("skill-speed");
    if (!speedTag) {
      speedTag = document.createElement("div");
      speedTag.id = "skill-speed";
      speedTag.className = "skill-tag";
      speedTag.style.borderColor = "#00ffff";
      speedTag.style.color = "#00ffff";
      skillsList.appendChild(speedTag);
    }
    speedTag.innerText = `🚀 Tốc độ +${bonusSpeed}`;
    speedTag.style.animation = "none";
    speedTag.offsetHeight;
    speedTag.style.animation = null;

    if (shortSkill !== "") {
      let uniqueId = "skill-special-" + evolutionLevel;
      if (evolutionLevel >= 6) uniqueId = "skill-special-6";

      let specialTag = document.getElementById(uniqueId);
      if (!specialTag) {
        specialTag = document.createElement("div");
        specialTag.id = uniqueId;
        specialTag.className = "skill-tag";
        specialTag.style.borderColor = msgColor;
        specialTag.style.color = msgColor;
        skillsList.appendChild(specialTag);
      }
      specialTag.innerText = shortSkill;
    }
  }

  jetpack
    .setTint(color)
    .setLifespan(300 + evolutionLevel * 150)
    .setScale({ start: 0.6 + evolutionLevel * 0.15, end: 0 });
  showFloatingText(player.x, player.y, message, msgColor);
  player.setTint(color);
  player.setScale(newScale);

  let coreSize = evolutionLevel === 3 ? 10 : 20;
  player.body.setSize(coreSize, coreSize, true);

  if (shieldRing1) shieldRing1.setScale(newScale * 1.0);
  if (shieldRing2) shieldRing2.setScale(newScale * 1.5);

  currentEvoColor = color;
  quizGroup.children.iterate((item) => {
    if (item && item.active) {
      game.scene.scenes[0].tweens.add({
        targets: item,
        scale: 1.5,
        duration: 200,
        yoyo: true,
        onComplete: () => item.setTint(currentEvoColor),
      });
    }
  });

  game.scene.scenes[0].cameras.main.flash(800, 255, 255, 255);
  game.scene.scenes[0].cameras.main.shake(300, 0.015);

  bgSpace.setTexture(newBgKey);
  bgSpace.setSize(window.innerWidth, window.innerHeight);
  let newImg = game.textures.get(newBgKey).getSourceImage();
  if (newImg) {
    let finalScale = Math.max(
      window.innerWidth / newImg.width,
      window.innerHeight / newImg.height,
    );
    bgSpace.tileScaleX = finalScale;
    bgSpace.tileScaleY = finalScale;
  }

  bgSpace.clearTint();
  bgSpace.setAlpha(0.85);

  bgStars.setTint(color);
  bgStars.setAlpha(0.3);

  const hudBoxes = document.querySelectorAll(".hud-box");
  hudBoxes.forEach((box) => {
    box.style.borderColor = msgColor;
    box.style.color = "#ffffff";
    box.style.boxShadow = `inset 0 0 5px ${msgColor}, 0 0 8px ${msgColor}`;
    box.style.transition = "all 0.5s ease";
  });

  const pauseBtn = document.getElementById("pause-btn-hud");
  if (pauseBtn) {
    pauseBtn.style.background = "#0b0f19";
    pauseBtn.style.border = `2px solid ${msgColor}`;
    pauseBtn.style.boxShadow = `0 0 8px ${msgColor}`;
  }
}

function spawnMeteor() {
  if (meteorGroup.countActive(true) >= GAME_CONFIG.meteor.maxCount) return;

  let edge = Phaser.Math.Between(0, 2);
  let startX, startY;
  let targetX = -150;
  let targetY = Phaser.Math.Between(0, window.innerHeight);

  if (edge === 0) {
    startX = window.innerWidth + Phaser.Math.Between(50, 200);
    startY = Phaser.Math.Between(50, window.innerHeight - 50);
  } else if (edge === 1) {
    startX = Phaser.Math.Between(window.innerWidth / 2, window.innerWidth + 50);
    startY = -50;
  } else {
    startX = Phaser.Math.Between(window.innerWidth / 2, window.innerWidth + 50);
    startY = window.innerHeight + 50;
  }

  const meteor = meteorGroup.get(startX, startY, "meteor");
  if (!meteor) return;

  meteor
    .setActive(true)
    .setVisible(true)
    .setPosition(startX, startY)
    .setAlpha(1);
  if (meteor.body) {
    meteor.body.enable = true;
    meteor.body.stop();
  }

  const scale = Phaser.Math.FloatBetween(1.5, 3.0);
  const tintColor = meteorShowerActive ? 0xff4757 : 0xffffff;
  meteor
    .setScale(scale)
    .setCircle(meteor.width / 2.5)
    .setTint(tintColor);

  let baseSpeed = meteorShowerActive
    ? Phaser.Math.Between(
        Math.abs(GAME_CONFIG.meteor.stormMinSpeed),
        Math.abs(GAME_CONFIG.meteor.stormMaxSpeed),
      )
    : Phaser.Math.Between(
        Math.abs(GAME_CONFIG.meteor.minSpeed),
        Math.abs(GAME_CONFIG.meteor.maxSpeed),
      );

  let speed = baseSpeed * gameSpeed;
  let angle = Phaser.Math.Angle.Between(startX, startY, targetX, targetY);

  meteor.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  meteor.setBounce(1).setMass(2);
}

function spawnQuizItem() {
  if (
    bossAvailable ||
    meteorShowerActive ||
    playDeck.length === 0 ||
    quizGroup.countActive(true) >= 5
  )
    return;

  // 1. Quét xem trên màn hình đang có những câu hỏi (uniqueKey) nào đang bay
  let activeKeys = [];
  quizGroup.children.iterate((child) => {
    if (child.active) activeKeys.push(child.getData("quizData")._uniqueKey);
  });

  // 2. Tìm câu hỏi đầu tiên trong bộ bài KHÔNG TRÙNG với các câu đang bay
  let qIndex = playDeck.findIndex((q) => !activeKeys.includes(q._uniqueKey));
  if (qIndex === -1) return; // Nếu tất cả câu hỏi đều đang hiển thị thì chờ

  // 3. Rút câu đó ra và NHÉT XUỐNG ĐÁY bộ bài (Học sinh bỏ lỡ ngọc thì nó sẽ quay lại sau)
  let nextQ = playDeck.splice(qIndex, 1)[0];
  playDeck.push(nextQ);

  let randomX = window.innerWidth + Phaser.Math.Between(50, 200);
  let item = quizGroup.create(
    randomX,
    Phaser.Math.Between(130, window.innerHeight - 130),
    "gem",
  );

  item
    .setScale(1.2)
    .setVelocityX(-200 * gameSpeed)
    .setData("quizData", nextQ)
    .setData("isBoss", false)
    .setTint(currentEvoColor);
}

function spawnBossItem() {
  bossAvailable = true;
  let item = bossGroup.create(
    window.innerWidth + 100,
    window.innerHeight / 2,
    "boss-gem",
  );

  item
    .setScale(4.0)
    .setTint(0xff0000)
    .setVelocityX(-100)
    .setCollideWorldBounds(true)
    .setBounce(1);

  game.scene.scenes[0].tweens.add({
    targets: item,
    angle: 360,
    duration: 3000,
    repeat: -1,
  });

  // --- PHẦN SỬA LOGIC RÚT CÂU HỎI ---

  // Kiểm tra nếu còn câu hỏi thì dùng .splice lấy câu đầu tiên (vị trí 0)
  // Nếu hết thì dùng câu mặc định
  let bossQ =
    playDeck.length > 0
      ? playDeck.splice(0, 1)[0]
      : {
          id: 999,
          q: "HẾT CÂU HỎI! TIÊU DIỆT TÔI ĐI!",
          options: ["OK"],
          answer: ["OK"],
          type: "single",
        };

  // Thêm tiền tố [BOSS] để học sinh biết đây là câu quan trọng
  // (Không cần check length ở đây nữa vì bossQ đã được lấy ra rồi)
  if (bossQ.id !== 999) {
    bossQ.q = "[BOSS] " + bossQ.q;
  }

  item.setData("quizData", bossQ).setData("isBoss", true);

  showFloatingText(
    window.innerWidth / 2,
    window.innerHeight / 2,
    "⚔️ BOSS XUẤT HIỆN! ⚔️",
    "#ff0000",
  );
}

function spawnRewardItem() {
  if (meteorShowerActive) return;
  const def = pickByRand(Math.random(), REWARD_TABLE);
  let randomX = window.innerWidth + Phaser.Math.Between(50, 250);

  itemGroup
    .create(
      randomX,
      Phaser.Math.Between(100, window.innerHeight - 100),
      def.sprite,
    )
    .setTint(def.tint)
    .setData("type", def.type)
    .setScale(def.scale)
    .setVelocityX(-350);
}

function triggerMeteorShower() {
  if (meteorShowerActive) return;
  meteorShowerActive = true;
  document.getElementById("boss-warning").style.display = "block";
  spawnTimerEvent.remove();
  spawnTimerEvent = game.scene.scenes[0].time.addEvent({
    delay: GAME_CONFIG.meteor.stormSpawnDelay,
    callback: spawnMeteor,
    callbackScope: game.scene.scenes[0],
    loop: true,
  });
  bossSpawnTimer = setTimeout(spawnBossItem, 5000);
}

function endMeteorShower() {
  meteorShowerActive = false;
  bossAvailable = false;
  document.getElementById("boss-warning").style.display = "none";
  spawnTimerEvent.remove();
  spawnTimerEvent = game.scene.scenes[0].time.addEvent({
    delay: GAME_CONFIG.meteor.spawnDelay,
    callback: spawnMeteor,
    callbackScope: game.scene.scenes[0],
    loop: true,
  });
  triggerSmartBomb();
}

function collectItem(player, item) {
  const type = item.getData("type");
  if (item && item.active) item.destroy();
  if (type === "hp") {
    hp = Math.min(hp + 1, GAME_CONFIG.player.initialHp);
    document.getElementById("hp").innerText = "❤️".repeat(hp);
    showFloatingText(player.x, player.y, "❤️ +1 MÁU", "#ff6b6b");
  } else if (type === "shield") activateShield(10);
  else if (type === "bomb") triggerSmartBomb();
  else if (type === "magnet") activateMagnet();
}

function activateShield(duration = 10) {
  hasShield = true;
  isInvulnerable = true;
  shieldTimeRemaining += duration;
  shieldRing1.setVisible(true);
  shieldRing2.setVisible(true);
  showFloatingText(
    player.x,
    player.y,
    duration >= 9999 ? "🛡️ BẤT TỬ!" : `🛡️ +${duration}s KHIÊN!`,
    "#00ccff",
  );
  uiShieldStatus.style.display = "flex";
}

function deactivateShield() {
  hasShield = false;
  isInvulnerable = false;
  shieldTimeRemaining = 0;
  shieldRing1.setVisible(false);
  shieldRing2.setVisible(false);
  document.getElementById("shield-status").style.display = "none";
  showFeedback("⚠️ HẾT KHIÊN", false);
}

function activateMagnet() {
  hasMagnet = true;
  magnetTimeRemaining += 10;
  magnetEffect.setVisible(true);
  showFloatingText(player.x, player.y, "🧲 +10s NAM CHÂM!", "#f1c40f");
  uiBuffStatus.style.display = "flex";
  document.getElementById("buff-text").innerText = "NAM CHÂM";
}

function triggerSmartBomb() {
  game.scene.scenes[0].cameras.main.flash(500, 255, 255, 255);
  meteorGroup.getChildren().slice().forEach(destroyMeteorSafely);
  showFloatingText(player.x, player.y, `💣 BÙM!! DỌN SẠCH!`, "#fffa65");
  spawnTimerEvent.paused = true;
  game.scene.scenes[0].time.delayedCall(1000, () => {
    if (!meteorShowerActive) spawnTimerEvent.paused = false;
  });
}

function hitMeteor(player, meteor) {
  if (hasShield) {
    const angle = Phaser.Math.Angle.Between(
      player.x,
      player.y,
      meteor.x,
      meteor.y,
    );
    meteor
      .setVelocity(Math.cos(angle) * 800, Math.sin(angle) * 800)
      .setTint(0x00f260);
    return;
  }
  if (isInvulnerable) return;

  game.scene.scenes[0].cameras.main.shake(500, 0.05);
  destroyMeteorSafely(meteor);
  hp--;
  document.getElementById("hp").innerText = "❤️".repeat(Math.max(0, hp));
  streak = 0;
  document.getElementById("streak").innerText = streak;

  showFeedback(getBatteryHTML(0), false, true);

  isInvulnerable = true;
  player.setTint(0xff4757);
  game.scene.scenes[0].tweens.add({
    targets: player,
    alpha: 0.2,
    duration: 150,
    yoyo: true,
    repeat: 7,
    onComplete: () => {
      player.setTint(currentEvoColor); // 🌟 Thay vì gọi lại mảng, dùng thẳng trạng thái hệ thống
      player.alpha = 1;
      isInvulnerable = false;
    },
  });

  if (hp <= 0) {
    game.scene.scenes[0].physics.pause();
    isGameRunning = false;
    clearTimeout(bossSpawnTimer);
    document.getElementById("end-score-text").innerHTML =
      `ĐIỂM SỐ CỦA <span class="player-name">${window.currentPlayer.fullname}</span>`;
    document.getElementById("end-score").innerText = score;
    // 🌟 In kỷ lục ra màn hình Game Over
    let endMaxStreakEl = document.getElementById("end-max-streak");
    if (endMaxStreakEl) endMaxStreakEl.innerText = maxStreak;
    document.getElementById("game-over-screen").style.display = "flex";
  }
}

function meteorVsMeteor(m1, m2) {
  if (
    m1.active &&
    m2.active &&
    (m1.body.velocity.x > 0 || m2.body.velocity.x > 0)
  ) {
    destroyMeteorSafely(m1);
    destroyMeteorSafely(m2);
  }
}

function destroyMeteorSafely(meteor) {
  if (!meteor || !meteor.active) return;
  meteorGroup.killAndHide(meteor);
  if (meteor.body) {
    meteor.body.stop();
    meteor.body.enable = false;
  }
}

function openQuiz(player, item) {
  setupModal(item, false);
}
function openBossQuiz(player, item) {
  setupModal(item, true);
}

let questionsAnswered = 0;
function finalizeResult(isCorrect, item, isBoss) {
  questionsAnswered++; // Tăng mỗi khi đóng modal câu hỏi (dù đúng hay sai)

  // Cập nhật thanh tiến trình dựa trên số câu đã làm thay vì số điểm
  const progressPercent =
    (questionsAnswered / GAME_CONFIG.game.totalQuestions) * 100;
  document.getElementById("progress-fill").style.width = progressPercent + "%";

  if (isCorrect) {
    score++;
    streak++;

    // Cập nhật kỷ lục mới!
    if (streak > maxStreak) {
      maxStreak = streak;
    }

    document.getElementById("score").innerText = score;
    document.getElementById("streak").innerText = streak;
    document.getElementById("progress-fill").style.width =
      (score / GAME_CONFIG.game.totalQuestions) * 100 + "%";
    gameSpeed = Math.min(gameSpeed + 0.02, 2.5);

    let passedMarker = document.getElementById(`boss-marker-${score}`);
    if (passedMarker) passedMarker.classList.add("passed");

    if (streak > 0 && streak % 5 === 0) {
      setTimeout(() => triggerSmartBomb(), 800);
      setTimeout(() => showFeedback("💣 NĂNG LƯỢNG ĐẦY! BÙM! 💣", true), 100);
    }
    if (streak > 0 && streak % 10 === 0) {
      setTimeout(() => activateShield(10), 1200);
      setTimeout(
        () => showFeedback("🛡️ ĐỘT PHÁ NĂNG LƯỢNG! NHẬN KHIÊN! 🛡️", true),
        100,
      );
    }

    if (isBoss) {
      endMeteorShower();
      evolvePlayer();
      showFeedback("BOSS ĐÃ BẠI! TÀU TIẾN HÓA!", true);
    } else {
      if (streak % 5 !== 0) {
        let energy = (streak % 5) * 20;
        showFeedback(getBatteryHTML(energy), true, true);
      }
      if (GAME_CONFIG.game.meteorStormTriggers.includes(score))
        triggerMeteorShower();
    }
  } else {
    // KHI TRẢ LỜI SAI
    streak = 0;
    document.getElementById("streak").innerText = streak;

    if (isBoss) {
      showFeedback("LỖI HỆ THỐNG! BOSS QUAY LẠI! ⚠️", false);
      setTimeout(spawnBossItem, 2000);
    } else {
      showFeedback("❌ BẠN ĐÃ MẤT CƠ HỘI GHI ĐIỂM CÂU NÀY!", false, true);
    }
  }

  // 🌟 LỆNH XÓA VĨNH VIỄN CÂU HỎI KHỎI BỘ BÀI KHI ĐÃ CÓ ĐÁP ÁN (DÙNG ID ẢO)
  playDeck = playDeck.filter(
    (q) => q._uniqueKey !== item.getData("quizData")._uniqueKey,
  );

  if (item && item.active) item.destroy();

  // 🌟 2. KIỂM TRA ĐIỀU KIỆN KẾT THÚC GAME ĐỨNG RIÊNG BIỆT DÀNH CHO MỌI TRƯỜNG HỢP
  if (score >= GAME_CONFIG.game.totalQuestions) {
    // TRƯỜNG HỢP 1: HOÀN HẢO 45/45 -> CHIẾN THẮNG
    document.getElementById("win-score-display").innerText =
      score + "/" + GAME_CONFIG.game.totalQuestions;
    let winMaxEl = document.getElementById("win-max-streak");
    if (winMaxEl) winMaxEl.innerText = maxStreak;

    document.getElementById("win-screen").style.display = "flex";
    isGameRunning = false;
    game.scene.scenes[0].add.particles("blue-flare").createEmitter({
      x: { min: 0, max: window.innerWidth },
      y: window.innerHeight,
      speedY: { min: -400, max: -800 },
      speedX: { min: -100, max: 100 },
      scale: { start: 0.5, end: 0 },
      quantity: 5,
      lifespan: 2000,
      tint: [0xf1c40f, 0xff4757, 0x00d2d3, 0x2ecc71],
    });
  } else if (playDeck.length === 0) {
    // TRƯỜNG HỢP 2: ĐÃ RÚT HẾT SẠCH CÂU HỎI MÀ VẪN CHƯA ĐỦ ĐIỂM MAX (Ví dụ 40/45) -> BỊ GAME OVER
    setTimeout(() => {
      game.scene.scenes[0].physics.pause();
      isGameRunning = false;
      clearTimeout(bossSpawnTimer);
      document.getElementById("end-score-text").innerHTML =
        `HẾT CÂU HỎI! ĐIỂM CỦA <span class="player-name">${window.currentPlayer.fullname}</span>`;
      document.getElementById("end-score").innerText = score;
      let endMaxStreakEl = document.getElementById("end-max-streak");
      if (endMaxStreakEl) endMaxStreakEl.innerText = maxStreak;
      document.getElementById("game-over-screen").style.display = "flex";
    }, 1500);
  } else {
    // TRƯỜNG HỢP 3: VẪN CÒN CÂU HỎI VÀ CHƯA MAX ĐIỂM -> CHẠY TIẾP GAME
    setTimeout(() => {
      if (isGameRunning) {
        game.scene.scenes[0].physics.resume();
        spawnTimerEvent.paused = false;
      }
    }, 500);
  }
}

function processResult(isCorrect, item, isBoss, meta = null) {
  if (
    !isCorrect &&
    meta &&
    meta.questionData &&
    (meta.questionData.type === "single" || meta.questionData.type === "multi")
  ) {
    lockAnswerUI();
    applyVisualLearning(meta.questionData, meta.selected || []);
    setTimeout(() => {
      closeModal(false);
      finalizeResult(false, item, isBoss);
    }, 2000);
    return;
  }
  closeModal(false);
  finalizeResult(isCorrect, item, isBoss);
}

function showFloatingText(x, y, msg, color) {
  let text = game.scene.scenes[0].add
    .text(x, y - 50, msg, {
      font: "900 24px 'Exo 2'",
      fill: color,
      stroke: "#000",
      strokeThickness: 4,
    })
    .setOrigin(0.5)
    .setDepth(200);
  game.scene.scenes[0].tweens.add({
    targets: text,
    y: y - 150,
    alpha: 0,
    duration: 1500,
    onComplete: () => text.destroy(),
  });
}

function getBatteryHTML(energy) {
  if (energy === 0) {
    return `
      <div style="display: flex; align-items: center; justify-content: center;">
        <div style="width: 160px; height: 50px; border: 4px solid #ff4757; border-radius: 10px; position: relative; background: rgba(13, 27, 51, 0.95); box-shadow: 0 4px 10px rgba(0,0,0,0.5); overflow: hidden;">
          <svg style="position: absolute; top: -5px; left: 45%; width: 25px; height: 60px; z-index: 1;" viewBox="0 0 50 100" preserveAspectRatio="none">
             <polyline points="30,0 15,35 40,55 20,100" fill="none" stroke="#ff4757" stroke-width="4"/>
          </svg>
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; z-index: 10; color: #ff4757; font-size: 24px; font-weight: 900;">
            0%
          </div>
          <div style="position: absolute; right: -12px; top: 11px; width: 8px; height: 20px; background: #ff4757; border-radius: 0 4px 4px 0;"></div>
        </div>
      </div>
    `;
  }

  let barColor = energy >= 80 ? "#f1c40f" : "#2ecc71";

  return `
    <div style="display: flex; align-items: center; justify-content: center;">
      <div style="width: 160px; height: 50px; border: 4px solid #ffffff; border-radius: 10px; position: relative; padding: 4px; box-sizing: border-box; background: rgba(13, 27, 51, 0.85); box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
        <div style="width: ${energy}%; height: 100%; background: ${barColor}; border-radius: 4px; transition: width 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);"></div>
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; z-index: 10; color: #fff; font-size: 24px; font-weight: 900; text-shadow: 1px 1px 3px rgba(0,0,0,0.8);">
          ${energy}%
        </div>
        <div style="position: absolute; right: -12px; top: 11px; width: 8px; height: 20px; background: #ffffff; border-radius: 0 4px 4px 0;"></div>
      </div>
    </div>
  `;
}
