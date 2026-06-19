const generateSerialNumber = () => {
  const random = Math.floor(100000 + Math.random() * 900000);

  return `SER-${random}`;
};

const generateRegistrationNumber = () => {
  const year = new Date().getFullYear();

  const random = Math.floor(1000 + Math.random() * 9000);

  return `REG/${year}/${random}`;
};

module.exports = {
  generateSerialNumber,
  generateRegistrationNumber,
};