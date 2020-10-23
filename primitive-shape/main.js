/* global glUtil, document */

;(function() {
  document.addEventListener('DOMContentLoaded', function() {
    //---webgl
    var webgl = document.getElementById('webgl');
    var gl = glUtil.getContext(webgl);
    glUtil.debug(true); // log error
    if (!gl) {
      return;
    }

    // 指定清空canvas的颜色
    // 参数是rgba，范围0.0~1.0
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 清空canvas
    // gl.COLOR_BUFFER_BIT颜色缓存，默认清空色rgba(0.0, 0.0, 0.0, 0.0) 透明黑色，通过gl.clearColor指定
    // gl.DEPTH_BUFFER_BIT深度缓存，默认深度1.0，通过gl.clearDepth指定
    // gl.STENCIL_BUFFER_BIT模板缓存，默认值0，通过gl.clearStencil()指定
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 在指定位置绘制点
    // 0.着色器源程序
    // 顶点着色器源程序
    var vsSrc = 'attribute vec4 a_Position;' +
      'void main() {' +
      'gl_Position = a_Position;' +   // 设置坐标
      'gl_PointSize = 7.0;' +       // 设置尺寸
      '}';
    // 片元着色器源程序
    var fsSrc = 'void main() {' +
      'gl_FragColor = vec4(1.0, 0.0, 1.0, 0.75);' + // 设置颜色
      '}';
    // 1.初始化着色器
    glUtil.initShaders(vsSrc, fsSrc);
    // 2.给attribute变量赋值
    // 获取attribute变量的存储位置
    var a_Position = gl.getAttribLocation(glUtil.program, 'a_Position');
    if (a_Position < 0) {
      console.log('Failed to get the storage location of a_Position');
      return;
    }
    // 把顶点位置传递给attribute变量
    // 一次性传递一组顶点数据
    var arrVtx = new Float32Array([
      -0.75, 0.5,
      -0.5, 0.0,
      -0.25, 0.5,
      0.0, 0.0,
      0.25, 0.5,
      0.5, 0.0
    ]);
    // 1.创建buffer
    var vBuffer = gl.createBuffer();
    if (!vBuffer) {
      console.log('Failed to create buffer');
      return;
    }
    // 2.把缓冲区对象绑定到目标
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    // 3.向缓冲区对象写入数据
    gl.bufferData(gl.ARRAY_BUFFER, arrVtx, gl.STATIC_DRAW);
    // 4.将缓冲区对象分配给a_Position变量
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    //!!! 注意：分配完还要enable连接
    // 5.连接a_Position变量和分配给它的缓冲区对象
    gl.enableVertexAttribArray(a_Position);

    // 绘制点
    gl.drawArrays(gl.POINTS, 0, arrVtx.length / 2);

    // 绘制其它图形
    //!!! 画其它图形时顶点着色器源程序中的gl_PointSize = xxx可以去掉
    //!!! 因为只在绘制孤立点时生效
    var delay = 2000;
    var n = arrVtx.length / 2;

    // 画孤立线段
    setTimeout(function() {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.LINES, 0, n);
    }, delay);

    // 画连续线段
    setTimeout(function() {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.LINE_STRIP, 0, n);
    }, delay * 2);

    // 画连续线圈
    setTimeout(function() {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.LINE_LOOP, 0, n);
    }, delay * 3);

    // 画三角
    setTimeout(function() {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, n);
    }, delay * 4);

    // 画三角带
    setTimeout(function() {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, n);
    }, delay * 5);

    // 画三角扇
    setTimeout(function() {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_FAN, 0, n);
    }, delay * 6);
  });
})();