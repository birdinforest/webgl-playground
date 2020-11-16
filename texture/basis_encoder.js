// For more formated demo script: https://www.notion.so/Texture-Compression-fe5d65ff61e146f9b4a737c2e298a24d#6aaa0333101b4233a6d06984052f4655

const basisu = require('../lib/basis_encoder/nodejs/basisu');
const fs = require('fs');
const path = require('path');

const filePath = function(relativePath) {
  return path.join(__dirname, relativePath);
}

const imagePath = filePath('./images/shannon.png');

basisu().then(module => {
  // try {
  //   modlue.FS && modlue.FS.writeFile && modlue.FS.writeFile(imagePath, buf)
  // } catch (e) {
  //   console.log(e);
  // }

    // modlue.FS.mkdir('/working');
    // modlue.FS.mount(modlue.FS.filesystems.NODEFS, { root: '.' }, '/working');

  // modlue.FS.chdir('/working');
  try {
    const stat = module.FS.stat(filePath('./basis_encoder.js'), true);
    console.log(filePath('./basis_encoder.js'), ' stat:', stat);
  } catch (e) {
    console.log('error for stat: ', e);
  }

  try {
    const cwd = module.FS.cwd();
    console.log('cwd:', cwd);
  } catch (e) {
    console.log('error for cwd: ', e);
  }

  module.callMain([filePath('./images/BATHROOM_baseColor.png'),
    '-mipmap',
    '-comp_level', '1',
    '-max_endpoints', '16128',
    '-max_selectors', '16128',
    '-no_selector_rdo', '-no_endpoint_rdo']);

  // modlue.callMain([filePath('./images/BATHROOM_baseColor.png'),
  //   '-no_multithreading', '-mipmap']);

  // var reader = modlue.FS.readFile(filePath('shannon.basis'), {encoding: 'binary'});
  // var result = reader.buffer;
  // console.log(result);
})
