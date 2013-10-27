(function () {
    // Utility functions. Because am smart.
    function weld (object, properties) {
        var newObject = function () { this.init.apply(this, arguments); };
        newObject.prototype = object.prototype;
        newObject.constructor = object;

        forEach(properties, function(prop, name) {
            if (properties.hasOwnProperty(name)) {
                newObject.prototype[name] = prop;
            }
        });

        return newObject;
    }

    function extend (original, properties) {
        var result = {};

        forEach(original, function(prop, name) {
            if (original.hasOwnProperty(name)) {
                result[name] = prop;
            }
        });

        forEach(properties, function(prop, name) {
            if (original.hasOwnProperty(name)) {
                result[name] = prop;
            }
        });

        return result;
    }

    function forEach (objects, func) {
        for (var i in objects) {
            func(objects[i], i);
        }
    }

    function bind (func, context) {
        return function () {
            func.apply(context, arguments);
        };
    }

    // Lets play a Game...
    function Game (canvas, window) {
        this.events = new Events();
        this.world = new World(canvas, new Point(800, 600));
        this.window = window;
        this.player = new Bug(this);

        this.entities.push(this.player);

        this.events.set('onkeyup', this.keyup, this.events);

        this.player.listenTo('onload', bind(this.start, this));
        this.world.listenTo('turn', bind(this.round, this));

        this.window.onkeydown = this.events.get('onkeyup');
    }

    // Yeah, JS is pretty damn weird...
    Game.prototype.state = 0;
    Game.prototype.world = null;
    Game.prototype.player = null;
    Game.prototype.entities = [];
    Game.prototype.moves = [];
    Game.prototype.history = [];
    Game.prototype.window = {};
    Game.prototype.start = function (e) { 
        this.render();
    };
    Game.prototype.render = function (e) {
        var self = this;
        forEach(this.entities, function (entity) {
            //self.world.stage.rotate(entity.angle*Math.PI/180);
            //self.world.stage.translate(entity.position.x, entity.position.y);
            self.world.stage.drawImage(entity.getImage(), 0, 0);
        });
    };
    Game.prototype.round = function (e) {
        var self = this;

        if (this.moves.length === 0) {
            return;
        }

        this.moves.reverse();
        forEach(this.moves, function(move) {
            self.world.clear();
            self.history.push( new move() );
        });

        this.moves = [];
        this.render();
    };
    Game.prototype.keyup = function (e) {
        e.preventDefault();
        this.trigger('keyup', { data: e });
    };
    Game.prototype.end = function () {};
    Game.prototype.win = function () {};
    Game.prototype.lose = function () {};
    Game.prototype.restart = function () {};
    Game.prototype.move = function () {
        var move = MoveFactory.build.apply(MoveFactory, arguments);
        this.moves.push( move );
    };

    // "A Brave new World"
    function World () {}
    World.prototype.init = function (canvas, size) {
        this.size = size;
        this.canvas = canvas;
        this.stage = canvas.getContext('2d');
        this.timer = setInterval(bind(this.turn, this), this.speed);

        this.canvas.width = this.size.x;
        this.canvas.height = this.size.y;
    };
    World.prototype.size = [];
    World.prototype.timer = 0;
    World.prototype.time = 0;
    World.prototype.speed = 10;  
    World.prototype.events = {};
    World.prototype.entities = [];
    World.prototype.queue = [];
    World.prototype.canvas = null;
    World.prototype.turn = function () {
        this.time += this.speed;
        this.trigger('turn', { target: this, data: { time: this.time }});
    };
    World.prototype.clear = function () {
        this.stage.clearRect(0, 0, this.size.x, this.size.y);
    };


    // heehee don't tell my employers I'm writing my own
    // "event management" software. Seriously, don't.
    function Events () {}
    Events.prototype.init = function () {
    };
    Events.prototype.methods = {};
    Events.prototype.get = function (name) {
        if (!( name in this.methods )) {
            return function() { console.log("Event Method \"" + name + "\" does not exist!."); };
        }

        return this.methods[name];
    };

    Events.prototype.set = function (name, method, context) {
        if (context) {
            method = bind(method, context);
        }
        this.methods[name] = method;
    };

    // Leaving functions empty like this "bugs" me. Get it? GET IT?!
    // I'm sorry...
    function Bug () {}

    Bug.prototype.position = null;
    Bug.prototype.angle = 0;
    Bug.prototype.sprites = [
        "images/bug.png"
    ];
    Bug.prototype.sprite = 0;
    Bug.prototype.init = function (game) {
        var self = this;
    
        self.game = game;
        self.events = new Events();
        self.events.set('left', this.moveLeft, this);
        self.events.set('right', this.moveRight, this);
        self.events.set('down', this.moveDown, this);
        self.events.set('up', this.moveUp, this);

        self.position = new Point(0,0);

        forEach(this.sprites, function (sprite, index) {
            self.sprites[index] = new Image();
            self.sprites[index].src = sprite;
        });

        this.sprites[0].onload = function () {
            self.trigger('onload', { target: self.sprites[0] });
        };

        game.events.listenTo('keyup', bind(this.dispatchKeys, this));
    };

    Bug.prototype.dispatchKeys = function (e) {
        this.events.get(e.data.keyIdentifier.toLowerCase())();
    };

    Bug.prototype.moveLeft = function (e) {
        this.game.move('MoveObject', this, new Point(-10, 0));
        //this.game.move('RotateObject', this, -90);
    };

    Bug.prototype.moveRight = function (e) {
        this.game.move('MoveObject', this, new Point(10, 0));
        //this.game.move('RotateObject', this, 90);
    };

    Bug.prototype.moveUp = function (e) {
        //this.game.move('RotateObject', this, 0);
        this.game.move('MoveObject', this, new Point(0, -10));
    };

    Bug.prototype.moveDown = function (e) {
        this.game.move('MoveObject', this, new Point(0, 10));
       //this.game.move('RotateObject', this, 180);
    };

    Bug.prototype.getImage = function (e) {
        return this.sprites[0];
    };


    // What's the point?
    // Again, I'm really sorry.
    function Point (x, y) {
        if (x !== undefined && y !== undefined) {
            this.x = x;
            this.y = y;
        }
        else {
            this.x = 0;
            this.y = 0;
        }
    }

    Point.prototype.delta = function (coords) {
        var x = thix.x - coords.x,
            y = this.y - coords.y;

        return new Point(x, y);
    };

    Point.prototype.set = function (coords) {
        this.x = coords.x;
        this.y = coords.y;
    };

    Point.prototype.append = function (coords) {
        this.set(this.add(coords));
    };

    Point.prototype.delta = function (coords) {
        var point = new Point();
        point.x = coords.x - this.x;
        point.y = coords.y - this.y;

        return point;
    };

    Point.prototype.add = function (coords) {
        var point = new Point(this.x, this.y);
        point.x += coords.x;
        point.y += coords.y;

        return point;
    };

    Point.prototype.toString = function () {
        return '(' + this.x + ',' + this.y + ')';
    };


    // The moves that can be queued together to manipulate objects
    // on the canvas/stage.
    var MoveFactory = {
        moveTypes: {},
        build: function (name) {
            var self = this,
                args = Array.prototype.slice.call(arguments, 1);
            return function() { 
                self.moveTypes[name].apply(this, args);
                console.log(name);
            };
        }
    };

    MoveFactory.moveTypes.MoveObject = function(object, coords) {
        var delta = new Point();
        if (object.position.x + coords.x < 0 || 
            object.position.y + coords.y < 0 || 
            object.game.world.size.x - 60 < object.position.x + coords.x ||            object.game.world.size.y - 74 < object.position.y + coords.y) {
            return;
        }
        delta = object.position.delta(object.position.add(coords));
        object.position.append(coords);
        object.game.world.stage.translate(delta.x, delta.y);
    };

    // This code doesn't seem to work quite yet. Will need to
    // expiriment with rotation in another project.
    MoveFactory.moveTypes.RotateObject = function(object, newAngle) {
        var angle = newAngle - object.angle;
        object.angle = newAngle;
        if ( angle !== 0 ) {
            object.game.world.stage.translate(object.game.world.size.x/2,object.game.world.size.y/2);
            object.game.world.stage.rotate(angle * Math.PI / 180);
        }
    };


    // Not to be confused with the supreme overseer.
    var Observer = {
        listeners: [],
        listenTo: function (event, callback) {
            this.listeners.push({ name: event, func: callback });
        },
        trigger: function (event, e, data) {
            e.context = this; 

            if (data !== undefined) {
                e.data = data;
            }

            forEach(this.listeners, function (listener) {
                if (listener.name == event) {
                    listener.func(e);    
                }
            });
        }
    };

    World = weld(World, Observer);
    Bug = weld(Bug, Observer);
    Events = weld(Events, Observer);

    // Lets expose that son-of-a-bitch for what it really is!
    window.Game = Game;
})();
