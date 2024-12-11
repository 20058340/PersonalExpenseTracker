module.exports = {
    transform: {
      '^.+\\.(js|jsx)$': 'babel-jest',
    },

    extensionsToTreatAsEsm: ['.js'],
    testEnvironment: 'jsdom',
  };
  