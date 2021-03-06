var activeMap;
var activeCharacter;
var isPaused = false;
var showingInstructions = false;
//stores projectiles, keys corespond to cuadrants with the character that creates them being (0,0)
var projectiles = {
  "(0,-)":[],
  "(0,+)":[],
  "(-,0)":[],
  "(+,0)":[],
  "(+,+)":[],
  "(-,+)":[],
  "(-,-)":[],
  "(+,-)":[]
};

function startGame(){
  winnerText = new component("50px","consolas","white",window.innerWidth / 2 - 300, window.innerHeight / 1.5, "text");
  meleeWinnerSprite = new component(150,150,"green",(window.innerWidth / 2) - 75, 200);
  punchingBagWinnerSprite = new component(150,250,"purple",(window.innerWidth / 2) - 75,150)
  //characters
  melee = new component(30,30,"green",300,300);
  ranged = new component(30,40,"purple",300,300);
  sowrdsman = new component();
  //text that displays the pleyers damage taken and lives left
  playerOneDamage = new component("38px","consolas","white",window.innerWidth / 3.5,window.innerHeight - 100, "text");
  playerTwoDamage = new component("38px","consolas","white",window.innerWidth / 1.5,window.innerHeight - 100,"text");
  playerOneLivesOne = new component(15,15,"green",window.innerWidth / 3.5, window.innerHeight - 80);
  playerOneLivesTwo = new component(15,15,"green",(window.innerWidth / 3.5) + 20, window.innerHeight - 80);
  playerTwoLivesOne = new component(15,25,"purple",window.innerWidth / 1.5, window.innerHeight - 90);
  playerTwoLivesTwo = new component(15,25,"purple",(window.innerWidth / 1.5) + 20, window.innerHeight - 90);
  //blue square used when melee character is using dSpecial
  chargingAnimation = new component(50,50,"blue",0,0)
  //training object
  punchingBag = new component(30,60,"pruple",(window.innerWidth / 2) - 15,300);
  //stage and platforms
  stage = new component(window.innerWidth / 1.8,10,"black",(window.innerWidth - window.innerWidth / 1.8) / 2,500);
  platformOne = new component();
  platformTwo = new component();
  myGameArea.start();
}

//mygame area, start, clear, and stop functions.
var myGameArea = {
  canvas : document.createElement("canvas"),
  start : function(){
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight - 3.01;
    this.context = this.canvas.getContext("2d");
    document.body.insertBefore(this.canvas, document.body.childNodes[0]);
    this.frameNo = 0;
    this.interval = setInterval(updateGameArea, 20);
  },
  clear : function(){
    this.context.clearRect(0,0,this.canvas.width, this.canvas.height);
  },
  stop : function(){
    clearInterval(this.interval);
  }
};

//create and manipulate components
function component(width,height,color,x,y,type){
  this.type = type;
  if (type == "image") {
      this.image = new Image();
      this.image.src = color;
    }
  this.width = width;
  this.height = height;
  this.speedX = 0;
  this.speedY = 0;
  this.x = x;
  this.y = y;
  this.gravity = 1;
  this.gravitySpeed = 0;
  this.jumpCount = 0;
  this.damage = 0;
  this.charge = 0;
  this.lives = 2;
  this.charging = false;
  this.canMoveLeft = true;
  this.canMoveRight = true;
  this.canAttack = true;
  this.canSpecial = true;
  this.hitStun = false;
  this.upPressed = false;
  this.downPressed = false;
  //attacks depending on arrows pressed; none: nAttack, up: upAttack, down: dAttack, right: fAttack, left: bAttack;
  this.nAttack = false;
  this.uAttack = false;
  this.dAttack = false;
  this.fAttack = false;
  this.bAttack = false;
  //same as above but with special attacks
  this.nSpecial = false;
  this.uSpecial = false;
  this.dSpecial = false;
  this.fSpecial = false;
  this.bSpecial = false;

  this.update = function() { //updates depending on type
      ctx = myGameArea.context;
      if (type == "image") {
          ctx.drawImage(this.image,
              this.x,
              this.y,
              this.width, this.height);
      } else if (this.type == "text") {
        ctx.font = this.width + " " + this.height;
        ctx.fillStyle = color;
        ctx.fillText(this.text, this.x, this.y);
      } else {
          ctx.fillStyle = color;
          ctx.fillRect(this.x, this.y, this.width, this.height);
      };
  };

  this.newPos = function() { //applies gravity and speeds to positions
    this.gravitySpeed += this.gravity;
    this.x += this.speedX;
    this.y += this.speedY + this.gravitySpeed;
    this.hitBottom();
  };

  this.crashWith = function(otherobj){ //if this comes in contact with otherobj returns true else false
    var myleft = this.x;
    var myright = this.x + (this.width);
    var mytop = this.y;
    var mybottom = this.y + (this.height);
    var otherleft = otherobj.x;
    var otherright = otherobj.x + (otherobj.width);
    var othertop = otherobj.y;
    var otherbottom = otherobj.y + (otherobj.height);
    var crash = true;
    if ((mybottom < othertop) || (mytop > otherbottom) || (myright < otherleft) || (myleft > otherright)) {
      crash = false;
    } else {
      this.gravitySpeed = 0;
    };
    return crash
  };

  this.didHit = function(otherobj){ //same as above but while attacking and applies damage
    var myleft = this.x;
    var myright = this.x + (this.width);
    var mytop = this.y;
    var mybottom = this.y + (this.height);
    var otherleft = otherobj.x;
    var otherright = otherobj.x + (otherobj.width);
    var othertop = otherobj.y;
    var otherbottom = otherobj.y + (otherobj.height);
    var hit = true;
    if ((mybottom < othertop) || (mytop > otherbottom) || (myright < otherleft) || (myleft > otherright)) {
      hit = false;
    } else {
      if (projectiles["(-,0)"].includes(this) ||
          projectiles["(+,0)"].includes(this) ||
          projectiles["(+,+)"].includes(this) ||
          projectiles["(-,+)"].includes(this) ||
          projectiles["(-,-)"].includes(this) ||
          projectiles["(+,-)"].includes(this)) {
        otherobj.damage += 0.2;
        otherobj.gravitySpeed = 0;
      } else {
        otherobj.damage += 1;
        otherobj.gravitySpeed = 0;
      }
      if (myleft < otherleft) {
        otherobj.speedX += otherobj.damage;
        otherobj.speedY -= otherobj.damage * 2;
      } else {
        otherobj.speedX -= otherobj.damage;
        otherobj.speedY -= otherobj.damage * 2;
      }
      otherobj.hitStun = true;
    }
  }

  this.hitBottom = function(){
    //make it so it falls of stage if not over it
    var rockbottom = myGameArea.canvas.height + 100;
    if (this.crashWith(stage)){
      rockbottom = myGameArea.canvas.height - this.height - (myGameArea.canvas.height - stage.y);
    };

    if (this.y > rockbottom) {
      this.y = rockbottom;
      this.jumpCount = 0;
      this.canSpecial = true;
    };
  };

  this.clearSpeeds = function(){
    this.speedX = 0;
    this.speedY = 0;
  };

  this.respawn = function(){
    this.x = (window.innerWidth / 2) - 15;
    this.y = 300;
    this.update();
    this.damage = 0;
    this.clearSpeeds();
    this.gravitySpeed = 0;
    this.charge = 0;
  };

  this.jump = function(){
    if (this.jumpCount < 2) {
      this.gravitySpeed -= this.gravitySpeed + 15;
      this.jumpCount += 1;
    };
  };

  this.moveLeft = function(){
    if (this.canMoveLeft) {
      this.speedX = -5;
    };
    this.canMoveLeft = false;
  };

  this.moveRight = function(){
    if (this.canMoveRight) {
      this.speedX = 5;
    };
    this.canMoveRight = false;
  };

  this.clearMoveLeft = function(){
    this.canMoveLeft = true;
    if (this.speedX == -5) {
      this.speedX = 0;
    };
  };

  this.clearMoveRight = function(){
    this.canMoveRight = true;
    if (this.speedX == 5) {
      this.speedX = 0;
    };
  };

  this.pressUp = function(){
    this.upPressed = true;
  };

   this.clearPressUp = function(){
     this.upPressed = false;
   };

   this.pressDown = function(){
     this.downPressed = true;
   };

   this.clearPressDown = function(){
     this.downPressed = false;
   };
   this.meleeMoves = {
    attack: function() { //adds to this's size to make it attack deending on the key pressed;
      if (melee.canAttack) {
        if (melee.speedX == 5) {
          melee.width += 20;
          melee.fAttack = true;
        } else if (melee.speedX == -5) {
          melee.width += 20;
          melee.x -= 20;
          melee.bAttack = true;
        } else if (melee.upPressed) {
          melee.height += 20;
          melee.y -= 20;
          melee.uAttack = true;
        } else if (this.downPressed) {
          melee.height += 20;
          melee.dAttack = true;
        } else if (melee.speedX == 0) {
          melee.width += 21;
          melee.x -= 7;
          melee.nAttack = true;
        };
      };
      melee.canAttack = false;
      melee.didHit(punchingBag);
    },

    clearAttack: function(){ //clears the change in this's size from the attack funcmelee

      if (melee.fAttack) {
        melee.width -= 20;
        melee.fAttack = false;
      } else if (melee.bAttack) {
        melee.width -= 20;
        melee.x += 20;
        melee.bAttack = false;
      } else if (melee.uAttack) {
        melee.height -= 20;
        melee.y += 20;
        melee.uAttack = false;
      } else if (melee.dAttack) {
        melee.height -= 20;
        melee.dAttack = false;
      } else if (melee.nAttack) {
        melee.width -= 21;
        melee.x += 7;
        melee.nAttack = false;
      };
      melee.canAttack = true;
    },

    specialAttack: function(){
      if(melee.canSpecial){
        if (melee.speedX == 5) { //if right key pressed, create projectile towards right: HADOUKEN!
          if (melee.charge >= 10 ) {
            projectiles["(+,0)"].push(new component(melee.charge,melee.charge,"blue",melee.x,melee.y + (melee.height / 3)));// size depends on charge
            melee.charge -= 10; // reduces charge after using
          }
          melee.fSpecial = true; // same as above but to the left: HADOUKEN!
        } else if (melee.speedX == -5) {
          if (melee.charge >= 10 ) {
            projectiles["(-,0)"].push(new component(melee.charge,melee.charge,"blue",melee.x + (melee.width),melee.y + (melee.height / 3)));
            melee.charge -= 10;
          }
          melee.bSpecial = true
        } else if (melee.upPressed) { //upwards jump that strikes twice at beggining of animation
          melee.gravitySpeed = -20;
          melee.attack();
          melee.attack();
          melee.clearAttack();
          melee.uSpecial = true;
          melee.jumpCount = 2;
          melee.canSpecial = false;
        } else if (melee.downPressed) { //adds to the charge variable until charge is 55
          if (melee.charge <= 50) {
            melee.charge += 5;
            melee.charging = true;
          }

          melee.dSpecial = true;
        } else if (this.charge > 50){ // neutral special, makes charge 0: too OP // not sure if let the projectile go through stage or dissapear on contact
          let projectileSize = 25;
          projectiles["(0,+)"].push(new component(projectileSize, projectileSize,"black",melee.x + (melee.width / 2),melee.y + (melee.height / 2)));
          projectiles["(+,0)"].push(new component(projectileSize, projectileSize,"black",melee.x + (melee.width / 2),melee.y + (melee.height / 2)));
          projectiles["(-,0)"].push(new component(projectileSize, projectileSize,"black",melee.x + (melee.width / 2),melee.y + (melee.height / 2)));
          projectiles["(+,+)"].push(new component(projectileSize, projectileSize,"black",melee.x + (melee.width / 2),melee.y + (melee.height / 2)));
          projectiles["(-,+)"].push(new component(projectileSize, projectileSize,"black",melee.x + (melee.width / 2),melee.y + (melee.height / 2)));
          projectiles["(-,-)"].push(new component(projectileSize, projectileSize,"black",melee.x + (melee.width / 2),melee.y + (melee.height / 2)));
          projectiles["(+,-)"].push(new component(projectileSize, projectileSize,"black",melee.x + (melee.width / 2),melee.y + (melee.height / 2)));
          melee.charge = 0;
          }
          melee.nSpecial = true;
      };
    },

    clearSpecial: function(){
      if (melee.dSpecial) {
        melee.charging = false;
      };
    }
  }
  this.mageMoves = {
    
  }
};

function everyInterval(n){
  if ((myGameArea.frameNo / n) % 1 === 0) {
    return true
  }
  return false
};

function updateProjectiles(){ //updates projectiles in the proper direction
  let verticalSpeed = 10;
  let horizontalSpeed = 10;
  let diagonalSpeed = 7.5;
  for (var i = 0; i < projectiles["(0,+)"].length; i++) {
    let projectile = projectiles["(0,+)"][i];
    projectile.gravity = 0;
    projectile.speedY = -verticalSpeed;
    projectile.newPos();
    projectile.update();
    projectile.didHit(punchingBag);
  }
  for (var i = 0; i < projectiles["(0,-)"].length; i++) {
    let projectile = projectiles["(0,-)"][i];
    projectile.gravity = 0;
    projectile.speedX = verticalSpeed;
    projectile.newPos();
    projectile.update();
    projectile.didHit(punchingBag);
  }
  for (var i = 0; i < projectiles["(+,0)"].length; i++) {
    let projectile = projectiles["(+,0)"][i];
    projectile.gravity = 0;
    projectile.speedX = horizontalSpeed;
    projectile.newPos();
    projectile.update();
    projectile.didHit(punchingBag);
  }
  for (var i = 0; i < projectiles["(-,0)"].length; i++) {
    let projectile = projectiles["(-,0)"][i];
    projectile.gravity = 0;
    projectile.speedX = -horizontalSpeed;
    projectile.newPos();
    projectile.update();
    projectile.didHit(punchingBag);
  }
  for (var i = 0; i < projectiles["(+,+)"].length; i++) {
    let projectile = projectiles["(+,+)"][i];
    projectile.gravity = 0;
    projectile.speedX = diagonalSpeed;
    projectile.speedY = diagonalSpeed;
    projectile.newPos();
    projectile.update();
    projectile.didHit(punchingBag);
  }
  for (var i = 0; i < projectiles["(-,+)"].length; i++) {
    let projectile = projectiles["(-,+)"][i];
    projectile.gravity = 0;
    projectile.speedX = -diagonalSpeed;
    projectile.speedY = diagonalSpeed;
    projectile.newPos();
    projectile.update();
    projectile.didHit(punchingBag);
  }
  for (var i = 0; i < projectiles["(-,-)"].length; i++) {
    let projectile = projectiles["(-,-)"][i];
    projectile.gravity = 0;
    projectile.speedX = -diagonalSpeed;
    projectile.speedY = -diagonalSpeed;
    projectile.newPos();
    projectile.update();
    projectile.didHit(punchingBag);
  }
  for (var i = 0; i < projectiles["(+,-)"].length; i++) {
    let projectile = projectiles["(+,-)"][i];
    projectile.gravity = 0;
    projectile.speedX = diagonalSpeed;
    projectile.speedY = -diagonalSpeed;
    projectile.newPos();
    projectile.update();
    projectile.didHit(punchingBag);
  }
}

function updateChargeAnimation(character){
  if (character.charging && character.charge < 55) {
    chargingAnimation.x = character.x - 10;
    chargingAnimation.y = character.y - 10;
    chargingAnimation.update()
  }
}
function updateTexts(){
  playerOneDamage.text = Math.round(melee.damage * 10) + "%";
  playerOneDamage.update();
  playerTwoDamage.text = Math.round(punchingBag.damage * 10) + "%";
  playerTwoDamage.update();
  displayLivesP1(melee.lives);
  displayLivesP2(punchingBag.lives);
}

function updateCharacters() {
  punchingBag.newPos();
  if (punchingBag.crashWith(stage)) {
    punchingBag.clearSpeeds();
  }
  punchingBag.update();
  melee.newPos();
  melee.update();
  stage.update();
}

function isOffScreen(){
  if (punchingBag.y < 0 ||
    punchingBag.y > window.innerHeight ||
    punchingBag.x < 0 ||
    punchingBag.x > window.innerWidth) {
      punchingBag.respawn();
      punchingBag.lives -= 1;
  }
  if (melee.y < 50 ||
    melee.y > window.innerHeight + 50 ||
    melee.x < 50 ||
    melee.x > window.innerWidth + 50) {
      melee.respawn();
      melee.lives -= 1;
  }
}

//checks if game is over returns true or false
function isGameOver(){
  if (punchingBag.lives == 0 ||
    melee.lives == 0) {
      return true
  }
  return false
}

//ends game display winner text
function gameOver(){
    var winner = "Punching Bag";
    var winnerSprite = punchingBagWinnerSprite;
    if (punchingBag.lives == 0) {
      winner = "Green Cube"
      winnerSprite = meleeWinnerSprite;
    }
    winnerSprite.update();
    winnerText.text = "The winner is... " + winner + "!";
    winnerText.update();
}

//PlayerOne lives sprite thingy
function displayLivesP1(num){
  switch (num) {
    case 2:
      playerOneLivesOne.update();
      playerOneLivesTwo.update();
      break;
    default:
      playerOneLivesOne.update();
      break;
  }
};

//PlayerTwo Lives sprite thingy
function displayLivesP2(num) {
  switch (num) {
    case 2:
      playerTwoLivesOne.update();
      playerTwoLivesTwo.update();
      break;
    default:
      playerTwoLivesOne.update();
      break;
  }
}

//The update homies, making shit work
function callTheUpdateCrew(params) {
  if (isGameOver()) {
    gameOver()
  } else {
    isOffScreen();
    updateChargeAnimation(melee);
    updateProjectiles();
    updateTexts();
    updateCharacters();
  };
};

function updateGameArea(){
  myGameArea.clear();
  callTheUpdateCrew();
}

function showMenu(){
  if (isPaused) {
    document.getElementById('menu-outer-container').style.display = "none";
    myGameArea.start();
    isPaused = false;
  } else {
      document.getElementById('menu-outer-container').style.display = "flex";
      myGameArea.stop();
      isPaused = true;
    }
};

function restartGame() {
  myGameArea.stop();
  myGameArea.clear();
  startGame();
  projectiles["(0,-)"] = [];
  projectiles["(0,+)"] = [];
  projectiles["(-,0)"] = [];
  projectiles["(+,0)"] = [];
  projectiles["(+,+)"] = [];
  projectiles["(-,+)"] = [];
  projectiles["(-,-)"] = [];
  projectiles["(+,-)"] = [];
  melee.lives = 2;
  punchingBag.lives = 2;
  document.getElementById('menu-outer-container').style.display = "none";
  isPaused = false;
}

function showInstructions() {
  if (showingInstructions) {
    document.getElementById('instructions-outer-container').style.display = "none";
  } else {
    showMenu();
    document.getElementById('instructions-outer-container').style.display = "flex";
  }
}

function concedeGame(){
  showMenu();
  melee.lives = 0;
}

window.addEventListener("resize", function(event){

});

window.addEventListener("keydown", function(event){
  switch (event.which) {
    case 32:
      melee.jump();
      break;
    case 37:
      melee.moveLeft();
      break;
    case 39:
      melee.moveRight();
      break;
    case 38:
      melee.pressUp();
      break;
    case 40:
      melee.pressDown();
      break;
    case 81:
      melee.meleeMoves.attack();
      break;
    case 87:
      melee.meleeMoves.specialAttack();
      break;
  };
});

window.addEventListener("keyup", function(event){
  switch (event.which) {
    case 37:
      melee.clearMoveLeft();
      break;
    case 39:
      melee.clearMoveRight();
      break;
    case 38:
      melee.clearPressUp();
      break;
    case 40:
      melee.clearPressDown();
      break;
    case 81:
      melee.meleeMoves.clearAttack();
      break;
    case 87:
      melee.meleeMoves.clearSpecial();
      break;
    case 27: 
      if (isPaused) {
        showMenu();
      } else {
        showMenu();

      }
  };
});
