import express from "express";
import featureflags from "../models/featureFlag.js";
import { adminAuth } from "../middleware/adminAuth.js";
import jwt from "jsonwebtoken";
import User from "../models/User.ts";

const featureFlagRoutes = express.Router();

const GROUP_TO_FEATURES = {
  identity: ["password_vault", "siem_dashboard"],
  threat: ["malware_analyzer", "phishing_detector", "deepfake_detector"],
  "ai-security": ["ai_red_team", "ai_agent_scanner", "prompt_injection", "pii_detector"],
  "web-infra": ["watch_agent", "site_shield", "csp_builder"],
  "team-workspaces": ["findings_board", "team_workspaces"],
  learn: ["security_awareness", "insights", "security_chatbot"],
};

const CORE_GROUP_FLAGS = [
  {
    key: "identity_access_group",
    name: "Identity & Access Group",
    description: "Controls visibility of the Identity & Access pillar.",
    enabled: true,
  },
  {
    key: "threat_detection_group",
    name: "Threat Detection Group",
    description: "Controls visibility of the Threat Detection pillar.",
    enabled: true,
  },
  {
    key: "ai_security_suite_group",
    name: "AI Security Suite Group",
    description: "Controls visibility of the AI Security Suite pillar.",
    enabled: true,
  },
  {
    key: "web_infra_group",
    name: "Web & Infrastructure Group",
    description: "Controls visibility of the Web & Infrastructure pillar.",
    enabled: true,
  },
  {
    key: "teams_group",
    name: "Teams Group",
    description: "Controls visibility of Findings and Team Workspaces.",
    enabled: true,
  },
  {
    key: "learn_secure_group",
    name: "Learn & Stay Secure Group",
    description: "Controls visibility of the learning pillar.",
    enabled: true,
  },
];

async function ensureCoreGroupFlags() {
  await Promise.all(
    CORE_GROUP_FLAGS.map((flag) =>
      featureflags.findOneAndUpdate(
        { key: flag.key },
        { $setOnInsert: { ...flag, allowedRoles: ["admin"], rolloutPercentage: 100 } },
        { upsert: true, new: false }
      )
    )
  );
}

const hasAnyOwnedFeature = (ownedFeatureFlags, featureKeys) =>
  featureKeys.some((key) => ownedFeatureFlags.includes(key));

// ============================================
// PUBLIC ROUTES FIRST (before any /:key route)
// ============================================

// PUBLIC ENDPOINT - Read feature flags for frontend
// routes/featureFlags.js

featureFlagRoutes.get("/read", async (req, res) => {
  try {
    await ensureCoreGroupFlags();

    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    let ownedFeatureFlags = [];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded?._id || decoded?.id;
        if (userId) {
          const user = await User.findById(userId).select("ownedFeatureFlags");
          ownedFeatureFlags = user?.ownedFeatureFlags || [];
        }
      } catch (err) {
        ownedFeatureFlags = [];
      }
    }

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
      key: "security_chatbot",
    });
    const siteShieldFlag = await featureflags.findOne({
      key: "site_shield",
    });
    const promptInjectionFlag = await featureflags.findOne({
      key: "prompt_injection",
    });
    const threatDetectionFlag = await featureflags.findOne({
      key: "threat_detection_group",
    });
    const aiSecuritySuiteFlag = await featureflags.findOne({
      key: "ai_security_suite_group",
    });
    const identityAccessFlag = await featureflags.findOne({
      key: "identity_access_group",
    });
    const webInfraFlag = await featureflags.findOne({
      key: "web_infra_group",
    });
    const teamsGroupFlag = await featureflags.findOne({
      key: "teams_group",
    });
    const learnSecureFlag = await featureflags.findOne({
      key: "learn_secure_group",
    });

    const identityAccessEnabled =
      (identityAccessFlag ? identityAccessFlag.enabled : true) &&
      hasAnyOwnedFeature(ownedFeatureFlags, GROUP_TO_FEATURES.identity);
    const threatDetectionEnabled =
      (threatDetectionFlag ? threatDetectionFlag.enabled : true) &&
      hasAnyOwnedFeature(ownedFeatureFlags, GROUP_TO_FEATURES.threat);
    const aiSecuritySuiteEnabled =
      (aiSecuritySuiteFlag ? aiSecuritySuiteFlag.enabled : true) &&
      hasAnyOwnedFeature(ownedFeatureFlags, GROUP_TO_FEATURES["ai-security"]);
    const webInfraEnabled =
      (webInfraFlag ? webInfraFlag.enabled : true) &&
      hasAnyOwnedFeature(ownedFeatureFlags, GROUP_TO_FEATURES["web-infra"]);
    const teamsEnabled =
      (teamsGroupFlag ? teamsGroupFlag.enabled : true) &&
      hasAnyOwnedFeature(ownedFeatureFlags, GROUP_TO_FEATURES["team-workspaces"]);
    const learnSecureEnabled =
      (learnSecureFlag ? learnSecureFlag.enabled : true) &&
      hasAnyOwnedFeature(ownedFeatureFlags, GROUP_TO_FEATURES.learn);

    res.json({
      otpEnabled: otpFlag ? otpFlag.enabled : true,
      pinVerificationPasswordManager: pinPMFlag ? pinPMFlag.enabled : false,
      pinVerificationSIEM: pinSIEMFlag ? pinSIEMFlag.enabled : false,
      phishingDetectorEnabled:
        (phishingDetectorFlag ? phishingDetectorFlag.enabled : false) &&
        ownedFeatureFlags.includes("phishing_detector"),
      securityChatbotEnabled:
        (securityChatbotFlag ? securityChatbotFlag.enabled : false) &&
        ownedFeatureFlags.includes("security_chatbot"),
      siteShieldEnabled:
        (siteShieldFlag ? siteShieldFlag.enabled : false) &&
        ownedFeatureFlags.includes("site_shield"),
      promptInjectionEnabled:
        (promptInjectionFlag ? promptInjectionFlag.enabled : false) &&
        ownedFeatureFlags.includes("prompt_injection"),
      threatDetectionEnabled,
      aiSecuritySuiteEnabled,
      identityAccessEnabled,
      webInfraEnabled,
      teamsEnabled,
      learnSecureEnabled,
      ownedFeatureFlags,
    });
  } catch (err) {
    console.error("Error reading feature flags:", err);
    res.status(500).json({
      otpEnabled: true,
      pinVerificationPasswordManager: false,
      pinVerificationSIEM: false,
      phishingDetectorEnabled: false,
      securityChatbotEnabled: false,
      siteShieldEnabled: false,
      promptInjectionEnabled: false,
      threatDetectionEnabled: false,
      aiSecuritySuiteEnabled: false,
      identityAccessEnabled: false,
      webInfraEnabled: false,
      teamsEnabled: false,
      learnSecureEnabled: false,
      ownedFeatureFlags: [],
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
    await ensureCoreGroupFlags();
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
