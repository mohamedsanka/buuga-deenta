const db = new Dexie('DebtDB');
db.version(1).stores({
  debts: '++id,customerId,name,phone,amount,date,time,note,status'
});

const reminderList = document.getElementById('reminderList');
const searchInput = document.getElementById('searchInput');

async function showReminders(search = '') {
  let debts = await db.debts.where('status').equals('unpaid').toArray();

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

  reminderList.innerHTML = '';
  const today = new Date();

  if (debts.length === 0) {
    reminderList.innerHTML = `<tr><td colspan="5" style="text-align:center; color:gray;">No unpaid records found.</td></tr>`;
    return;
  }

  debts.forEach((d, i) => {
    const due = new Date(d.date + 'T' + d.time);
    const overdue = due < today;
    const row = document.createElement('tr');
    row.style.background = overdue ? '#ffebee' : '#fff';
    row.innerHTML = `
      <td>${i + 1}</td>
      <td>${d.name}</td>
      <td>${d.amount}</td>
      <td>${d.date}, ${d.time}</td>
      <td style="color:${overdue ? '#d32f2f' : '#388e3c'}; font-weight:bold;">${overdue ? 'Wa ladhaafay balanti' : 'Goordhow dhow'}</td>
    `;
    reminderList.appendChild(row);
  });
}

// Real-time search
searchInput.addEventListener('input', e => {
  showReminders(e.target.value);
});

showReminders();
