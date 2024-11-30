const { response } = require("express");

// Base URL for API requests
const baseURL = "http://localhost:3000";

// Load Categories into Dropdowns 
function loadCategories() {
    fetch(`${baseURL}/categories`)
        .then(response => response.json())
        .then(data => {
            const expenseCategoryDropdown = document.getElementById("expense-category");
            const budgetCategoryDropdown = document.getElementById("budget-category");


            expenseCategoryDropdown.innerHTML = "";
            budgetCategoryDropdown.innerHTML = ""; 

            console.log("Categories loaded:", data.categories);

            data.categories.forEach(category => {
                const option = document.createElement("option");
                option.value = category.id;
                option.textContent = category.name;
                expenseCategoryDropdown.appendChild(option);
            });
        })
        .catch(error => console.error("Error loading categories:", error));
}

// Add Expense - Handling Form Submission
document.getElementById('add-expense-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const amount = document.getElementById('expense-amount').value;
    const date = document.getElementById('expense-date').value;
    const category = document.getElementById('expense-category').value;
    const description = document.getElementById('expense-description').value;

    fetch(`${baseURL}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, date, category_id: category, description }),
    })
        .then(response => response.json())
        .then(data => {
            console.log("Expense added:", data);
            loadExpenses(); 
            updateBudgetStatus(); 
        })
        .catch(error => console.error("Error adding expense:", error));
});

// Load Expenses into the Table
function loadExpenses() {
    fetch(`${baseURL}/expenses`)
        .then(response => response.json())
        .then(data => {
            const expenseTableBody = document.getElementById("expense-table-body");
            expenseTableBody.innerHTML = ""; 

            data.expenses.forEach(expense => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${expense.amount}</td>
                    <td>${expense.date}</td>
                    <td>${expense.category_name}</td>
                    <td>${expense.description}</td>
                    <td>
                        <button onclick="editExpense(${expense.id})">Edit</button>
                        <button onclick="deleteExpense(${expense.id})">Delete</button>
                    </td>
                `;
                expenseTableBody.appendChild(row);
            });
        })
        .catch(error => console.error("Error loading expenses:", error));
}

// Function to edit an expense
function editExpense(id) {
    fetch(`${baseURL}/expenses/${id}`)
        .then(response => response.json())
        .then(expense => {
            // Pre-fill the form with the current expense data
            document.getElementById('expense-amount').value = expense.amount;
            document.getElementById('expense-date').value = expense.date;
            document.getElementById('expense-category').value = expense.category_id;
            document.getElementById('expense-description').value = expense.description;

            // Change the form button to "Update"
            const submitButton = document.querySelector("#add-expense-form button");
            submitButton.textContent = "Update Expense";

            // Modify the form submission to update the expense
            const form = document.getElementById('add-expenses-form');
            form.onsubmit = function (event) {
                event.preventDefault();

                // Get the updated values from the form
                const updatedAmount = document.getElementById('expense-amount').value;
                const updatedDate = document.getElementById('expense-date').value;
                const updatedCategory = document.getElementById('expense-category').value;
                const updatedDescription = document.getElementById('expense-description').value;

                // Send the updated expense data to the server
                fetch(`${baseURL}/expenses/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: updatedAmount,
                        date: updatedDate,
                        category_id: updatedCategory,
                        description: updatedDescription
                    })
                })
                .then(response => response.json())
                .then(data => {
                    console.log("Expense updated:", data);
                    loadExpenses(); // Reload the expenses table
                    updateBudgetStatus(); // Update budget status after updating expense
                    // Reset the form and button text
                    form.reset();
                    submitButton.textContent = "Add Expense";
                    form.onsubmit = addExpense; 
                })
                .catch(error => console.error("Error updating expense:", error));
            };
        })
        .catch(error => console.error("Error fetching expenses  data "));
    }
        
      
// Delete Expense
function deleteExpense(id) {
    if (confirm("Are you sure you want to delete this expense?")) {
        fetch(`${baseURL}/expenses/${id}`, { method: 'DELETE' })
            .then(response => {
                if (response.ok) {
                    console.log("Expense deleted successfully.");
                    loadExpenses(); // Reload expenses after deletion
                    updateBudgetStatus(); // Update budget status after deletion
                } else {
                    console.error("Error deleting expense.");
                }
            })
            .catch(error => console.error("Error deleting expense:", error));
    }
}

// Load Budget Categories into Dropdown
function loadBudgetCategories() {
    fetch(`${baseURL}/categories`)
        .then(response => response.json())
        .then(data => {
            const budgetCategoryDropdown = document.getElementById("budget-category");
            budgetCategoryDropdown.innerHTML = ""; // Clear existing options

            data.categories.forEach(category => {
                const option = document.createElement("option");
                option.value = category.id;
                option.textContent = category.name;
                budgetCategoryDropdown.appendChild(option);
            });
        })
        .catch(error => console.error("Error loading categories for budget:", error));
}



// Set or Update Budget
document.getElementById('set-budget-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const category = document.getElementById('budget-category').value;
    const limit = document.getElementById('budget-limit').value;

    fetch(`${baseURL}/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            category_id: category,
            limit_amount: limit
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log("Budget set:", data);
        loadBudgets();
    })
    .catch(error => console.error("Error setting budget:", error));
});

//delete budgets

function deleteBudget(id) {
    fetch(`${baseURL}/budgets/${id}`, {
        method: 'DELETE'
    })
    .then(response => response.json())
    .then(data => {
        console.log("Budgets deleted:", data);
        loadBudgets();
    })
    .catch(error => console.error("Error deleting budgets:", error));

}



// Load Budgets into the Summary Section
function updateBudgetStatus() {
    fetch(`${baseURL}/budgets`)
        .then(response => response.json())
        .then(data => {
            const budgetSummary = document.getElementById("budget-summary");
            budgetSummary.innerHTML = ""; 

            
            data.budgets.forEach(budget => {
                const div = document.createElement("div");
                div.classList.add("budget-status");

                const statusClass = budget.status === "Over Budget" ? "over-budget" : "within-budget";

                div.innerHTML = `
                    <strong>${budget.category_name}</strong>: 
                    Budget Limit: ${budget.limit_amount} | 
                    Total Spent: ${budget.total_spent || 0} | 
                    <button onclick ="deleteBudget(${budget.id})">Delete</button>
                `;

                budgetSummary.appendChild(div);
            });
        })
        .catch(error => console.error("Error fetching budget status:", error));
}

// Initialize Data on Page Load
loadCategories();
loadExpenses();
updateBudgetStatus();
loadBudgetCategories();
