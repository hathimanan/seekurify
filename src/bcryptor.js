import  bcrypt from 'bcryptjs';
const hash = "$2b$10$Yb2s6IIwsfownCfCWteki.TFXYx9AKhUgbjG/VUHmYtE5MxsDQvDW"; // from MongoDB
bcrypt.compare("Test@123456", hash).then(console.log); // should return true
const hash2 = "$2b$10$HnpHC5xwuU.iVxhT5M4KuerYmsPdqnPjXr5tbTq2kNUZNlrhlFfye";
bcrypt.compare("$2b$10$Yb2s6IIwsfownCfCWteki.TFXYx9AKhUgbjG/VUHmYtE5MxsDQvDW", hash2).then(console.log); // should return true