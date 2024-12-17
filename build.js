const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// 创建dist目录
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

// 创建zip文件
const output = fs.createWriteStream(path.join(distDir, 'chrome-bilibili-barrage.zip'));
const archive = archiver('zip', {
    zlib: { level: 9 } // 最高压缩级别
});

output.on('close', () => {
    console.log(`打包完成，总大小: ${archive.pointer()} bytes`);
});

archive.on('error', (err) => {
    throw err;
});

archive.pipe(output);

// 添加文件到zip
archive.file('manifest.json', { name: 'manifest.json' });
archive.file('README.md', { name: 'README.md' });
archive.file('LICENSE', { name: 'LICENSE' });

// 添加目录
archive.directory('content/', 'content');
archive.directory('popup/', 'popup');
archive.directory('icons/', 'icons');

// 完成打包
archive.finalize(); 