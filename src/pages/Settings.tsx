import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Key, AlertCircle, ArrowRight } from "lucide-react";

import { validateGroqApiKey } from '@/utils/validation';

export default function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('groq_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setSaved(true);
    }
  }, []);

  const handleSave = () => {
    const validation = validateGroqApiKey(apiKey);
    
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid API key");
      return;
    }

    try {
      localStorage.setItem('groq_api_key', apiKey.trim());
      setSaved(true);
      toast.success("API Key saved successfully");
    } catch (error) {
      toast.error("Failed to save API key. Please check your browser storage settings.");
    }
  };

  const handleClear = () => {
    localStorage.removeItem('groq_api_key');
    setApiKey('');
    setSaved(false);
    toast.info("API Key cleared");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start gap-4 mb-8">
        <div className="bg-orange-600 p-4 rounded-xl shadow-md">
          <Key className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-h2 mb-2">System Configuration</h1>
          <p className="text-body text-gray-600">Configure your API credentials and system preferences</p>
        </div>
      </div>

      <Card className="max-w-4xl">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3">
            <Key className="w-6 h-6 text-orange-600" />
            <span className="text-h3">Groq API Configuration</span>
          </CardTitle>
          <CardDescription className="text-body text-gray-600 mt-2">
            Your API key is stored locally in your browser and used for secure communication with Groq's inference API. All data remains private and secure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="card p-6 border-l-4 border-l-orange-500 bg-orange-50">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-h4 mb-2">Need an API Key?</h3>
                <p className="text-body text-gray-600 mb-4">
                  Get a free API key from Groq Console to activate your AI workforce.
                </p>
                <a 
                  href="https://console.groq.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn btn-primary inline-flex items-center px-4 py-2 rounded-lg font-semibold transition-all"
                >
                  Get API Key
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-body font-semibold text-gray-900">API Key</label>
            <div className="flex gap-4">
              <Input
                type="password"
                placeholder="gsk_..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 font-mono text-base py-3 px-4 focus-ring"
              />
              <Button onClick={handleSave} className="btn btn-primary px-6 py-3">
                <Save className="w-5 h-5 mr-2" />
                Save Configuration
              </Button>
            </div>
          </div>

          {saved && (
            <div className="flex items-center justify-between p-6 bg-green-50 border border-green-200 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-green-500 rounded-full" />
                <div>
                  <span className="text-body font-semibold text-green-800">API Key Configured Successfully</span>
                  <p className="text-caption text-green-700 mt-1">Your AI workforce is ready for deployment</p>
                </div>
              </div>
              <Button variant="ghost" onClick={handleClear} className="text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2">
                Clear Configuration
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}