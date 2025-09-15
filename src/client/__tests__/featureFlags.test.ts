import type { FeatureFlags } from "../featureFlagsInterface";
import type { FeatureFlagOverrides } from "../featureFlagOverrides";
import { initializeFeatureFlags } from "../initializeFeatureFlags";
import { isFeatureEnabled } from "../isFeatureEnabled";

describe("Feature Flags System", () => {
  describe("FeatureFlags interface", () => {
    it("should define all required feature flags", () => {
      const flags: FeatureFlags = {
        CHAT_ENABLED: false,
        STREAMING_ENABLED: false,
        TOOLS_ENABLED: false,
      };

      expect(flags.CHAT_ENABLED).toBe(false);
      expect(flags.STREAMING_ENABLED).toBe(false);
      expect(flags.TOOLS_ENABLED).toBe(false);
    });

    it("should accept enabled flags", () => {
      const flags: FeatureFlags = {
        CHAT_ENABLED: true,
        STREAMING_ENABLED: true,
        TOOLS_ENABLED: true,
      };

      expect(flags.CHAT_ENABLED).toBe(true);
      expect(flags.STREAMING_ENABLED).toBe(true);
      expect(flags.TOOLS_ENABLED).toBe(true);
    });

    it("should accept mixed flag states", () => {
      const flags: FeatureFlags = {
        CHAT_ENABLED: true,
        STREAMING_ENABLED: false,
        TOOLS_ENABLED: true,
      };

      expect(flags.CHAT_ENABLED).toBe(true);
      expect(flags.STREAMING_ENABLED).toBe(false);
      expect(flags.TOOLS_ENABLED).toBe(true);
    });
  });

  describe("FeatureFlagOverrides interface", () => {
    it("should accept partial overrides", () => {
      const overrides: FeatureFlagOverrides = {
        chatEnabled: true,
      };

      expect(overrides.chatEnabled).toBe(true);
      expect(overrides.streamingEnabled).toBeUndefined();
      expect(overrides.toolsEnabled).toBeUndefined();
    });

    it("should accept all override options", () => {
      const overrides: FeatureFlagOverrides = {
        chatEnabled: true,
        streamingEnabled: false,
        toolsEnabled: true,
      };

      expect(overrides.chatEnabled).toBe(true);
      expect(overrides.streamingEnabled).toBe(false);
      expect(overrides.toolsEnabled).toBe(true);
    });

    it("should accept empty overrides object", () => {
      const overrides: FeatureFlagOverrides = {};

      expect(overrides.chatEnabled).toBeUndefined();
      expect(overrides.streamingEnabled).toBeUndefined();
      expect(overrides.toolsEnabled).toBeUndefined();
    });
  });

  describe("initializeFeatureFlags", () => {
    it("should return default disabled flags when no overrides provided", () => {
      const flags = initializeFeatureFlags();

      expect(flags.CHAT_ENABLED).toBe(false);
      expect(flags.STREAMING_ENABLED).toBe(false);
      expect(flags.TOOLS_ENABLED).toBe(false);
    });

    it("should return default disabled flags when empty overrides provided", () => {
      const flags = initializeFeatureFlags({});

      expect(flags.CHAT_ENABLED).toBe(false);
      expect(flags.STREAMING_ENABLED).toBe(false);
      expect(flags.TOOLS_ENABLED).toBe(false);
    });

    it("should apply chat override while keeping other defaults", () => {
      const flags = initializeFeatureFlags({
        chatEnabled: true,
      });

      expect(flags.CHAT_ENABLED).toBe(true);
      expect(flags.STREAMING_ENABLED).toBe(false);
      expect(flags.TOOLS_ENABLED).toBe(false);
    });

    it("should apply streaming override while keeping other defaults", () => {
      const flags = initializeFeatureFlags({
        streamingEnabled: true,
      });

      expect(flags.CHAT_ENABLED).toBe(false);
      expect(flags.STREAMING_ENABLED).toBe(true);
      expect(flags.TOOLS_ENABLED).toBe(false);
    });

    it("should apply tools override while keeping other defaults", () => {
      const flags = initializeFeatureFlags({
        toolsEnabled: true,
      });

      expect(flags.CHAT_ENABLED).toBe(false);
      expect(flags.STREAMING_ENABLED).toBe(false);
      expect(flags.TOOLS_ENABLED).toBe(true);
    });

    it("should apply multiple overrides", () => {
      const flags = initializeFeatureFlags({
        chatEnabled: true,
        streamingEnabled: true,
      });

      expect(flags.CHAT_ENABLED).toBe(true);
      expect(flags.STREAMING_ENABLED).toBe(true);
      expect(flags.TOOLS_ENABLED).toBe(false);
    });

    it("should apply all overrides", () => {
      const flags = initializeFeatureFlags({
        chatEnabled: true,
        streamingEnabled: false,
        toolsEnabled: true,
      });

      expect(flags.CHAT_ENABLED).toBe(true);
      expect(flags.STREAMING_ENABLED).toBe(false);
      expect(flags.TOOLS_ENABLED).toBe(true);
    });

    it("should handle explicit false overrides", () => {
      const flags = initializeFeatureFlags({
        chatEnabled: false,
        streamingEnabled: false,
        toolsEnabled: false,
      });

      expect(flags.CHAT_ENABLED).toBe(false);
      expect(flags.STREAMING_ENABLED).toBe(false);
      expect(flags.TOOLS_ENABLED).toBe(false);
    });
  });

  describe("isFeatureEnabled", () => {
    it("should return true for enabled features", () => {
      const flags: FeatureFlags = {
        CHAT_ENABLED: true,
        STREAMING_ENABLED: false,
        TOOLS_ENABLED: true,
      };

      expect(isFeatureEnabled(flags, "CHAT_ENABLED")).toBe(true);
      expect(isFeatureEnabled(flags, "TOOLS_ENABLED")).toBe(true);
    });

    it("should return false for disabled features", () => {
      const flags: FeatureFlags = {
        CHAT_ENABLED: true,
        STREAMING_ENABLED: false,
        TOOLS_ENABLED: true,
      };

      expect(isFeatureEnabled(flags, "STREAMING_ENABLED")).toBe(false);
    });

    it("should work with all flags disabled", () => {
      const flags: FeatureFlags = {
        CHAT_ENABLED: false,
        STREAMING_ENABLED: false,
        TOOLS_ENABLED: false,
      };

      expect(isFeatureEnabled(flags, "CHAT_ENABLED")).toBe(false);
      expect(isFeatureEnabled(flags, "STREAMING_ENABLED")).toBe(false);
      expect(isFeatureEnabled(flags, "TOOLS_ENABLED")).toBe(false);
    });

    it("should work with all flags enabled", () => {
      const flags: FeatureFlags = {
        CHAT_ENABLED: true,
        STREAMING_ENABLED: true,
        TOOLS_ENABLED: true,
      };

      expect(isFeatureEnabled(flags, "CHAT_ENABLED")).toBe(true);
      expect(isFeatureEnabled(flags, "STREAMING_ENABLED")).toBe(true);
      expect(isFeatureEnabled(flags, "TOOLS_ENABLED")).toBe(true);
    });

    it("should be type-safe with feature flag keys", () => {
      const flags: FeatureFlags = {
        CHAT_ENABLED: true,
        STREAMING_ENABLED: false,
        TOOLS_ENABLED: true,
      };

      // These should compile without errors
      const chatEnabled: boolean = isFeatureEnabled(flags, "CHAT_ENABLED");
      const streamingEnabled: boolean = isFeatureEnabled(
        flags,
        "STREAMING_ENABLED",
      );
      const toolsEnabled: boolean = isFeatureEnabled(flags, "TOOLS_ENABLED");

      expect(chatEnabled).toBe(true);
      expect(streamingEnabled).toBe(false);
      expect(toolsEnabled).toBe(true);
    });
  });

  describe("integration", () => {
    it("should work together in typical usage", () => {
      // Phase 1: All disabled
      const phase1Flags = initializeFeatureFlags();
      expect(isFeatureEnabled(phase1Flags, "CHAT_ENABLED")).toBe(false);
      expect(isFeatureEnabled(phase1Flags, "STREAMING_ENABLED")).toBe(false);
      expect(isFeatureEnabled(phase1Flags, "TOOLS_ENABLED")).toBe(false);

      // Development: Chat enabled for testing
      const devFlags = initializeFeatureFlags({ chatEnabled: true });
      expect(isFeatureEnabled(devFlags, "CHAT_ENABLED")).toBe(true);
      expect(isFeatureEnabled(devFlags, "STREAMING_ENABLED")).toBe(false);
      expect(isFeatureEnabled(devFlags, "TOOLS_ENABLED")).toBe(false);

      // Phase 2: Chat and streaming enabled
      const phase2Flags = initializeFeatureFlags({
        chatEnabled: true,
        streamingEnabled: true,
      });
      expect(isFeatureEnabled(phase2Flags, "CHAT_ENABLED")).toBe(true);
      expect(isFeatureEnabled(phase2Flags, "STREAMING_ENABLED")).toBe(true);
      expect(isFeatureEnabled(phase2Flags, "TOOLS_ENABLED")).toBe(false);
    });

    it("should maintain immutability of flags", () => {
      const flags = initializeFeatureFlags({ chatEnabled: true });
      const originalChatEnabled = flags.CHAT_ENABLED;

      // Attempting to modify should not affect the original
      const modifiedFlags = { ...flags, CHAT_ENABLED: false };

      expect(flags.CHAT_ENABLED).toBe(originalChatEnabled);
      expect(modifiedFlags.CHAT_ENABLED).toBe(false);
    });
  });
});
