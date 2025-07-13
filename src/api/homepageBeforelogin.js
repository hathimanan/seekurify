import express from 'express';

const router = express.Router();

// Homepage content for unauthenticated users
router.get('/', (req, res) => {
  res.json({
    appName: "Securify",
    tagline: "Secure Your Digital Life",
    navLinks: [
      { label: "Home Page", path: "/" },
      { label: "About Securify", path: "/about" },
      { label: "Contact Us", path: "/contact" }
    ],
    buttons: {
      signup: "Signup",
      login: "Login"
    },
    about: {
      heading: "About Securify",
      description:
        "Securify is a modern password manager that lets you securely store, access, and manage your passwords from anywhere. Your credentials are encrypted and never shared."
    }
  });
});

export default router;
