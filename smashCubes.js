var activeMap;
var activeCharacter;
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
  //characters
  melee = new component(30,30,"green",300,300);
  ranged = new component(30,40,"blue",300,300);
  sowrdsman = new component();
  //text that displays the pleyers damage taken
  playerOneDamage = new component("38px","consolas","white",window.innerWidth / 3.5,window.innerHeight - 100, "text");
  playerTwoDamage = new component("38px","consolas","white",window.innerWidth / 1.5,window.innerHeight - 100,"text");
  //blue square used when melee character is using dSpecial
  chargingAnimation = new component(50,50,"blue",0,0)
  //training object
  punchingBag = new component(30,60,"purple",(window.innerWidth / 2) - 15,300);
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


function everyInterval(n){
  if ((myGameArea.frameNo / n) % 1 === 0) {
    return true
  }
  return false
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
    var rockbottom = myGameArea.canvas.height;
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

  this.attack = function() { //adds to this's size to make it attack deending on the key pressed;
    if (this.canAttack) {
      if (this.speedX == 5) {
        this.width += 20;
        this.fAttack = true;
      } else if (this.speedX == -5) {
        this.width += 20;
        this.x -= 20;
        this.bAttack = true;
      } else if (this.upPressed) {
        this.height += 20;
        this.y -= 20;
        this.uAttack = true;
      } else if (this.downPressed) {
        this.height += 20;
        this.dAttack = true;
      } else if (this.speedX == 0) {
        this.width += 21;
        this.x -= 7;
        this.nAttack = true;
      };
    };
    this.canAttack = false;
    this.didHit(punchingBag);
  };

  this.clearAttack = function(){ //clears the change in this's size from the attack function

    if (this.fAttack) {
      this.width -= 20;
      this.fAttack = false;
    } else if (this.bAttack) {
      this.width -= 20;
      this.x += 20;
      this.bAttack = false;
    } else if (this.uAttack) {
      this.height -= 20;
      this.y += 20;
      this.uAttack = false;
    } else if (this.dAttack) {
      this.height -= 20;
      this.dAttack = false;
    } else if (this.nAttack) {
      this.width -= 21;
      this.x += 7;
      this.nAttack = false;
    };
    this.canAttack = true;
  };

  this.specialAttack = function(){
    if(this.canSpecial){
      if (this.speedX == 5) { //if right key pressed, create projectile towards right: HADOUKEN!
        if (this.charge >= 10 ) {
          projectiles["(+,0)"].push(new component(this.charge,this.charge,"blue",this.x,this.y + (this.height / 3)));// size depends on charge
          this.charge -= 10; // reduces charge after using
        }
        this.fSpecial = true; // same as above but to the left: HADOUKEN!
      } else if (this.speedX == -5) {
        if (this.charge >= 10 ) {
          projectiles["(-,0)"].push(new component(this.charge,this.charge,"blue",this.x + (this.width),this.y + (this.height / 3)));
          this.charge -= 10;
        }
        this.bSpecial = true
      } else if (this.upPressed) { //upwards jump that strikes twice at beggining of animation
        this.gravitySpeed = -20;
        this.attack();
        this.attack();
        this.clearAttack();
        this.uSpecial = true;
        this.jumpCount = 2;
        this.canSpecial = false;
      } else if (this.downPressed) { //adds to the charge variable until charge is 55
        if (this.charge <= 50) {
          this.charge += 5;
          this.charging = true;
        }

        this.dSpecial = true;
      } else if (this.charge > 50){ // neutral special, makes charge 0: too OP // not sure if let the projectile go through stage or dissapear on contact
        let projectileSize = 25;
        projectiles["(0,+)"].push(new component(projectileSize, projectileSize,"black",this.x + (this.width / 2),this.y + (this.height / 2)));
        projectiles["(+,0)"].push(new component(projectileSize, projectileSize,"black",this.x + (this.width / 2),this.y + (this.height / 2)));
        projectiles["(-,0)"].push(new component(projectileSize, projectileSize,"black",this.x + (this.width / 2),this.y + (this.height / 2)));
        projectiles["(+,+)"].push(new component(projectileSize, projectileSize,"black",this.x + (this.width / 2),this.y + (this.height / 2)));
        projectiles["(-,+)"].push(new component(projectileSize, projectileSize,"black",this.x + (this.width / 2),this.y + (this.height / 2)));
        projectiles["(-,-)"].push(new component(projectileSize, projectileSize,"black",this.x + (this.width / 2),this.y + (this.height / 2)));
        projectiles["(+,-)"].push(new component(projectileSize, projectileSize,"black",this.x + (this.width / 2),this.y + (this.height / 2)));
        this.charge = 0;
        }
        this.nSpecial = true;
    };
  }

  this.clearSpecial = function(){
    if (this.dSpecial) {
      this.charging = false;

    };
  };
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



function updateGameArea(){
  myGameArea.clear();
  punchingBag.newPos();
  if (punchingBag.crashWith(stage)) {
    punchingBag.clearSpeeds();
  }
  updateChargeAnimation(melee);
  updateProjectiles();
  playerOneDamage.text = Math.round(melee.damage * 10) + "%";
  playerOneDamage.update();
  playerTwoDamage.text = Math.round(punchingBag.damage * 10) + "%";
  playerTwoDamage.update();
  punchingBag.update();
  melee.newPos();
  melee.update();
  stage.update();
};

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
      melee.attack();
      break;
    case 87:
      melee.specialAttack();
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
      melee.clearAttack();
      break;
    case 87:
      melee.clearSpecial();
      break;
  };
});
