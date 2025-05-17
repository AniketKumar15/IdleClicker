import kaboom from "https://unpkg.com/kaboom@3000.0.1/dist/kaboom.mjs";
// initialize kaboom context
kaboom({
    width: window.innerWidth,
    height: window.innerHeight,
    scale: 1,
    stretch: true,
    background: [44, 204, 222]
});

// Loading All Images
loadSprite("sword", "Image/ttrpg_legacy_swords_1.0/sword_04.png");
loadSprite("money", "Image/money.png");
loadSprite("heart", "Image/heart.png");
loadSprite("enemy", "Image/Christmas_Gingerbread_Move.png", {
    sliceX: 6, // number of frames horizontally
    sliceY: 1, // number of rows
    anims: {
        walk: {
            from: 0,
            to: 3,
            speed: 10,
            loop: true,
        },
    },
});

// Loading All Music
loadSound("bg", "./Audio/Bg1.mp3");
loadSound("die", "./Audio/explosion1.mp3");
loadSound("upgrage", "./Audio/power-up-sparkle-1-177983.mp3");
loadSound("Notupgrage", "./Audio/wrongSound.wav");
loadSound("gameOverSound", "./Audio/game-over-31-179699.mp3");


// START SCENE -> The main menu Where the game start
scene("start", () => {
    // Add game title or name in the center
    add([
        text("Sword Defense", {
            size: 32,
        }),
        pos(center().x, center().y - 40),
        anchor("center"),
    ]);

    // Start Game Button
    const startBtn = add([
        rect(160, 40, { radius: 8 }),
        pos(center()),
        color(0, 0.6, 1),
        area(),
        "startBtn",
        anchor("center"),
    ]);
    startBtn.onHoverUpdate(() => {
        const t = time() * 10
        startBtn.color = hsl2rgb((t / 10) % 1, 0.6, 0.7)
        startBtn.scale = vec2(1.2)
        setCursor("pointer")
    })
    startBtn.onHoverEnd(() => {
        startBtn.scale = vec2(1)
        startBtn.color = rgb(0, 0.6, 1)
    })

    // Start Game Text
    add([
        text("Start Game", { size: 20 }),
        pos(startBtn.pos),
        anchor("center"),
        color(255, 255, 255),
    ]);

    // When Click on the btn load the game scene
    onClick("startBtn", () => {
        play("bg", { loop: true, volume: 0.5 });
        go("game");
    });
});

// Actual Game scene
scene("game", () => {

    // a simple score counter or Money
    const scorePos = vec2(24, 24);   // Container position

    // Background rectangle
    const moneyBg = add([
        rect(140, 40, { radius: 10 }),
        pos(scorePos),
        color(30, 30, 30), // dark background
    ]);

    // Money icon
    const moneyIcon = add([
        sprite("money"),
        pos(scorePos.x + 10, scorePos.y + 8),
        scale(0.05),
    ]);

    // Score text
    const moneyText = add([
        text("0", { size: 24 }),
        pos(scorePos.x + 50, scorePos.y + 8),
        color(255, 215, 0), // gold
    ]);

    // Health Player Text
    const healthPos = vec2(200, 24);   // Container position

    // Background rectangle
    const HealthBg = add([
        rect(140, 40, { radius: 10 }),
        pos(healthPos),
        color(30, 30, 30), // dark background
    ]);

    // Heart icon
    const HeartIcon = add([
        sprite("heart"),
        pos(healthPos.x + 10, healthPos.y + 8),
        scale(0.05),
    ]);

    // Health text
    const HealthText = add([
        text("0", { size: 24 }),
        pos(healthPos.x + 50, healthPos.y + 8),
        color(255, 215, 0), // gold
    ]);

    // Upgrade INfo
    let upgradesState = {
        autoRotate: false,
        spinSpeed: 0,       // count of times upgraded
        swordLength: 0,     // count of times upgraded
        incomeLevel: 0,     // count of times upgraded
        healthLevel: 0,
    };
    const savedUpgrades = localStorage.getItem("upgrades");
    if (savedUpgrades) {
        upgradesState = JSON.parse(savedUpgrades);
    }

    // Upgraded cost
    let upgradeCosts = {
        spinSpeed: 100,
        swordLength: 200,
        autoRotate: 300,
        income: 40,
        healthKey: 10
    };
    const savedCosts = localStorage.getItem("upgradeCosts");
    if (savedCosts) {
        upgradeCosts = JSON.parse(savedCosts);
    }

    // All game variables
    let rotationSpeed = 0; // initial speed
    let rotationBoost = 50; // degrees added per click
    let friction = 0.98; // slow it down gradually (optional)
    let isRotating = false;
    let autoRotate = false;
    let maxHealth = 10;
    let playerHelth = maxHealth;
    let isGameOver = false;

    let moneyValue = 50;
    let addMoney = 1;

    // Load the money amount from local storage
    let savedScore = localStorage.getItem("Money");
    if (savedScore !== null) {
        moneyValue = parseInt(savedScore);
        moneyText.text = moneyValue.toString();
    }
    HealthText.text = playerHelth.toString();


    // add a Player in the center
    const sword = add([
        sprite("sword"),
        pos(center()),
        anchor("botleft"),
        scale(0.1),
        area(),
        rotate(0),
        health(playerHelth),
    ]);

    // Apply all the Updgrades when game started
    rotationBoost += upgradesState.spinSpeed * 10;
    sword.scaleTo(sword.scale.x + upgradesState.swordLength * 0.01);
    addMoney += upgradesState.incomeLevel * 2;
    autoRotate = upgradesState.autoRotate;


    // ----- Enemy Spwan -> Randomly spwan emeny to the edge of the screen
    // get the Random postion first
    function getRandomEdgePosition() {
        const w = width();
        const h = height();
        const edge = choose(["top", "bottom", "left", "right"]);

        if (edge === "top") return vec2(rand(0, w), 0);
        if (edge === "bottom") return vec2(rand(0, w), h);
        if (edge === "left") return vec2(0, rand(0, h));
        if (edge === "right") return vec2(w, rand(0, h));
    }
    // Spawn the enemy
    function spawnEnemy() {
        const spawnPos = getRandomEdgePosition();
        const centerPos = center();
        const direction = centerPos.sub(spawnPos).unit();

        const enemy = add([
            sprite("enemy"),
            pos(spawnPos),
            anchor("center"),
            scale(0.5),
            area(),
            {
                dir: direction,
                speed: 50,
                stopped: false,
            },
            "enemy"
        ]);
        enemy.play("walk")

        // Flip sprite if coming from the right
        if (enemy.dir.x < 0) {
            enemy.flipX = true;
        }
        // Enemy update loop
        enemy.onUpdate(() => {
            if (!enemy.stopped) {
                enemy.move(enemy.dir.scale(enemy.speed));

                // Stop if close to center
                if (enemy.pos.dist(centerPos) < 10) {
                    enemy.stop("walk")
                    enemy.stopped = true;
                    enemy.speed = 0;
                }
            }
        });
    }
    // Spawn 5 enemy every 4 sec
    loop(4, () => {
        for (let i = 0; i < 5; i++) {
            spawnEnemy();
        }
    });

    // Rotate Sword when click
    onClick(() => {
        rotationSpeed += rotationBoost;
        isRotating = true;
        wait(0.5, () => {
            isRotating = false;
        });
    });

    onUpdate(() => {
        if (autoRotate) {
            sword.angle += rotationBoost * dt();
            isRotating = true;
        }

        sword.angle += rotationSpeed * dt();
        rotationSpeed *= friction; // gradually reduce speed

        // ✅ Trigger game over only once
        if (!isGameOver && playerHelth <= 0) {
            isGameOver = true; // prevent re-triggering

            addExplosion(sword.pos);
            destroy(sword);
            wait(1, () => {
                play("gameOverSound");
                go("gameover");
            });
        }
    });


    // Explosion effect
    function addExplosion(enemyPos) {
        for (let i = 0; i < 12; i++) {
            add([
                pos(enemyPos),
                rect(4, 4),
                color(rand(200, 255), rand(50, 100), 0),
                move(vec2(rand(-1, 1), rand(-1, 1)).unit(), rand(100, 200)),
                lifespan(0.3),
            ]);
        }

        play("die", { volume: 1 });
        shake(10);
    }
    // Update score
    function updateScore(newScore) {
        moneyValue = newScore;
        moneyText.text = moneyValue.toString();
    }

    // Collide detection
    sword.onCollideUpdate("enemy", (e) => {

        if (isRotating) {
            destroy(e);
            addExplosion(e.pos);
            updateScore(moneyValue + addMoney);
            playerHelth -= 0.1;
            playerHelth = Math.max(0, playerHelth);
            HealthText.text = playerHelth.toFixed(2);
            localStorage.setItem("Money", moneyValue.toString());
        }

    });

    // It show the upgrade Ui where user can upgrade there sword
    function showUpgradeUI() {
        const panel = add([
            rect(200, 300, { radius: 12 }),
            pos(width() - 220, height() - 310),
            color(20, 20, 20),
            outline(2, rgb(255, 255, 255)),
            z(100),
            "upgradePanel"
        ]);

        add([
            text("Upgrades", { size: 16 }),
            pos(panel.pos.x + 20, panel.pos.y + 10),
            color(255, 255, 255),
            z(101),
        ]);
        const autoSpinBought = localStorage.getItem("AutoSpin") === "true";
        const upgrades = [
            {
                name: "Spin Speed",
                key: "spinSpeed",
                currentValue: () => rotationBoost + "°/s",
                apply: () => {
                    upgradesState.spinSpeed += 1;
                    rotationBoost += 10;
                }
            },
            {
                name: "Sword Length",
                key: "swordLength",
                currentValue: () => sword.scale.x.toFixed(2),
                apply: () => {
                    upgradesState.swordLength += 1;
                    sword.scaleTo(sword.scale.x + 0.01);
                }
            },
            {
                name: "Auto-Spin",
                key: "autoRotate",
                currentValue: () => autoRotate ? "Enabled" : "Disabled",
                apply: () => {
                    upgradesState.autoRotate = true;
                    autoRotate = true;
                },
                disabled: autoSpinBought
            },
            {
                name: "Income",
                key: "income",
                currentValue: () => "$" + addMoney,
                apply: () => {
                    upgradesState.incomeLevel += 1;
                    addMoney += 2;
                }
            },
            {
                name: "Health",
                key: "healthKey",
                currentValue: () => playerHelth,
                apply: () => {
                    upgradesState.healthLevel += 1;
                    playerHelth = maxHealth;
                    HealthText.text = playerHelth.toString();
                }
            },
        ];



        upgrades.forEach((upgrade, i) => {
            const yOffset = 40 + i * 50;
            const cost = upgradeCosts[upgrade.key];

            const btn = add([
                rect(160, 40, { radius: 8 }),
                pos(panel.pos.x + 20, panel.pos.y + yOffset),
                color(50, 100, 200),
                area(),
                z(101),
                "upgradeBtn",
                {
                    upgrade,
                    key: upgrade.key,
                }
            ]);
            if (upgrade.disabled) {
                btn.enabled = false;
                btn.color = rgb(100, 100, 100);
                btn.label = "Auto-Spin (Bought)";
            }
            btn.label = add([
                text(`${upgrade.name} ($${cost})\n➡ ${upgrade.currentValue()}`, { size: 12 }),
                pos(btn.pos.x + 10, btn.pos.y + 10),
                color(255, 255, 255),
                z(102),
            ]);
        });


        function showFloatingMessage(msg, posVec, colorValue) {
            const message = add([
                text(msg, { size: 12 }),
                pos(posVec.x + 10, posVec.y - 10),
                color(colorValue),
                z(200),
            ]);

            message.onUpdate(() => {
                message.move(0, -20 * dt());
            });

            wait(1, () => destroy(message));
        }

        onClick("upgradeBtn", (btn) => {
            if (btn.enabled === false) return;
            const key = btn.key;
            const cost = upgradeCosts[key];

            if (moneyValue >= cost) {
                moneyValue -= cost;
                btn.upgrade.apply();
                play("upgrage");

                if (btn.upgrade.name === "Auto-Spin") {
                    autoRotate = true;
                    localStorage.setItem("AutoSpin", "true");

                    // Disable the button instead of destroying
                    btn.enabled = false;
                    btn.color = rgb(100, 100, 100);
                    if (btn.label) btn.label.text = "Auto-Spin (Bought)";
                }

                // Increase cost

                upgradeCosts[key] = Math.floor(cost * 1.2);


                // Save state
                localStorage.setItem("upgrades", JSON.stringify(upgradesState));
                localStorage.setItem("upgradeCosts", JSON.stringify(upgradeCosts));

                // Update UI
                moneyText.text = moneyValue.toString();
                if (btn.label) {
                    btn.label.text = `${btn.upgrade.name} ($${upgradeCosts[key]})\n➡ ${btn.upgrade.currentValue()}`;
                }

                showFloatingMessage("Upgrade Successful!", btn.pos, rgb(0, 255, 0));
            } else {
                play("Notupgrage")
                showFloatingMessage("Not Enough Money!", btn.pos, rgb(255, 0, 0));
            }
        });

    }


    showUpgradeUI();
    // Adding Save Logic using local stroage
    setInterval(() => {
        localStorage.setItem("Money", moneyValue.toString());
    }, 5000);
});
go("start")

scene("gameover", () => {
    destroyAll();
    add([
        text("Game Over", { size: 48 }),
        pos(center().x, center().y - 40),
        anchor("center"),
        color(255, 0, 0),
    ]);

    const restart = add([
        text("Click to Restart", { size: 24 }),
        pos(center().x, center().y + 20),
        anchor("center"),
        area(),
        "restartButton"
    ]);

    restart.onClick(() => {
        // localStorage.clear()
        go("game");
    });
});


window.addEventListener("resize", () => {
    go("start");
});

