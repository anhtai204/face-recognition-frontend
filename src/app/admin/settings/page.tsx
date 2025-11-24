"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Save, RotateCcw, Lock } from "lucide-react";
import { ModelConfiguration } from "@/types/next-auth";
import { availableModels, defaultModelConfiguration } from "@/utils/mock-data";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { sendRequest } from "@/utils/api";
import { useSession } from "next-auth/react";
// import { availableModels, type ModelConfiguration, defaultModelConfiguration } from "@/lib/mock-data"

interface Settings {
  accuracyThreshold: number;
  autoMarkLate: boolean;
  lateThresholdMinutes: number;
  enableNotifications: boolean;
  darkMode: boolean;
  emailNotifications: boolean;
  cameraResolution: "720p" | "1080p" | "4k";
}

export default function AdminSettingsPage() {
  const [modelConfig, setModelConfig] = useState<ModelConfiguration>(
    defaultModelConfiguration
  );
  const { data: session } = useSession();
  //   const { modelConfig, setModelConfig } = useAuth()
  const [settings, setSettings] = useState<Settings>({
    accuracyThreshold: 85,
    autoMarkLate: true,
    lateThresholdMinutes: 5,
    enableNotifications: true,
    darkMode: true,
    emailNotifications: false,
    cameraResolution: "1080p",
  });
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/me/password`,
      method: "PATCH",
      body: {
        current_password: currentPassword,
        new_password: newPassword,
      },
      headers: {
        Authorization: `Bearer ${session?.user.access_token}`,
      },
    });

    console.log('>>> Change password response:', res);

    if (res.statusCode !== 200) {
      throw new Error(res.message || "Đổi mật khẩu thất bại!");
    }
    console.log('>>>currentPassword: ', currentPassword)
    console.log('>>>newPassword: ', newPassword)

  };

  const [localModelConfig, setLocalModelConfig] =
    useState<ModelConfiguration>(modelConfig);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setModelConfig(localModelConfig);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings({
      accuracyThreshold: 85,
      autoMarkLate: true,
      lateThresholdMinutes: 5,
      enableNotifications: true,
      darkMode: true,
      emailNotifications: false,
      cameraResolution: "1080p",
    });
    setLocalModelConfig(defaultModelConfiguration);
  };

  return (
    <main className="flex-1 bg-background p-6 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            System Settings
          </h1>
          <p className="text-foreground/60">
            Configure system-wide attendance and camera settings
          </p>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              AI Models Configuration
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Face Detection Model
                </label>
                <select
                  value={localModelConfig.faceDetectionModel}
                  onChange={(e) =>
                    setLocalModelConfig({
                      ...localModelConfig,
                      faceDetectionModel: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground"
                >
                  {availableModels.detection.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} v{model.version} - {model.description}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-foreground/60 mt-1">
                  Select the model for detecting faces in images
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Face Extraction Model
                </label>
                <select
                  value={localModelConfig.faceExtractionModel}
                  onChange={(e) =>
                    setLocalModelConfig({
                      ...localModelConfig,
                      faceExtractionModel: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground"
                >
                  {availableModels.extraction.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} v{model.version} - {model.description}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-foreground/60 mt-1">
                  Select the model for extracting face embeddings
                </p>
              </div>

              {/* <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Face Recognition Model
                </label>
                <select
                  value={localModelConfig.faceRecognitionModel}
                  onChange={(e) =>
                    setLocalModelConfig({
                      ...localModelConfig,
                      faceRecognitionModel: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground"
                >
                  {availableModels.recognition.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} v{model.version} - {model.description}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-foreground/60 mt-1">
                  Select the model for face recognition and matching
                </p>
              </div> */}

              {/* <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Liveness Detection Model
                </label>
                <select
                  value={localModelConfig.livenessDetectionModel}
                  onChange={(e) =>
                    setLocalModelConfig({
                      ...localModelConfig,
                      livenessDetectionModel: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground"
                >
                  {availableModels.liveness.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} v{model.version} - {model.description}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-foreground/60 mt-1">
                  Select the model for detecting liveness (anti-spoofing)
                </p>
              </div> */}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Facial Recognition
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Accuracy Threshold (%)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="70"
                    max="100"
                    value={settings.accuracyThreshold}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        accuracyThreshold: Number.parseInt(e.target.value),
                      })
                    }
                    className="flex-1"
                  />
                  <span className="text-lg font-semibold text-primary w-12 text-right">
                    {settings.accuracyThreshold}%
                  </span>
                </div>
                <p className="text-xs text-foreground/60 mt-1">
                  Minimum accuracy required to mark attendance
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Camera Resolution
                </label>
                <select
                  value={settings.cameraResolution}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      cameraResolution: e.target.value as
                        | "720p"
                        | "1080p"
                        | "4k",
                    })
                  }
                  className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground"
                >
                  <option value="720p">720p (HD)</option>
                  <option value="1080p">1080p (Full HD)</option>
                  <option value="4k">4K (Ultra HD)</option>
                </select>
                <p className="text-xs text-foreground/60 mt-1">
                  Higher resolution improves accuracy but uses more bandwidth
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Attendance Rules
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Auto Mark Late
                  </label>
                  <p className="text-xs text-foreground/60 mt-1">
                    Automatically mark attendance as late if after threshold
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoMarkLate}
                  onChange={(e) =>
                    setSettings({ ...settings, autoMarkLate: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-border"
                />
              </div>

              {settings.autoMarkLate && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Late Threshold (minutes)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={settings.lateThresholdMinutes}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          lateThresholdMinutes: Number.parseInt(e.target.value),
                        })
                      }
                      className="flex-1"
                    />
                    <span className="text-lg font-semibold text-primary w-12 text-right">
                      {settings.lateThresholdMinutes}m
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Notifications
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Enable Notifications
                  </label>
                  <p className="text-xs text-foreground/60 mt-1">
                    Show in-app notifications for attendance events
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableNotifications}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      enableNotifications: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-border"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Email Notifications
                  </label>
                  <p className="text-xs text-foreground/60 mt-1">
                    Send email alerts for important events
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      emailNotifications: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded border-border"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Display</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Dark Mode
                  </label>
                  <p className="text-xs text-foreground/60 mt-1">
                    Use dark theme throughout the application
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(e) =>
                    setSettings({ ...settings, darkMode: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-border"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Account Security
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-foreground/60 mb-3">
                  Manage your account security settings and change your password
                </p>
                <Button
                  onClick={() => setIsPasswordDialogOpen(true)}
                  className="gap-2"
                  variant="outline"
                  style={{ color: "rgb(59, 130, 246)" }}
                >
                  <Lock className="h-4 w-4" />
                  Change Password
                </Button>
              </div>
            </div>
          </Card>

          {saved && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-600 text-sm">
              Settings saved successfully!
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Settings
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="gap-2 bg-transparent"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>
          </div>
        </div>
      </div>

      <ChangePasswordDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
        onConfirm={changePassword}
      />
    </main>
  );
}
