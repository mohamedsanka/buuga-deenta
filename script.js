// Initialize Dexie database for ID generation
const db = new Dexie('DebtDB');
db.version(1).stores({
  debts: '++id,customerId,name,phone,amount,date,time,note,status'
});

const loginModal = document.getElementById("loginModal");
const registerModal = document.getElementById("registerModal");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const closeButtons = document.querySelectorAll(".close");

// Show modals
loginBtn.addEventListener("click", () => loginModal.style.display = "flex");
registerBtn.addEventListener("click", () => registerModal.style.display = "flex");

// Close modals
closeButtons.forEach(btn => btn.addEventListener("click", () => {
  loginModal.style.display = "none";
  registerModal.style.display = "none";
}));

window.addEventListener("click", (e) => {
  if(e.target === loginModal) loginModal.style.display = "none";
  if(e.target === registerModal) registerModal.style.display = "none";
});

// Limit PIN to 4 digits
function limitToFourDigits(event) {
  if(event.target.id === 'pinRegister' || event.target.id === 'pinLogin' || event.target.id === 'pinRegisterConfirm') {
    if(event.target.value.length > 4) event.target.value = event.target.value.slice(0, 4);
  }
}
document.querySelectorAll('input[type="number"]').forEach(input => input.addEventListener('input', limitToFourDigits));

// Function to get the next available sequential ID (ordered from 1 to infinite)
async function getNextCustomerId() {
  try {
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
  } catch (error) {
    // If database is not accessible, start from 1
    return 1;
  }
}

// Function to find existing customer ID by name or phone
async function findExistingCustomerId(name, phone) {
  try {
    if (!name && !phone) return null;
    
    const allDebts = await db.debts.toArray();
    const existing = allDebts.find(d => {
      if (name && d.name && d.name.toLowerCase() === name.toLowerCase()) return true;
      if (phone && d.phone && d.phone === phone) return true;
      return false;
    });
    
    return existing ? existing.customerId : null;
  } catch (error) {
    return null;
  }
}

// Auto-generate ID when phone or name is entered in registration form
const customerIdRegister = document.getElementById('customerIdRegister');
const phoneRegister = document.getElementById('phoneRegister');
const nameRegister = document.getElementById('nameRegister');

async function autoGenerateRegisterId() {
  if (customerIdRegister.value) return; // Don't override if user has entered an ID
  
  const name = nameRegister.value.trim();
  const phone = phoneRegister.value.trim();
  
  if (name || phone) {
    // First check if customer already exists
    const existingId = await findExistingCustomerId(name, phone);
    if (existingId) {
      customerIdRegister.value = existingId;
    } else {
      // Generate new ID
      const nextId = await getNextCustomerId();
      customerIdRegister.value = nextId;
    }
  }
}

phoneRegister.addEventListener('input', autoGenerateRegisterId);
nameRegister.addEventListener('input', autoGenerateRegisterId);

// Validate ID on input to ensure it's a positive number
customerIdRegister.addEventListener('input', (e) => {
  const value = parseInt(e.target.value);
  if (e.target.value && (isNaN(value) || value < 1)) {
    e.target.value = '';
  }
});

// REGISTER
document.getElementById("registerForm").addEventListener("submit", async e => {
  e.preventDefault();
  const phone = phoneRegister.value;
  const pin = e.target.querySelector('#pinRegister').value;
  const pinConfirm = e.target.querySelector('#pinRegisterConfirm').value;
  const name = nameRegister.value;
  let customerId = parseInt(customerIdRegister.value);

  if(pin !== pinConfirm){
    alert("PINs aad gelisay waa khalad!");
    return;
  }

  // If no ID provided, generate one
  if (!customerId || customerId <= 0) {
    customerId = await getNextCustomerId();
    customerIdRegister.value = customerId;
  }

  // Store user data with customer ID
  localStorage.setItem(phone, JSON.stringify({name, pin, customerId}));
  alert(`Registered successfully! Your Customer ID is ${customerId}. Please login.`);
  registerModal.style.display = "none";
  loginModal.style.display = "flex";
  
  // Reset form
  e.target.reset();
  customerIdRegister.value = '';
});

// LOGIN
document.getElementById("loginForm").addEventListener("submit", e => {
  e.preventDefault();
  const phone = e.target.querySelector('input[type="tel"]').value;
  const pin = e.target.querySelector('#pinLogin').value;

  const user = JSON.parse(localStorage.getItem(phone));
  if(user && user.pin === pin){
    localStorage.setItem("currentUser", phone);
    alert("Welcome!");
    window.location.href = "dashboard.html";
  } else {
    alert("Waa khalad numberka ama PIN-ka");
  }
});
