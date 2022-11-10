var GRID; //THIS IS THE GRID SINGLETON


//--------------------------------------------------------------//

//TileState Enum
class TileState {
    static Empty = new TileState("Empty");
    static Wall = new TileState("Wall");
    static Finder = new TileState("Finder");
    static Flag = new TileState("Flag");

    constructor(name) {
        this.name = name;
    }

    toString() {
        return `${this.name}`;
    }
}

function posToString(pos) {
    return pos.x+","+pos.y;
}

class Tile {
    #x;
    #y;
    #element;
    #state;

    constructor(x, y) {
        this.#x = x;
        this.#y = y;
        this.#state = TileState.Empty;

        this.#element = $("<div></div>").attr("tag",x+","+y).addClass("tile");
        this.#element.css("top", (5*y)+"%").css("left", (5*x)+"%");
        this.#element.appendTo($("#grid"));

        //Bind hovering to events
        this.#element.mouseover(function() {
            $(document).trigger("pathfinder:tileHover", [x, y]);
        });
        this.#element.mouseleave(function() {
            $(document).trigger("pathfinder:tileHoverStop", [x, y]);
        });
    }


    getState() {
        return this.#state;
    }

    setState(newTileState) {
        //remove every class
        this.#element.removeClass("finder").removeClass("flag").removeClass("wall");
        if (newTileState == TileState.Wall) {
            this.#element.addClass("wall");
        } else if (newTileState == TileState.Finder) {
            this.#element.addClass("finder");
        } else if (newTileState == TileState.Flag) {
            this.#element.addClass("flag");
        }

        //change state
        this.#state = newTileState
    }

    setVisibility(isVisible) {
        if (isVisible) {
            this.#element.removeClass("invisible");
        } else {
            this.#element.addClass("invisible");
        }
    }

    setAsPathTile() {
        this.#element.addClass("pathTile");
    }

}




//-- Pathfinding --//
class PathTile {
    #x;
    #y;
    #from; //{x, y}
    #tilesTraversed;

    constructor(x, y, pathTileFrom) {
        this.#x = x;
        this.#y = y;

        if (pathTileFrom != null) {
            this.#from = pathTileFrom;
            this.#tilesTraversed = this.#from.getTilesTraversed+1;
        } else {
            this.#from = null;
            this.#tilesTraversed = 0;
        }
    }

    getTilesTraversed() {
        return this.#tilesTraversed;
    }

}

const neighborOffsets = [
    {x: -1, y: 0},
    {x: 0, y: 1},
    {x: 1, y: 0},
    {x: 0, y: -1}
];

class AbstractPath {
    constructor(gridInstance) {
        if (this.constructor == AbstractPath) {
            throw new Error("Unable to instantiate object of an abstract class.");
        }
    }
    getTimeline() {
        throw new Error("Unable to call abstract method without implementation.");
        /*
        This method should return an array of every step the pathfinding algorithm
        takes. Each entry is a dictionary...
        */
    }
    getTiles() {
        throw new Error("Unable to call abstract method without implementation.");
        /*
        This method should return an array of every tile on the actual path
        */
    }
}

class AStarPath extends AbstractPath {
    #shortestPath;

    constructor(gridInstance) {
        super(gridInstance);

        var finish = gridInstance.getFlagPos();
        var start = gridInstance.getFinderPos()

        var cameFrom = {};

        var tilesFromStart = {};
        tilesFromStart[posToString(start)] = 0;

        var estimatedDistToFinish = {};
        estimatedDistToFinish[posToString(start)] = this.getSquareDistToFinish(start, finish);

        var openSet = new PriorityQueue();
        openSet.enqueue(start, estimatedDistToFinish[posToString(start)]);

        while (openSet.length() > 0) {
            var currentTile = openSet.dequeue();
            if (currentTile.x == finish.x && currentTile.y == finish.y) {
                break 
            }

            for (var i = 0; i < 4; i++) {
                var offset = neighborOffsets[i];
                var neighbor = {x: currentTile.x+offset.x, y: currentTile.y+offset.y};
                if ((neighbor.x >= 0 && neighbor.x < 20 && neighbor.y >= 0 && neighbor.y < 20)
                && (gridInstance.getTileState(neighbor.x, neighbor.y) !== TileState.Wall)
                && (!(posToString(neighbor) in tilesFromStart) || tilesFromStart[posToString(neighbor)] > tilesFromStart[posToString(currentTile)]+1)) {
                    cameFrom[posToString(neighbor)] = currentTile;
                    tilesFromStart[posToString(neighbor)] = tilesFromStart[posToString(currentTile)]+1;
                    estimatedDistToFinish[posToString(neighbor)] = tilesFromStart[posToString(neighbor)]+this.getSquareDistToFinish(neighbor, finish);
                    if (!openSet.contains(neighbor)) {
                        openSet.enqueue(neighbor, estimatedDistToFinish[posToString(neighbor)])
                    }
                }
            }
        }

        //Path from start to finish
        if (cameFrom.length == 0) {
            this.#shortestPath = [start];
        } else {
            this.#shortestPath = [finish];
            var currentTile = finish;
            while (currentTile.x != start.x || currentTile.y != start.y) {
                var posString = posToString(currentTile)
                if (posString in cameFrom) {
                    this.#shortestPath.unshift(cameFrom[posString]);
                    currentTile = cameFrom[posString];
                } else {
                    break
                }
            }
        }
    }

    getSquareDistToFinish(tile, finish) {
        return (tile.x-finish.x)^2 + (tile.y-finish.y)^2
    }

    getTiles() {
        return this.#shortestPath;
    }

}




//Grid singleton class
class _GridClass {
    #tiles;
    #finderPos;
    #flagPos;

    constructor() {
        if (_GridClass._instance) {
            throw new Error("Singleton already instantiated!");
        }
        _GridClass._instance = this;

        //Setup grid tiles
        this.#tiles = new Array(20);
        for (let x = 0; x<20; x++) {
            this.#tiles[x] = new Array(20)
            for (let y = 0; y<20; y++) {
                this.#tiles[x][y] = new Tile(x, y, $(".grid"));
            }
        }

        //Create finder and flag
        this.#finderPos = {x: 0, y: 0};
        this.#tiles[0][0].setState(TileState.Finder);
        this.#flagPos = {x: 19, y: 19}
        this.#tiles[19][19].setState(TileState.Flag);

        //Pathfind at beginning
        this.reroutePath();
    }
    


    //Tile interactions
    setTileState(x, y, newState) {
        this.#tiles[x][y].setState(newState);

        //If finder or flag was set, then remove the old ones
        if (newState == TileState.Finder) {
            this.#tiles[this.#finderPos.x][this.#finderPos.y].setState(TileState.Empty);
            this.#finderPos = {x: x, y: y};
        } else if (newState == TileState.Flag) {
            this.#tiles[this.#flagPos.x][this.#flagPos.y].setState(TileState.Empty);
            this.#flagPos = {x: x, y: y};
        }

        this.reroutePath();
    }

    getTileState(x, y) {
        return this.#tiles[x][y].getState();
    }

    setTileVisibility(x, y, isVisible) {
        this.#tiles[x][y].setVisibility(isVisible);
    }

    getFinderPos() {
        return {x: this.#finderPos.x, y: this.#finderPos.y};
    }
    getFlagPos() {
        return {x: this.#flagPos.x, y: this.#flagPos.y};
    }

    //Pathfinding
    reroutePath() {
        //Remove all previous path tiles
        $(".pathTile").removeClass("pathTile");
        //Make new path
        var path = new AStarPath(this);
        var pathTiles = path.getTiles();
        for (var i = 0; i < pathTiles.length; i++) {
            var t = pathTiles[i];
            this.#tiles[t.x][t.y].setAsPathTile();
        }
    }
}



$(document).ready(function() {
    //Create and initialize the singleton
    GRID = new _GridClass();
})