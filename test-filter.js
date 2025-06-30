const fetch = require('node-fetch');

async function testFilter() {
  console.log('=== TESTE DE FILTRAGEM POR DATA ===');
  
  // Teste 1: Sem filtro (deve retornar todos os pedidos)
  console.log('\n1. Testando SEM filtro:');
  try {
    const response1 = await fetch('http://localhost:5000/api/basic-stats');
    const data1 = await response1.json();
    console.log(`Pedidos retornados: ${data1.recentOrders?.length || 0}`);
    console.log('IDs dos pedidos:', data1.recentOrders?.map(o => o.id) || []);
  } catch (error) {
    console.error('Erro no teste 1:', error.message);
  }
  
  // Teste 2: Com filtro de fevereiro 2025
  console.log('\n2. Testando COM filtro (fevereiro 2025):');
  try {
    const response2 = await fetch('http://localhost:5000/api/basic-stats?start=2025-02-01&end=2025-02-29');
    const data2 = await response2.json();
    console.log(`Pedidos retornados: ${data2.recentOrders?.length || 0}`);
    console.log('IDs dos pedidos:', data2.recentOrders?.map(o => o.id) || []);
  } catch (error) {
    console.error('Erro no teste 2:', error.message);
  }
  
  // Teste 3: Com filtro de março 2025
  console.log('\n3. Testando COM filtro (março 2025):');
  try {
    const response3 = await fetch('http://localhost:5000/api/basic-stats?start=2025-03-01&end=2025-03-31');
    const data3 = await response3.json();
    console.log(`Pedidos retornados: ${data3.recentOrders?.length || 0}`);
    console.log('IDs dos pedidos:', data3.recentOrders?.map(o => o.id) || []);
  } catch (error) {
    console.error('Erro no teste 3:', error.message);
  }
  
  // Teste 4: Com filtro de abril 2025
  console.log('\n4. Testando COM filtro (abril 2025):');
  try {
    const response4 = await fetch('http://localhost:5000/api/basic-stats?start=2025-04-01&end=2025-04-30');
    const data4 = await response4.json();
    console.log(`Pedidos retornados: ${data4.recentOrders?.length || 0}`);
    console.log('IDs dos pedidos:', data4.recentOrders?.map(o => o.id) || []);
  } catch (error) {
    console.error('Erro no teste 4:', error.message);
  }
  
  // Teste 5: Com filtro de julho 2025
  console.log('\n5. Testando COM filtro (julho 2025):');
  try {
    const response5 = await fetch('http://localhost:5000/api/basic-stats?start=2025-07-01&end=2025-07-31');
    const data5 = await response5.json();
    console.log(`Pedidos retornados: ${data5.recentOrders?.length || 0}`);
    console.log('IDs dos pedidos:', data5.recentOrders?.map(o => o.id) || []);
  } catch (error) {
    console.error('Erro no teste 5:', error.message);
  }
}

testFilter().catch(console.error); 