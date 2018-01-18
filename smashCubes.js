var activeMap;
var activeCharacter;
var projectiles = {"neg":[],"pos":[]};

function startGame(){
  melee = new component(30,30,"green",300,300);
  ranged = new component(30,30,"blue",300,300);
  playerDamage = new component("38px","consolas","white",window.innerWidth / 3.5,window.innerHeight - 100, "text");
  chargingAnimation = new component(50,50,"blue",0,0)
  punchingBag = new component(30,60,"purple",(window.innerWidth / 2) - 15,300);
  punchingBagDamage = new component("38px","consolas","white",window.innerWidth / 1.5,window.innerHeight - 100,"text");
  stage = new component(window.innerWidth / 1.8,10,"black",(window.innerWidth - window.innerWidth / 1.8) / 2,500);
  platformOne = new component();
  platformTwo = new component();
  myGameArea.start();
}

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
  this.damage = 0;
  this.jumpCount = 0;
  this.damage = 0;
  this.charge = 0;
  this.charging = false;
  this.canMoveLeft = true;
  this.canMoveRight = true;
  this.canAttack = true;
  this.upPressed = false;
  this.downPressed = false;
  this.nAttack = false;
  this.uAttack = false;
  this.dAttack = false;
  this.fAttack = false;
  this.bAttack = false;
  this.canSpecial = true;
  this.nSpecial = false;
  this.uSpecial = false;
  this.dSpecial = false;
  this.fSpecial = false;
  this.bSpecial = false;
  this.update = function() {
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

  this.newPos = function() {

    this.gravitySpeed += this.gravity;
    this.x += this.speedX;
    this.y += this.speedY + this.gravitySpeed;
    this.hitBottom();
  };

  this.crashWith = function(otherobj){
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

  this.didHit = function(otherobj){
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
      if (projectiles["neg"].includes(this) || projectiles["pos"].includes(this)) {
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
    }
  }

  this.hitBottom = function(){
    //make it so it falls of stagge if not over stage
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

  this.attack = function() {
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

  this.clearAttack = function(){

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
      if (this.speedX == 5) {
        if (this.charge >= 10 ) {
          projectiles["pos"].push(new component(this.charge,this.charge,"blue",this.x,this.y + (this.height / 3)));
          this.charge -= 10;
        }
        this.fSpecial = true;
      } else if (this.speedX == -5) {
        if (this.charge >= 10 ) {
          projectiles["neg"].push(new component(this.charge,this.charge,"blue",this.x + (this.width),this.y + (this.height / 3)));
          this.charge -= 10;
        }
        this.bSpecial = true
      } else if (this.upPressed) {
        this.gravitySpeed = -20;
        this.attack();
        this.attack();
        this.clearAttack();
        this.uSpecial = true;
        this.jumpCount = 2;
        this.canSpecial = false;
      } else if (this.downPressed) {
        if (this.charge <= 50) {
          this.charge += 5;
          this.charging = true;
        }
        this.dSpecial = true;
      }
    };
  }

  this.clearSpecial = function(){
    if (this.dSpecial) {
      this.charging = false
    };
  };
};



function updateGameArea(){
  myGameArea.clear();
  punchingBag.newPos();
  if (punchingBag.crashWith(stage)) {
    punchingBag.clearSpeeds();
  }
  if (melee.charging && melee.charge < 50) {
    chargingAnimation.x = melee.x - 10;
    chargingAnimation.y = melee.y - 10;
    chargingAnimation.update()
  }
  for (var i = 0; i < projectiles["pos"].length; i++) {
    let projectile = projectiles["pos"][i];
    projectile.gravity = 0;
    projectile.speedX = 10;
    projectile.newPos();
    projectile.update();
    projectile.didHit(punchingBag);
  }
  for (var i = 0; i < projectiles["neg"].length; i++) {
    let projectile = projectiles["neg"][i];
    projectile.gravity = 0;
    projectile.speedX = -10;
    projectile.newPos();
    projectile.update();
    projectile.didHit(punchingBag);
  }
  playerDamage.text = Math.round(melee.damage * 10) + "%";
  playerDamage.update();
  punchingBagDamage.text = Math.round(punchingBag.damage * 10) + "%";
  punchingBagDamage.update();
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
