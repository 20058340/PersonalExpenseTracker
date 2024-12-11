$(document).ready(function () {
    const API_BASE_URL = 'http://localhost:4000';

    // Initial fetch
    fetchCategories();
    fetchExpenses();
    fetchBudgets();

    // Event Listeners
    $('#category-form').submit(function (e) {
        e.preventDefault();
        addCategory();
    });

    $('#expense-form').submit(function (e) {
        e.preventDefault();
        addOrUpdateExpense(); // Handles both adding and updating
    });

    $('#budget-form').submit(function (e) {
        e.preventDefault();
        setOrUpdateBudget(); // Handles both setting and updating
    });

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

    // Delete Category
    $(document).on('click', '.delete-category-btn', function () {
        const categoryId = $(this).data('id');
        if (confirm('Are you sure you want to delete this category?')) {
            $.ajax({
                url: `${API_BASE_URL}/categories/${categoryId}`,
                method: 'DELETE',
                success: function () {
                    alert('Category deleted successfully!');
                    fetchCategories();
                },
                error: function () {
                    alert('Failed to delete category.');
                }
            });
        }
    });

    // Fetch Expenses
    function fetchExpenses() {
        $.get(`${API_BASE_URL}/expenses`, function (data) {
            $('#expense-table-body').empty();

            if (data.expenses.length === 0) {
                $('#expense-table-body').append('<tr><td colspan="5">No expenses recorded</td></tr>');
            } else {
                data.expenses.forEach(expense => {
                    $('#expense-table-body').append(`
                        <tr>
                            <td>$${expense.amount}</td>
                            <td>${expense.date}</td>
                            <td>${expense.category_name}</td>
                            <td>${expense.description}</td>
                            <td>
                                <button class="edit-expense-btn" data-id="${expense.id}">Edit</button>
                                <button class="delete-expense-btn" data-id="${expense.id}">Delete</button>
                            </td>
                        </tr>
                    `);
                });
            }
        }).fail(function () {
            alert('Failed to fetch expenses');
        });
    }

    // Add or Update Expense
    function addOrUpdateExpense() {
        const expenseId = $('#expense-id').val(); // Hidden input for expense ID
        const amount = $('#expense-amount').val();
        const date = $('#expense-date').val();
        const categoryId = $('#expense-category').val();
        const description = $('#expense-description').val();

        if (!amount || !date || !categoryId || !description) {
            alert('Please fill in all fields.');
            return;
        }

        const method = expenseId ? 'PUT' : 'POST';
        const url = expenseId ? `${API_BASE_URL}/expenses/${expenseId}` : `${API_BASE_URL}/expenses`;

        $.ajax({
            url: url,
            method: method,
            contentType: 'application/json',
            data: JSON.stringify({ amount, date, category_id: categoryId, description }),
            success: function () {
                alert(`Expense ${expenseId ? 'updated' : 'added'} successfully!`);
                fetchExpenses();
                $('#expense-form')[0].reset();
                $('#expense-id').val(''); // Reset hidden input
                $('#expense-form button[type="submit"]').text('Add Expense'); // Reset button text
            },
            error: function () {
                alert(`Failed to ${expenseId ? 'update' : 'add'} expense.`);
            }
        });
    }

    // Edit Expense
    $(document).on('click', '.edit-expense-btn', function () {
        const expenseId = $(this).data('id');
        $.get(`${API_BASE_URL}/expenses/${expenseId}`, function (data) {
            $('#expense-id').val(data.id);
            $('#expense-amount').val(data.amount);
            $('#expense-date').val(data.date);
            $('#expense-category').val(data.category_id);
            $('#expense-description').val(data.description);
            $('#expense-form button[type="submit"]').text('Update Expense');
        });
    });

    // Delete Expense
    $(document).on('click', '.delete-expense-btn', function () {
        const expenseId = $(this).data('id');
        if (confirm('Are you sure you want to delete this expense?')) {
            $.ajax({
                url: `${API_BASE_URL}/expenses/${expenseId}`,
                method: 'DELETE',
                success: function () {
                    alert('Expense deleted successfully!');
                    fetchExpenses();
                },
                error: function () {
                    alert('Failed to delete expense.');
                }
            });
        }
    });

    // Fetch Budgets
    function fetchBudgets() {
        $.get(`${API_BASE_URL}/budgets`, function (data) {
            $('#budgets-table-body').empty();

            if (data.budgets.length === 0) {
                $('#budgets-table-body').append('<tr><td colspan="4">No budgets set</td></tr>');
            } else {
                data.budgets.forEach(budget => {
                    $('#budgets-table-body').append(`
                        <tr>
                            <td>${budget.category_name}</td>
                            <td>$${budget.limit_amount}</td>
                            <td>${budget.status}</td>
                            <td>
                                <button class="edit-budget-btn" data-id="${budget.id}" data-category-id="${budget.category_id}" data-limit="${budget.limit_amount}">Edit</button>
                                <button class="delete-budget-btn" data-id="${budget.id}">Delete</button>
                            </td>
                        </tr>
                    `);
                });
            }
        }).fail(function () {
            alert('Failed to fetch budgets');
        });
    }

    // Set or Update Budget
    function setOrUpdateBudget() {
        const budgetId = $('#budget-id').val(); // Hidden input for budget ID
        const categoryId = $('#budget-category').val();
        const limitAmount = $('#budget-limit').val();

        if (!categoryId || !limitAmount) {
            alert('Please fill in all fields.');
            return;
        }

        const method = budgetId ? 'PUT' : 'POST';
        const url = budgetId ? `${API_BASE_URL}/budgets/${budgetId}` : `${API_BASE_URL}/budgets`;

        $.ajax({
            url: url,
            method: method,
            contentType: 'application/json',
            data: JSON.stringify({ category_id: categoryId, limit_amount: limitAmount }),
            success: function () {
                alert(`Budget ${budgetId ? 'updated' : 'set'} successfully!`);
                fetchBudgets();
                $('#budget-form')[0].reset();
                $('#budget-id').val(''); // Reset hidden input
                $('#budget-form button[type="submit"]').text('Set Budget'); // Reset button text
            },
            error: function () {
                alert(`Failed to ${budgetId ? 'update' : 'set'} budget.`);
            }
        });
    }

    // Edit Budget
    $(document).on('click', '.edit-budget-btn', function () {
        const budgetId = $(this).data('id');
        const categoryId = $(this).data('category-id');
        const limitAmount = $(this).data('limit');
        $('#budget-id').val(budgetId);
        $('#budget-category').val(categoryId);
        $('#budget-limit').val(limitAmount);
        $('#budget-form button[type="submit"]').text('Update Budget');
    });

    // Delete Budget
    $(document).on('click', '.delete-budget-btn', function () {
        const budgetId = $(this).data('id');
        if (confirm('Are you sure you want to delete this budget?')) {
            $.ajax({
                url: `${API_BASE_URL}/budgets/${budgetId}`,
                method: 'DELETE',
                success: function () {
                    alert('Budget deleted successfully!');
                    fetchBudgets();
                },
                error: function () {
                    alert('Failed to delete budget.');
                }
            });
        }
    });
});
