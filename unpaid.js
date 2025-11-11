const db = new Dexie('DebtDB');
db.version(1).stores({
  debts: '++id,customerId,name,phone,amount,date,time,note,status'
});

const unpaidList = document.getElementById('unpaidList');
const searchInput = document.getElementById('searchInput');

async function showUnpaid(search = '') {
  let debts = await db.debts.where('status').equals('unpaid').toArray();

  // Filter by name or amount
  if (search) {
    debts = debts.filter(d => 
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.amount.toString().includes(search)
    );
  }

  // Sort by date/time (newest first)
  debts.sort((a,b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateB - dateA;
  });

  unpaidList.innerHTML = '';

  if (debts.length === 0) {
    unpaidList.innerHTML = `<tr><td colspan="6" style="text-align:center; color:gray;">No unpaid debts found.</td></tr>`;
    return;
  }

  debts.forEach((d, i) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${i + 1}</td>
      <td>${d.name}</td>
      <td>${d.amount}</td>
      <td>${d.date}, ${d.time}</td>
      <td>${d.phone}</td>
      <td><button onclick="markPaid(${d.id})">Ma bixiyay?</button></td>
    `;
    unpaidList.appendChild(row);
  });
}

window.markPaid = async function(id) {
  await db.debts.update(id, { status: 'paid' });
  showUnpaid();
  alert('Mahadsanid waa lasaxay');
};

// Real-time search
searchInput.addEventListener('input', e => {
  showUnpaid(e.target.value);
});

showUnpaid();
