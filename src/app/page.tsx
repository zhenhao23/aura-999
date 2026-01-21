import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-red-50 font-sans p-8">
      <main className="flex flex-col items-center gap-8 max-w-5xl w-full">
        <div className="text-center space-y-4">
          <div className="inline-block px-4 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold mb-2">
            🚨 Emergency Response System
          </div>
          <h1 className="text-6xl font-bold tracking-tight text-zinc-900">
            WhateverClicks
          </h1>
          <p className="text-2xl text-zinc-600 max-w-2xl mx-auto">
            AI-Powered Emergency Dispatch System for Malaysia
          </p>
          <p className="text-lg text-zinc-500">
            KitaHack 2026 - Intelligent Triage & Resource Optimization
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🤖 AI Triage
              </CardTitle>
              <CardDescription>Multimodal Analysis Engine</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600">
                Vision, audio, and NLP combine to instantly assess emergency
                severity and recommend resources.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🗺️ Smart Dispatch
              </CardTitle>
              <CardDescription>Real-time Resource Tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600">
                Interactive map showing all agencies (PDRM, JBPM, KKM, APM,
                MMEA) with optimal routing.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💬 Universal Comms
              </CardTitle>
              <CardDescription>Malaysian Dialect Support</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600">
                Real-time translation handling Northern, Kelantanese, and other
                Malaysian dialects.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Link href="/dashboard">
            <Button
              size="lg"
              className="text-base px-8 bg-red-600 hover:bg-red-700"
            >
              🚨 Open Dispatcher Dashboard
            </Button>
          </Link>
          <Link href="/caller">
            <Button
              size="lg"
              className="text-base px-8 bg-blue-600 hover:bg-blue-700"
            >
              📱 Caller Interface
            </Button>
          </Link>
        </div>

        <div className="mt-12 text-center space-y-2">
          <p className="text-sm text-zinc-500">Powered by</p>
          <div className="flex items-center justify-center gap-4 text-xs text-zinc-400">
            <span>Next.js 16</span>
            <span>•</span>
            <span>TypeScript</span>
            <span>•</span>
            <span>Tailwind CSS 4</span>
            <span>•</span>
            <span>Google Maps API</span>
          </div>
        </div>
      </main>
    </div>
  );
}
