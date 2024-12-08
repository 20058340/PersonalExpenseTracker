//const { response } = require("express");

//const { response } = require("express");

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

            
            data.categories.forEach(category => {
                const option = document.createElement("option");
                option.value = category.id;
                option.textContent = category.name;
                
                expenseCategoryDropdown.appendChild(option.cloneNode(true));
                budgetCategoryDropdown.appendChild(option);
            });
            console.log("Categories loaded:", data.categories);
        })
        .catch(error => console.error("Error loading categories:", error));
}

// Add Expense - Handling Form Submission
document.getElementById("add-expense-form").addEventListener("submit", function (event) {
    event.preventDefault();

    const amount = parseFloat(document.getElementById("expense-amount").value);
    const date = document.getElementById("expense-date").value;
    const category = parseInt(document.getElementById("expense-category").value);
    const description = document.getElementById("expense-description").value;

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
            event.target.reset(); 
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


            document.getElementById('add-expense-form').onsubmit = function (event) {
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
                    loadExpenses(); 
                    updateBudgetStatus(); 

                    
                    submitButton.textContent= "Add-Expense";
                    event.target.reset();
                    
                })
                .catch(error => console.error("Error updating expense:", error));
            };
        })
        .catch(error => console.error("Error fetching expenses  data ", error));
    }
        
      
// Delete Expense
function deleteExpense(id) {
    if (confirm("Are you sure you want to delete this expense?")) {
        fetch(`${baseURL}/expenses/${id}`, { method: 'DELETE' })
            .then(() => {
                loadExpenses(); 
                updateBudgetStatus();
            }) 
            .catch(error => console.error("Error deleting expense:", error));
    }
}

// Load budgets and display in budget summary 

function updateBudgetStatus() {
    fetch(`${baseURL}/budgets`)
        .then(response =>response.json())
        .then(data=> {
            console.log("Budgets fetched:", data);
            const budgetSummary = document.getElementById("budget-summary");
            budgetSummary.innerHTML = "";
    

            data.budgets.forEach(budgets =>  {
                const isOverBudget = budgets.total_spent > budgets.limit_amount;
                const statusClass = isOverBudget ? "over-budget" : " within-budget " ;

                const budgetDiv = document.createElement("li");
                budgetDiv.classList.add("budget-item");

                budgetDiv.innerHTML = `
                <strong>${ budgets.category_name}</strong>:
                Limit: ${budgets.limit_amount} |
                Spent: ${budgets.total_spent || 0} |
                <span class= "${statusClass}">${isOverBudget ? "Over Budget" : "Within Budgets"}</span>
                <button onclick= "deleteBudget(${budgets.id})">Delete</button>
                `;

                budgetSummary.appendChild(budgetDiv);

                });
            })

            .catch(error => console.error("Error loading budgets:", error));

}

// Set or update a budget
document.getElementById('set-budget-form').addEventListener('submit', function (event) {
    event.preventDefault();

    const category = document.getElementById('budget-category').value;
    const limit = document.getElementById('budget-limit').value;

    console.log("Category ID:", category);
    console.log("Limit Amount:", limit);

    if (!category || !limit) {
        alert("Please select a category and enter a budget limit.");
        return;
    }


    fetch(`${baseURL}/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: category, limit_amount: limit }),
    })
    
    .then(response => response.json())
    .then(data => {
        console.log("Budget set:", data);
    })
    .catch(error => console.error("Error setting budget:", error));
});




//delete budget
function deleteBudget(id) {
    console.log("Deleting budget with ID:", id);
    if (confirm("Are you sure you want to delete this budget?")) {
        fetch(`${baseURL}/budgets/${id}`, { method: 'DELETE' })

        .then(response => {
            console.log(`Delete request status for budget ID ${id}:`, response.status);
            if (response.ok) {
                console.log("Budget deleted successfully.");
                updateBudgetStatus();

            }else {
                console.error(`Error deleting budget.Status: ${response.statusText}`);
            }
        })
            
            
        .catch(error => console.error("Error deleting budget:", error));
     
    }
}



// Initialize Data on Page Load
loadCategories();
loadExpenses();
updateBudgetStatus();
