var server = 'localhost:8080';
var isHost = true;

function createCanvas(width, height) {
    var canvas = document.createElement('canvas');
    canvas.context = canvas.getContext('2d');
    canvas.width = width || 100;
    canvas.height = height || 100;
    return canvas;
}

function getCtx(canvas) {
    return canvas.context;
}

function bindEvents(canvas, color) {
    canvas.context.fillCircle = function (x, y, radius, fillColor) {
        this.fillStyle = fillColor;
        this.beginPath();
        this.moveTo(x, y);
        this.arc(x, y, radius, 0, Math.PI * 2, false);
        this.fill();
    };
    canvas.onmousedown = function (e) {

        canvas.isDrawing = true;
    };
    canvas.onmouseup = function (e) {

        canvas.isDrawing = false;
    };
    canvas.onmousemove = function (e) {
        var pos = fixPosition(e, canvas);
        if (!canvas.isDrawing) {
            return;
        }

        updateHost(pos.x, pos.y, 3, color);
    };
}

/************************* HOST ******************************************/

function updateHost(x, y, size, color) {

    var updatehost = {
        method: 'update-host',
        data: {
            x: x,
            y: y,
            size: size,
            color: color
        }
    }

    var updatesubs = {
        method: 'update-subs',
    }

    console.log(updatehost);

    socket.send(JSON.stringify(updatehost));
    socket.send(JSON.stringify(updatesubs));
    //hostCanvas.context.fillCircle(x, y, size, color);
}

function fixPosition(e, gCanvasElement) {
    var x;
    var y;
    if (e.pageX || e.pageY) {
        x = e.pageX;
        y = e.pageY;
    } else {
        x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    x -= gCanvasElement.offsetLeft;
    y -= gCanvasElement.offsetTop;
    return {
        x: x,
        y: y
    };
}

// NETWORK STUFF

var socket = new WebSocket('ws://' + server + '/intellipaint');

socket.onopen = function(event) {
    var setupreq = {'method': 'setup'};

    console.log('did this ever happen?');
    socket.send(JSON.stringify(setupreq));
}

socket.onmessage = function(event) {
    var res = JSON.parse(event.data);
    console.log('received: ' + res['method']);

    // the 'setup' call, will designate who is host
    if (res['method'] === 'setup') {
        console.log('response to setup method');
        if (res.data === false) { isHost = false }
        else {
            isHost = true
            console.log('i am host now!');
        }
    }

    if (isHost === true) {
        // methods only the host should care about
        
        if (res['method'] === 'update-host') {
            // received canvas data, I am the host.
            // I should probably apply that shit.
            console.log(res.data);
            canvas.context.fillCircle(res.data.x, res.data.y,
                                      res.data.size, res.data.color);
        }

        if (res['method'] === 'canvas') {
            (function() {
                var req = {
                    'method': 'host-canvas',
                    'data': canvas.toDataURL()
                }

                socket.send(JSON.stringify(req));
                
            })();
            
        }
    }

    if (isHost === false) {
        // methods that should only be handled by subscribers
        if (res['method'] === 'copy-canvas') {
            (function() {

                context = getCtx(canvas);
                console.log(typeof(res.data));
                console.log(res.data);
                

                var image = new Image();
                image.src = res.data;

                image.onload = function() {
                    context.drawImage(image, 0, 0);
                }
                
            })();
        }
    }
}

var canvas = createCanvas(500, 500);
var colors = '#' + (Math.random() * 0xFFFFFF << 0).toString(16).toUpperCase();
$("#master").append(canvas);
bindEvents(canvas, colors);
