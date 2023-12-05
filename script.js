const canvas = document.querySelector("canvas"),
      context = canvas.getContext("2d");

const DEBUG = false;

class Point {
  constructor(x=0,y=0) {
    this.x = x;
    this.y = y;
  }
  
  get lengthSquared() {
    return this.x * this.x + this.y * this.y;
  }
  
  get length() {
    return Math.sqrt(this.lengthSquared);
  }
  
  set(x,y) {
    this.x = x;
    this.y = y;
    return this;
  }
  
  add(x,y) {
    this.x += x;
    this.y += y;
    return this;
  }
  
  addVector(v) {
    return this.add(v.x,v.y);
  }
  
  subtract(x,y) {
    this.x -= x;
    this.y -= y;
    return this;
  }
  
  subtractVector(v) {
    return this.subtract(v.x,v.y);
  }
  
  invertX() {
    this.x = -this.x;
    return this;
  }
  
  invertY() {
    this.y = -this.y;
    return this;
  }
  
  invert() {
    return this.invertX().invertY();
  }
  
  multiply(x,y) {
    this.x *= x;
    this.y *= y;
    return this;
  }
  
  multiplyVector(v) {
    return this.multiply(v.x,v.y);
  }
  
  multiplyScalar(k) {
    return this.multiply(k,k);
  }
}

class Rect extends Point {
  constructor(x=0,y=0,width=0,height=0) {
    
    super(x,y);
    
    this.width = width;
    this.height = height;
    
  }
  
  get left() {
    return this.x;
  }
  
  get top() {
    return this.y;
  }
  
  get right() {
    return this.x + this.width;
  }
  
  get bottom() {
    return this.y + this.height;
  }
  
  get halfWidth() {
    return this.width * 0.5;
  }
  
  get halfHeight() {
    return this.height * 0.5;
  }
  
  get centerX() {
    return this.x + (this.halfWidth);
  }
  
  get centerY() {
    return this.y + (this.halfHeight);
  }
  
  contains(x,y) {
    return x > this.x 
        && y > this.y 
        && x < this.x + this.width 
        && y < this.y + this.height;
  }
  
  containsPoint(p) {
    return this.contains(p.x,p.y);
  }
  
  containsRect(r) {
    return this.contains(r.left, r.top) 
        && this.contains(r.right, r.bottom);
  }
  
  collides(r) {
    return r.contains(this.left,this.top)
        || r.contains(this.right,this.top)
        || r.contains(this.left,this.bottom)
        || r.contains(this.right,this.bottom);
  }
}

const State = {
  TITLE: 0,
  PREPARE: 1,
  GAME: 2,
  GAME_OVER: 3,
  WON: 4,
  PAUSE: 5
};

const Stage = {
  contains(x,y) {
    return x > 0 && y > 0 && x < this.width && y < this.height;
  },
  containsVector(v) {
    return this.contains(v.x,v.y);
  },
  get max() {
    return Math.max(canvas.width,canvas.height);
  },
  get min() {
    return Math.min(canvas.width,canvas.height);
  },
  get width() {
    return canvas.width;
  },
  get height() {
    return canvas.height;
  },
  get centerX() {
    return canvas.width * 0.5;
  },
  get centerY() {
    return canvas.height * 0.5;
  },
  get leftBorder() {
    return this.centerX - ((Brick.WIDTH + 1) * 9);
  },
  get rightBorder() {
    return this.centerX + ((Brick.WIDTH + 1) * 9);
  }
};

const Key = (function() {
  const keys = new Array(256),
        hooks = {};
  for (let index = 0; index < keys.length; index++) {
    keys[index] = false;
  }

  function keyup(e) {
    const key = e.keyCode;
    keys[key] = false;
    if (hooks[key]) {
      hooks[key]();
    }
  }

  function keydown(e) {
    const key = e.keyCode;
    keys[key] = true;
  }

  return {
    ENTER: 13,
    ESCAPE: 27,
    SPACE: 32,

    NUM_0: 48,
    NUM_1: 49,
    NUM_2: 50,
    NUM_3: 51,
    NUM_4: 52,
    NUM_5: 53,
    NUM_6: 54,
    NUM_7: 55,
    NUM_8: 56,
    NUM_9: 57,

    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,

    start() {
      window.addEventListener("keyup", keyup);
      window.addEventListener("keydown", keydown);
    },
    stop() {
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("keydown", keydown);
    },
    on(key, fn) {
      hooks[key] = fn;
      return this;
    },
    off(key) {
      hooks[key] = null;
      return this;
    },
    isDown(key) {
      return keys[key];
    },
    isUp(key) {
      return !keys[key];
    }
  };
}());

class Item extends Point {
  static WIDTH = 20;
  static HEIGHT = 20;

  static LARGE = "large";
  static SMALL = "small";
  static POWERBALL = "powerball";

  static TYPES = ["large","small","powerball"];
  
  constructor(x,y,color) {
    super(x,y);
    
    this.color = color;
    
    const itemTypeIndex = Math.round(Math.random() * (Item.TYPES.length - 1));
    this.type = Item.TYPES[itemTypeIndex];
  }
  
  move() {
    this.add(0,3);
    return this;
  }
  
  render(now) {
    context.save();
    context.translate(this.x,this.y);
    
    context.fillStyle = this.color;
    context.fillRect(Item.WIDTH * -0.5, Item.HEIGHT * -0.5, Item.WIDTH, Item.HEIGHT);
    context.font = "bold 20px Orbitron, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillStyle = "#00ff0f";
    if (this.type === Item.LARGE) {
      context.fillText("L",0,3);
    } else if (this.type === Item.SMALL) {
      context.fillText("S",0,3);
    } else if (this.type === Item.POWERBALL) {
      context.fillText("P",0,3);
    } else {
      context.fillText("U",0,3);
    }

    context.restore();
  }  
}

class Particle extends Point {
  
  static WIDTH = 4;
  static HEIGHT = 4;
  
  constructor(x,y,color) {
    super(x,y);
    
    const vx = (Math.random() - 0.5) * 5;
    const vy = (Math.random() - 0.5) * 5;
    
    this.velocity = new Point(vx, vy);
    this.color = color;
    this.life = 1.0;
  }
  
  get isDead() {
    return this.life <= 0.0;
  }
  
  update(now) {
    this.addVector(this.velocity);
    this.life -= 0.1;
    return this;
  }
  
  render(now) {
    context.save();
    context.translate(this.x,this.y);
    context.globalAlpha = this.life;
    context.fillStyle = this.color;
    context.fillRect(Particle.WIDTH * -0.5,Particle.HEIGHT * -0.5,Particle.WIDTH,Particle.HEIGHT);
    context.restore();
  }
  
}

class Brick extends Rect {

  static WIDTH = 50;
  static HEIGHT = 20;

  constructor(tx = 0, ty = 0, isUndestructible = false, hitsToDestroy = 3) {
    super(tx * Brick.WIDTH, ty * Brick.HEIGHT, Brick.WIDTH, Brick.HEIGHT);
    
    this.tx = tx;
    this.ty = ty;

    this.initialHitsToDestroy = hitsToDestroy;
    this.hitsToDestroy = hitsToDestroy;

    this.isUndestructible = isUndestructible;
    this.isDestroyed = false;
  }

  destroy(force = false) {
    if (force) {
      this.hitsToDestroy = 0;
      this.isDestroyed = true;
    } else {
      if (this.hitsToDestroy > 0) {
        this.hitsToDestroy--;
      }
      
      if (this.hitsToDestroy === 0) {
        this.isDestroyed = true;
      }
    }
    return this;
  }

  restore() {
    this.hitsToDestroy = this.initialHitsToDestroy;
    this.isDestroyed = false;
    return this;
  }

  get initialColor() {
    if (this.isUndestructible) {
      return "#0cf";
    } else if (this.initialHitsToDestroy > 1) {
      return `#f0c`;
    } else {
      return "#fc0";
    }
  }

  get color() {
    if (this.isUndestructible) {
      return "#0cf";
    } else {
      if (this.initialHitsToDestroy > 1) {
        const value = Math.round((this.hitsToDestroy / this.initialHitsToDestroy) * 255);
        return `rgb(${value},0,${Math.round(value * 0.5)})`;
      } else {
        return "#fc0";
      }
    }
  }

  render(now) {
    if (this.isDestroyed) {
      return;
    }

    context.save();
    context.translate(this.x, this.y);
    context.fillStyle = this.color;
    context.fillRect(0,0,this.width,this.height);
    context.restore();
  }

  setInitialPosition() {
    // TODO: Make this code more clear
    this.x = (Stage.centerX) - ((this.tx * (this.width + 1)) - ((this.width + 1) * 7)) - this.halfWidth;
    this.y = 50 + this.ty * (this.height + 1) - this.halfHeight;
    return this;
  }

  resize() {
    return this.setInitialPosition();
  }
}

class Ball extends Rect {

  static WIDTH = 10;
  static HEIGHT = 10;

  static DEFAULT_VEL_X = 0;
  static DEFAULT_VEL_Y = 5;
  
  constructor() {
    super(Stage.centerX,Stage.centerY,Ball.WIDTH,Ball.HEIGHT);
    this.velocity = new Point(Ball.DEFAULT_VEL_X,Ball.DEFAULT_VEL_Y);
    this.isPowerful = false;
  }

  move() {
    this.addVector(this.velocity);
    return this;
  }

  over(pad) {
    this.y = pad.y - this.height;
    this.x = pad.centerX - this.halfWidth;
    return this;
  }

  throw() {
    this.x = Math.random() * this.halfWidth;
    this.y = -Ball.DEFAULT_VEL_Y;
    return this;
  }

  bounceY() {
    this.velocity.invertY();
    return this;
  }

  bounceX() {
    this.velocity.invertX();
    return this;
  }

  bounce() {
    return this.bounceX().bounceY();
  }

  bounceBrick(brick) {
    this.rewind();
    if (this.centerY >= brick.top && this.centerY <= brick.bottom) {
      return this.bounceX();
    } else {
      return this.bounceY();
    }
  }
  
  bouncePad(pad) {
    this.velocity.x = (this.centerX - pad.centerX) / this.halfWidth;
    return this.bounceY();
  }

  rewind() {
    this.subtractVector(this.velocity);
    return this;
  }

  setInitialVelocity() {
    return this.velocity.set(Ball.DEFAULT_VEL_X,Ball.DEFAULT_VEL_Y);
  }

  setInitialPosition() {
    this.x = Stage.centerX - this.halfWidth;
    this.y = Stage.centerY - this.halfHeight;
    return this.setInitialVelocity();
  }
  
  render(now) {
    context.save();
    context.translate(this.x, this.y);
    context.fillStyle = "#d305f2";
    context.fillRect(0,0,this.width,this.height);
    context.restore();
  }

  resize() {
    this.setInitialPosition();
  }
}

class Pad extends Rect {
  static WIDTH = 100;
  static WIDTH_L = 200;
  static WIDTH_S = 50;
  static HEIGHT = 10;

  static DEFAULT_POS_Y = 0.9;
  
  constructor() {
    super(Stage.centerX,Stage.height * 0.9,Pad.WIDTH,Pad.HEIGHT);

    this.velocity = new Point();

    this.isSmall = false;
    this.isLarge = false;

    this.friction = 0.9;
  }

  moveLeft() {
    this.velocity.x -= 1.0;
    return this;
  }

  moveRight() {
    this.velocity.x += 1.0;
    return this;
  }

  move() {
    
    if (this.isLarge && this.width != Pad.WIDTH_L) {
      this.width += (Pad.WIDTH_L - this.width) * 0.1;
    } else if (this.isSmall && this.width != Pad.WIDTH_S) {
      this.width += (Pad.WIDTH_S - this.width) * 0.1;
    } else {
      if (this.width != Pad.WIDTH) {
        this.width += (Pad.WIDTH - this.width) * 0.1;
      }
    }
    
    this.addVector(this.velocity);
    this.velocity.multiplyScalar(this.friction);
    
    return this;
    
  }

  render(now) {
    context.save();
    context.translate(this.x,this.y);
    context.fillStyle = "#e6460b";
    context.fillRect(0,0,this.width,this.height);
    context.restore();
  }

  setInitialPosition() {
    this.x = (Stage.centerX - this.halfWidth);
    this.y = (Stage.height * Pad.DEFAULT_POS_Y) - this.halfHeight;
    return this;
  }

  resize() {
    return this.setInitialPosition();
  }
}

let lifes = 3,
    state = State.TITLE,
    countdown = 3,
    startCountdown = null,
    destructibleBricks = 0,
    destroyedBricks = 0;

let isPaused = false;


const pad = new Pad(),
      ball = new Ball(),
      bricks = [],
      items = [],
      particles = [];

for (let y = 0; y < 10; y++) {
  for (let x = 0; x < 15; x++) {
    bricks.push(new Brick(x, y, (y % 5 === 0 ? true : false), (y % 2 === 0 ? 2 : 1)));
  }
}

for (let index = 0; index < bricks.length; index++) {
  const brick = bricks[index];
  if (!brick.isUndestructible) {
    destructibleBricks++;
  }
}

function explosion(v,color) {
  for (let index = 0; index < 10; index++) {
    particles.push(new Particle(v.x,v.y,color));
  }
}

function frame(now = 0) {
  update(now);
  render(now);

  window.requestAnimationFrame(frame);
}

function updateParticles(now) {
  for (let index = particles.length - 1; index >= 0; index--) {
    const particle = particles[index];
    particle.update(now);
    if (particle.isDead) {
      particles.splice(index, 1);
    }
  }
}

function update(now) {

  if (state === State.PREPARE || state === State.GAME) {

    if (!isPaused){

    if (Key.isDown(Key.LEFT)) {
      pad.moveLeft();
    } else if (Key.isDown(Key.RIGHT)) {
      pad.moveRight();
    }

    pad.move();
    if (pad.x < Stage.leftBorder) {
      pad.x = Stage.leftBorder;
    } else if (pad.x > Stage.rightBorder - pad.width) {
      pad.x = Stage.rightBorder - pad.width;
    }
    
    if (state === State.PREPARE) {
      
      if (!startCountdown) {
        startCountdown = now;
      } else {
        countdown = 3 - Math.floor((now - startCountdown) / 1000);
        if (countdown <= 0) {
          startCountdown = null;
          state = State.GAME;
          ball.throw();
        }
      }
      
      ball.over(pad);
      updateParticles(now);
      
    } else if (state === State.GAME) {

      ball.move();
      if (ball.y > Stage.height) {
        lifes--;
        if (lifes === 0) {
          state = State.GAME_OVER;
        } else {
          state = State.PREPARE;
          pad.isLarge = false;
          pad.isSmall = false;
          ball.isPowerful = false;
          ball.setInitialPosition();
          while (items.length > 0) {
            const item = items.pop();
            explosion(item,item.color);
          }
        }
      } else if (ball.y < 0) {
        ball.bounceY();
        explosion(ball,"#0c3eb3");
      } else if (ball.x < Stage.leftBorder + ball.halfWidth) {
        ball.bounceX();
        explosion(ball,"#0cf");
      } else if (ball.x > Stage.rightBorder - ball.width) {
        ball.bounceX();
        explosion(ball,"#25168a");
      }

      if (ball.collides(pad)) {
        ball.bouncePad(pad);
        explosion(ball,"#360127");
      }

      destroyedBricks = 0;
      for (let index = 0; index < bricks.length; index++) {
        const brick = bricks[index];
        if (!brick.isDestroyed) {
          if (ball.collides(brick)) {
            if (!brick.isUndestructible) {
              brick.destroy(ball.isPowerful);
              if (brick.isDestroyed && Math.random() > 0.85) {
                items.push(new Item(brick.centerX,brick.centerY,brick.initialColor));
              }
            }
            
            if (!ball.isPowerful || brick.isUndestructible) {
              ball.bounceBrick(brick);
            }
            
            explosion(ball,brick.color);
          }
        } else {
          destroyedBricks++;
          if (destroyedBricks === destructibleBricks) {
            state = State.WON;
          }
        }
      }
      
      for (let index = items.length - 1; index >= 0; index--) {
        const item = items[index];
        item.move();
        if (pad.containsPoint(item)) {
          if (item.type === Item.LARGE) {
            pad.isLarge = true;
            if (pad.isSmall === true) {
              pad.isSmall = false;
            }
          } else if (item.type === Item.SMALL) {
            pad.isSmall = true;
            if (pad.isLarge === true) {
              pad.isSmall = false;
            }
          } else if (item.type === Item.POWERBALL) {
            ball.isPowerful = true;
          }
          explosion(item,item.color);
          items.splice(index,1);
        } else if (item.y > Stage.height) {
          items.splice(index,1);
        }
      }

      updateParticles(now);

    }
    
  }
}
}

Key.on(Key.SPACE, () => {

  if (state === State.GAME_OVER || state === State.WON) {
    state = State.TITLE;
  } else if (state === State.TITLE) {
    lifes = 3;

    pad.setInitialPosition();
    ball.setInitialPosition();

    for (let index = 0; index < bricks.length; index++) {
      const brick = bricks[index];
      brick.restore();
    }

    state = State.PREPARE;
  }

});

Key.on(Key.ESCAPE, () => {
  if (state !== State.GAME_OVER && state !== State.WON) {
    isPaused = !isPaused;
    if (isPaused) {
      state = State.PAUSE;
    } else {
      state = State.GAME;
    }
  }
});
  
if (DEBUG) {
  Key.on(Key.NUM_1, () => {
    pad.isLarge = !pad.isLarge;
    if (pad.isLarge) {
      pad.isSmall = false;
    }
  }).on(Key.NUM_2, () => {
    pad.isSmall = !pad.isSmall;
    if (pad.isLarge) {
      pad.isLarge = false;
    }
  }).on(Key.NUM_3, () => {
    ball.isPowerful = !ball.isPowerful;
  });
}

function renderBackground(now) {

  context.save();
  context.translate(Stage.centerX,Stage.centerY);
  context.scale(2,2);
  context.save();
  context.rotate(now * 0.001);
  context.translate(-Stage.centerX,-Stage.centerY);
  context.fillStyle = "#0cf";
  context.fillRect(0,0,Stage.max * (1/3), Stage.max);
  context.fillStyle = "#06bd80";
  context.fillRect(Stage.max * (1/3),0,Stage.max * (1/3), Stage.max);
  context.fillStyle = "#f0c";
  context.fillRect(Stage.max * (2/3),0,Stage.max * (1/3), Stage.max);
  context.restore();
  context.restore();
  
}

function renderLifes() {
  
  context.font = "bold 20px Orbitron, sans-serif";
  context.textAlign = "left";
  context.textBaseline = "top";
  context.fillStyle = "#d305f2";
  context.fillText(`LIFES: ${lifes}`, Stage.leftBorder + 20, Stage.height - 30);
  
}

function renderDebug() {
  
  context.font = "normal 10px monospace";
  context.fillStyle = "#beff54";
  context.fillText(`LARGE: ${pad.isLarge} (Use 1 to toggle)`, Stage.leftBorder + 21, Stage.height - 101);
  context.fillText(`SMALL: ${pad.isSmall} (Use 2 to toggle)`, Stage.leftBorder + 21, Stage.height - 91);
  context.fillText(`POWER BALL: ${ball.isPowerful} (Use 3 to toggle)`, Stage.leftBorder + 21, Stage.height - 81);
  context.fillStyle = "#07ed50";
  context.fillText(`LARGE: ${pad.isLarge} (Use 1 to toggle)`, Stage.leftBorder + 20, Stage.height - 100);
  context.fillText(`SMALL: ${pad.isSmall} (Use 2 to toggle)`, Stage.leftBorder + 20, Stage.height - 90);
  context.fillText(`POWER BALL: ${ball.isPowerful} (Use 3 to toggle)`, Stage.leftBorder + 20, Stage.height - 80);
  
}

function renderCountdown(now) {
  
  const a = 1.0 - (((now - startCountdown) % 1000) / 1000);
  
  context.save();
  context.globalAlpha = a;
  context.translate(Stage.centerX,Stage.centerY);
  context.scale(a,a);
  context.font = "bold 100px Orbitron, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#fff";
  context.fillText(`${countdown}`,0,0);
  context.restore();
  
}

function renderBouncingText(now, bouncingText) {
  
  const a = Math.abs(Math.sin((now) / 1000)),
        s = Math.abs(Math.sin((now) / 1000)) + 0.5;
  
  context.save();
  context.translate(Stage.centerX,Stage.centerY);
  context.scale(s,s);
  context.rotate(Math.sin(now / 1000) * Math.PI * 0.125);
  context.font = "bold 100px Orbitron, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#4a5612";
  context.fillText(bouncingText,0,0);
  context.restore();
  
  context.save();
  context.font = "bold 20px Orbitron, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#0745bb";
  const text = "PRESS SPACEBAR, ESC TO PAUSE"
  const fullMeasure = context.measureText(text);
  for (let index = 0; index < text.length; index++) {
    const measures = context.measureText(text.substr(0,index));
    context.fillText(text.substr(index, 1), (Stage.centerX + measures.width) - (fullMeasure.width * 0.5), (Stage.height * 0.9) + Math.sin(now / 100 + index));
  }
  context.restore();
  
}

function renderTitle(now) {
  renderBackground(now);
  renderBouncingText(now, "BREAK OUT");
}

function renderGameOver(now) {
  renderBouncingText(now, "HALA, BANGA");  
}

function renderWon(now) {
  renderBouncingText(now, "NOOOOOO, ni DAOG KA!");
}

function renderLeftBorder() {
  context.fillStyle = "#679173";
  context.fillRect(0, 0, Stage.leftBorder, Stage.height);
}

function renderRightBorder() { 
  context.fillStyle = "#700C15";
  context.fillRect(Stage.rightBorder, 0, Stage.width - Stage.rightBorder, Stage.height);
}

function render(now) {
  if (state === State.PREPARE || state === State.GAME) {
    context.clearRect(0, 0, Stage.width, Stage.height);
  } else {
    context.fillStyle = "#6D7E86";
    context.fillRect(0,0,Stage.width,Stage.height);
  }
  
  if (state === State.TITLE) {
    renderTitle(now);
  } else if (state === State.PREPARE || state === State.GAME) {
    pad.render(now);
    ball.render(now);

    for (let index = 0; index < bricks.length; index++) {
      const brick = bricks[index];
      brick.render(now);
    }
    
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      item.render(now);
    }
    
    for (let index = 0; index < particles.length; index++) {
      const particle = particles[index];
      particle.render(now);
    }

    renderLeftBorder(now);
    renderRightBorder(now);

    renderLifes(now);
    
    if (state === State.PREPARE) {
      renderCountdown(now);
    }
    
    
  } else if (state === State.GAME_OVER) {
    renderGameOver(now);
  } else if (state === State.WON) {
    renderWon(now);
  }
  
  if (DEBUG) {
    renderDebug();
  } 
    
}

function resize() {
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  pad.resize();
  ball.resize();

  for (let index = 0; index < bricks.length; index++) {
    const brick = bricks[index];
    brick.resize();
  }
  
}

Key.start();

resize();
frame();

window.addEventListener("resize", resize); 