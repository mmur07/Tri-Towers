    import Tower from "./Tower.js"
import Game from "./game.js";

export default class TowerIcon extends Phaser.GameObjects.Image {

    constructor(scene, spritename, xPos, yPos,size,towerData,spriteKey) {
        super(scene, xPos, yPos, spritename)
        this.actionSound = this.scene.sound.add('selectButtonSound');
        this._spriteDrag = spritename;
        this._spriteKey = spriteKey;
        this.originX = xPos;
        this.originY = yPos;
        this.inputEnabled = true;
        this._canAdd = false;
        this._tD = towerData;

        this.container = this.scene.add.container(this.originX, this.originY); //Crea el container. Es la hitbox para la acción
        this.container.setSize(32*size, 32*size); //Importante definir el tamaño del container antes del setInteractive()
        this.container.setInteractive();
        this.scene.add.existing(this); //Añade el icono a la escena
        this.container.on('pointerdown', this.addTower, this); //Si el jugador hace click en el container, llama a addTower

        this.sample_Tile = this.scene.towers.getTileAt(30, 30);
        this.setScale(size);
    }


    //Seleccionamos el objeto a mover y activamos los nuevos listeners
    addTower(pointer, target) {
        this.actionSound.play();
        this._canAdd = true;
        this.dragObj = this.scene.add.image(64, 64, this._spriteDrag); //El objeto que arrastramos es un sprite
        this.dragObj.setScale(3);
        //Activamos listeners para detectar la posicion del raton y cuando lo soltamos
        this.scene.input.on('pointermove', this.Drag, this);
        this.scene.input.on('pointerup', this.stopDrag, this);

    }
    //arrastra el icono
    Drag(pointer) {
        this.dragObj.x = pointer.x;
        this.dragObj.y = pointer.y;
    }

    stopDrag(pointer) {
        let tile_canAdd = this.scene.can_place_towers.getTileAtWorldXY(pointer.x, pointer.y);
        let tile_towers = this.scene.towers.getTileAtWorldXY(pointer.x, pointer.y);
        if (tile_canAdd != null && tile_towers == null && this.scene.getCurrentGold() >= this._tD.cost) {//si la posición es válida
            this.scene.towers.putTileAtWorldXY(this.sample_Tile, pointer.x, pointer.y);
            let t = new Tower(this.scene,this._spriteKey, Math.round(Math.random() * 3) , tile_canAdd.getCenterX(), tile_canAdd.getCenterY(), this._tD.range, this._tD.cadencia,this._tD.dmg, this._tD.area, Math.round(this._tD.cost / 2));
            this.scene.ActiveTowers.add(t); 
            this.scene.modifyGold(-this._tD.cost);
        }
        //volvemos al estado inicial
        this.scene.input.off('pointermove', this.Drag, this);
        this.scene.input.off('pointerup', this.stopDrag, this);
        this.dragObj.destroy();
    }
}