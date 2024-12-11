import $ from 'jquery';

const $ = require('jquery'); 
const app = require('./app');


jest.mock('jquery', () => ({
    get: jest.fn(),
    ajax: jest.fn(),
}));

describe('Expense Tracker Application', () => {

    // Test fetching categories
    it('should fetch categories and display them', async () => {
        $.get.mockImplementationOnce((url, callback) => {
            callback({ categories: [{ id: 1, name: 'Food' }, { id: 2, name: 'Entertainment' }] });
        });

        // Call fetchCategories function
        await app.fetchCategories();

        expect($('#categories-list').html()).toContain('Food');
        expect($('#categories-list').html()).toContain('Entertainment');
    });

    // Test adding a new category
    it('should add a new category', async () => {
        $.ajax.mockImplementationOnce((options) => {
            expect(options.method).toBe('POST');
            expect(options.url).toBe('http://localhost:4000/categories');
            expect(options.data).toEqual(JSON.stringify({ name: 'Transport' }));
            options.success();
        });

        // Simulate adding a category
        $('#category-name').val('Transport');
        await app.addCategory();

        expect($('#category-name').val()).toBe('');
        expect($('#categories-list').html()).toContain('Transport');
    });

    // Test expense form validation
    it('should not add an expense if required fields are empty', () => {
        $('#expense-amount').val('');
        $('#expense-date').val('');
        $('#expense-category').val('');
        $('#expense-description').val('');

        app.addOrUpdateExpense();

        // Ensure no call to API is made if fields are empty
        expect($.ajax).not.toHaveBeenCalled();
    });

    // Test expense validation for valid date format
    it('should validate date format correctly', () => {
        $('#expense-amount').val('100');
        $('#expense-date').val('2024-12-11'); 
        $('#expense-category').val('1');
        $('#expense-description').val('Lunch');

        app.addOrUpdateExpense();

        expect($.ajax).toHaveBeenCalled();
    });

    // Test deleting an expense
    it('should delete an expense', async () => {
        
        $.ajax.mockImplementationOnce((options) => {
            expect(options.method).toBe('DELETE');
            expect(options.url).toBe('http://localhost:4000/expenses/1');
            options.success(); // Mock success callback
        });

        
        await app.deleteExpense(1);

        
        expect($('#expense-table-body').html()).not.toContain('Expense 1');
    });

    // Test editing an expense
    it('should edit an existing expense', async () => {
        
        $.get.mockImplementationOnce((url, callback) => {
            callback({
                id: 1,
                amount: 50,
                date: '2024-12-10',
                category_name: 'Food',
                description: 'Dinner'
            });
        });
        await app.editExpense(1);

        expect($('#expense-id').val()).toBe('1');
        expect($('#expense-amount').val()).toBe('50');
        expect($('#expense-category').val()).toBe('Food');
        expect($('#expense-description').val()).toBe('Dinner');
    });

    // Test fetching expenses
    it('should fetch expenses and display them', async () => {
    
        $.get.mockImplementationOnce((url, callback) => {
            callback({ expenses: [{ id: 1, amount: 100, date: '2024-12-10', category_name: 'Food', description: 'Lunch' }] });
        });

        await app.fetchExpenses();

        expect($('#expense-id').val()).toBe('1');
        expect($('#expense-amount').val()).toBe('50');
        expect($('#expense-category').val()).toBe('Food');
        expect($('#expense-description').val()).toBe('Dinner');
    });

    // Test fetching expenses
    it('should fetch expenses and display them', async () => {
        
        $.get.mockImplementationOnce((url, callback) => {
            callback({ expenses: [{ id: 1, amount: 100, date: '2024-12-10', category_name: 'Food', description: 'Lunch' }] });
        });
        await app.fetchExpenses();

        expect($('#expense-table-body').html()).toContain('100');
        expect($('#expense-table-body').html()).toContain('Lunch');
    });

    // Test form submission button disable and enable
    it('should disable submit button while submitting', async () => {
        $('#expense-amount').val('100');
        $('#expense-date').val('2024-12-10');
        $('#expense-category').val('Food');
        $('#expense-description').val('Lunch');

        const submitButton = $('#expense-form button[type="submit"]');
        submitButton.prop('disabled', false);

        await app.addOrUpdateExpense();

        expect(submitButton.prop('disabled')).toBe(true);

        await app.completeSubmit(); 
        expect(submitButton.prop('disabled')).toBe(false);
    });

});
