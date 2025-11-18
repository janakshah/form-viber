"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface FormResult {
  id: string;
  formId: string;
  data: Record<string, any>;
  submittedAt: string;
}

export default function ResultsPage() {
  const params = useParams();
  const formId = params.formId as string;

  const [results, setResults] = useState<FormResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    try {
      const response = await fetch(`/api/forms/${formId}/results`);
      if (!response.ok) {
        throw new Error("Failed to fetch results");
      }
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load results");
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <p className="text-black dark:text-white">Loading results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Link
            href="/"
            className="text-black dark:text-white underline hover:opacity-80"
          >
            Go back to generator
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white mb-4 inline-block"
          >
            ← Back to Generator
          </Link>
          <h1 className="text-4xl font-bold text-black dark:text-white mb-2">
            Form Results
          </h1>
          <p className="text-black/60 dark:text-white/60">
            Form ID: {formId}
          </p>
          <p className="text-sm text-black/60 dark:text-white/60 mt-2">
            Total Submissions: {results.length}
          </p>
          <div className="flex gap-4 mt-4">
            <Link
              href={`/form/${formId}`}
              className="text-sm text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white underline"
            >
              Fill Form
            </Link>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg p-8 text-center">
            <p className="text-black/60 dark:text-white/60">
              No submissions yet. Be the first to submit this form!
            </p>
            <Link
              href={`/form/${formId}`}
              className="mt-4 inline-block text-black dark:text-white underline hover:opacity-80"
            >
              Fill Form
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {results.map((result, index) => (
              <div
                key={result.id}
                className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-lg p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-black dark:text-white">
                    Submission #{results.length - index}
                  </h2>
                  <p className="text-sm text-black/60 dark:text-white/60">
                    {new Date(result.submittedAt).toLocaleString()}
                  </p>
                </div>
                <pre className="bg-black/5 dark:bg-white/5 p-4 rounded-md overflow-x-auto">
                  <code className="text-sm text-black dark:text-white">
                    {JSON.stringify(result.data, null, 2)}
                  </code>
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

