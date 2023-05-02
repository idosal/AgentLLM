import { useState } from "react";
import type { ModelSettings, SettingModel } from "../utils/types";

import {
  DEFAULT_MAX_LOOPS_CUSTOM_API_KEY,
  DEFAULT_MAX_LOOPS_FREE,
  GPT_35_TURBO,
  WIZARDLM,
} from "../utils/constants";

const SETTINGS_KEY = "AGENTLLM_SETTINGS";
const DEFAULT_SETTINGS: ModelSettings = {
  customModelName: WIZARDLM,
  customTemperature: 0.7 as const,
  customMaxLoops: DEFAULT_MAX_LOOPS_CUSTOM_API_KEY,
  maxTokens: 300 as const,
  setInitProgress: console.log,
};

const loadSettings = () => {
  const settings = { ...DEFAULT_SETTINGS };

  if (typeof window === "undefined") {
    return settings;
  }

  const data = localStorage.getItem(SETTINGS_KEY);
  if (!data) {
    return settings;
  }

  try {
    const obj = JSON.parse(data) as ModelSettings;
    Object.entries(obj).forEach(([key, value]) => {
      if (settings.hasOwnProperty(key)) {
        // @ts-ignore
        settings[key] = value;
      }
    });
  } catch (error) {}

  return DEFAULT_SETTINGS;
};

export function useSettings(): SettingModel {
  const [settings, setSettings] = useState<ModelSettings>(loadSettings);

  const saveSettings = (settings: ModelSettings) => {
    setSettings(settings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  };

  const resetSettings = () => {
    localStorage.removeItem(SETTINGS_KEY);
    setSettings((_) => {
      return { ...DEFAULT_SETTINGS };
    });
  };

  return {
    settings,
    saveSettings,
    resetSettings,
  };
}
