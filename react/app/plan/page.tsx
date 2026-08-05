"use client";

import {
  EmbedProvider,
  SchematicEmbed,
} from "@schematichq/schematic-components";
import { useSchematicIsPending } from "@schematichq/schematic-react";
import React, { useEffect, useState } from "react";

export default function PlanPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const isPending = useSchematicIsPending();

  const fetchAccessToken = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/accessToken");
      const result = await response.json();
      if ("accessToken" in result) {
        setAccessToken(result.accessToken);
      }
      setError(null);
    } catch (error) {
      console.error(error);
      setError("Error fetching data");
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessToken();
  }, []);

  const componentId = process.env.NEXT_PUBLIC_SCHEMATIC_COMPONENT_ID;
  if (!componentId) {
    console.error(
      "Missing Schematic component ID (NEXT_PUBLIC_SCHEMATIC_COMPONENT_ID)",
    );

    return <div>Not found</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold mb-4">Usage & Plan</h1>
          Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold mb-4">Usage & Plan</h1>
          <p>{error ?? "Unknown error"}</p>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return <></>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-4">
        <EmbedProvider debug>
          <h1 className="text-2xl font-bold mb-4">Usage & Plan</h1>
          {isPending && (
            <p className="text-muted-foreground animate-pulse mb-2">
              Schematic SDK loading...
            </p>
          )}
          <SchematicEmbed accessToken={accessToken} id={componentId} />
        </EmbedProvider>
      </div>
    </div>
  );
}
