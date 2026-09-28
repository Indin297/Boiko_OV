const fse = require('fs-extra');
const path = require('path');
const ejs = require('ejs');
const { glob } = require('glob');
const config = require('../site.config');

const srcPath = './src';
const distPath = './site';

console.log('Старт генератора');
console.log('Текущая папка:', process.cwd());
console.log('Путь к src:', srcPath);
console.log('Путь к site:', distPath);

fse.emptyDirSync(distPath);
fse.copy(`${srcPath}/assets`, `${distPath}/assets`);

console.log('Ищу EJS-файлы...');

glob('**/*.ejs', { cwd: `${srcPath}/pages` })
  .then((files) => {
    console.log('Найдено файлов:', files.length);

    const renderPromises = files.map((file) => {
      const fileData = path.parse(file);
      const destPath = path.join(distPath, fileData.dir);
      fse.mkdirs(destPath);

      const pagePath = `${srcPath}/pages/${file}`;
      const outPath = `${destPath}/${fileData.name}.html`;

      // 1. Рендерим страницу
      return ejs.renderFile(pagePath, config)
        .then((pageContents) => {
          console.log('Страница отрендерена:', file, '| длина:', pageContents.length);
          // 2. Оборачиваем в layout
          return ejs.renderFile(`${srcPath}/layout.ejs`, { ...config, body: pageContents });
        })
        .then((layoutContent) => {
          console.log('Layout готов для:', file, '| длина:', layoutContent.length);
          // 3. Записываем файл
          return fse.writeFile(outPath, layoutContent);
        })
        .then(() => {
          console.log('Создан:', outPath);
        })
        .catch((err) => {
          console.error('Ошибка при обработке', file, ':', err);
        });
    });

    return Promise.all(renderPromises);
  })
  .then(() => {
    console.log('Готово! Все страницы сгенерированы.');
  })
  .catch((err) => console.error('Ошибка glob:', err));