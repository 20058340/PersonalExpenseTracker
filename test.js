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