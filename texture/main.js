/*
Doc of gl-matrix
http://glmatrix.net/docs/index.html
 */

// Vertex shader program
//
// In previous examples, vertices displays solid colours, now we need to replace the vertex shader
// so that instead of fetching color data, it instead fetches the texture coordinate data.
//
// The key change here is that instead of fetching the vertex color, we're fetching the texture coordinates and passing
// them to the vertex shader; this will indicate the location within the texture corresponding to the vertex.
const vsSource = `
  attribute vec4 aVertexPosition;
  attribute vec2 aTextureCoord;
  
  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;
  
  varying highp vec2 vTextureCoord;
  
  void main(void) {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vTextureCoord = aTextureCoord;
  }
`

// Fragment shader program
//
// Instead of assigning a color value to the fragment's color, the fragment's color is computed by fetching the texel
// (that is, the pixel within the texture) based on the value of vTextureCoord which like the colors is interpolated bewteen vertices.
const fsSource = `
  varying highp vec2 vTextureCoord;
  
  uniform sampler2D uSampler;
  
  void main(void) {
    gl_FragColor = texture2D(uSampler, vTextureCoord);
  }
`

// 创建指定类型的着色器，上传source源码并编译
function loadShader (gl, type, source) {
  const shader = gl.createShader(type)

  // Send the source to the shader object

  gl.shaderSource(shader, source)

  // Compile the shader program

  gl.compileShader(shader)

  // See if it compiled successfully

  if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }

  return shader
}

/*
  现在我们已经定义了两个着色器，我们需要将它们传递给WebGL，
  编译并将它们连接在一起。下面的代码通过调用loadShader（），
  为着色器传递类型和来源，创建了两个着色器。然后创建一个附加着色器的程序，
  将它们连接在一起。如果编译或链接失败，代码将弹出alert。
 */

// Init shader programs, let WebGL know how to render data.
function initShaderProgram (gl, vsSource, fsSource) {
  // Load shader programs source code.
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource)
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource)

  // Create shader programs.
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader)
  gl.attachShader(shaderProgram, fragmentShader)
  gl.linkProgram(shaderProgram)

  // If failed, alert
  if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null
  }

  return shaderProgram
}

/*
我们需要创建一个缓冲器来存储它的顶点。我们会用到名字为 initBuffers() 的函数。当我们了解到更多WebGL 的高级概念时，
这段代码会将有更多参数，变得更加复杂，并且用来创建更多的三维物体。
 */
function initBuffers (gl, vertices, indices, textureCoordinations) {
  // Vertices position
  const verticesBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)

  // Build the element array buffer; this specifies the indices
  // into the vertex arrays for each face's vertices.
  const indexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)

  // Texture
  const textureCoordBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinations), gl.STATIC_DRAW)

  // Return buffer:{position:x, color:x}
  return {
    position: verticesBuffer,
    indices: indexBuffer,
    textureCoord: textureCoordBuffer
  }
}

function drawScene (gl, programInfo, buffers, texture, rotationAmount) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.

  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.

  // Create vec3
  const moveTo = vec3.fromValues(-0.0, 0.0, -6.0)

  // Translation
  mat4.translate(
    modelViewMatrix,     // destination matrix
    modelViewMatrix,     // matrix to translate
    [-0.0, 0.0, -6.0]);  // amount to translate

  // Rotation around z
  mat4.rotate(
    modelViewMatrix,  // destination matrix
    modelViewMatrix,  // matrix to rotate
    rotationAmount,   // amount to rotate in radians
    [0, 0, 1])        // axis to rotate around)

  // Rotation around y
  mat4.rotate(
    modelViewMatrix,
    modelViewMatrix,
    rotationAmount * 0.7,
    [0, 1, 0])

  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  {
    const numComponents = 3;  // pull out 3 values per iteration
    const type = gl.FLOAT;    // the data in the buffer is 32bit floats
    const normalize = false;  // don't normalize
    const stride = 0;         // how many bytes to get from one set of values to the next
                              // 0 = use type and numComponents above
    const offset = 0;         // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  }

  // tell WebGL how to pull out the texture coordinates from buffer
  {
    const num = 2; // every coordinate composed of 2 values
    const type = gl.FLOAT; // the data in the buffer is 32 bit float
    const normalize = false; // don't normalize
    const stride = 0; // how many bytes to get from one set to the next
    const offset = 0; // how many bytes inside the buffer to start from
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(
      programInfo.attribLocations.textureCoord,
      num,
      type,
      normalize,
      stride,
      offset);
    gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
  }

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices)

  // Tell WebGL to use our program when drawing
  // If only one shader program is in using, to set this before any uniform setting.
  // If multiple shader programs are in using, to set this before corresponding uniform setting.
  // Otherwise there will be warning about `WebGL: INVALID_OPERATION: uniform1i: location not for current program`
  // https://stackoverflow.com/questions/14413713/webgl-invalid-operation-uniform1i-location-not-for-current-program
  gl.useProgram(programInfo.program);

  /*
  To specify the texture to map onto the faces

  WebGL provides a minimum of 8 texture units; the first of these is gl.TEXTURE0.
  We tell WebGL we want to affect unit 0. We then call bindTexture() which binds the texture to the
  TEXTURE_2D bind point of texture unit 0. We then tell the shader that for the uSampler use texture unit 0
   */
  // Tell WebGL we want to affect texture unit 0
  gl.activeTexture(gl.TEXTURE0)
  // Tell the shader we bound the texture to texture unit 0
  gl.uniform1i(programInfo.uniformLocations.uSampler, 0)
  // Bind the texture to texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the shader uniforms
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix);
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix);

  {
    const vertexCount = 36
    const type = gl.UNSIGNED_SHORT
    const offset = 0
    // gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset)
  }
}

function loadTexture (gl, url) {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)

  // Because images have to be download over the internet
  // they might take a moment until they are ready.
  // Until then put a single pixel in the texture so we can
  // use it immediately. When the image has finished downloading
  // we'll update the texture with the contents of the image.
  // *纹理图需要在图片全部下载完之后生成，但是图片下载需要时间，我们先在上面填上一个蓝点，这样在下载完之前就可以使用这张纹理图。
  // 在图片下载完后，onload()方法会根据图片的内容再次更新纹理图*
  const level = 0
  const internalFormat = gl.RGBA
  const width = 1
  const height = 1
  const border = 0
  const srcFormat = gl.RGBA
  const srcType = gl.UNSIGNED_BYTE
  const pixel = new Uint8Array([0,0,255,255]);      // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, srcType, pixel)

  const image = new Image()
  image.onload = function () {
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, image)

    /*
    WebGL1 can only use non power of 2 textures with filtering set to NEAREST or LINEAR and
    it can not generate a mipmap for them. Their wrapping mode must also be set to CLAMP_TO_EDGE.
    On the other hand if the texture is a power of 2 in both dimensions then WebGL can do higher quality filtering,
    it can use mipmap, and it can set the wrapping mode to REPEAT or MIRRORED_REPEAT.
    https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
     */
    if(isPowerOf2(image.width) && isPowerOf2(image.height)) {
      // Yes. Generate mips
      gl.generateMipmap(gl.TEXTURE_2D)
    } else {
      // No. Turn off mips and set wrapping to clamp to edge
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    }
  }
  image.src = url;

  return texture;
}

async function getBasisLoader() {
  console.log('Basis loader init start.');
  const start = performance.now();
  await new Promise(resolve =>
    BASIS().then(Module => {
      const { BasisFile, initializeBasis } = Module;
      initializeBasis();
      console.log('Basis loader init takes: ', (performance.now() - start));
      window.BasisFile = BasisFile;
      resolve();
  }));
}

/**
 * Image compressed by BasisU.
 * For latest BasisTextureLoader ref:
 * @reference https://www.notion.so/Texture-Compression-fe5d65ff61e146f9b4a737c2e298a24d#0e85b1022b8a4c7dbf614f1d9e488832
 * @returns {Promise<WebGLTexture>}
 */
async function getCompressedTextureBasis(gl, url, basisLoader) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture); // create texture object on GPU

  // the file is already in the correct compressed format
  const texData = await fetch(url)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => basisLoader.createTextureData(arrayBuffer));

  // const res = clay.util.ktx.parse(dataArrayBuffer);

  console.log(texData.width, texData.height);

  gl.compressedTexImage2D(
    gl.TEXTURE_2D,
    0, // set the base image level
    texData.internalFormat, // the compressed format we are using
    texData.width, texData.height,
    0, // border, always 0
    texData.data);

  // Set wrapping to clamp to edge
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

  return texture;
}

/**
 * Images compressed by S3TC.
 * @returns {Promise<WebGLTexture>}
 */
async function getCompressedTextureS3TC(gl, url, width, height) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture); // create texture object on GPU

  // Get extension
  // will be null if not supported
  const ext = (
    gl.getExtension('WEBGL_compressed_texture_s3tc') ||
    gl.getExtension('MOZ_WEBGL_compressed_texture_s3tc') ||
    gl.getExtension('WEBKIT_WEBGL_compressed_texture_s3tc')
  );

  if (ext) {
    // the file is already in the correct compressed format
    const dataArrayBuffer = await fetch(url)
      .then(response => response.arrayBuffer());

    // const res = clay.util.ktx.parse(dataArrayBuffer);

    gl.compressedTexImage2D(
      gl.TEXTURE_2D,
      0, // set the base image level
      ext.COMPRESSED_RGB_S3TC_DXT1_EXT, // the compressed format we are using
      width, height,
      0, // border, always 0
      new DataView(dataArrayBuffer));

    // create mipmap levels, like we would for a standard image
    // Have not test this.
    // Not sure can we generate mipmaps for compressed textures, even they are natively supported.
    // Some discussion says we should not generate mipmap on fly.
    if(isPowerOf2(width) && isPowerOf2(height)) {
      // Yes. Generate mips
      gl.generateMipmap(gl.TEXTURE_2D)
    } else {
      // No. Turn off mips and set wrapping to clamp to edge
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    }
    return texture;
  }
}

/**
 * Images compressed by PVRTC is natively supported on safari iOS.
 * It requires the width equals to the height.
 * Here the input image is PVRTC compressed and is wrapped in KTX container.
 * @returns {Promise<WebGLTexture>}
 */
async function getCompressedTextureKTX_PVRTC(gl, url, width, height) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture); // create texture object on GPU

  // Get extension
  // will be null if not supported
  const ext = (
    // gl.getExtension('WEBGL_compressed_texture_s3tc') ||
    // gl.getExtension('WEBKIT_WEBGL_compressed_texture_s3tc')
    gl.getExtension('WEBGL_compressed_texture_pvrtc')
  );

  if (ext) {
    // the file is already in the correct compressed format
    const dataArrayBuffer = await fetch(url)
      .then(response => response.arrayBuffer());

    const res = clay.util.ktx.parse(dataArrayBuffer);

    gl.compressedTexImage2D(
      gl.TEXTURE_2D,
      0, // set the base image level
      res.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG, // the compressed format we are using
      res.width, res.height, // width, height of the image
      0, // border, always 0
      res.pixels);

    // create mipmap levels, like we would for a standard image
    // Have not test this.
    // Not sure can we generate mipmaps for compressed textures, even they are natively supported.
    // Some discussion says we should not generate mipmap on fly.
    if(isPowerOf2(width) && isPowerOf2(height)) {
      // Yes. Generate mips
      gl.generateMipmap(gl.TEXTURE_2D)
    } else {
      // No. Turn off mips and set wrapping to clamp to edge
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    }

    return texture;
  }
}

function isPowerOf2(value) {
  return (value & (value - 1)) === 0;
}

//
// start here
//
async function main() {
  const canvas = document.querySelector("#glcanvas");
  // Initialize the GL context
  const gl = canvas.getContext("webgl");

  // Only continue if WebGL is available and working
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }

  // Track rotation amount in current time;
  let rotationAmount = 0

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource)

  /*
  在创建着色器程序之后，我们需要查找WebGL返回分配的输入位置。在上述情况下，
  我们有一个属性和两个uniforms。属性从缓冲区接收值。顶点着色器的每次迭代都从分配给该属性的缓冲区接收
  下一个值。uniforms类似于JavaScript全局变量。它们在着色器的所有迭代中保持相同的值。由于属性和统一的
  位置是特定于单个着色器程序的，因此我们将它们存储在一起以使它们易于传递
   */
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord')
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram, 'uSampler')
    }
  }


  /*
  Vertices:
  need 24 vertices, and not just 8, it is because each corner belongs to three faces of different colours,
  and a single vertex needs to have a single specific colour - therefore we will create three copies of each vertex
  in three different colours, one for each face.
   */
  // Cube vertices position
  const vertices = [
    // Front face
    -1.0, -1.0,  1.0,
    1.0, -1.0,  1.0,
    1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,

    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
    1.0,  1.0, -1.0,
    1.0, -1.0, -1.0,

    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
    1.0,  1.0,  1.0,
    1.0,  1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
    1.0, -1.0, -1.0,
    1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,

    // Right face
    1.0, -1.0, -1.0,
    1.0,  1.0, -1.0,
    1.0,  1.0,  1.0,
    1.0, -1.0,  1.0,

    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0,
  ];

  /*
  Indices:
  This array defines each face as two triangles, using the
  indices into the vertex array to specify each triangle's
  position.
  */
  const indices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
  ];

  /*
  Texture:
  we need to establish the mapping of the texture
  coordinates to the vertices of the faces of our cube.

  UV: The textureCoordinates array defines the texture coordinates corresponding to each vertex of each face.
  Note that the texture coordinates range from 0.0 to 1.0; the dimensions of textures are normalized to a range of 0.0 to 1.0
  regardless of their actual size, for the purpose of texture mapping.
  */
  const textureCoordinations = [
    // Front
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Back
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Top
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Bottom
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Right
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
    // Left
    0.0,  0.0,
    1.0,  0.0,
    1.0,  1.0,
    0.0,  1.0,
  ];

  // Get buffers:{position:x, color:x}
  const buffers = initBuffers(gl, vertices, indices, textureCoordinations)

  // Load compressed texture
  await getBasisLoader();
  const basisLoader = new BasisTextureLoader();
  basisLoader.detectSupportGL(gl);

  // const texture = loadTexture(gl, './images/shannon.png')
  const texture = await getCompressedTextureBasis(gl, './images/shannon.basis', basisLoader)

  // For animation delta time calculation
  let then = 0

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001          // Convert to seconds
    const deltaTime = now - then;
    then = now;

    rotationAmount += deltaTime;

    drawScene(gl, programInfo, buffers, texture, rotationAmount)

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
