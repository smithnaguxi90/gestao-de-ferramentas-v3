import fs from 'fs';

// Lê o seu arquivo HTML
const html = fs.readFileSync('./src/index.html', 'utf8');

// Estas são as propriedades que JÁ ESTÃO no seu main.css para a classe .btn
const redundancias = [
  'inline-flex',
  'flex',
  'items-center',
  'justify-center',
  'gap-2',
  'rounded-xl',
  'font-semibold',
  'transition-all',
  'duration-200',
  'ease-in-out',
];

const regex = /class="([^"]*\bbtn\b[^"]*)"/g;
let match;
let count = 0;

console.log('🔍 Procurando classes redundantes em botões...\n');

while ((match = regex.exec(html)) !== null) {
  const classesAtuais = match[1].split(/\s+/); // Separa as classes por espaço

  // Filtra para ver se tem alguma classe que já existe no CSS do .btn
  const repetidas = classesAtuais.filter((c) => redundancias.includes(c));

  if (repetidas.length > 0) {
    // Calcula em qual linha isso está acontecendo
    const linhaAproximada = html.substring(0, match.index).split('\n').length;

    console.log(`❌ Linha ~${linhaAproximada}`);
    console.log(`⚠️  Remover do HTML: \x1b[33m${repetidas.join(', ')}\x1b[0m`);
    console.log(`📄 Class atual: class="${match[1]}"\n`);
    count++;
  }
}

console.log(`✅ Busca concluída! Foram encontrados ${count} botões precisando de limpeza.`);
