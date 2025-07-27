import  bcrypt from 'bcryptjs';
const hash = "$2b$10$dpeeLFhOQ4ytvtyw50/Ao.TvaENm5pfG/rzyW8iDfQvqFu/3niJ5K"; // from MongoDB
bcrypt.compare("Test@1234", hash).then(console.log); // should return true
const hash2 = "$2b$10$mvow25VnoMwNb.7v/7VXZO..2PwTQWTSxgSDC.icaICEybjNS9zBK";
bcrypt.compare("5678", hash2).then(console.log); // should return true