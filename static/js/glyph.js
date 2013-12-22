var Y_OFFSET = 100;

var Graph = function() {}


Graph.createCanvas = function(canvas, size) {
    var ppscope = new paper.PaperScope();
    ppscope.setup(canvas);
    return new PaperJSGraph(size, ppscope);
}

Graph.resize = function(x, y, srcwidth, srcheight, destwidth, destheight) {
    var ratio = srcwidth / srcheight;
    var w, h, nx, ny;
    if (ratio >= 1) {
        w = destwidth;
        h = w / ratio;
    } else {
        h = destheight;
        w = h * ratio;
    }
    nx = w * x / srcwidth;
    ny = h * y / srcheight;
    return {x: nx, y: ny}
}


var PaperJSGraph = function(size, paperscope) {
    this.ppscope = paperscope;
    this.size = size;
    this.tool = new this.ppscope.Tool();

    this.zpoints = [];
    this.glyphpathes = [];

    this.tool.onMouseDown = this.firedMouseDown.bind(this);
    this.tool.onMouseUp = this.firedMouseUp.bind(this);
    this.tool.onMouseDrag = this.firedMouseDrag.bind(this);
}


PaperJSGraph.prototype = {

    firedMouseDown: function(event) {
        this.selectedzpoint = null;
        for (var k = 0; k < this.zpoints.length; k++) {
            var p = this.zpoints[k].segment.point;
            if (p.getDistance(event.point) < 5) {
                this.selectedzpoint = this.zpoints[k];
                this.isdragged = false;
                return;
            };
        }
    },

    firedMouseDrag: function(event) {
        if (!this.selectedzpoint) {
            return;
        }
        // this.box.position = event.point;
        this.selectedzpoint.segment.path.position = event.point;
        this.selectedzpoint.label.point = event.point;
        this.isdragged = true;
    },

    firedMouseUp: function(event) {
        if (!this.selectedzpoint) 
            return;

        var x = event.point.x;
        var y = event.point.y - 200;
        var xycoord = this.restore_original_coords(new this.ppscope.Point(x, y));

        var data = {
            x: xycoord.x,
            y: 500 - xycoord.y,
            params: this.selectedzpoint.data
        };

        this.onMouseUp ? this.onMouseUp(event.event, this.isdragged, data) : false;
    },

    restore_original_coords: function(point) {
        return Graph.resize(point.x, point.y, 350, 350, this.size.width, this.size.height);
    },

    getPoint: function(x, y) {
        var r = Graph.resize(x, y, this.size.width, this.size.height, 350, 350);
        return new this.ppscope.Point(r.x, r.y);
    },

    /*
     * Draw on canvas concrete contour.
     * 
     * Parameters:
     * points - array of contour points in json format
     *   {x: N, y: M, controls: [{x: K, y: L}, {x: G, y: H}]}
     */
    drawcontour: function(points) {
        var path = new this.ppscope.Path();
        for (var k = 0; k < points.length; k++) {
            var point = points[k];

            var ppoint = this.getPoint(Number(point.x), 500 - Number(point.y));
            ppoint.y += +Y_OFFSET;
            console.log(JSON.stringify(ppoint));

            var handleIn = this.getPoint(Number(point.controls[0].x) - Number(point.x),
                                         Number(point.y) - Number(point.controls[0].y));
            var handleOut = this.getPoint(Number(point.controls[1].x) - Number(point.x),
                                          Number(point.y) - Number(point.controls[1].y));
            var segment = new this.ppscope.Segment(ppoint, handleIn, handleOut);

            path.add(segment);
        }
        path.fillColor = {
            hue: 360 * Math.random(),
            saturation: 1,
            brightness: 1,
            alpha: 0.5
        };
        path.closed = true;
        path.strokeColor = new this.ppscope.Color(0.5, 0, 0.5);
        this.ppscope.view.draw();

        this.glyphpathes.push(path);
    },

    /*
     * Draw z-point in canvas
     * 
     * Parameters:
     * point - concrete point in json format {x: N, y: M, iszpoint: boolean}
     */
    drawpoint: function(point) {
        if ( !point.iszpoint )
            return;

        var zpoint = this.getPoint(Number(point.x), 500 - Number(point.y));
        zpoint.y += +Y_OFFSET;

        var gpath = new this.ppscope.Path.Rectangle(zpoint, 1);
        gpath.strokeColor = 'green';
        gpath.closed = true;
        gpath.selected = true;

        var text = new this.ppscope.PointText(zpoint);
        text.justification = 'center';
        text.fillColor = 'black';
        text.content = point.data.pointname;

        this.zpoints.push({segment: gpath.segments[0],
                           data: point.data,
                           label: text});

        this.ppscope.view.draw();
    },


    deletepoints: function() {
        $(this.zpoints).each(function(i, el){
            el.segment.path.remove();
        });
        
        delete this.zpoints;
        this.zpoints = [];
    },


    deletepathes: function() {
        $(this.glyphpathes).each(function(i, el) {
            el.remove();
        });

        delete this.glyphpathes;
        this.glyphpathes = [];
    }

}


var Glyph = function(canvas, glyphsize) {
    this.graph = new Graph();
    this.canvas = $(canvas);

    // To use two.js just implement Graph interface
    // with all functions that will provide needed
    // functional, and replace this line with method of
    // Graph Factory
    this.graph = Graph.createCanvas(canvas, glyphsize);

    this.graph.onMouseDown = this.onMouseDown.bind(this);
    this.graph.onMouseUp = this.onMouseUp.bind(this);
    this.graph.onMouseDrag = this.onMouseDrag.bind(this);
}


Glyph.prototype = {

    render: function(contours) {
        this.graph.deletepathes();
        for (var k = 0; k < contours.length; k++) {
            this.graph.drawcontour(contours[k]);
        }
    },

    renderZPoints: function(points) {
        this.graph.deletepoints();
        for (var k = 0; k < points.length; k++) {
            this.graph.drawpoint(points[k]);
        }
    },

    onMouseDown: function() {
        alert('mouse down');
    },

    onMouseUp: function(event, isdragged, data) {
        if (isdragged) {
            this.onZPointChanged ? this.onZPointChanged(this, data) : false;
        }
    },

    onMouseDrag: function() {
        alert('mouse drag');
    }

}