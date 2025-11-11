if(!localStorage.getItem("currentUser")){
  window.location.href = "index.html";
}

const currentUser = localStorage.getItem("currentUser");



if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
  }
  
  // Initialize Dexie database
  const db = new Dexie('DebtDB');
  db.version(1).stores({
    debts: '++id,customerId,name,phone,amount,date,time,note,status'
  });
  
  const form = document.getElementById('debtForm');
  const customerIdInput = document.getElementById('customerId');
  const phoneInput = document.getElementById('phone');
  
  // Function to get the next available sequential ID (ordered from 1 to infinite)
  async function getNextCustomerId() {
    const allDebts = await db.debts.toArray();
    if (allDebts.length === 0) {
      return 1;
    }
    
    // Get all existing customer IDs
    const existingIds = allDebts
      .map(d => parseInt(d.customerId))
      .filter(id => !isNaN(id) && id > 0);
    
    // Return the highest ID + 1 (never reuse deleted IDs)
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    return maxId + 1;
  }
  
  // Function to check if customer ID is already taken by a different customer
  async function isCustomerIdTaken(customerId, currentName, currentPhone) {
    if (!customerId || customerId <= 0) return false;
    const existing = await db.debts.where('customerId').equals(parseInt(customerId)).first();
    
    // If no existing record, ID is available
    if (!existing) return false;
    
    // If existing record is for the same customer (same name or phone), ID is not taken
    if (currentName && existing.name === currentName) return false;
    if (currentPhone && existing.phone === currentPhone) return false;
    
    // ID is taken by a different customer
    return true;
  }
  
  // Function to find existing customer ID by name or phone
  async function findExistingCustomerId(name, phone) {
    if (!name && !phone) return null;
    
    const allDebts = await db.debts.toArray();
    const existing = allDebts.find(d => {
      if (name && d.name && d.name.toLowerCase() === name.toLowerCase()) return true;
      if (phone && d.phone && d.phone === phone) return true;
      return false;
    });
    
    return existing ? existing.customerId : null;
  }
  
  // Auto-generate ID when phone or name is entered (if ID field is empty)
  async function autoGenerateId() {
    if (customerIdInput.value) return; // Don't override if user has entered an ID
    
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    
    if (name || phone) {
      // First check if customer already exists
      const existingId = await findExistingCustomerId(name, phone);
      if (existingId) {
        customerIdInput.value = existingId;
      } else {
        // Generate new ID
        const nextId = await getNextCustomerId();
        customerIdInput.value = nextId;
      }
    }
  }
  
  phoneInput.addEventListener('input', autoGenerateId);
  form.name.addEventListener('input', autoGenerateId);
  
  // Validate ID when user edits it
  customerIdInput.addEventListener('blur', async () => {
    const enteredId = parseInt(customerIdInput.value);
    if (customerIdInput.value && enteredId > 0) {
      const name = form.name.value.trim();
      const phone = form.phone.value.trim();
      const isTaken = await isCustomerIdTaken(enteredId, name, phone);
      if (isTaken) {
        alert(`ID-ga ${enteredId} horay baa looqaatay. fadlan midka cusub qaado.`);
        const nextId = await getNextCustomerId();
        customerIdInput.value = nextId;
      }
    }
  });
  
  // Validate ID on input to ensure it's a positive number
  customerIdInput.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    if (e.target.value && (isNaN(value) || value < 1)) {
      e.target.value = '';
    }
  });
  
  form.addEventListener('submit', async e => {
    e.preventDefault(); // prevent page reload
  
    // Get or generate customer ID
    let customerId = parseInt(customerIdInput.value);
    
    // If no ID provided, generate one
    if (!customerId || customerId <= 0) {
      customerId = await getNextCustomerId();
      customerIdInput.value = customerId;
    }
    
    // Check if ID is already taken by a different customer
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const isTaken = await isCustomerIdTaken(customerId, name, phone);
    if (isTaken) {
      alert(`ID-ga${customerId} horay baa looqaatay. fadlan midka cusub qaado.`);
      const nextId = await getNextCustomerId();
      customerIdInput.value = nextId;
      return;
    }
  
    const debt = {
      customerId: customerId,
      name: form.name.value,
      phone: form.phone.value,
      amount: parseFloat(form.amount.value),
      date: form.date.value,
      time: form.time.value,
      status: 'unpaid'
    };
  
    try {
      await db.debts.add(debt); // store in IndexedDB
      alert(`Waa ladiiwangeliyay ${debt.name} - $${debt.amount} Balanta ${debt.date} ${debt.time}`);
      form.reset();
      // Clear the customer ID field so next entry gets auto-generated
      customerIdInput.value = '';
    } catch (error) {
      alert('Error saving debt: ' + error.message);
    }
  });





// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
});
