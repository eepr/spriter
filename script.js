window.eepr = _.create({
    define: function(name, module) {
        var deepName = name.split('.'),
            parent = _.reduce(_.dropRight(deepName), function(base, subname) {
                return base[subname] || (base[subname] = {});
            }, eepr);
        return parent[_.last(deepName)] = module;
    },
});

eepr.define('webgl.JustImage', function(options) {
    return _.create(new eepr.webgl.Runner(options), {
        options: options || {},
        shader: null,
        vertexBuffer: null,
        texture: null,
        vertices: null,
        mousePos: {},

        initialize: function(/* args */) {
            this.__proto__.initialize.apply(this, arguments);
            var options = this.options,
                shaderUtils = eepr.webgl.shaderUtils,
                vsCode = options.vsCode,
                fsCode = options.fsCode,
                gl = this.gl;

            this.vertices = new Float32Array([
                -1.0,   -1.0,
                 1.0,   -1.0,
                -1.0,    1.0,
                 1.0,   -1.0,
                 1.0,    1.0,
                -1.0,    1.0
            ]);

            this.shader = shaderUtils.createProgram(gl, vsCode, fsCode);

            gl.enableVertexAttribArray(
                gl.getAttribLocation(this.shader, "position")
            );

            this.texture = shaderUtils.createTexture(gl, options.image1);

            this.vertexBuffer = gl.createBuffer();

            this.renderLoop();
        },

        render: function() {
            var gl = this.gl;

            gl.useProgram(this.shader);

            gl.vertexAttribPointer(
                gl.getAttribLocation(this.shader, "position"),
                2, gl.FLOAT, false, 0, 0
            );

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);

            gl.uniform1i(gl.getUniformLocation(this.shader, "tex0"), 0);
            gl.uniform2f(gl.getUniformLocation(this.shader, "resolution"), this.viewportWidth, this.viewportHeight);

            gl.viewport(0, 0, this.viewportWidth, this.viewportHeight);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

            gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 2);
        },
    });
});

eepr.define('webgl.Runner', function(options) {
    options = options || {};

    return {
        options: options,
        el: options.el,
        gl: null,


        initialize: function() {
            this.gl = this.el.getContext('experimental-webgl');
            this.updateSize();

            this.gl.clearColor(0.3, 0.3, 0.3, 1.0);
        },

        updateSize: function() {
            this.viewportWidth = this.el.width;
            this.viewportHeight = this.el.height;
        },

        renderLoop: function(self) {
            self = self || this;
            _.delay(self.renderLoop, 10000, self);
            self.render && self.render();
        },
    };
});

eepr.define('webgl.shaderUtils', {
    createProgram: function(gl, vsCode, fsCode) {
        var i, vs, fs, tmpProgram = gl.createProgram();
        try {
            vs = this.compileShader(gl, vsCode, gl.VERTEX_SHADER);
            console.log('HEYO');
            fs = this.compileShader(gl, fsCode, gl.FRAGMENT_SHADER);
        } catch (e) {
            gl.deleteProgram(tmpProgram);
            throw e;
        }
        gl.attachShader(tmpProgram, vs);
        gl.deleteShader(vs);
        gl.attachShader(tmpProgram, fs);
        gl.deleteShader(fs);
        gl.linkProgram(tmpProgram);
        return tmpProgram;
    },

    compileShader: function(gl, code, type) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, code);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw 'SHADER ERROR: ' + gl.getShaderInfoLog(shader);
        }
        return shader;
    },

    createTexture: function(gl, image) {
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.bindTexture(gl.TEXTURE_2D, null);

        return texture;
    },
});

window.onload = function initialize() {
    var demo, image, canvas;

    canvas = document.createElement('canvas');
    document.body.appendChild(canvas);

    function start() {
        demo = new eepr.webgl.JustImage({
            image1: image,
            vsCode: document.getElementById("vs-shader").innerHTML,
            fsCode: document.getElementById("fs-shader").innerHTML,
            el: canvas,
        });
        demo.initialize();

        window.onresize = updateCanvasSize;
        updateCanvasSize();
    }

    function updateCanvasSize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        demo.updateSize();
    }

    image = new Image();
    image.onload = start;
    image.src = "mushroom.png";
};