// Teste da lógica de filtros
function testFilterLogic() {
  console.log('=== TESTANDO LÓGICA DE FILTROS ===');
  
  // Simular diferentes estados do dateRange
  const testCases = [
    { name: 'Filtro válido', dateRange: { start: '2025-02-01', end: '2025-02-28' } },
    { name: 'Filtro limpo (strings vazias)', dateRange: { start: '', end: '' } },
    { name: 'Filtro limpo (undefined)', dateRange: undefined },
    { name: 'Filtro parcial', dateRange: { start: '2025-02-01', end: '' } },
    { name: 'Filtro parcial 2', dateRange: { start: '', end: '2025-02-28' } }
  ];
  
  testCases.forEach(testCase => {
    const { name, dateRange } = testCase;
    const hasValidFilter = dateRange && dateRange.start && dateRange.end;
    const shouldUseFetch = hasValidFilter || !dateRange || !dateRange.start || !dateRange.end;
    
    console.log(`\n${name}:`);
    console.log(`  dateRange:`, dateRange);
    console.log(`  hasValidFilter: ${hasValidFilter}`);
    console.log(`  shouldUseFetch: ${shouldUseFetch}`);
    
    if (hasValidFilter) {
      console.log(`  → Usar filtro específico: ${dateRange.start} a ${dateRange.end}`);
    } else {
      const currentYear = new Date().getFullYear();
      console.log(`  → Buscar ano atual: ${currentYear}-01-01 a ${currentYear}-12-31`);
    }
  });
}

testFilterLogic(); 