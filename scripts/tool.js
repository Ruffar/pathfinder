var TOOL; //THIS IS THE TOOL SINGLETON



//-------------------------------------------------------//

//ToolState Enum
class ToolState {
    static Grab = new ToolState("Grab");
    static Draw = new ToolState("Draw");
    static Erase = new ToolState("Erase");

    constructor(name) {
        this.name = name;
    }

    toString() {
        return `${this.name}`;
    }
}

//-- Individual tool state handler classes --//
class AbstractToolHandler {
    constructor() {
        if (this.constructor == AbstractToolHandler) {
            throw new Error("Unable to instantiate object of an abstract class.");
        }
    }
    enable() {
        throw new Error("Unable to call abstract method without implementation.");
    }
    disable() {
        throw new Error("Unable to call abstract method without implementation.");
    }
    tileClick(x, y) {
        throw new Error("Unable to call abstract method without implementation.");
    }
    tileHover(x, y, isMouseDown) {
        throw new Error("Unable to call abstract method without implementation.");
    }
    tileHoverStop(x, y) {
        throw new Error("Unable to call abstract method without implementation.");
    }
}

class GrabToolHandler extends AbstractToolHandler {
    #grabbingFrom;
    #cursorElement;
    
    constructor() {
        super();
        this.#grabbingFrom = null; //The tile position that we're grabbing from
        //null if grabbing nothing
        this.#cursorElement = null; //The element that sticks to cursor when grabbing
    }

    enable() {

    }
    disable() {
        this.#grabbingFrom = null;
        this.#cursorElement = null;
    }


    startGrab(x, y) {
        var tileState = GRID.getTileState(x, y);

        if (tileState == TileState.Finder || tileState == TileState.Flag) {
            this.#grabbingFrom = {x: x, y: y};

            //Create element that follows cursor
            this.#cursorElement = $("<div></div>").attr("id","cursor").appendTo($("body"));
            if (tileState == TileState.Finder) {
                this.#cursorElement.addClass("finder");
            } else {
                this.#cursorElement.addClass("flag");
            }

            //Make element follow cursor
            $("#cursor").css("left", (event.pageX-$("#cursor").width()/2) +"px").css("top", (event.pageY-$("#cursor").height()/2) +"px"); //Set initial position
            $(document).bind("mousemove.GrabCursor", function(event){
                //console.log($("#cursor"));
                $("#cursor").css("left", (event.pageX-$("#cursor").width()/2) +"px").css("top", (event.pageY-$("#cursor").height()/2) +"px");
            });

            //Make grabbed tile invisible
            GRID.setTileVisibility(x, y, false);
        }
    }

    stopGrab(x, y) {
        if (this.#grabbingFrom != null) {

            var canPlaceAtTile = GRID.getTileState(x, y) == TileState.Empty;
            var isInitialTile = x == this.#grabbingFrom.x && y == this.#grabbingFrom.y;

            if (canPlaceAtTile || isInitialTile) {

                if (canPlaceAtTile) {
                    GRID.setTileState(x, y, GRID.getTileState(this.#grabbingFrom.x, this.#grabbingFrom.y));
                }
                //GRID also empties the previous tile

                
                GRID.setTileVisibility(this.#grabbingFrom.x, this.#grabbingFrom.y, true);
                
                $(document).unbind("mousemove.GrabCursor")
                
                this.#cursorElement.remove();
                this.#cursorElement = null;

                this.#grabbingFrom = null;
            }
        }
    }


    tileClick(x, y) {
        if (this.#grabbingFrom == null) {
            this.startGrab(x, y);
        } else {
            this.stopGrab(x, y);
        }
    }

    tileHover(x, y, isMouseDown) {
        
    }

    tileHoverStop(x, y) {

    }
}


class DrawToolHandler extends AbstractToolHandler {
    
    constructor() {
        super();
    }

    enable() {

    }
    disable() {
    }

    tileClick(x, y) {
        var tileState = GRID.getTileState(x, y);
        if (tileState == TileState.Empty) {
            GRID.setTileState(x, y, TileState.Wall);
        }
    }

    tileHover(x, y, isMouseDown) {
        if (isMouseDown) {
            var tileState = GRID.getTileState(x, y);
            if (tileState == TileState.Empty) {
                GRID.setTileState(x, y, TileState.Wall);
            }
        }
    }

    tileHoverStop(x, y) {
        
    }
}


class EraseToolHandler extends AbstractToolHandler {
    
    constructor() {
        super();
    }

    enable() {

    }
    disable() {
    }

    tileClick(x, y) {
        var tileState = GRID.getTileState(x, y);
        if (tileState == TileState.Wall) {
            GRID.setTileState(x, y, TileState.Empty);
        }
    }

    tileHover(x, y, isMouseDown) {
        if (isMouseDown) {
            var tileState = GRID.getTileState(x, y);
            if (tileState == TileState.Wall) {
                GRID.setTileState(x, y, TileState.Empty);
            }
        }
    }

    tileHoverStop(x, y) {
        
    }
}



//Tool singleton class (manages how user interacts with app)
class _ToolClass {
    #state;
    #toolStateHandlers;

    #hoveredTile;
    #isMouseDown;

    constructor() {
        if (_ToolClass._instance) {
            throw new Error("Singleton already instantiated!");
        }
        _ToolClass._instance = this;

        //-- Create tool state handlers --//
        this.#toolStateHandlers = {};
        this.#toolStateHandlers[ToolState.Grab] = new GrabToolHandler(),
        this.#toolStateHandlers[ToolState.Draw] = new DrawToolHandler(),
        this.#toolStateHandlers[ToolState.Erase] = new EraseToolHandler(),

        //Set initial state
        this.changeToolState(ToolState.Grab);

        //-- Listen for menu buttons --//
        $("#grabButton").on("click", function(){TOOL.changeToolState(ToolState.Grab)});
        $("#drawButton").on("click", function(){TOOL.changeToolState(ToolState.Draw)});
        $("#eraseButton").on("click", function(){TOOL.changeToolState(ToolState.Erase)});

        // Listen for tile hover //
        $(document).on("pathfinder:tileHover", function(event, x, y){TOOL.handleTileHover(x, y)});
        $(document).on("pathfinder:tileHoverStop", function(event, x, y){TOOL.handleTileHoverStop(x, y)});

        // Listen for mouse down //
        this.#isMouseDown = false;
        $(document).on("mousedown", function(event){TOOL.setMouseDown(true)});
        $(document).on("mouseup", function(event){TOOL.setMouseDown(false)});

    }



    #getButtonElement(toolState) {
        if (toolState == ToolState.Grab) {
            return $("#grabButton");
        } else if (toolState == ToolState.Draw) {
            return $("#drawButton");
        } else if (toolState == ToolState.Erase) {
            return $("#eraseButton");
        }
        return null;
    }


    changeToolState(newState) {
        if (this.#state != null) {
            this.#getButtonElement(this.#state).removeClass("selectedTool");
            this.#toolStateHandlers[this.#state].disable();
        }
        this.#state = newState;
        this.#getButtonElement(this.#state).addClass("selectedTool");
        this.#toolStateHandlers[this.#state].enable();
    }


    setMouseDown(isDown) {
        this.#isMouseDown = isDown;
        if (this.#hoveredTile != null) {
            if (isDown) { //Treat change as a click if mouse is pressed
                this.handleTileClick(this.#hoveredTile.x, this.#hoveredTile.y);
            } else { //Treat change as a hover with mouse unpressed otherwise
                this.handleTileHover(this.#hoveredTile.x, this.#hoveredTile.y, false);
            }
        }
    }

    handleTileClick(x, y) { 
        this.#toolStateHandlers[this.#state].tileClick(x, y);
    }
    handleTileHover(x, y) {
        this.#hoveredTile = {x: x, y: y};
        this.#toolStateHandlers[this.#state].tileHover(x, y, this.#isMouseDown);
    }
    handleTileHoverStop(x, y) {
        if (this.#hoveredTile != null && this.#hoveredTile.x == x && this.#hoveredTile.y == y) {
            this.#hoveredTile = null;
        }
        this.#toolStateHandlers[this.#state].tileHoverStop(x, y);
    }
}



$(document).ready(function(){
    //Create and initialize the singleton
    TOOL = new _ToolClass();
});