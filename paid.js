const db = new Dexie('DebtDB');
db.version(1).stores({
  debts: '++id,customerId,name,phone,amount,date,time,note,status'
});

const paidList = document.getElementById('paidList');
const searchInput = document.getElementById('searchInput');

async function showPaid(search = '') {
  let debts = await db.debts.where('status').equals('paid').toArray();

  // Filter by name or amount
  if (search) {
    debts = debts.filter(d => 
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.amount.toString().includes(search)
    );
  }

  // Sort by date & time (newest first)
  debts.sort((a,b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateB - dateA;
  });

  paidList.innerHTML = '';

  if (debts.length === 0) {
    paidList.innerHTML = `<tr><td colspan="4" style="text-align:center; color:gray;">No paid records found.</td></tr>`;
    return;
  }

  debts.forEach((d, i) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${i + 1}</td>
      <td>${d.name}</td>
      <td>${d.amount}</td>
      <td>${d.date}, ${d.time}</td>
    `;
    paidList.appendChild(row);
  });
}

// Real-time search
searchInput.addEventListener('input', e => {
  showPaid(e.target.value);
});

// Clear all paid records
const clearAllBtn = document.getElementById('clearAllBtn');
clearAllBtn.addEventListener('click', async () => {
  const paidDebts = await db.debts.where('status').equals('paid').toArray();
  
  if (paidDebts.length === 0) {
    alert('No paid records to clear');
    return;
  }

  if (confirm(`Mahubtaa inaad tirtirto dhamaan ${paidDebts.length}.`)) {
    await db.debts.where('status').equals('paid').delete();
    showPaid();
    alert('Mahadsanid Waala tirtiray');
  }
});

showPaid();
