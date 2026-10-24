// The native checkout sheet does not exist under Jest.
module.exports = {
  __esModule: true,
  default: { open: jest.fn(() => Promise.reject({ code: 0, description: '' })) },
};
