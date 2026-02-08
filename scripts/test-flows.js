(async () => {
  // script to simulate create/edit flows on data fixtures
  const path = (p) => `${process.cwd()}/${p}`;

  const clientesMod = await import(path('src/data/clientes.js'));
  const vendasMod = await import(path('src/data/vendas.js'));
  const comprasMod = await import(path('src/data/compras.js'));
  const financeiroMod = await import(path('src/data/financeiro.js'));

  const clientes = JSON.parse(JSON.stringify(clientesMod.clientes));
  const vendas = JSON.parse(JSON.stringify(vendasMod.vendas));
  const compras = JSON.parse(JSON.stringify(comprasMod.compras));
  const contasReceber = JSON.parse(JSON.stringify(financeiroMod.contasReceber));
  const contasPagar = JSON.parse(JSON.stringify(financeiroMod.contasPagar));

  console.log('--- Inicial ---');
  console.log('clientes:', clientes.length);
  console.log('vendas:', vendas.length, 'total primeira venda:', vendas[0]?.total);
  console.log('compras:', compras.length, 'total primeira compra:', compras[0]?.total);
  console.log('contasReceber:', contasReceber.length, 'valor:', contasReceber.map(c=>c.valor));
  console.log('contasPagar:', contasPagar.length, 'valor:', contasPagar.map(c=>c.valor));

  // Simular criar cliente
  const novoCliente = { id: Date.now(), nome: 'Cliente Z', email: 'z@ex.com', telefone: '000', endereco: 'Rua Z' };
  clientes.unshift(novoCliente);
  console.log('\nCriado novo cliente -> total:', clientes.length);

  // Editar venda: alterar total da primeira venda
  if (vendas[0]) {
    const old = vendas[0].total;
    vendas[0].total = (Number(vendas[0].total || 0) + 100).toFixed ? Number(vendas[0].total) + 100 : vendas[0].total + 100;
    console.log('\nEditada venda V001: total', old, '->', vendas[0].total);
  }

  // Simular criar conta a pagar
  const novaConta = { id: 'CP' + Date.now(), descricao: 'Teste CP', fornecedor: 'Fornecedor X', valor: 1200.5, vencimento: '15/03/2026', status: 'Pendente' };
  contasPagar.unshift(novaConta);
  console.log('\nCriada conta a pagar -> total:', contasPagar.length, 'primeira:', contasPagar[0]);

  // Simular editar conta a receber
  if (contasReceber[0]) {
    const prev = contasReceber[0].valor;
    contasReceber[0].valor = contasReceber[0].valor + 200;
    console.log('\nEditada conta a receber', contasReceber[0].id, prev, '->', contasReceber[0].valor);
  }

  console.log('\n--- Final ---');
  console.log('clientes:', clientes.length);
  console.log('vendas:', vendas.length, 'total primeira venda:', vendas[0]?.total);
  console.log('compras:', compras.length, 'total primeira compra:', compras[0]?.total);
  console.log('contasReceber:', contasReceber.length, 'valores:', contasReceber.map(c=>c.valor));
  console.log('contasPagar:', contasPagar.length, 'valores:', contasPagar.map(c=>c.valor));

  console.log('\nPara executar:');
  console.log('  node scripts/test-flows.js');
})();
