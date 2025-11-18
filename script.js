// Function to load card data from JSON file with nested categories support
async function loadCardData() {
    try {
        let response = await fetch('./cards_data.json', { cache: "no-store" }); // Prevent caching issues
        if (!response.ok) {
            throw new Error('Failed to fetch JSON file: ' + response.statusText);
        }
        let data = await response.json();

        console.log("JSON Data Loaded Successfully:", data); // Debugging log
        
        contentGroups = { ...data.contentGroups };
        functionGroups = { ...data.functionGroups };

        updateGroupSelection();
        updateFunctionSelection();

    } catch (error) {
        console.error("Error loading JSON data:", error);
        // Only show alert if contentGroups is still empty, meaning data hasn't loaded
        if (Object.keys(contentGroups).length === 0) {
            alert("Failed to load flashcard data. Please ensure the JSON file is accessible.");
        }
    }

    // (Note: previous inline JSON file-upload handler was nested here;
    // Excel upload is now handled by handleExcelUpload further down.)
}

// Initialize flashcard groups
let contentGroups = {};
let functionGroups = [];

// Function to show/hide sidebar
function toggleSidebar() {
    let sidebar = document.getElementById("sidebar");
    sidebar.classList.toggle("open");
}

// Function to create checkboxes for nested categories
function createCategoryCheckboxes(parentElement, categories) {
    Object.entries(categories).forEach(([category, items]) => {
        let container = document.createElement("div");
        container.classList.add("category-container");

        let categoryTitle = document.createElement("div");
        categoryTitle.classList.add("category-title");
        categoryTitle.textContent = category;

        let categoryCheckbox = document.createElement("input");
        categoryCheckbox.type = "checkbox";
        categoryCheckbox.classList.add("category-checkbox");
        categoryCheckbox.dataset.category = category;
        categoryCheckbox.onclick = (event) => {
            event.stopPropagation(); // Prevent dropdown expansion when clicking checkbox
        };
        categoryCheckbox.onchange = () => {
            let checkboxes = container.querySelectorAll(".content-checkbox");
            checkboxes.forEach(cb => cb.checked = categoryCheckbox.checked);
        };

        let contentDiv = document.createElement("div");
        contentDiv.classList.add("category-content");

        categoryTitle.prepend(categoryCheckbox);
        categoryTitle.onclick = (event) => {
            if (!event.target.classList.contains("category-checkbox")) {
                contentDiv.style.display = contentDiv.style.display === "block" ? "none" : "block";
            }
        };

        if (Array.isArray(items)) {
            items.forEach(item => {
                let label = document.createElement("label");
                let checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.classList.add("content-checkbox");
                checkbox.value = item;
                label.appendChild(checkbox);
                label.appendChild(document.createTextNode(" " + item));
                contentDiv.appendChild(label);
            });
        } else {
            createCategoryCheckboxes(contentDiv, items); // Recursive call for deeper nesting
        }

        container.appendChild(categoryTitle);
        container.appendChild(contentDiv);
        parentElement.appendChild(container);
    });
}

function updateGroupSelection() {
    const groupSelection = document.getElementById("groupSelection");
    if (!groupSelection) return;

    groupSelection.innerHTML = "";

    // Preloaded Content Section
    let preloadedContainer = document.createElement("div");
    preloadedContainer.classList.add("category-container");
    preloadedContainer.innerHTML = "<strong>Preloaded Content</strong>";
    createCategoryCheckboxes(preloadedContainer, contentGroups);
    groupSelection.appendChild(preloadedContainer);

    // Uploaded Content Section (Collapsible)
    if (Object.keys(contentGroups).some(key => key.startsWith("(Uploaded)"))) {
        let uploadedContainer = document.createElement("div");
        uploadedContainer.classList.add("category-container");
        
        let uploadedHeader = document.createElement("div");
        uploadedHeader.classList.add("category-title");
        uploadedHeader.textContent = "Uploaded Content";
        uploadedHeader.onclick = () => {
            uploadedContent.style.display = uploadedContent.style.display === "block" ? "none" : "block";
        };

        let uploadedContent = document.createElement("div");
        uploadedContent.classList.add("category-content");
        createCategoryCheckboxes(
            uploadedContent,
            Object.fromEntries(
                Object.entries(contentGroups).filter(([key]) => key.startsWith("(Uploaded)"))
            )
        );

        uploadedContainer.appendChild(uploadedHeader);
        uploadedContainer.appendChild(uploadedContent);
        groupSelection.appendChild(uploadedContainer);
    }
}

// Function to toggle function selection visibility
function toggleFunctionSelection(event) {
    // Prevent expanding/collapsing when clicking the checkbox
    if (event.target.id === "selectAllFunctions") return;

    let functionDiv = document.getElementById("functionSelection");
    if (!functionDiv) return;
    functionDiv.style.display = functionDiv.style.display === "block" ? "none" : "block";
}

// Function to populate function selection in the sidebar
function updateFunctionSelection() {
    const functionSelection = document.getElementById("functionSelection");
    if (!functionSelection) return;

    functionSelection.innerHTML = '';

    Object.entries(functionGroups).forEach(([category, functions]) => {
        let categoryContainer = document.createElement("div");
        categoryContainer.classList.add("function-container");

        let categoryHeader = document.createElement("div");
        categoryHeader.classList.add("function-title");

        let categoryCheckbox = document.createElement("input");
        categoryCheckbox.type = "checkbox";
        categoryCheckbox.classList.add("function-category-checkbox");
        categoryCheckbox.onchange = function(event) {
            event.stopPropagation(); // Prevent expansion toggle
            toggleCategoryFunctions(categoryCheckbox);
            updateSelectAllCheckbox();
        };

        let categoryText = document.createElement("span");
        categoryText.textContent = ` ${category} `;
        categoryText.onclick = function() {
            let functionList = categoryContainer.querySelector(".function-content");
            functionList.style.display = functionList.style.display === "block" ? "none" : "block";
        };

        categoryHeader.appendChild(categoryCheckbox);
        categoryHeader.appendChild(categoryText);

        let functionList = document.createElement("div");
        functionList.classList.add("function-content");
        functionList.style.display = 'none';

        functions.forEach(func => {
            let label = document.createElement("label");
            let checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.classList.add("function-checkbox");
            checkbox.value = func;
            checkbox.onchange = updateSelectAllCheckbox;

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(` ${func}`));
            functionList.appendChild(label);
        });

        categoryContainer.appendChild(categoryHeader);
        categoryContainer.appendChild(functionList);
        functionSelection.appendChild(categoryContainer);
    });
}

// Function to select/deselect all function cards
function toggleAllFunctionCards(event) {
    event.stopPropagation(); // Prevents the click from triggering toggleFunctionSelection
    let isChecked = document.getElementById("selectAllFunctions").checked;
    document.querySelectorAll(".function-category-checkbox, .function-checkbox").forEach(cb => {
        cb.checked = isChecked;
    });
}

// Update Select All Checkboxes
function updateSelectAllCheckbox() {
    let allFunctionCheckboxes = document.querySelectorAll(".function-checkbox");
    if (allFunctionCheckboxes.length === 0) return;
    let allChecked = Array.from(allFunctionCheckboxes).every(cb => cb.checked);
    let selectAll = document.getElementById("selectAllFunctions");
    if (selectAll) {
        selectAll.checked = allChecked;
    }
}

// Category wise Selection
function toggleCategoryFunctions(categoryCheckbox) {
    const functionContainer = categoryCheckbox.parentElement.nextElementSibling;
    const checkboxes = functionContainer.querySelectorAll('.function-checkbox');
    checkboxes.forEach(cb => cb.checked = categoryCheckbox.checked);
    updateSelectAllCheckbox(); // Ensure "Select All" checkbox reflects the change
}

// Function to generate random flashcards
function generateFlashcards() {
    let selectedContent = Array.from(document.querySelectorAll(".content-checkbox:checked"))
        .map(cb => cb.value)
        .filter(value => value.trim() !== "" && value !== "on"); // Filter out invalid values

    let selectedFunctions = Array.from(document.querySelectorAll(".function-checkbox:checked"))
        .map(cb => cb.value)
        .filter(value => value.trim() !== "" && value !== "on"); // Ensure only valid function names are selected

    let functionOnly = document.getElementById("functionOnly").checked;
    let contentOnly = document.getElementById("contentOnly").checked;

    if (selectedContent.length === 0 && !functionOnly) {
        alert("Please select at least one content card.");
        return;
    }

    if (selectedFunctions.length === 0 && !contentOnly) {
        alert("Please select at least one instruction card.");
        return;
    }

    let contentText = contentOnly 
        ? "Content"
        : selectedContent.length > 0 
            ? selectedContent[Math.floor(Math.random() * selectedContent.length)] 
            : "No content selected";

    let functionText = functionOnly 
        ? "Instruction"
        : selectedFunctions.length > 0 
            ? selectedFunctions[Math.floor(Math.random() * selectedFunctions.length)] 
            : "No instruction selected";

    let contentCard = document.getElementById("content-card");
    let functionCard = document.getElementById("function-card");

    if (contentCard) contentCard.innerText = contentText;
    if (functionCard) functionCard.innerText = functionText;
}

// 🔹 Mutually exclusive toggle for "content only" / "instruction only"
function toggleSelection(type) {
    const contentOnly = document.getElementById("contentOnly");
    const functionOnly = document.getElementById("functionOnly");

    if (!contentOnly || !functionOnly) return;

    if (type === "content" && contentOnly.checked) {
        functionOnly.checked = false;
    } else if (type === "function" && functionOnly.checked) {
        contentOnly.checked = false;
    }
}

// Ensure JSON data loads properly before running other scripts
document.addEventListener("DOMContentLoaded", async () => {
    await loadCardData();
    
    // Add click listeners to flashcards
    const contentCard = document.getElementById("content-card");
    const functionCard = document.getElementById("function-card");

    if (contentCard) {
        contentCard.addEventListener("click", function() {
            randomiseSingleCard("content");
        });
    }

    if (functionCard) {
        functionCard.addEventListener("click", function() {
            randomiseSingleCard("function");
        });
    }

    // Keyboard accessibility (Enter/Space to randomise)
    [contentCard, functionCard].forEach(card => {
        if (!card) return;
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (card.id === "content-card") randomiseSingleCard("content");
                if (card.id === "function-card") randomiseSingleCard("function");
            }
        });
    });

    // Theme toggle
    const themeToggleBtn = document.getElementById("toggleThemeBtn");
    const storedTheme = localStorage.getItem("revisionRandomiserTheme");

    if (storedTheme === "dark") {
        document.body.classList.remove("theme-light");
    } else if (storedTheme === "light") {
        document.body.classList.add("theme-light");
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", () => {
            const isLight = document.body.classList.contains("theme-light");
            if (isLight) {
                document.body.classList.remove("theme-light");
                localStorage.setItem("revisionRandomiserTheme", "dark");
            } else {
                document.body.classList.add("theme-light");
                localStorage.setItem("revisionRandomiserTheme", "light");
            }
        });
    }
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then((reg) => console.log("Service Worker Registered!", reg))
    .catch((err) => console.log("Service Worker Registration Failed!", err));
}

let deferredPrompt;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;

  // Create an install button
  let installButton = document.createElement("button");
  installButton.textContent = "Install App";
  installButton.style.position = "fixed";
  installButton.style.bottom = "20px";
  installButton.style.right = "20px";
  installButton.style.padding = "10px";
  installButton.style.background = "#007BFF";
  installButton.style.color = "#fff";
  installButton.style.border = "none";
  installButton.style.cursor = "pointer";
  installButton.style.zIndex = "9999";

  installButton.addEventListener("click", () => {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choice) => {
      if (choice.outcome === "accepted") {
        console.log("User installed the app");
      }
      installButton.remove();
    });
  });

  document.body.appendChild(installButton);
});

// 🔹 Load Nested Function Categories (kept for compatibility)
function loadFunctionCategories() {
    fetch('cards_data.json')
        .then(response => response.json())
        .then(data => {
            const functionSelectionDiv = document.getElementById('functionSelection');
            if (!functionSelectionDiv) return;

            functionSelectionDiv.innerHTML = ''; // Clear previous content

            Object.entries(data.functionGroups).forEach(([category, functions]) => {
                // Create Category Header
                const categoryContainer = document.createElement('div');
                categoryContainer.classList.add('function-container');

                const categoryHeader = document.createElement('div');
                categoryHeader.classList.add('function-title');
                categoryHeader.innerHTML = `<input type="checkbox" class="function-checkbox" onchange="toggleCategoryFunctions(this)"> ${category} `;

                // Create Function List (Initially Hidden)
                const functionList = document.createElement('div');
                functionList.classList.add('function-content');
                functionList.style.display = 'none';

                functions.forEach(func => {
                    const label = document.createElement('label');
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.classList.add('function-checkbox');
                    checkbox.value = func;
                    label.appendChild(checkbox);
                    label.appendChild(document.createTextNode(` ${func}`));
                    functionList.appendChild(label);
                });

                // Add Toggle Feature to Category Header
                categoryHeader.addEventListener('click', () => {
                    functionList.style.display = functionList.style.display === 'none' ? 'block' : 'none';
                });

                // Append to Sidebar
                categoryContainer.appendChild(categoryHeader);
                categoryContainer.appendChild(functionList);
                functionSelectionDiv.appendChild(categoryContainer);
            });
        })
        .catch(error => console.error('Error loading function categories:', error));
}

// Load function categories on page load
document.addEventListener('DOMContentLoaded', loadFunctionCategories);

// Randomise Single Card
function randomiseSingleCard(type) {
    if (type === "content") {
        let selectedContent = Array.from(document.querySelectorAll(".content-checkbox:checked"))
            .map(cb => cb.value)
            .filter(value => value.trim() !== "" && value !== "on");

        if (selectedContent.length === 0) {
            alert("Please select at least one content card.");
            return;
        }

        let contentText = selectedContent[Math.floor(Math.random() * selectedContent.length)];
        const contentCard = document.getElementById("content-card");
        if (contentCard) contentCard.innerText = contentText;
    }

    if (type === "function") {
        let selectedFunctions = Array.from(document.querySelectorAll(".function-checkbox:checked"))
            .map(cb => cb.value)
            .filter(value => value.trim() !== "" && value !== "on");

        if (selectedFunctions.length === 0) {
            alert("Please select at least one instruction card.");
            return;
        }

        let functionText = selectedFunctions[Math.floor(Math.random() * selectedFunctions.length)];
        const functionCard = document.getElementById("function-card");
        if (functionCard) functionCard.innerText = functionText;
    }
}

// Handle Excel File Upload
async function handleExcelUpload() {
    const fileInput = document.getElementById("fileInput");
    if (!fileInput || fileInput.files.length === 0) {
        alert("Please select an Excel file.");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function (event) {
        try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            let parsedData = parseExcelToJSON(workbook);

            // Merge uploaded data into the global storage
            Object.keys(parsedData.contentGroups).forEach(group => {
                contentGroups[`(Uploaded) ${group}`] = parsedData.contentGroups[group];
            });

            Object.keys(parsedData.functionGroups).forEach(group => {
                functionGroups[`(Uploaded) ${group}`] = parsedData.functionGroups[group];
            });

            // Ensure UI updates
            await loadCardData(); // Reload to integrate new data
            updateGroupSelection();
            updateFunctionSelection();

            alert("Flashcard data uploaded successfully!");
        } catch (error) {
            console.error("Error processing Excel file:", error);
            alert("Invalid Excel file format. Please check the structure.");
        }
    };

    reader.readAsArrayBuffer(file);
}

// Convert Excel File Data into JSON Format
function parseExcelToJSON(workbook) {
    let sheet = workbook.Sheets[workbook.SheetNames[0]];
    let jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    let contentGroups = {};
    let functionGroups = {};
    let currentCategory = "";
    let isFunctionGroup = false;

    jsonData.forEach((row) => {
        if (row.length === 0) return;

        if (row[0] === "Functions") {
            isFunctionGroup = true;
            return;
        }

        if (!isFunctionGroup) {
            if (row[0] && !row[1]) {
                currentCategory = `(Uploaded) ${row[0]}`; // Ensure "(Uploaded)" is prefixed
                contentGroups[currentCategory] = [];
            } else if (currentCategory && row[1]) {
                contentGroups[currentCategory].push(row[1]);
            }
        } else {
            if (row[0] && !row[1]) {
                currentCategory = `(Uploaded) ${row[0]}`;
                functionGroups[currentCategory] = [];
            } else if (currentCategory && row[1]) {
                functionGroups[currentCategory].push(row[1]);
            }
        }
    });

    return { contentGroups, functionGroups };
}

// Function to create and download an Excel template
function downloadExcelTemplate() {
    // Define the correct template structure
    const templateData = [
        ["Content Group", "Topic"], // Headers
        ["Greek History", "The Battle of Marathon"],
        ["", "The Battle of Salamis"],
        ["Roman History", "Caesar’s Assassination"],
        ["", "Augustus’ Reforms"],
        ["Functions", ""], // Separator
        ["Function Group", "Function Instruction"], // Function Headers
        ["Summarisation", "Summarise in 3 bullet points"],
        ["Recall", "Write a 5-minute paragraph"]
    ];

    // Create a new worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Flashcard Template");

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, "Flashcard_Template.xlsx");
}
