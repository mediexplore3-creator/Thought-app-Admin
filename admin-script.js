// admin-script.js
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { db } from './firebase-config.js';

// =============== DOM Elements ===============
// --- Add Thought Section ---
const thoughtForm = document.getElementById('thoughtForm');
const categorySelect = document.getElementById('category'); // Renamed for clarity
const inputContainer = document.getElementById('inputContainer');
const thoughtPreview = document.getElementById('thoughtPreview');

// --- App Info Section ---
const infoForm = document.getElementById('infoForm');

// --- Daily Content Section ---
const dailyContentForm = document.getElementById('dailyContentForm');
const dailyContentPreview = document.getElementById('dailyContentPreview');
const quoteInput = document.getElementById('quote');
const quoteAuthorInput = document.getElementById('quoteAuthor'); // Added
const tipInput = document.getElementById('tip');
const achievementInput = document.getElementById('achievement');
const milestoneInput = document.getElementById('milestone'); // Added
const themeSelect = document.getElementById('theme');
const customThemeUrlInput = document.getElementById('customThemeUrl');

// --- Manage Sections (Tables) ---
const usersTableBody = document.querySelector('#usersTable tbody');
const thoughtsTableBody = document.querySelector('#thoughtsTable tbody'); // Target correct table

// =============== EVENT LISTENERS ===============

// --- Add Thought Form Listeners ---
categorySelect.addEventListener('change', () => {
    updateContentInput();
    updateThoughtPreview(); // Update preview on category change
});
inputContainer.addEventListener('input', updateThoughtPreview); // Update preview on typing

thoughtForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const selectedCategory = categorySelect.value;
  const contentEl = document.getElementById('content'); // Get content input dynamically

  if (!selectedCategory || !contentEl || !contentEl.value.trim()) {
    alert('❌ Please fill all fields.');
    return;
  }

  const content = contentEl.value.trim();
  // Determine type based on category
  const type = selectedCategory === 'images' ? 'image' : 'text';

  try {
    await addDoc(collection(db, 'thoughts'), {
      type,
      category: selectedCategory, // Use the selected category value (text/images)
      content
    });
    alert('✅ Thought added successfully!');
    thoughtForm.reset();
    inputContainer.innerHTML = ''; // Clear dynamic input
    updateThoughtPreview(); // Clear preview
    loadThoughts(); // Refresh the thoughts management table
  } catch (err) {
    console.error('Error adding thought:', err);
    alert('❌ Save failed: ' + err.message);
  }
});

// --- App Info Form Listener ---
infoForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    developer: document.getElementById('developer').value.trim(),
    minOS: document.getElementById('minOS').value.trim(),
    buildNumber: document.getElementById('buildNumber').value.trim(),
    version: document.getElementById('version').value.trim()
  };

  if (!data.developer || !data.minOS || !data.buildNumber || !data.version) {
    alert('❌ All fields are required!');
    return;
  }

  if (!/^(\d+\.){2}\d+$/.test(data.version)) {
    alert('❌ Version must be in format: 1.0.0');
    return;
  }

  try {
    await setDoc(doc(db, 'app_info', 'details'), data);
    alert('✅ App Info saved successfully!');
  } catch (err) {
    alert('❌ Failed: ' + err.message);
  }
});

// --- Daily Content Form Listeners ---
themeSelect.addEventListener('change', () => {
  customThemeUrlInput.style.display = themeSelect.value === 'custom' ? 'block' : 'none';
  updateDailyContentPreview(); // Update preview on theme change
});

// Update preview when any daily content field changes
[quoteInput, quoteAuthorInput, tipInput, achievementInput, milestoneInput, themeSelect, customThemeUrlInput].forEach(el => {
    el.addEventListener('input', updateDailyContentPreview);
});

dailyContentForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = {
    quote: quoteInput.value.trim(),
    quoteAuthor: quoteAuthorInput.value.trim(),
    tip: tipInput.value.trim(),
    theme: themeSelect.value,
    customThemeUrl: themeSelect.value === 'custom' ? customThemeUrlInput.value.trim() : '',
    achievement: achievementInput.value.trim(),
    milestone: milestoneInput.value.trim(),
    updatedAt: new Date().toISOString()
  };

  // Basic validation for custom theme URL if selected
  if (data.theme === 'custom' && !data.customThemeUrl) {
      alert('❌ Please provide a Custom Image URL.');
      return;
  }
  // Note: Removed check for quoteAuthor if quote exists to allow anonymous quotes if desired.

  try {
    await setDoc(doc(db, 'daily_content', 'today'), data);
    alert('✨ Daily Experience Published!');
    // Optional: Reload preview or give confirmation
  } catch (err) {
    alert('❌ Failed: ' + err.message);
  }
});

// --- Load Data on Startup ---
document.addEventListener('DOMContentLoaded', () => {
  loadUsers();      // Load users for management
  loadAppInfo();    // Load app settings
  loadDailyContent(); // Load daily content settings
  loadThoughts();   // Load thoughts for management
});

// =============== FUNCTIONS ===============

// --- Add Thought Helpers ---
function updateContentInput() {
    const selectedCategory = categorySelect.value;
    inputContainer.innerHTML = ''; // Clear previous input

    if (selectedCategory === 'text') {
        inputContainer.innerHTML = `
            <textarea id="content" placeholder="Enter your thought" rows="4" required></textarea>
        `;
    } else if (selectedCategory === 'images') {
        inputContainer.innerHTML = `
            <input type="url" id="content" placeholder="https://example.com/image.jpg" required />
        `;
    }
    // Add input listener to the newly created element
    const contentEl = document.getElementById('content');
    if (contentEl) {
        contentEl.addEventListener('input', updateThoughtPreview);
    }
}

function updateThoughtPreview() {
    const selectedCategory = categorySelect.value;
    const contentEl = document.getElementById('content');
    const content = contentEl ? contentEl.value.trim() : '';

    // Clear previous preview
    thoughtPreview.innerHTML = '<p class="preview-placeholder">Preview will appear here...</p>';

    if (!selectedCategory) return; // Do nothing if no category selected

    if (selectedCategory === 'text' && content) {
        thoughtPreview.innerHTML = `<div class="preview-card"><p>${content}</p></div>`;
    } else if (selectedCategory === 'images' && content) {
        // Basic URL validation
        if (content.startsWith('http')) {
             thoughtPreview.innerHTML = `<div class="preview-card"><img src="${content}" alt="Preview Image" style="max-width:100%; max-height: 150px; border-radius: 8px;"></div>`;
        } else {
             thoughtPreview.innerHTML = `<div class="preview-card"><p style="color: #e74c3c;">Invalid URL format</p></div>`;
        }
    }
    // If category selected but no content, placeholder remains
}

// --- Daily Content Helpers ---
function updateDailyContentPreview() {
    const quote = quoteInput.value.trim();
    const tip = tipInput.value.trim();
    const achievement = achievementInput.value.trim();
    // Milestone is not shown in toast preview per previous instructions
    const theme = themeSelect.value;

    // Clear previous preview
    dailyContentPreview.innerHTML = '<p class="preview-placeholder">Toast preview will appear here...</p>';

    let previewHTML = '<div class="toast-preview">';
    let hasContent = false;
    if (quote) {
        // Include quote author in preview if provided
        const author = quoteAuthorInput.value.trim();
        const fullQuote = author ? `"${quote}" — ${author}` : `"${quote}"`;
        previewHTML += `<p><i class="fas fa-quote-left" style="color: #f1c40f;"></i> <strong>Quote:</strong> ${fullQuote}</p>`;
        hasContent = true;
    }
    if (tip) {
        previewHTML += `<p><i class="fas fa-lightbulb" style="color: #2ecc71;"></i> <strong>Tip:</strong> ${tip}</p>`;
        hasContent = true;
    }
    if (achievement) {
        previewHTML += `<p><i class="fas fa-certificate" style="color: #e74c3c;"></i> <strong>Achievement:</strong> ${achievement}</p>`;
        hasContent = true;
    }

    if (!hasContent) {
         previewHTML += '<p style="color: #95a5a6; font-style: italic;">No content to preview.</p>';
    }
    previewHTML += '</div>';

    // Apply theme style to preview
    let previewStyle = '';
    if (theme === 'soft') {
      previewStyle = 'background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%); color: #2c3e50;';
    } else if (theme === 'dark') {
      previewStyle = 'background: #1a1a2e; color: white;';
    } else if (theme === 'ocean') {
      previewStyle = 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;';
    } else if (theme === 'sunset') {
      previewStyle = 'background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); color: #2c3e50;';
    } else if (theme === 'forest') {
      previewStyle = 'background: linear-gradient(135deg, #1d976c 0%, #93f9b9 100%); color: white;';
    } else if (theme === 'custom') {
        // For custom, show a placeholder or default
        previewStyle = 'background: rgba(25, 24, 24, 0.95); color: white;'; // Default for custom preview
        // Could potentially try to use customThemeUrl for background, but complex in preview
    } else {
      // Default toast style if no theme or default selected
      previewStyle = 'background: rgba(25, 24, 24, 0.95); color: white;';
    }

    dailyContentPreview.innerHTML = previewHTML;
    // Apply combined styles
    dailyContentPreview.style.cssText = previewStyle + ' padding: 15px; border-radius: 12px; font-size: 0.85rem; line-height: 1.4; border: 1px solid rgba(255,255,255,0.1);';
}

// --- User Management ---
async function loadUsers() {
  try {
    // Query users ordered by name for consistent display
    const q = query(collection(db, 'users'), orderBy('name'));
    const snapshot = await getDocs(q);
    usersTableBody.innerHTML = ''; // Clear existing rows
    if (snapshot.empty) {
      usersTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No users found.</td></tr>';
      return;
    }
    snapshot.forEach(doc => {
      const data = doc.data();
      const row = document.createElement('tr');
      // Include User ID column
      row.innerHTML = `
        <td>${doc.id.substring(0, 6)}...</td> <!-- Truncate ID for display -->
        <td>${data.name || 'N/A'}</td>
        <td>${data.email || 'N/A'}</td>
        <td><button class="delete-btn" data-id="${doc.id}" data-type="user"><i class="fas fa-trash"></i></button></td>
      `;
      usersTableBody.appendChild(row);
    });
    // Re-attach event listeners to new delete buttons
    document.querySelectorAll('.delete-btn[data-type="user"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            deleteUser(id);
        });
    });
  } catch (err) {
    console.error('Error loading users:', err);
    usersTableBody.innerHTML = '<tr><td colspan="4">Failed to load users.</td></tr>';
  }
}

async function deleteUser(id) {
    // Confirmation dialog
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
        await deleteDoc(doc(db, 'users', id));
        alert('✅ User deleted.');
        loadUsers(); // Refresh user list
    } catch (err) {
        alert('❌ Delete failed: ' + err.message);
    }
}

// --- App Info Management ---
async function loadAppInfo() {
  try {
    const docRef = doc(db, 'app_info', 'details');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Populate form fields
      document.getElementById('developer').value = data.developer || '';
      document.getElementById('minOS').value = data.minOS || '';
      document.getElementById('buildNumber').value = data.buildNumber || '';
      document.getElementById('version').value = data.version || '';
    } else {
        // Handle case where document doesn't exist (optional)
        console.log("No app_info document found.");
        // Could reset form fields to empty here if desired
    }
  } catch (err) {
    console.error('Load app info error:', err);
    // Optionally alert user
  }
}

// --- Daily Content Management ---
async function loadDailyContent() {
  try {
    const docRef = doc(db, 'daily_content', 'today');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Populate form fields
      quoteInput.value = data.quote || '';
      quoteAuthorInput.value = data.quoteAuthor || '';
      tipInput.value = data.tip || '';
      themeSelect.value = data.theme || '';
      // Handle custom theme URL input visibility
      if (data.theme === 'custom') {
        customThemeUrlInput.style.display = 'block';
        customThemeUrlInput.value = data.customThemeUrl || '';
      } else {
        customThemeUrlInput.style.display = 'none'; // Hide if not custom
        customThemeUrlInput.value = ''; // Clear value if hidden
      }
      achievementInput.value = data.achievement || '';
      milestoneInput.value = data.milestone || '';
      updateDailyContentPreview(); // Show loaded data in preview
    } else {
        // Handle case where document doesn't exist (optional)
        console.log("No daily_content document found.");
        // Reset form/preview? Not strictly necessary as fields default to empty.
        themeSelect.value = ''; // Ensure theme select is reset
        customThemeUrlInput.style.display = 'none';
        updateDailyContentPreview(); // Show empty preview
    }
  } catch (err) {
    console.error('Load daily content error:', err);
    // Optionally alert user or reset form
    themeSelect.value = '';
    customThemeUrlInput.style.display = 'none';
    updateDailyContentPreview(); // Show error state in preview?
  }
}

// --- Thought Management ---
async function loadThoughts() {
  try {
    // Query thoughts, potentially ordered
    const q = query(collection(db, 'thoughts'), orderBy('category'));
    const snapshot = await getDocs(q);
    thoughtsTableBody.innerHTML = ''; // Clear existing rows
    if (snapshot.empty) {
      thoughtsTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No thoughts found.</td></tr>';
      return;
    }
    snapshot.forEach(doc => {
      const data = doc.data();
      // Create a short preview of the content for the table
      let displayContent = '';
      if (data.type === 'image') {
          // Show a small thumbnail or icon
          displayContent = `<img src="${data.content}" alt="Thought Image" style="max-height: 50px; border-radius: 4px;" onerror="this.style.display='none'; this.outerHTML='<span>Image</span>';">`;
      } else {
          // Truncate long text
          displayContent = data.content.substring(0, 50) + (data.content.length > 50 ? '...' : '');
      }
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${data.type}</td>
        <td>${data.category}</td>
        <td>${displayContent}</td>
        <td><button class="delete-btn" data-id="${doc.id}" data-type="thought"><i class="fas fa-trash"></i></button></td>
      `;
      thoughtsTableBody.appendChild(row); // Append to the correct, dedicated table
    });
    // Re-attach event listeners to new delete buttons
    document.querySelectorAll('.delete-btn[data-type="thought"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            deleteThought(id);
        });
    });
  } catch (err) {
    console.error('Error loading thoughts:', err);
    thoughtsTableBody.innerHTML = '<tr><td colspan="4">Failed to load thoughts.</td></tr>';
  }
}

async function deleteThought(id) {
    // Confirmation dialog
    if (!confirm("Are you sure you want to delete this thought?")) return;
    try {
        await deleteDoc(doc(db, 'thoughts', id));
        alert('✅ Thought deleted.');
        loadThoughts(); // Refresh thought list
    } catch (err) {
        alert('❌ Delete failed: ' + err.message);
    }
}
