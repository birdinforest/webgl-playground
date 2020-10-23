/**
 * @author Don McCurdy / https://www.donmccurdy.com
 * @author Austin Eng / https://github.com/austinEng
 * @author Shrek Shao / https://github.com/shrekshao
 */

/**
 * An example three.js loader for Basis compressed textures.
 */
let BasisTextureLoader = class BasisTextureLoader {

	constructor () {

		this.etcSupported = false;
		this.dxtSupported = false;
		this.pvrtcSupported = false;

		this.format = null;

	}

	detectSupport ( renderer ) {

		const context = renderer.context;

		this.etcSupported = context.getExtension( 'WEBGL_compressed_texture_etc1' );
		this.dxtSupported = context.getExtension( 'WEBGL_compressed_texture_s3tc' );
		this.pvrtcSupported = context.getExtension( 'WEBGL_compressed_texture_pvrtc' )
			|| context.getExtension( 'WEBKIT_WEBGL_compressed_texture_pvrtc' );

		if (! this.etcSupported && ! this.dxtSupported && ! this.pvrtcSupported) {

			throw new Error( 'THREE.BasisTextureLoader: No suitable compressed texture format found.' );

		}

		this.format = this.etcSupported
			? BASIS_FORMAT.cTFETC1
			: ( this.dxtSupported
				? BASIS_FORMAT.cTFBC1
				: BASIS_FORMAT.cTFPVRTC1_4_OPAQUE_ONLY );

		return this;

	}

	detectSupportGL ( gl ) {

		this.etcSupported = gl.getExtension( 'WEBGL_compressed_texture_etc1' );
		this.dxtSupported = gl.getExtension( 'WEBGL_compressed_texture_s3tc' );
		this.pvrtcSupported = gl.getExtension( 'WEBGL_compressed_texture_pvrtc' )
			|| gl.getExtension( 'WEBKIT_WEBGL_compressed_texture_pvrtc' );

		if (! this.etcSupported && ! this.dxtSupported && ! this.pvrtcSupported) {

			throw new Error( 'BasisTextureLoader: No suitable compressed texture format found.' );

		}

		this.format = this.etcSupported
			? BASIS_FORMAT.cTFETC1
			: ( this.dxtSupported
				? BASIS_FORMAT.cTFBC1
				: BASIS_FORMAT.cTFPVRTC1_4_OPAQUE_ONLY );

		return this;

	}

	load ( url, onLoad, onProgress, onError ) {

		fetch( url )
			.then( ( res ) => res.arrayBuffer() )
			.then( ( arrayBuffer ) => this._createTexture( arrayBuffer ) )
			.then( onLoad )
			.catch( onError );

	}

	createTextureData ( arrayBuffer ) {

		const BASIS_FORMAT = BasisTextureLoader.BASIS_FORMAT;
		const DXT_FORMAT_MAP = BasisTextureLoader.DXT_FORMAT_MAP;

		const basisFile = new BasisFile( new Uint8Array( arrayBuffer ) );

		const width = basisFile.getImageWidth( 0, 0 );
		const height = basisFile.getImageHeight( 0, 0 );
		const images = basisFile.getNumImages();
		const levels = basisFile.getNumLevels( 0 );

		function cleanup () {

			basisFile.close();
			basisFile.delete();

		}

		if (! width || ! height || ! images || ! levels) {

			cleanup();
			throw new Error( 'BasisTextureLoader:  Invalid .basis file' );

		}

		if (! basisFile.startTranscoding()) {

			cleanup();
			throw new Error( 'BasisTextureLoader: .startTranscoding failed' );

		}

		const dst = new Uint8Array( basisFile.getImageTranscodedSizeInBytes( 0, 0, this.format ) );

		const startTime = performance.now();

		const status = basisFile.transcodeImage(
			dst,
			0,
			0,
			this.format,
			this.etcSupported ? 0 : ( this.dxtSupported ? 1 : 0 ),
			0
		);

		console.log( `BasisTextureLoader: Transcode time: ${performance.now() - startTime}ms`, dst );

		cleanup();

		if (! status) {
			throw new Error( 'BasisTextureLoader: .transcodeImage failed.' );
		}

		let internalFormat;
		if (this.etcSupported) {
		  internalFormat = RGB_ETC1_Format;
		} else if (this.dxtSupported) {
			internalFormat = DXT_FORMAT_MAP[this.format];
		} else if (this.pvrtcSupported) {
			internalFormat = RGB_PVRTC_4BPPV1_Format;
		} else {
			throw new Error( 'THREE.BasisTextureLoader: No supported format available.' );
		}

		return { data: dst, width: width, height: height, internalFormat: internalFormat };
	}

	_createTexture ( arrayBuffer ) {

		const BASIS_FORMAT = BasisTextureLoader.BASIS_FORMAT;
		const DXT_FORMAT_MAP = BasisTextureLoader.DXT_FORMAT_MAP;

		const basisFile = new BasisFile( new Uint8Array( arrayBuffer ) );

		const width = basisFile.getImageWidth( 0, 0 );
		const height = basisFile.getImageHeight( 0, 0 );
		const images = basisFile.getNumImages();
		const levels = basisFile.getNumLevels( 0 );

		function cleanup () {

			basisFile.close();
			basisFile.delete();

		}

		if (! width || ! height || ! images || ! levels) {

			cleanup();
			throw new Error( 'BasisTextureLoader:  Invalid .basis file' );

		}

		if (! basisFile.startTranscoding()) {

			cleanup();
			throw new Error( 'BasisTextureLoader: .startTranscoding failed' );

		}

		const dst = new Uint8Array( basisFile.getImageTranscodedSizeInBytes( 0, 0, this.format ) );

		const startTime = performance.now();

		const status = basisFile.transcodeImage(
			dst,
			0,
			0,
			this.format,
			this.etcSupported ? 0 : ( this.dxtSupported ? 1 : 0 ),
			0
		);

		console.log( `THREE.BasisTextureLoader: Transcode time: ${performance.now() - startTime}ms`, dst );

		cleanup();

		if (! status) {

			throw new Error( 'THREE.BasisTextureLoader: .transcodeImage failed.' );

		}

		const mipmaps = [{ data: dst, width, height }];

		return mipmaps;

		let texture;

		if (this.etcSupported) {

			texture = new CompressedTexture( mipmaps, width, height, RGB_ETC1_Format );

		} else if (this.dxtSupported) {

			texture = new CompressedTexture( mipmaps, width, height, DXT_FORMAT_MAP[this.format], UnsignedByteType );

		} else if (this.pvrtcSupported) {

			texture = new CompressedTexture( mipmaps, width, height, RGB_PVRTC_4BPPV1_Format );

		} else {

			throw new Error( 'THREE.BasisTextureLoader: No supported format available.' );

		}

		// TODO: Look for following constant variable in ClayGL
		// Ref: threejs src/constants.js or ln188 three.js
		texture.minFilter = 1008;
		texture.magFilter = 1006;
		texture.encoding = 3001;
		texture.generateMipmaps = false;
		texture.flipY = false;
		texture.needsUpdate = true;

		return texture;

	}
};

const BASIS_FORMAT = {
	cTFETC1: 0,
	cTFBC1: 1,
	cTFBC4: 2,
	cTFPVRTC1_4_OPAQUE_ONLY: 3,
	cTFBC7_M6_OPAQUE_ONLY: 4,
	cTFETC2: 5,
	cTFBC3: 6,
	cTFBC5: 7,
};

// DXT formats, from:
// http://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_s3tc/
const DXT_FORMAT_MAP = {};
const COMPRESSED_RGB_S3TC_DXT1_EXT = 0x83F0;
const COMPRESSED_RGBA_S3TC_DXT1_EXT = 0x83F1;
const COMPRESSED_RGBA_S3TC_DXT3_EXT = 0x83F2;
const COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83F3;
DXT_FORMAT_MAP[BASIS_FORMAT.cTFBC1] = COMPRESSED_RGB_S3TC_DXT1_EXT;
DXT_FORMAT_MAP[BASIS_FORMAT.cTFBC3] = COMPRESSED_RGBA_S3TC_DXT5_EXT;

// TODO: Look for following constant variable in ClayGL
// Ref: threejs src/constants.js or ln188 three.js
const RGB_ETC1_Format = 36196;
const UnsignedByteType = 1009;
const RGB_PVRTC_4BPPV1_Format = 35840;


BasisTextureLoader.BASIS_FORMAT = BASIS_FORMAT;
BasisTextureLoader.DXT_FORMAT_MAP = DXT_FORMAT_MAP;
