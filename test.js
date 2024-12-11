const $ = require('jquery'); 
const app = require('./app');

jest.mock('jquery', () => ({
    get: jest.fn(),
    ajax: jest.fn(),
}));