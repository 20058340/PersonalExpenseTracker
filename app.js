// Base URL for API requests
const baseURL = "http://localhost:4000";


// Fetch Categories
function fetchCategories() {
    $.get(`${API_BASE_URL}/categories`, function (data) {
        $('#categories-list').empty();
        $('#expense-category, #budget-category').empty().append('<option value="">Select Category</option>');
        if (data.categories.length === 0) {
            $('#categories-list').append('<li>No categories available</li>');
        } else {
            data.categories.forEach(category => {
                $('#categories-list').append(`
                    <li>
                        ${category.name}
                        <button class="delete-category-btn" data-id="${category.id}">Delete</button>
                    </li>
                `);
                $('#expense-category').append(`<option value="${category.id}">${category.name}</option>`);
                $('#budget-category').append(`<option value="${category.id}">${category.name}</option>`);
            });
        }
    }).fail(function () {
        alert('Failed to fetch categories');
    });

}

// Add Category
function addCategory() {
    const categoryName = $('#category-name').val();
    if (!categoryName) {
        alert('Please enter a category name.');
        return;
    }

    $.ajax({
        url: `${API_BASE_URL}/categories`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ name: categoryName }),
        success: function () {
            alert('Category added successfully!');
            fetchCategories();
            $('#category-name').val('');
        },
        error: function () {
            alert('Failed to add category.');
        }
    });
}

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
                        <button class="edit-expense-btn" onclick="editExpense(${expense.id})">Edit</button>
                        <button class="delete-expense-btn" data-id="${expense.id}">Delete</button>
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
                    .then(() => {
                        loadExpenses();
                        updateBudgetStatus();

                        // Reset form and button text
                        document.getElementById('add-expense-form').reset();
                        submitButton.textContent = "Add Expense";
                        document.getElementById('add-expense-form').onsubmit = null;
                    })
                    .catch(error => console.error("Error updating expense:", error));
            };
        })
        .catch(error => console.error("Error fetching expense data:", error));
}

// jQuery-based Delete Expense
$(document).on('click', '.delete-expense-btn', function () {
    const expenseId = $(this).data('id');

    if (confirm('Are you sure you want to delete this expense?')) {
        $.ajax({
            url: `${baseURL}/expenses/${expenseId}`,
            method: 'DELETE',
            success: function () {
                alert('Expense deleted successfully!');
                loadExpenses(); // Refresh the expense list
                updateBudgetStatus(); // Refresh the budget status
            },
            error: function (xhr) {
                console.error('Error deleting expense:', xhr.responseText);
                alert('Failed to delete expense.');
            }
        });
    }
});

// Load budgets and display in budget summary
function updateBudgetStatus() {
    fetch(`${baseURL}/budgets`)
        .then(response => response.json())
        .then(data => {
            const budgetSummary = document.getElementById("budget-summary");
            budgetSummary.innerHTML = "";

            data.budgets.forEach(budget => {
                const isOverBudget = budget.total_spent > budget.limit_amount;
                const statusClass = isOverBudget ? "over-budget" : "within-budget";

                const budgetDiv = document.createElement("li");
                budgetDiv.classList.add("budget-item");

                budgetDiv.innerHTML = `
                    <strong>${budget.category_name}</strong>:
                    Limit: ${budget.limit_amount} |
                    Spent: ${budget.total_spent || 0} |
                    <span class="${statusClass}">${isOverBudget ? "Over Budget" : "Within Budget"}</span>
                    <button onclick="deleteBudget(${budget.id})">Delete</button>
                `;

                budgetSummary.appendChild(budgetDiv);
            });
        })
        .catch(error => console.error("Error loading budgets:", error));
}

