import Elemental from "./Elemental.js";

export default class Tower extends Elemental {

    constructor(scene, spriteKey, element, xPos, yPos, range, cdShoots, dmg, area, sellCost) {
        super(scene, spriteKey, element, xPos, yPos,element);
        let upscaleFactor = 4;
        this._scene = scene;
        this._cdShoots = cdShoots * 1000;
        this._nextShot = 0; //siempre puede disparar al ser creada
        this.lockedEnemy = null;
        this._dmg = dmg;
        this._areadmg = area;
        this._range = range;
        this._sellCost = sellCost;
        this.canRotate = false;
        this._timeToRotate = 5000;
        this._nextRotation = 0;
        //this._spriteName = spriteName;
        this.setOrigin(0.5, 0.5);
        this.scene.ActiveTowers.add(this);
        this.scene.physics.add.existing(this);
        this.body.setCircle(range/upscaleFactor, (32 - range)/upscaleFactor, (32 - range)/upscaleFactor);
        this.scene.physics.add.overlap(this, this.scene.ActiveEnemies, onCollision);
        this.createContainer();
        this.setScale(upscaleFactor);

        this.buildTowerSound = this.scene.sound.add('buyTowerSound');
        this.buildTowerSound.setVolume(2);
        this.buildTowerSound.play();
        this.rotateTowerSound = this.scene.sound.add('rotateTowerSound');
    }

    createContainer() {
        this.container = this.scene.add.container(this.x, this.y); //Crea el container. Es la hitbox para la acción
        this.container.setSize(64, 64); //Importante definir el tamaño del container antes del setInteractive()
        this.container.setInteractive();
        this.scene.add.existing(this); //Añade el icono a la escena
        this.container.on('pointerup', this.procesaInput, this); //Si el jugador hace click en el container, llama a addTower
    }

    procesaInput(pointer) {
        if (pointer.middleButtonReleased()) {
            this.scene.sound.add('sellTowerSound').play();
            this._scene.ActiveTowers.remove(this);
            this._scene.deleteTile(this.originX, this.originY);
            this.setActive(false);
            this.setVisible(false);
            this.lockedEnemy = null;
            this.destroy();
            this._scene.modifyGold(this._sellCost);
        }
        else if (this.canRotate){
            if (pointer.leftButtonReleased()) {
                this.rotateLeft();
                this.setFrame(this._elem);
                this.canRotate = false;
                this.resetTimer = true;
                this.rotateTowerSound.play();
            }
            else if (pointer.rightButtonReleased()) {
                this.rotateRight();
                this.setFrame(this._elem);         
                this.canRotate = false;
                this.resetTimer = true;
                this.rotateTowerSound.play();
            }
        }
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta)
        if (this.lockedEnemy != null){
            if (!this.scene.physics.collide(this, this.lockedEnemy)) this.looseTarget();
        }
        if (!this.canRotate && time >= this._nextRotation){
            this.canRotate = true;
            this._nextRotation = time + this._timeToRotate;
        }
        if (this.lockedEnemy != null && time >= this._nextShot) {
            let angle = Phaser.Math.Angle.Between(this.x, this.y, this.lockedEnemy.x, this.lockedEnemy.y);
            this._nextShot = time + this._cdShoots;        
            this.shoot(angle);
        }
    }
    rotateRight(){
        super.rotateRight();
        this.setFrame(this._elem);
    }
    rotateLeft(){
        super.rotateLeft();
        this.setFrame(this._elem);
    }

    shoot(angle) {
        if(!this._areadmg)
            this.scene.SpawnBullet(angle, this.x, this.y,this._dmg,this._elem);
        else
        {
            this.scene.SpawnAoeBullet(this.x, this.y, this._dmg, this._range,this._elem);
        }
    }

    looseTarget() { this.lockedEnemy = null; }
    getTarget() { return this.lockedEnemy }

}
function onCollision(obj1, obj2) {
    if (obj1.lockedEnemy == null) {
        obj1.lockedEnemy = obj2;
    }
}