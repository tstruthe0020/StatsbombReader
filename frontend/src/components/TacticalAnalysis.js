import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { TrendingUp, BarChart3, Users, Target } from 'lucide-react';
import MatchBreakdown from './MatchBreakdown';
import TeamBreakdown from './TeamBreakdown';

const TacticalAnalysis = () => {
  const [activeTab, setActiveTab] = useState('match');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Advanced Tactical Analysis
          </CardTitle>
          <p className="text-sm text-gray-600">
            Detailed breakdowns of tactical approaches, categorization models, and team analysis
          </p>
        </CardHeader>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="match" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Match Breakdown
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Breakdown
          </TabsTrigger>
        </TabsList>

        <TabsContent value="match" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Match Tactical Breakdown
              </CardTitle>
              <p className="text-sm text-gray-600">
                Detailed analysis of tactical approaches, categorization statistics, and archetype derivation for specific matches
              </p>
            </CardHeader>
            <CardContent>
              <MatchBreakdown />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Tactical Analysis
              </CardTitle>
              <p className="text-sm text-gray-600">
                Analyze team tactical consistency, evolution, and performance across recent matches
              </p>
            </CardHeader>
            <CardContent>
              <TeamBreakdown />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TacticalAnalysis;