import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Input } from './components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Alert, AlertDescription } from './components/ui/alert';
import { Separator } from './components/ui/separator';
import { 
  Search, Users, MapPin, Target, Clock, Activity, 
  TrendingUp, AlertTriangle, BarChart3, Shield, 
  Calendar, Trophy, Play
} from 'lucide-react';
import MatchViewer from './components/MatchViewer';
import TacticalAnalysis from './components/TacticalAnalysis';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto py-8 px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            ⚽ Soccer Analytics Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Advanced match analysis with StatsBomb data
          </p>
        </header>

        <Tabs defaultValue="match-viewer" className="w-full">
          <TabsList className="grid w-full grid-cols-1 lg:grid-cols-3 mb-8">
            <TabsTrigger value="match-viewer" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Match Viewer
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2" disabled>
              <BarChart3 className="h-4 w-4" />
              Analytics (Coming Soon)
            </TabsTrigger>
            <TabsTrigger value="referee-analysis" className="flex items-center gap-2" disabled>
              <Shield className="h-4 w-4" />
              Referee Analysis (Coming Soon)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="match-viewer">
            <MatchViewer />
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription>Coming soon - comprehensive team and player analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">This section will include advanced statistical analysis and visualizations.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referee-analysis">
            <Card>
              <CardHeader>
                <CardTitle>Referee Analysis</CardTitle>
                <CardDescription>Coming soon - referee decision patterns and bias analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">This section will include referee-specific analytics and decision patterns.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;