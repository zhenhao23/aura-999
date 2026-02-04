"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function AnalyticsPage() {
  // Mock success metrics data
  const metrics = {
    responseTime: {
      current: 4.2,
      previous: 5.1,
      unit: "minutes",
      trend: "down", // down is good for response time
    },
    successRate: {
      current: 94.8,
      previous: 92.3,
      unit: "%",
      trend: "up",
    },
    callsHandled: {
      current: 1247,
      previous: 1189,
      unit: "calls",
      trend: "up",
    },
    resourceUtilization: {
      current: 87.5,
      previous: 84.2,
      unit: "%",
      trend: "up",
    },
    aiAccuracy: {
      current: 96.3,
      previous: 95.8,
      unit: "%",
      trend: "up",
    },
    avgIncidentResolution: {
      current: 18.5,
      previous: 21.3,
      unit: "minutes",
      trend: "down",
    },
  };

  const getTrendIcon = (trend: string, isLowerBetter: boolean = false) => {
    const isImprovement = isLowerBetter ? trend === "down" : trend === "up";
    if (trend === "neutral")
      return <Minus className="h-4 w-4 text-yellow-500" />;
    return isImprovement ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getTrendColor = (trend: string, isLowerBetter: boolean = false) => {
    const isImprovement = isLowerBetter ? trend === "down" : trend === "up";
    if (trend === "neutral") return "text-yellow-600";
    return isImprovement ? "text-green-600" : "text-red-600";
  };

  const calculateChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return change.toFixed(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-zinc-900">
                Analytics Dashboard
              </h1>
              <p className="text-zinc-600 mt-2">
                Success Metrics & Performance Overview
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-500">Last updated</p>
              <p className="text-lg font-semibold text-zinc-900">
                {new Date().toLocaleString("en-MY", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Average Response Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Avg Response Time</span>
                {getTrendIcon(metrics.responseTime.trend, true)}
              </CardTitle>
              <CardDescription>Time to first response</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-900">
                {metrics.responseTime.current}{" "}
                <span className="text-lg font-normal text-zinc-500">
                  {metrics.responseTime.unit}
                </span>
              </div>
              <p
                className={`text-sm mt-2 ${getTrendColor(metrics.responseTime.trend, true)}`}
              >
                {calculateChange(
                  metrics.responseTime.current,
                  metrics.responseTime.previous,
                )}
                % from last month
              </p>
            </CardContent>
          </Card>

          {/* Success Rate */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Success Rate</span>
                {getTrendIcon(metrics.successRate.trend)}
              </CardTitle>
              <CardDescription>Successful incident resolutions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-900">
                {metrics.successRate.current}
                <span className="text-lg font-normal text-zinc-500">
                  {metrics.successRate.unit}
                </span>
              </div>
              <p
                className={`text-sm mt-2 ${getTrendColor(metrics.successRate.trend)}`}
              >
                +
                {calculateChange(
                  metrics.successRate.current,
                  metrics.successRate.previous,
                )}
                % from last month
              </p>
            </CardContent>
          </Card>

          {/* Calls Handled */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Calls Handled</span>
                {getTrendIcon(metrics.callsHandled.trend)}
              </CardTitle>
              <CardDescription>Total emergencies processed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-900">
                {metrics.callsHandled.current.toLocaleString()}{" "}
                <span className="text-lg font-normal text-zinc-500">
                  {metrics.callsHandled.unit}
                </span>
              </div>
              <p
                className={`text-sm mt-2 ${getTrendColor(metrics.callsHandled.trend)}`}
              >
                +
                {calculateChange(
                  metrics.callsHandled.current,
                  metrics.callsHandled.previous,
                )}
                % from last month
              </p>
            </CardContent>
          </Card>

          {/* Resource Utilization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Resource Utilization</span>
                {getTrendIcon(metrics.resourceUtilization.trend)}
              </CardTitle>
              <CardDescription>
                Efficiency of resource deployment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-900">
                {metrics.resourceUtilization.current}
                <span className="text-lg font-normal text-zinc-500">
                  {metrics.resourceUtilization.unit}
                </span>
              </div>
              <p
                className={`text-sm mt-2 ${getTrendColor(metrics.resourceUtilization.trend)}`}
              >
                +
                {calculateChange(
                  metrics.resourceUtilization.current,
                  metrics.resourceUtilization.previous,
                )}
                % from last month
              </p>
            </CardContent>
          </Card>

          {/* AI Accuracy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>AI Triage Accuracy</span>
                {getTrendIcon(metrics.aiAccuracy.trend)}
              </CardTitle>
              <CardDescription>Correct severity assessments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-900">
                {metrics.aiAccuracy.current}
                <span className="text-lg font-normal text-zinc-500">
                  {metrics.aiAccuracy.unit}
                </span>
              </div>
              <p
                className={`text-sm mt-2 ${getTrendColor(metrics.aiAccuracy.trend)}`}
              >
                +
                {calculateChange(
                  metrics.aiAccuracy.current,
                  metrics.aiAccuracy.previous,
                )}
                % from last month
              </p>
            </CardContent>
          </Card>

          {/* Incident Resolution Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Avg Resolution Time</span>
                {getTrendIcon(metrics.avgIncidentResolution.trend, true)}
              </CardTitle>
              <CardDescription>Time to incident closure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-zinc-900">
                {metrics.avgIncidentResolution.current}{" "}
                <span className="text-lg font-normal text-zinc-500">
                  {metrics.avgIncidentResolution.unit}
                </span>
              </div>
              <p
                className={`text-sm mt-2 ${getTrendColor(metrics.avgIncidentResolution.trend, true)}`}
              >
                {calculateChange(
                  metrics.avgIncidentResolution.current,
                  metrics.avgIncidentResolution.previous,
                )}
                % from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agency Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Agency Performance</CardTitle>
              <CardDescription>
                Response times by emergency service
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      🚨
                    </div>
                    <div>
                      <p className="font-medium">PDRM (Police)</p>
                      <p className="text-sm text-zinc-500">
                        Royal Malaysian Police
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">3.8 min</p>
                    <p className="text-sm text-green-600">↓ 12%</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      🔥
                    </div>
                    <div>
                      <p className="font-medium">JBPM (Bomba)</p>
                      <p className="text-sm text-zinc-500">
                        Fire & Rescue Dept
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">4.2 min</p>
                    <p className="text-sm text-green-600">↓ 8%</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      🏥
                    </div>
                    <div>
                      <p className="font-medium">KKM (Health)</p>
                      <p className="text-sm text-zinc-500">
                        Ministry of Health
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">5.1 min</p>
                    <p className="text-sm text-green-600">↓ 15%</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      ⚠️
                    </div>
                    <div>
                      <p className="font-medium">APM (Civil Defence)</p>
                      <p className="text-sm text-zinc-500">Disaster Response</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">6.3 min</p>
                    <p className="text-sm text-green-600">↓ 5%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Platform performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Uptime</span>
                    <span className="text-sm font-semibold text-green-600">
                      99.97%
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: "99.97%" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">
                      API Response Time
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      142ms
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: "85%" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">
                      Translation Accuracy
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      98.2%
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: "98.2%" }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">
                      Database Performance
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      Excellent
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: "95%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
            <CardDescription>Key achievements this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">1,247</p>
                <p className="text-sm text-zinc-600 mt-1">Lives Protected</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">342</p>
                <p className="text-sm text-zinc-600 mt-1">
                  Critical Cases Resolved
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-3xl font-bold text-orange-600">856</p>
                <p className="text-sm text-zinc-600 mt-1">Resources Deployed</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">4.2★</p>
                <p className="text-sm text-zinc-600 mt-1">
                  Avg Response Time (min)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
