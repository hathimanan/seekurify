// backend/phishing.js
import express from 'express';
const phishingRouter = express.Router();

const analyzeEmail = (text) => {
    let score = 0;
    const detections = [];
    const lower = text.toLowerCase();

    const headerStats = {
        spf: 'NOT FOUND',
        dkim: 'NOT FOUND',
        dmarc: 'NOT FOUND'
    };

    // --- HEADER AUTH CHECKS ---
    const patterns = {
        spf: /spf=(pass|fail|softfail|neutral|none)/i,
        dkim: /dkim=(pass|fail|none)/i,
        dmarc: /dmarc=(pass|fail|none)/i,
    };

    for (const key in patterns) {
        const match = text.match(patterns[key]);
        if (match) headerStats[key] = match[1].toUpperCase();

        if (match && match[1].toLowerCase() === 'fail') {
            score += key === 'spf' ? 50 : key === 'dmarc' ? 40 : 30;
            detections.push(`AUTH FAILURE: ${key.toUpperCase()} failed verification.`);
        }
    }

    // --- SUSPICIOUS LINKS ---
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    const links = text.match(linkRegex) || [];

    links.forEach(link => {
        const risky =
            link.includes('bit.ly') ||
            link.includes('.xyz') ||
            link.includes('secure-login') ||
            link.includes('verify-now') ||
            /[0-9]{4,}\.[a-z]{2,}/.test(link); // weird numeric domains

        if (risky) {
            score += 20;
            detections.push(`Suspicious Link: ${link}`);
        }
    });

    // --- SENDER DOMAIN CHECK ---
    const fromMatch = text.match(/from:\s*(.*?)\n/i);
    if (fromMatch) {
        const email = fromMatch[1];
        const displayDomain = email.split("@")[1]?.trim();
        const dkimDomain = text.match(/dkim-signature:.*?d=([^;\s]+)/i)?.[1];

        if (dkimDomain && displayDomain && dkimDomain !== displayDomain) {
            score += 30;
            detections.push(`Domain Mismatch: FROM domain (${displayDomain}) ≠ DKIM domain (${dkimDomain})`);
        }
    }

    // --- REPLY-TO TAMPERING ---
    const replyToMatch = text.match(/reply-to:\s*(.*?)\n/i);
    if (replyToMatch && fromMatch && replyToMatch[1] !== fromMatch[1]) {
        score += 20;
        detections.push(`Reply-To Mismatch: Email replies redirect to different address.`);
    }

    // --- URGENCY / SOCIAL ENGINEERING ---
    const triggers = [
        "urgent", "immediately", "verify your account",
        "your account will be suspended", "unauthorized login"
    ];

    triggers.forEach(trigger => {
        if (lower.includes(trigger)) {
            score += 10;
            detections.push(`Social Engineering: "${trigger}" detected.`);
        }
    });

    // Final Score Limit
    score = Math.min(score, 100);

    return {
        isAttacker: score >= 50,
        score,
        detections,
        headerStats
    };
};


phishingRouter.post('/detect-attacker', (req, res) => {
    const { emailContent } = req.body;
    if (!emailContent) return res.status(400).json({ error: "emailContent is required" });
    return res.json(analyzeEmail(emailContent));
});

export default phishingRouter;
