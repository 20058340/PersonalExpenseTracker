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