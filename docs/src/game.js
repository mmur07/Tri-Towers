document.addEventListener('contextmenu', event => event.preventDefault());

import Elemental from "./Elemental.js";
import elements from "./enum.js";
import Tower from "./Tower.js"
import Enemy from "./Enemy.js";
import Bullet from "./Bullet.js"
import Spawner from "./Spawner.js";
import ShieldEnemy from "./ShieldEnemy.js"
import AoeBullet from "./AoeBullet.js";
import HUD from "./HUD.js"
import TankyEnemy from "./TankyEnemy.js";
import RotationButton from "./RotationButton.js";

const WIN_WIDTH = 1984, WIN_HEIGTH = 1984;
const MAX_GOLD = 9999;

const PATHDATA = {
  'start': { x: -50, y: 400 },
  'begin': [{ x: 50, y: 400 }, { x: 375, y: 550 },],
  'up0': [{ x: 550, y: 525 }, { x: 850, y: 850 }, { x: 925, y: 1100 }, { x: 1100, y: 1175 }],
  'down0': [{ x: 175, y: 700 }, { x: 125, y: 900 }, { x: 150, y: 1250 }, { x: 225, y: 1475 }, { x: 750, y: 1400 }, { x: 800, y: 1400 }, { x: 1100, y: 1175 }],
  'up1': [{ x: 1300, y: 1000 }, { x: 1400, y: 850 }, { x: 1800, y: 800 }],
  'down1': [{ x: 1450, y: 1500 }, { x: 1650, y: 1500 }, { x: 1775, y: 1075 }, { x: 1800, y: 800 },],
  'end': [{ x: 1800, y: 700 }, { x: 1800, y: 400 }, { x: 1750, y: 350 }, { x: 1650, y: 350 }, { x: 1600, y: 300 }, { x: 1500, y: 250 }, { x: 1200, y: 250 }, { x: 1118, y: 200 }, { x: 1118, y: -100 }]
}
const ENEMYGOLD = { 'normal': 5, 'shield': 7, 'tank': 10 };
const BASEGOLD = 150;
const ENEMYSPEED = 12;
export default class Game extends Phaser.Scene {

  constructor() {
    super({ key: 'game' });
    this._idCount = 0;
    this._won = false;
  }
  preload() {
    this.anims.create({
      key: 'basic_walk_1',
      frames: this.anims.generateFrameNumbers('BasicEnW', { start: 0, end: 4 }),
      frameRate: 5, repeat: -1
    });
    this.anims.create({
      key: 'basic_walk_2',
      frames: this.anims.generateFrameNumbers('BasicEnE', { start: 0, end: 4 }),
      frameRate: 5, repeat: -1
    });
    this.anims.create({
      key: 'basic_walk_0',
      frames: this.anims.generateFrameNumbers('BasicEnF', { start: 0, end: 4 }),
      frameRate: 5, repeat: -1
    });
    this.anims.create({
      key: 'shield_walk_0',
      frames: this.anims.generateFrameNumbers('ShieldEnF', { start: 0, end: 2 }),
      frameRate: 5, repeat: -1
    });
    this.anims.create({
      key: 'shield_walk_1',
      frames: this.anims.generateFrameNumbers('ShieldEnW', { start: 0, end: 2 }),
      frameRate: 5, repeat: -1
    });
    this.anims.create({
      key: 'shield_walk_2',
      frames: this.anims.generateFrameNumbers('ShieldEnE', { start: 0, end: 2 }),
      frameRate: 5, repeat: -1
    });

    this.anims.create({
      key: 'tank_walk_0',
      frames: this.anims.generateFrameNumbers('TankEnF', { start: 0, end: 3 }),
      frameRate: 5, repeat: -1
    });
    this.anims.create({
      key: 'tank_walk_1',
      frames: this.anims.generateFrameNumbers('TankEnW', { start: 0, end: 3 }),
      frameRate: 5, repeat: -1
    });
    this.anims.create({
      key: 'tank_walk_2',
      frames: this.anims.generateFrameNumbers('TankEnE', { start: 0, end: 3 }),
      frameRate: 5, repeat: -1
    });
  }
  PoolBullets() {
    for (let i = 0; i < 200; i++) {
      let bull = new Bullet(this, 50, 400, 90, 10, 100, elements.FIRE, 'bulletSprite');
      this.BulletPool.add(bull);
      this.BUlletPool.killAndHide(bull);
    }
  }
  PoolAoeBullets() {
    for (let i = 0; i < 150; i++) {
      let bull = new AoeBullet(this, 400, 90, 1.25, 100, 100, elements.FIRE, 'aoeBullet');
    }
  }
  SpawnEnemy(elem, x, y,route,hp) {
    let en = new Enemy(this, 'BasicEnF', elem, x, y, 200, ENEMYSPEED,route,this._idCount, 'deathSoundMinion');
    this.ActiveEnemies.add(en);
    this._idCount++;
  }
  SpawnTankyEnemy(elem, x, y, hpregen,route) {
    this.ActiveEnemies.add(new TankyEnemy(this, 'TankEnF', elem, x, y, 300, ENEMYSPEED, route, hpregen,this._idCount,'deathSoundGolem'));
    this._idCount++;
  }
  SpawnShieldedEnemy(elem, x, y, shields,route) {
    this.ActiveEnemies.add(new ShieldEnemy(this, 'ShieldEnF', elem, x, y, 250, ENEMYSPEED, route,this._idCount,shields, 'deathSoundSkeleton'));
    this._idCount++;
  }
  SpawnAoeBullet(x, y, damage, range, elem) {
    let b;
    if (this.aoeBulletPool.getLength() > 0) {
      b = this.aoeBulletPool.getFirstDead();
      b.setDmg(damage, elem);
    }
    else b = new AoeBullet(this, 400, 90, 1.25, 100, 100, elem, 'aoeBullet');
    b.fire(x, y, range);
  }
  SpawnBullet(angle, x, y,damage,elem) {
    let b;
    if (this.BulletPool.getLength() > 0) {
      b = this.BulletPool.getFirstDead();
      b.setDmg(damage, elem);
    }
    else {
      b = new Bullet(this, 50, 400, 90, 2, damage, elem, 'bulletSprite');
    }
    b.fire(x, y, angle);
  }
  CreatePath(start, route) {
    let ruta = this.add.path(start.x, start.y);
    route.forEach(part => {
      part.forEach(p => {
        ruta.lineTo(p.x, p.y);
      });
    });
    return ruta;
  }
  ShowPathsDebug() {
    let graphics = this.add.graphics();

    graphics.lineStyle(3, 0xffffff, 1);
    // visualize the path
    this._routes[0].draw(graphics);
    graphics.lineStyle(3, 0xff0000, 1);
    this._routes[1].draw(graphics);
    graphics.lineStyle(3, 0xe49213, 1);
    // visualize the path
    this._routes[2].draw(graphics);
    graphics.lineStyle(3, 0x1d13e4, 1);
    this._routes[3].draw(graphics);

    this.paths = this.add.group();
  }
  CreatePaths() {

    // let init = [{x:-50,y:400},{x:50,y:400},{x:375,y:550}];
    // let camino = this.CreatePath(pathData.start,[pathData.begin,pathData.up0,pathData.down1]);
    this._routes = new Array();
    this._routes.push(this.CreatePath(PATHDATA.start, [PATHDATA.begin, PATHDATA.up0, PATHDATA.down1, PATHDATA.end]));
    this._routes.push(this.CreatePath(PATHDATA.start, [PATHDATA.begin, PATHDATA.down0, PATHDATA.down1, PATHDATA.end]));
    this._routes.push(this.CreatePath(PATHDATA.start, [PATHDATA.begin, PATHDATA.up0, PATHDATA.up1, PATHDATA.end]));
    this._routes.push(this.CreatePath(PATHDATA.start, [PATHDATA.begin, PATHDATA.down0, PATHDATA.up1, PATHDATA.end]));

    // this.ShowPathsDebug();
  }
  getRoute(num) {
    if (num >= this._routes.length)
      return undefined
    else
      return this._routes[num];
  }
  getCurrentGold() {
    return this.player.gold;
  }

  OnEnemySlain(enemy) {
    this.ActiveEnemies.remove(enemy);
    this.EnemyPool.add(enemy);

    enemy.setActive(false);
    enemy.setVisible(false);
    this.earnGoldEnemy(enemy);
    this.ActiveTowers.getChildren().forEach(tow => {
      if (tow.getTarget() === enemy)
        tow.looseTarget();
    });
  }
  OnEnemyAttack(enemy) {
    this.player.hp--;
    this._HUD.updateHealth(this.player.hp);
    if (this.player.hp <= 0)
      this.scene.start('endGame');
  }
  earnGoldEnemy(enemy) {
    //primero comprobaremos las subclases cuando las implementemos y enemigo por descarte
    let gain;
    if (enemy instanceof ShieldEnemy) {
      gain = ENEMYGOLD.shield;
    }
    else if (enemy instanceof TankyEnemy) {
      gain = ENEMYGOLD.tank;
    }
    else {
      gain = ENEMYGOLD.normal;
    }
    this.player.gold += gain;
    if (this.player.gold > MAX_GOLD) this.player.gold = MAX_GOLD;
    this._HUD.updateGold(this.player.gold);
  }
  modifyGold(gain) {
    this.player.gold += gain;
    if (this.player.gold > MAX_GOLD) this.player.gold = MAX_GOLD;
    this._HUD.updateGold(this.player.gold);
  }
  addTower(pointer, target) {
    this._canAdd = true;
    this.dragObj = this.scene.add.image(64, 64, 'towerIconSprite'); //El objeto que arrastramos es un sprite
    //Activamos listeners para detectar la posicion del raton y cuando lo soltamos
    this.scene.input.on('pointermove', this.Drag, this);
    this.scene.input.on('pointerup', this.stopDrag, this);

  }


  deleteTile(xPos, yPos) {
    if (this.towers.getTileAtWorldXY(this.pointer.x, this.pointer.y) != null) {
      this.towers.removeTileAtWorldXY(this.pointer.x, this.pointer.y, true);
    }
  }

  CreateMap() {
    this.map = this.make.tilemap({
      key: 'tilemap',
      tileWidth: 16,
      tileHeight: 16
    });
    this.tileset = this.map.addTilesetImage('modded_colored', 'patronesTilemap');
    this._bgMap = this.map.createStaticLayer('Background', this.tileset, 0, 0).setScale(4);
    this._nodes = this.map.createStaticLayer('Nodes', this.tileset, 0, 0).setScale(4);
    this.towers = this.map.createDynamicLayer('Towers', this.tileset, 0, 0).setScale(4);
    this._default = this.map.createStaticLayer('Default', this.tileset, 0, 0).setScale(4);
    this.can_place_towers = this.map.createStaticLayer('Can_place_towers', this.tileset, 0, 0).setScale(4);
    this._hud = this.map.createStaticLayer('HUD', this.tileset, 0, 0).setScale(4);
  }
  CreateHUD() {
    let self = this;
    WebFont.load({
      google: {
        families: ['Freckle Face', 'Finger Paint', 'VT323']
      },
      active: function () // se llama a esta función cuando está cargada
      {
        let nuevoTexto =
          self.add.text(900, WIN_HEIGTH - 200,
            'g',
            { fontFamily: 'VT323', fontSize: 90, color: '#ffffff' })
        nuevoTexto.setShadow(2, 2, "#FFD700", 2, false, true);
      }
    });
  }
  rotateAllTowers() {
    this.ActiveTowers.getChildren().forEach(tower => { tower.rotateLeft() });
  }

  create() {
    //Creación sonidos

    this.musicPhases = [];
    this.waveMusicCount = 0;
    this.startMenuMusic = this.sound.add('titleScreen');

    this.musicPhases.push(this.sound.add('stage1Music'));
    this.musicPhases.push(this.sound.add('stage2Music'));
    this.musicPhases.push(this.sound.add('stage3Music'));
    this.musicPhases.push(this.sound.add('stage4Music'));
    this.musicPhases.push(this.sound.add('stage5Music'));
    this.musicPhases.push(this.sound.add('stage6Music'));
    this.musicPhases.push(this.sound.add('stage7Music'));
    this.musicPhases.push(this.sound.add('stage8Music'));

    this.startMenuMusic.play();
    this.startMenuMusic.setLoop(true);

    //Creación del mapa
    this.CreateMap();

    this.player = { hp: 20, gold: 0 };

    //Modificación de la cámara principal para ajustarse al nuevo mapa
    this.camera = this.cameras.main;
    this.camera.setViewport(0, 0, 1982, 1984);
    this.CreatePaths();
    //let wD = this.cache.json.get('waveData');

    //Pooling de enemigos
    this.ActiveTowers = this.add.group();
    this.EnemyPool = this.add.group();
    this.ActiveEnemies = this.physics.add.group();
    this.ActiveEnemies.runChildUpdate = true;
    this.BulletPool = this.add.group();
    this.ActiveBullets = this.physics.add.group();
    this.physics.add.overlap(this.ActiveBullets, this.ActiveEnemies, (bullet, enemy) => bullet.hitEnemy(enemy));
    this.aoeBulletPool = this.add.group();
    this.activeAoeBullets = this.physics.add.group();
    this.physics.add.overlap(this.activeAoeBullets, this.ActiveEnemies, (bullet, enemy) => bullet.hitEnemy(enemy));
    this.pointer = this.input.activePointer;
    this.button = new RotationButton(this, 'rotationButton', 0, WIN_HEIGTH, 1000);

    //input
    this.w = this.input.keyboard.addKey('W');
    this.d = this.input.keyboard.addKey('D');
    this.b = this.input.keyboard.addKey('B');
    this.e = this.input.keyboard.addKey('E');
    this.q = this.input.keyboard.addKey('Q');
    this.s = this.input.keyboard.addKey('S');

    this._HUD = new HUD(this, WIN_WIDTH, WIN_HEIGTH);
    this._startButton = new Phaser.GameObjects.Image(this, WIN_WIDTH / 2, WIN_HEIGTH / 2, 'startButton');
    this._startButton.setInteractive();
    self =  this;
    this._startButton.on('pointerup',() => {
      this.startMenuMusic.stop();
      this.currentWaveMusic = this.musicPhases[0];
      this.currentWaveMusic.play();
      this.currentWaveMusic.setLoop(true);

      self._Spawner = new Spawner(this, { x: 0, y: 50 });
      self._startButton.destroy();
      self.player.gold = BASEGOLD;
      self._HUD.updateGold(this.player.gold);
    })
    this.add.existing(this._startButton);
  }

  switchWaveMusic(){
    console.log(this.waveMusicCount);
    this.waveMusicCount++;
    this.currentWaveMusic.stop();
    this.currentWaveMusic = this.musicPhases[this.waveMusicCount];
    this.currentWaveMusic.play();
    this.currentWaveMusic.setLoop(true);
  }

  update(time, delta) {
    if (Phaser.Input.Keyboard.JustDown(this.e)) {
      this.ActiveTowers.getChildren().forEach(tower => {
        tower.rotateRight();
      })
    } if (Phaser.Input.Keyboard.JustDown(this.q)) {
      this.rotateAllTowers();
    }
    if (Phaser.Input.Keyboard.JustDown(this.s)) {

    }
    if (Phaser.Input.Keyboard.JustDown(this.w)) {
      this.SpawnEnemy(elements.FIRE, 20, 20)
    }
    if (Phaser.Input.Keyboard.JustDown(this.b)) {
      this.SpawnBullet(3 / 2 * Math.PI, 50, 250);
    }
    if (Phaser.Input.Keyboard.JustDown(this.d)) {
      if (this.ActiveEnemies.getLength() > 0) {
        let target = this.ActiveEnemies.getFirstAlive();
        target.ReceiveDMG(100, elements.FIRE);
      }
    }
    if (this.pointer.middleButtonDown()) {
      if (this.towers.getTileAtWorldXY(this.pointer.x, this.pointer.y) != null) {
        this.towers.removeTileAtWorldXY(this.pointer.x, this.pointer.y, true);
      }
    }
    this.ActiveEnemies.getChildren().forEach(enem => {
      enem.update(delta);
    });
    this.ActiveTowers.getChildren().forEach(tow => {
      tow.update(time, delta);
    });
    this.ActiveBullets.getChildren().forEach(bullet => {
      bullet.update(delta);
    });
    if (this._Spawner !== undefined) {
      this._Spawner.update(time, delta);
    }

    if(this._won)
      this.scene.start('winGame');

  }
}
