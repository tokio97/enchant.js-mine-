
// Start enchant.js
enchant();
window.focus();
window.onload = function() {
    // Starting point
    var game = new Game(320, 440);
    game.preload('res/BG.png',
                 'res/penguinSheet.png',
                 'res/Ice.png',
                 'res/bgm.mp3',
                 'res/Hit.mp3',
                 'res/Eat.mp3');
    game.fps = 24;  //30;
    game.scale = 1;
    game.onload = function() {

        
        var scene = new SceneGame();
        game.pushScene(scene);
    }
    window.scrollTo(0,0);
    game.start();   
};

/**
 * SceneGame  
 */
var SceneGame = Class.create(Scene, {
    /**
     * The main gameplay scene.     
     */
    initialize: function() {
        var game, label, bg, penguin, iceGroup;
 
        // Call superclass constructor
        Scene.apply(this);
 
        // Access to the game singleton instance
        game = Game.instance;
 
        label = new Label('SCORE<br>0');
        label.x = 9;
        label.y = 32;        
        label.color = 'white';
        label.font = '16px strong';
        label.textAlign = 'center';
        label._style.textShadow ="-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black";
        this.scoreLabel = label;        
 
        bg = new Sprite(460, 1000);
        bg.image = game.assets['res/BG.png'];
        bg.y = -400;

        bg.tl.moveBy(0, 400, 300)
            .moveBy(0, -400, 0)
            .loop();

        penguin = new Penguin();
        penguin.x = game.width/2 - penguin.width/2;
        penguin.y = 280;
        this.penguin = penguin;

        iceGroup = new Group();
        this.iceGroup = iceGroup;
 
        this.addChild(bg);
        this.addChild(iceGroup);
        this.addChild(penguin);
        this.addChild(label);

        this.addEventListener(Event.TOUCH_START,this.handleTouchControl);
        this.addEventListener(Event.ENTER_FRAME,this.update);

        // Instance variables
        this.generateIceTimer = 0;
        this.scoreTimer = 0;
        this.score = 0;

        this.bgm = game.assets['res/bgm.mp3']; // Add this line

        this.bgm.play();
    },

    handleTouchControl: function (evt) {
        var laneWidth, lane;
        laneWidth = 320/3;
        lane = Math.floor(evt.x/laneWidth);
        lane = Math.max(Math.min(2,lane),0);
        this.penguin.switchToLaneNumber(lane);
    },

    update: function(evt) {
        // Score increase as time pass
        this.scoreTimer += evt.elapsed * 0.001;
        if(this.scoreTimer >= 0.5)
        {
            this.setScore(this.score + 1);
            this.scoreTimer -= 0.5;
        }

        // Check if it's time to create a new set of obstacles
        this.generateIceTimer += evt.elapsed * 0.001;
        if(this.generateIceTimer >= 0.5)
        {
            var ice;
            this.generateIceTimer -= 0.5;
            ice = new Ice(Math.floor(Math.random()*3));
            this.iceGroup.addChild(ice);
        }

        // Check collision
        for (var i = this.iceGroup.childNodes.length - 1; i >= 0; i--) {
            var ice;
            ice = this.iceGroup.childNodes[i];
            if(ice.intersect(this.penguin)){  
                var game;
                game = Game.instance;
                game.assets['res/Hit.mp3'].play();                  
                this.iceGroup.removeChild(ice);
                game.replaceScene(new SceneGameOver(this.score));        
                break;
            }
        }

        // Loop BGM
        if( this.bgm.currentTime >= this.bgm.duration ){
           this.bgm.play();
        }
    },

    setScore: function (value) {
        this.score = value;
        this.scoreLabel.text = 'SCORE<br>' + this.score;
    },
    //onenterframe : function() {
        //game.assets['res/bgm.mp3'].play();

    //}
});

/**
 * Penguin
 */
 var Penguin = Class.create(Sprite, {
    /**
     * The player character.     
     */
    initialize: function() {
        // Call superclass constructor
        Sprite.apply(this,[30, 43]);
        this.image = Game.instance.assets['res/penguinSheet.png'];        
        this.animationDuration = 0;
        this.addEventListener(Event.ENTER_FRAME, this.updateAnimation);
    },

    updateAnimation: function (evt) {        
        this.animationDuration += evt.elapsed * 0.001;       
        if(this.animationDuration >= 0.25)
        {
            this.frame = (this.frame + 1) % 2;
            this.animationDuration -= 0.25;
        }
    },

    switchToLaneNumber: function(lane){     
        var targetX = 160 - this.width/2 + (lane-1)*90;
        this.x = targetX;
    }
});

 /**
 * Ice Cube
 */
var Ice = Class.create(Sprite, {
    /**
     * The obstacle that the penguin must avoid
     */
    initialize: function(lane) {
        // Call superclass constructor
        Sprite.apply(this,[48, 49]);
        this.image  = Game.instance.assets['res/Ice.png'];      
        this.rotationSpeed = 0;
        this.setLane(lane);
        this.addEventListener(Event.ENTER_FRAME, this.update);
    },

    setLane: function(lane) {
        var game, distance;
        game = Game.instance;        
        distance = 90;
     
        this.rotationSpeed = Math.random() * 100 - 50;
     
        this.x = game.width/2 - this.width/2 + (lane - 1) * distance;
        this.y = -this.height;    
        this.rotation = Math.floor( Math.random() * 360 );    
    },

    update: function(evt) { 
        var ySpeed, game;
     
        game = Game.instance;
        ySpeed = 300;
     
        this.y += ySpeed * evt.elapsed * 0.001;
        this.rotation += this.rotationSpeed * evt.elapsed * 0.001;           
        if(this.y > game.height)
        {
            this.parentNode.removeChild(this);          
        }
    }
});

/**
 * SceneGameOver  
 */
var SceneGameOver = Class.create(Scene, {
    initialize: function(score) {
        var gameOverLabel, scoreLabel;
        Scene.apply(this);
        this.backgroundColor = 'black';

        gameOverLabel = new Label("GAME OVER<br>");
        gameOverLabel.x = 15;
        gameOverLabel.y = 128;
        gameOverLabel.color = 'white';
        gameOverLabel.font = '32px strong';
        gameOverLabel.textAlign = 'center';

        scoreLabel = new Label('SCORE<br>' + score);
        scoreLabel.x = 9;
        scoreLabel.y = 32;        
        scoreLabel.color = 'white';
        scoreLabel.font = '16px strong';
        scoreLabel.textAlign = 'center';

        var btn2 = new Button("Restart", "light");
        btn2.x = 75;
        btn2.y = 250;
        btn2.opacity = 0.5;
        btn2.width = 50;
        btn2.addEventListener(Event.TOUCH_START, this.touchToRestart);
        this.addChild(btn2);

        var btn4 = new Button("Twitter", "light");
        btn4.x = 185;
        btn4.y = 250;
        btn4.opacity = 0.5;
        btn4.width = 50;
        btn4.addEventListener('touchstart', function() {
            var EUC = encodeURIComponent;
            var Twitter_url = "http://twitter.com/?status=";//, "_newtab";
            var message = "You scored " + score + " points in Deep Sea Swimming Mini Game. #deepseaswimming";
            //Move to Twitter
            location.href = Twitter_url + EUC(message);
        });
        this.addChild(btn4);

        this.addChild(gameOverLabel);
        this.addChild(scoreLabel);
    },

    touchToRestart:function(evt) {
        var game = Game.instance;
        game.replaceScene(new SceneGame());
    }
});