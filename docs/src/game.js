import Elemental from "./Elemental.js";
import elements from "./enum.js";
import Tower from "./Tower.js"
import Enemy from "./Enemy.js";
import Bullet from "./Bullet.js"
import TowerIcon from "./TowerIcon.js";
import Pool from "./Pool.js";
import Spawner from "./Spawner.js";
import ShieldEnemy from "./ShieldEnemy.js"
import HUD from "./HUD.js"

const WIN_WIDTH = 1984, WIN_HEIGTH = 1984;

const towerData = {normal:{cost: 70,range:150,cadencia:0.5,dmg:40,area:false},
speedWagon:{cost: 50,range:225,cadencia:0.2,dmg:1000000000,area:false},
ratt:{cost: 100,range:300,cadencia:2,dmg:500,area:false}}; 

export default class Game extends Phaser.Scene {

  constructor() {
    super({ key: 'main' });
  }
  preload() {
    this.load.image('patronesTilemap', '/tilemaps/modded_colored.png');
    this.load.tilemapTiledJSON('tilemap', '/tilemaps/TD_TilemapBit.json');
    // this.load.json('waveData','./waves,json');  
    let jojoBG = this.load.image('jojoBG', '/img/thunderSplit.png');
    this.load.image('jojoSprite', '/img/favicon.png');
    this.load.image('towerIconSprite', '/img/towericon.png');
    this.load.image('hohoho', '/img/HowManyBreadsHaveYouEatenInYourLifetime.png');
    this.load.image('bulletSprite', '/img/rocketto.png');
    this.load.image('speedSprite', '/img/bullethellIcon.png');
    this.load.image('sniperSprite', '/img/sniperIcon.png');

    this.load.script('webfont', 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js');

  }
  PoolEnemies() {
    for (let i = 0; i < 10; i++) {
      let basicEnem = new Enemy(this, 'jojoSprite', elements.FIRE, 400, 400, 150, 20,0);
      this.EnemyPool.add(basicEnem);
      this.EnemyPool.killAndHide(basicEnem);
    }
  }
  PoolBullets() {
    for (let i = 0; i < 200; i++) {
      let bull = new Bullet(this, 50, 400, 90, 10, 100, elements.FIRE, 'bulletSprite');
      this.BulletPool.add(bull);
      this.BUlletPool.killAndHide(bull);
    }
  }
  SpawnEnemy(elem, x, y) {
    let en
    if (this.EnemyPool.getLength() > 0) {
      en = this.EnemyPool.getFirstDead();
      en.spawn(x, y);
    }
    else {
      en = new Enemy(this, 'jojoSprite', elements.FIRE, x, y, 400, 400,0);
    }
    this.ActiveEnemies.add(en);
  }
  SpawnShieldedEnemy(elem, x, y, shields) {
    this.ActiveEnemies.add(new ShieldEnemy(this, 'hohoho', elements.FIRE, x, y, 400, 20,1, shields))
  }
  SpawnBullet(angle, x, y,damage) {
    let b;
    if (this.BulletPool.getLength() > 0) {
      b = this.BulletPool.getFirstDead();
      b.setDmg(damage);
    }
    else {
      b = new Bullet(this, 50, 400, 90, 1, damage, elements.FIRE, 'bulletSprite');
    }
    b.fire(x, y, angle);
  }
  CreatePath() {

    this._routes = new Array();
    let graphics = this.add.graphics();
    //inicio
    this.path = this.add.path(-50, 400);
    this.path.lineTo(50, 400)
    //bif1
    this.path.lineTo(375, 550);
    //bifurcacion dcha
    this.path.lineTo(550,525);
    this.path.lineTo(850, 850);
    this.path.lineTo(875, 1100);
    //cruce
    this.path.lineTo(1100, 1175);
    //bifurcacion dcha
    this.path.lineTo(1450, 1500);
    this.path.lineTo(1650, 1500);
    this.path.lineTo(1775, 1075);
    this.path.lineTo(1850, 700);
    this._routes.push(this.path);

    //inicio
    var ruta2 =  this.add.path(-50, 400);
    ruta2.lineTo(50, 400);
    //bif1
    ruta2.lineTo(375, 550);
  //bifurcaion izq
  ruta2.lineTo(175,700);
    ruta2.lineTo(125,900);
    ruta2.lineTo(150,1250);
    ruta2.lineTo(225,1475);
    ruta2.lineTo(700,1475);
    ruta2.lineTo(750,1400);
    ruta2.lineTo(800,1400);
    //cruce
    ruta2.lineTo(1100, 1175);
    //bifurcacion dcha
    ruta2.lineTo(1450, 1500);
    ruta2.lineTo(1650, 1500);
    ruta2.lineTo(1775, 1075);
    ruta2.lineTo(1850, 700);
    
    this._routes.push(ruta2);

    graphics.lineStyle(3, 0xffffff, 1);
    // visualize the path
    this._routes[0].draw(graphics);
    graphics.lineStyle(3, 0xff0000,1);
    this._routes[1].draw(graphics);

    // this.paths = this.add.group();
  }
  getRoute(num) {
    if (num >= this._routes.length)
      return undefined
    else
      return this._routes[num];
  }
  OnEnemySlain(enemy) {
    this.ActiveEnemies.remove(enemy);
    this.EnemyPool.add(enemy);
    enemy.setActive(false);
    enemy.setVisible(false);
    this.EarnGold(enemy);
    this.ActiveTowers.getChildren().forEach(tow => {
      if (tow.getTarget() === enemy)
        tow.looseTarget();
    });
  }
  OnEnemyAttack(enemy) {
    this.player.hp--;
    //actualizar el hud
    //comprobar la moridira
  }
  EarnGold(enemy) {
    //primero comprobaremos las subclases cuando las implementemos y enemigo por descarte
    let gain;
    if (enemy instanceof ShieldEnemy) {
      gain = 20;
    }
    else{
      gain = 10;
    }
    this.player.gold += gain;
    this._HUD.updateGold(this.player.gold);
    console.log(this.player.gold)
  }
  addTower(pointer, target) {
    this._canAdd = true;
    this.dragObj = this.scene.add.image(64, 64, 'towerIconSprite'); //El objeto que arrastramos es un sprite
    //Activamos listeners para detectar la posicion del raton y cuando lo soltamos
    this.scene.input.on('pointermove', this.Drag, this);
    this.scene.input.on('pointerup', this.stopDrag, this);

}

  CreateTowerIcons(){
    let iconOffset = 20; //px
    let w = WIN_WIDTH * 0.95;
    let h = WIN_HEIGTH * 0.95;
    this._normalIcon = new TowerIcon(this, 'towerIconSprite', WIN_WIDTH * 0.95, WIN_HEIGTH * 0.95,3,towerData.normal);
    this._speedIcon = new TowerIcon(this, 'speedSprite', (WIN_WIDTH * 0.85), (WIN_HEIGTH * 0.95),3,towerData.speedWagon);
    this._sniperIcon = new TowerIcon(this, 'sniperSprite', (WIN_WIDTH * 0.80), WIN_HEIGTH * 0.95,3,towerData.ratt);

  }

  deleteTile(xPos, yPos){
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
    this._bgMap = this.map.createStaticLayer('Background',this.tileset,0,0).setScale(4);
    this._hud =this.map.createStaticLayer('HUD',this.tileset,0,0).setScale(4);  
    this._nodes = this.map.createStaticLayer('Nodes', this.tileset, 0, 0).setScale(4);
    this.towers = this.map.createDynamicLayer('Towers', this.tileset, 0, 0).setScale(4);
    this._default = this.map.createStaticLayer('Default', this.tileset, 0, 0).setScale(4);
    this.can_place_towers = this.map.createStaticLayer('Can_place_towers', this.tileset, 0, 0).setScale(4);
  }
  CreateHUD(){
    let self = this;
    WebFont.load({
      google: {
          families: [ 'Freckle Face', 'Finger Paint', 'VT323' ]
      },
      active: function () // se llama a esta función cuando está cargada
      {
          let nuevoTexto = 
              self.add.text(900, WIN_HEIGTH-200, 
                  'g', 
                  { fontFamily: 'VT323', fontSize: 90, color: '#ffffff' })
          nuevoTexto.setShadow(2, 2, "#FFD700", 2, false, true);
      }
  });
  }
  create() {
    //Creación del mapa
    this.CreateMap();


    this.player = { hp: 20, gold: 0 };

    //Modificación de la cámara principal para ajustarse al nuevo mapa
    this.camera = this.cameras.main;
    this.camera.setViewport(0, 0, 1982, 1984);
    
    this.CreateTowerIcons();
    
    this.CreatePath();
    //let wD = this.cache.json.get('waveData');

    //Pooling de enemigos
    this.ActiveTowers = this.add.group();
    this.EnemyPool = this.add.group();
    this.ActiveEnemies = this.physics.add.group();
    this.ActiveEnemies.runChildUpdate = true;
    this.PoolEnemies();
    //this.EnemyPool.killAndHide(this.EnemyPool.getFirstAlive());
    this.BulletPool = this.add.group();
    this.ActiveBullets = this.physics.add.group();
    // function bulletHitEnemy(bullet, enemy) {
    //   bullet.hitEnemy(enemy);
    // }
    // this.physics.add.overlap(this.ActiveBullets,this.ActiveEnemies,bulletHitEnemy);
    this.physics.add.overlap(this.ActiveBullets, this.ActiveEnemies, (bullet, enemy) => bullet.hitEnemy(enemy));
    this.pointer = this.input.activePointer;



    //input
    this.w = this.input.keyboard.addKey('W');
    this.d = this.input.keyboard.addKey('D');
    this.b = this.input.keyboard.addKey('B');
    this.e = this.input.keyboard.addKey('E');
    this.q = this.input.keyboard.addKey('Q');

    this._HUD = new HUD(this,WIN_WIDTH,WIN_HEIGTH);
    this._Spawner = new Spawner(this, { x: 0, y: 50 });
  }

  update(time, delta) {
    if (Phaser.Input.Keyboard.JustDown(this.e)) {
      this.ActiveTowers.getChildren().forEach(tower => { tower.rotateRight() })
    } if (Phaser.Input.Keyboard.JustDown(this.q)) {
      this.ActiveTowers.getChildren().forEach(tower => { tower.rotateLeft() })
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
    this._Spawner.update(time, delta);
  }
}
