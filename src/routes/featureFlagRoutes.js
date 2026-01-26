import express from "express";
import featureflags from "../models/featureFlag.js";
import { adminAuth } from "../middleware/adminAuth.js";

const featureFlagRoutes = express.Router();

// ============================================
// PUBLIC ROUTES FIRST (before any /:key route)
// ============================================

// PUBLIC ENDPOINT - Read feature flags for frontend
// routes/featureFlags.js

featureFlagRoutes.get("/read", async (req, res) => {
  try {
    const otpFlag = await featureflags.findOne({ key: "otp_verification" });
    const pinPMFlag = await featureflags.findOne({
      key: "pin_verification_password_manager",
    });
    const pinSIEMFlag = await featureflags.findOne({
      key: "pin_verification_siem",
    });
    const phishingDetectorFlag = await featureflags.findOne({
      key: "phishing_detector",
    });
    const securityChatbotFlag = await featureflags.findOne({
      key: "security_chatbot", // ✅ Add Security Chatbot flag
    });

    res.json({
      otpEnabled: otpFlag ? otpFlag.enabled : true,
      pinVerificationPasswordManager: pinPMFlag ? pinPMFlag.enabled : false,
      pinVerificationSIEM: pinSIEMFlag ? pinSIEMFlag.enabled : false,
      phishingDetectorEnabled: phishingDetectorFlag ? phishingDetectorFlag.enabled : false,
      securityChatbotEnabled: securityChatbotFlag ? securityChatbotFlag.enabled : false, // ✅ Add to response
    });
  } catch (err) {
    console.error("Error reading feature flags:", err);
    res.status(500).json({
      otpEnabled: true,
      pinVerificationPasswordManager: false,
      pinVerificationSIEM: false,
      phishingDetectorEnabled: false,
      securityChatbotEnabled: false, // ✅ Safe default
    });
  }
});

// CHECK if feature is enabled (public endpoint with optional user context)
featureFlagRoutes.post("/check", async (req, res) => {
  try {
    const { key, userId } = req.body;

    if (!key) {
      return res.status(400).json({ 
        enabled: false, 
        error: "Key is required" 
      });
    }

    const flag = await featureflags.findOne({ key });

    if (!flag) {
      return res.json({ 
        enabled: false, 
        exists: false 
      });
    }

    // Check rollout percentage (for gradual rollouts)
    let isEnabled = flag.enabled;
    
    if (isEnabled && flag.rolloutPercentage < 100) {
      if (userId) {
        // Use hash of userId for consistent rollout
        const hash = userId.split('').reduce((acc, char) => {
          return ((acc << 5) - acc) + char.charCodeAt(0);
        }, 0);
        isEnabled = (Math.abs(hash) % 100) < flag.rolloutPercentage;
      } else {
        isEnabled = Math.random() * 100 < flag.rolloutPercentage;
      }
    }

    res.json({
      enabled: isEnabled,
      exists: true,
      rolloutPercentage: flag.rolloutPercentage,
      key: flag.key
    });
  } catch (err) {
    console.error("Error checking feature flag:", err);
    res.status(500).json({ 
      enabled: false, 
      error: "Failed to check feature flag" 
    });
  }
});

// ============================================
// ADMIN ROUTES - Specific paths before /:key
// ============================================

// CREATE a flag (admin only)
featureFlagRoutes.post("/create", adminAuth, async (req, res) => {
  try {
    const { key, name, description, enabled, allowedRoles, rolloutPercentage } = req.body;

    // Validation
    if (!key || !name) {
      return res.status(400).json({ 
        success: false, 
        error: "Key and name are required" 
      });
    }

    // Check if flag already exists
    const existingFlag = await featureflags.findOne({ key });
    if (existingFlag) {
      return res.status(409).json({ 
        success: false, 
        error: "Feature flag with this key already exists" 
      });
    }

    const flag = new featureflags({
      key,
      name,
      description,
      enabled: enabled ?? false,
      allowedRoles: allowedRoles ?? ["admin"],
      rolloutPercentage: rolloutPercentage ?? 100
    });

    await flag.save();
    res.status(201).json({ success: true, flag });
  } catch (err) {
    console.error("Error creating flag:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create feature flag" 
    });
  }
});

// TOGGLE/UPDATE flag (admin only)
featureFlagRoutes.post("/toggle", adminAuth, async (req, res) => {
  try {
    const { key, enabled, rolloutPercentage } = req.body;

    // Validation
    if (!key) {
      return res.status(400).json({ 
        success: false, 
        error: "Key is required" 
      });
    }

    // Build update object dynamically
    const updateFields = {};
    if (typeof enabled === "boolean") updateFields.enabled = enabled;
    if (typeof rolloutPercentage === "number" && rolloutPercentage >= 0 && rolloutPercentage <= 100) {
      updateFields.rolloutPercentage = rolloutPercentage;
    }

    const flag = await featureflags.findOneAndUpdate(
      { key },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!flag) {
      return res.status(404).json({ 
        success: false, 
        error: "Feature flag not found" 
      });
    }

    res.json({ success: true, flag });
  } catch (err) {
    console.error("Error toggling flag:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to toggle feature flag" 
    });
  }
});

// UPDATE flag (admin only) - more comprehensive update
featureFlagRoutes.put("/update/:key", adminAuth, async (req, res) => {
  try {
    const { key } = req.params;
    const { name, description, enabled, allowedRoles, rolloutPercentage } = req.body;

    const updateFields = {};
    if (name) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (typeof enabled === "boolean") updateFields.enabled = enabled;
    if (Array.isArray(allowedRoles)) updateFields.allowedRoles = allowedRoles;
    if (typeof rolloutPercentage === "number") updateFields.rolloutPercentage = rolloutPercentage;

    const flag = await featureflags.findOneAndUpdate(
      { key },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!flag) {
      return res.status(404).json({ 
        success: false, 
        error: "Feature flag not found" 
      });
    }

    res.json({ success: true, flag });
  } catch (err) {
    console.error("Error updating flag:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to update feature flag" 
    });
  }
});

// DELETE flag (admin only)
featureFlagRoutes.delete("/delete/:key", adminAuth, async (req, res) => {
  try {
    const { key } = req.params;

    const flag = await featureflags.findOneAndDelete({ key });

    if (!flag) {
      return res.status(404).json({ 
        success: false, 
        error: "Feature flag not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "Feature flag deleted successfully",
      deletedFlag: flag
    });
  } catch (err) {
    console.error("Error deleting flag:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to delete feature flag" 
    });
  }
});

// ============================================
// PARAMETERIZED ROUTES LAST
// ============================================

// GET all flags (admin only)
featureFlagRoutes.get("/", adminAuth, async (req, res) => {
  try {
    const flags = await featureflags.find({}).sort({ createdAt: -1 });
    res.json({ success: true, flags });
  } catch (err) {
    console.error("Error fetching flags:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch feature flags" 
    });
  }
});

// GET specific flag by key (admin only) - MUST BE LAST
featureFlagRoutes.get("/:key", adminAuth, async (req, res) => {
  try {
    const { key } = req.params;
    const flag = await featureflags.findOne({ key });

    if (!flag) {
      return res.status(404).json({ 
        success: false, 
        error: "Feature flag not found" 
      });
    }

    res.json({ success: true, flag });
  } catch (err) {
    console.error("Error fetching flag:", err);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch feature flag" 
    });
  }
});

export default featureFlagRoutes;