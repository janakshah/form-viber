"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Form {
  formId: string;
  title?: string;
  createdAt: string;
}

export default function Home() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forms, setForms] = useState<Form[]>([]);
  const router = useRouter();

  // Fetch all forms on mount
  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await fetch("/api/forms");
      if (response.ok) {
        const data = await response.json();
        setForms(data);
      }
    } catch (err) {
      console.error("Error fetching forms:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Please enter a description");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/forms/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create form");
      }

      const data = await response.json();
      // Redirect to the form page
      router.push(`/form/${data.formId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create form");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black dark:text-white mb-2">
            Form Generator
          </h1>
          <p className="text-lg text-black/60 dark:text-white/60">
            Describe the form you need, and AI will generate it for you
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Form Generator */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-black dark:text-white mb-2"
                  >
                    Describe your form
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., I need a form for collecting birthdate, name, email, and family members"
                    className="w-full px-4 py-3 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-md text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition-all duration-200 min-h-[200px] resize-y"
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-medium rounded-md hover:bg-black/90 dark:hover:bg-white/90 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Generating Form..." : "Generate Form"}
                </button>
              </form>
            </div>
          </div>

          {/* Right Panel - Forms List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
                Created Forms
              </h2>
              {forms.length === 0 ? (
                <p className="text-sm text-black/60 dark:text-white/60">
                  No forms created yet. Create your first form using the generator.
                </p>
              ) : (
                <div className="space-y-3">
                  {forms.map((form) => (
                    <Link
                      key={form.formId}
                      href={`/form/${form.formId}`}
                      className="block p-3 border border-black/10 dark:border-white/10 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-200"
                    >
                      <h3 className="font-medium text-black dark:text-white mb-1">
                        {form.title || form.formId}
                      </h3>
                      <p className="text-xs text-black/60 dark:text-white/60">
                        {new Date(form.createdAt).toLocaleDateString()}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
