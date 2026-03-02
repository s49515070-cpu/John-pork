const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// UI
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const scoreDisplay = document.getElementById('score');

let gameStarted = false;
let gameOver = false;
let score = 0;
let highScore = 0;

// Boss Sound
const bossSound = new Audio('assets/bossSound.mp3');

// Spieler
const player = {
    x: canvas.width / 2,
    y: canvas.height - 150,
    radius: 50,
    speed: 10,
    health: 3
};

// Gegner
const enemies = [];
const enemySpawnInterval = 2000;
const enemyTypes = [
    {size: 50, speed: 2, health: 1},
    {size: 70, speed: 1.5, health: 2},
];

// Boss
let boss = null;
let bossAttackCooldown = 0;

// Projektile
const bullets = [];

// Steuerung
let keys = {};
document.addEventListener('keydown', e => keys[e.code] = true);
document.addEventListener('keyup', e => {
    keys[e.code] = false;
    if(e.code === 'Space') shoot();
});

// Schießen
function shoot(){
    if(!gameStarted || gameOver) return;
    bullets.push({x: player.x, y: player.y - player.radius, width:10, height:20, speed:15, owner:'player'});
}

// Gegner spawnen
function spawnEnemy(){
    if(!gameStarted || gameOver) return;
    const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    const x = Math.random() * (canvas.width - type.size) + type.size/2;
    enemies.push({x:x, y:-type.size, size:type.size, speed:type.speed, health:type.health});
}

// Boss zufällig
function maybeSpawnBoss(){
    if(!gameStarted || gameOver) return;
    if(!boss && Math.random()<0.003){
        boss = {x:canvas.width/2-100, y:50, size:200, health:20, bullets:[]};
    }
}

// Kollision
function checkCollision(a,b){
    return (a.x - (a.radius||a.width/2) < b.x + (b.size||b.width)/2 &&
            a.x + (a.radius||a.width/2) > b.x - (b.size||b.width)/2 &&
            a.y - (a.radius||a.height/2) < b.y + (b.size||b.height)/2 &&
            a.y + (a.radius||a.height/2) > b.y - (b.size||b.height)/2);
}

// Update
function update(){
    if(!gameStarted || gameOver) return;

    // Spieler bewegen
    if(keys['ArrowLeft'] && player.x - player.radius >0) player.x -= player.speed;
    if(keys['ArrowRight'] && player.x + player.radius < canvas.width) player.x += player.speed;
    if(keys['ArrowUp'] && player.y - player.radius >0) player.y -= player.speed;
    if(keys['ArrowDown'] && player.y + player.radius < canvas.height) player.y += player.speed;

    // Bullets bewegen
    bullets.forEach((b,i)=>{
        b.owner==='player'? b.y -= b.speed : b.y += b.speed;
        if(b.y<0 || b.y>canvas.height) bullets.splice(i,1);
    });

    // Gegner bewegen
    enemies.forEach((e,i)=>{
        e.y += e.speed;
        bullets.forEach((b,j)=>{
            if(b.owner==='player' && checkCollision(b,e)){
                e.health--;
                bullets.splice(j,1);
                if(e.health<=0){
                    enemies.splice(i,1);
                    score++;
                    scoreDisplay.textContent = `Score: ${score}`;
                }
            }
        });
        if(checkCollision(player,e)){
            player.health--;
            enemies.splice(i,1);
            if(player.health<=0) endGame();
        }
        if(e.y>canvas.height) endGame();
    });

    // Boss
    if(boss){
        bossAttackCooldown--;
        if(bossAttackCooldown<=0){
            bossAttackCooldown=120;
            boss.bullets.push({x:boss.x+boss.size/2, y:boss.y+boss.size, width:10, height:20, speed:8, owner:'boss'});
        }
        bullets.forEach((b,j)=>{
            if(b.owner==='player' && checkCollision(b,boss)){
                boss.health--;
                bullets.splice(j,1);
                if(boss.health<=0){
                    bossSound.play();
                    boss=null;
                    score+=10;
                    scoreDisplay.textContent=`Score: ${score}`;
                }
            }
            if(b.owner==='boss' && checkCollision(b,player)){
                bullets.splice(j,1);
                player.health--;
                if(player.health<=0) endGame();
            }
        });
    }

    maybeSpawnBoss();
}

// Draw
function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    if(!gameStarted){
        ctx.fillStyle='black';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle='white';
        ctx.font='50px Arial';
        ctx.textAlign='center';
        ctx.fillText('SPACE SHOOTER',canvas.width/2,canvas.height/2-50);
        ctx.fillText('Press START',canvas.width/2,canvas.height/2+50);
        return;
    }

    if(gameOver){
        ctx.fillStyle='black';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle='red';
        ctx.font='60px Arial';
        ctx.textAlign='center';
        ctx.fillText('GAME OVER',canvas.width/2,canvas.height/2-50);
        ctx.fillStyle='white';
        ctx.font='40px Arial';
        ctx.fillText('Press RESTART',canvas.width/2,canvas.height/2+50);
        return;
    }

    // Spieler
    ctx.fillStyle='cyan';
    ctx.beginPath();
    ctx.arc(player.x,player.y,player.radius,0,Math.PI*2);
    ctx.fill();

    // Bullets
    bullets.forEach(b=>{
        ctx.fillStyle=b.owner==='player'?'yellow':'red';
        ctx.fillRect(b.x,b.y,b.width,b.height);
    });

    // Gegner als Dreiecke
    enemies.forEach(e=>{
        ctx.fillStyle='orange';
        ctx.beginPath();
        ctx.moveTo(e.x,e.y);
        ctx.lineTo(e.x-e.size/2,e.y+e.size);
        ctx.lineTo(e.x+e.size/2,e.y+e.size);
        ctx.closePath();
        ctx.fill();
    });

    // Boss als Quadrat
    if(boss){
        ctx.fillStyle='purple';
        ctx.fillRect(boss.x,boss.y,boss.size,boss.size);
        boss.bullets.forEach(b=>{
            ctx.fillStyle='red';
            ctx.fillRect(b.x,b.y,b.width,b.height);
        });
    }
}

// Hauptschleife
function gameLoop(){
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start/Restart
function startGame(){
    gameStarted=true;
    gameOver=false;
    startButton.style.display='none';
    restartButton.style.display='none';
    scoreDisplay.style.display='inline';
    enemies.length=0;
    bullets.length=0;
    boss=null;
    player.health=3;
    score=0;
    scoreDisplay.textContent=`Score: ${score}`;
}

function endGame(){
    gameOver=true;
    restartButton.style.display='inline';
    if(score>highScore) highScore=score;
}

// Event Listener
startButton.addEventListener('click',startGame);
restartButton.addEventListener('click',startGame);
setInterval(spawnEnemy,enemySpawnInterval);
gameLoop();

window.addEventListener('resize',()=>{
    canvas.width=window.innerWidth;
    canvas.height=window.innerHeight;
});
