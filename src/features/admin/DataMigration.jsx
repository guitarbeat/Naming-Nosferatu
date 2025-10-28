import React, { useState } from "react";
import { Card, Button } from "../../shared/components";
import { resolveSupabaseClient } from "../../integrations/supabase/client";
import styles from "./DataMigration.module.css";

export default function DataMigration() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);

  const runMigration = async () => {
    try {
      setIsLoading(true);
      setResults(null);

      const supabaseClient = await resolveSupabaseClient();

      if (!supabaseClient) {
        showError("Supabase client is not configured.");
        setResults({
          success: false,
          error: "Supabase client is not configured.",
        });
        return;
      }

      const { data, error } =
        await supabaseClient.functions.invoke("migrate-data");

      if (error) throw error;

      setResults(data);
    } catch (err) {
      console.error("Migration failed:", err);
      setResults({
        success: false,
        error: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Card
        className={styles.card}
        variant="elevated"
        padding="large"
        shadow="large"
        background="glass"
      >
        <h2 className={styles.title}>Data Migration Tool</h2>
        <p className={styles.description}>
          This will copy all data from your external Supabase project to Lovable
          Cloud:
        </p>
        <ul className={styles.list}>
          <li>Users (cat_app_users)</li>
          <li>Cat Name Options</li>
          <li>Ratings</li>
          <li>Tournament Selections</li>
        </ul>

        <Button
          onClick={runMigration}
          disabled={isLoading}
          loading={isLoading}
          size="large"
        >
          Start Migration
        </Button>

        {results && (
          <div
            className={`${styles.results} ${results.success ? styles.success : styles.error}`}
          >
            <h3>Migration Results</h3>
            <p>
              <strong>Message:</strong> {results.message || results.error}
            </p>

            {results.details && (
              <div className={styles.details}>
                <div className={styles.stat}>
                  <span className={styles.label}>Users:</span>
                  <span className={styles.value}>
                    ✅ {results.details.users.success} | ❌{" "}
                    {results.details.users.failed}
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.label}>Cat Names:</span>
                  <span className={styles.value}>
                    ✅ {results.details.catNames.success} | ❌{" "}
                    {results.details.catNames.failed}
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.label}>Ratings:</span>
                  <span className={styles.value}>
                    ✅ {results.details.ratings.success} | ❌{" "}
                    {results.details.ratings.failed}
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.label}>Selections:</span>
                  <span className={styles.value}>
                    ✅ {results.details.selections.success} | ❌{" "}
                    {results.details.selections.failed}
                  </span>
                </div>

                {Object.values(results.details).some(
                  (d) => Array.isArray(d.errors) && d.errors.length > 0
                ) && (
                  <div className={styles.errors}>
                    <h4>Errors:</h4>
                    {Object.entries(results.details).map(
                      ([key, data]) =>
                        Array.isArray(data.errors) &&
                        data.errors.length > 0 && (
                          <div key={key} className={styles.errorSection}>
                            <strong>{key}:</strong>
                            <ul>
                              {data.errors.map((err, idx) => (
                                <li key={idx}>{err}</li>
                              ))}
                            </ul>
                          </div>
                        )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
