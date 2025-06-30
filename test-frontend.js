// Teste simples para verificar se o frontend está recebendo dados filtrados
console.log('=== TESTE FRONTEND - DADOS FILTRADOS ===');

// Teste 1: Sem filtro
console.log('\n1. Testando SEM filtro:');
fetch('http://localhost:5000/api/basic-stats')
  .then(response => response.json())
  .then(data => {
    console.log(`Total de pedidos: ${data.totalOrders}`);
    console.log(`Pedidos recentes: ${data.recentOrders?.length || 0}`);
    console.log('IDs dos pedidos:', data.recentOrders?.map(o => o.id) || []);
  })
  .catch(error => console.error('Erro:', error));

// Teste 2: Com filtro de fevereiro
console.log('\n2. Testando COM filtro (fevereiro 2025):');
fetch('http://localhost:5000/api/basic-stats?start=2025-02-01&end=2025-02-29')
  .then(response => response.json())
  .then(data => {
    console.log(`Total de pedidos: ${data.totalOrders}`);
    console.log(`Pedidos recentes: ${data.recentOrders?.length || 0}`);
    console.log('IDs dos pedidos:', data.recentOrders?.map(o => o.id) || []);
  })
  .catch(error => console.error('Erro:', error));

// Teste 3: SSE sem filtro
console.log('\n3. Testando SSE SEM filtro:');
const eventSource1 = new EventSource('http://localhost:5000/api/stats-stream');
eventSource1.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(`SSE - Total de pedidos: ${data.totalOrders}`);
  console.log(`SSE - Pedidos recentes: ${data.recentOrders?.length || 0}`);
  console.log('SSE - IDs dos pedidos:', data.recentOrders?.map(o => o.id) || []);
  eventSource1.close();
};

// Teste 4: SSE com filtro (após 2 segundos)
setTimeout(() => {
  console.log('\n4. Testando SSE COM filtro (fevereiro 2025):');
  const eventSource2 = new EventSource('http://localhost:5000/api/stats-stream?start=2025-02-01&end=2025-02-29');
  eventSource2.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log(`SSE Filtrado - Total de pedidos: ${data.totalOrders}`);
    console.log(`SSE Filtrado - Pedidos recentes: ${data.recentOrders?.length || 0}`);
    console.log('SSE Filtrado - IDs dos pedidos:', data.recentOrders?.map(o => o.id) || []);
    eventSource2.close();
  };
}, 2000); 