// Script para ler os cabeçalhos de todas as abas de uma planilha Excel
const xlsx = require('xlsx');
const path = require('path');

const filePath = path.resolve(__dirname, '../Atualização Cardapio Microsoft 2025.xlsx');

try {
  const workbook = xlsx.readFile(filePath);
  const sheetNames = workbook.SheetNames;
  console.log('Abas encontradas:', sheetNames);

  sheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const json = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    const header = json[0];
    console.log(`\nAba: ${sheetName}`);
    console.log('Cabeçalhos:', header);
  });
} catch (err) {
  console.error('Erro ao ler a planilha:', err.message);
} 