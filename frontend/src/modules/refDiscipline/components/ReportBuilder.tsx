import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { useTeamsList, useRefereesList } from '../hooks';
import { useFilters, useFeatureOverrides } from '../state';
import { FileText, Download, Loader2, Check, X } from 'lucide-react';

const ReportBuilder: React.FC = () => {
  const filters = useFilters();
  const featureOverrides = useFeatureOverrides();
  
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedReferees, setSelectedReferees] = useState<string[]>([]);
  const [reportFormat, setReportFormat] = useState<'pdf' | 'png'>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState<Array<{
    id: string;
    teamName: string;
    referees: string[];
    format: string;
    generatedAt: string;
    downloadUrl: string;
  }>>([]);

  const { data: teams } = useTeamsList(filters.season);
  const { data: referees } = useRefereesList(filters.season);

  const handleTeamSelect = (teamId: string) => {
    setSelectedTeam(teamId);
  };

  const handleRefereeToggle = (refId: string) => {
    setSelectedReferees(prev => 
      prev.includes(refId) 
        ? prev.filter(id => id !== refId)
        : [...prev, refId]
    );
  };

  const handleGenerateReport = async () => {
    if (!selectedTeam || selectedReferees.length === 0) return;

    setIsGenerating(true);
    
    try {
      // Mock API call to generate report
      const response = await fetch('/api/ref-discipline/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeam,
          refIds: selectedReferees,
          season: filters.season,
          featureDeltas: featureOverrides,
          grid: filters.grid,
          exposure: filters.exposure,
          format: reportFormat
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Add to generated reports list
        const newReport = {
          id: `report_${Date.now()}`,
          teamName: teams?.find(t => t.teamId === selectedTeam)?.teamName || selectedTeam,
          referees: selectedReferees.map(refId => 
            referees?.find(r => r.refId === refId)?.refName || refId
          ),
          format: reportFormat.toUpperCase(),
          generatedAt: new Date().toLocaleString(),
          downloadUrl: result.url || '#'
        };
        
        setGeneratedReports(prev => [newReport, ...prev]);
      } else {
        // Mock successful generation for demo
        const newReport = {
          id: `report_${Date.now()}`,
          teamName: teams?.find(t => t.teamId === selectedTeam)?.teamName || selectedTeam,
          referees: selectedReferees.map(refId => 
            referees?.find(r => r.refId === refId)?.refName || refId
          ),
          format: reportFormat.toUpperCase(),
          generatedAt: new Date().toLocaleString(),
          downloadUrl: `#mock-download-${Date.now()}`
        };
        
        setGeneratedReports(prev => [newReport, ...prev]);
      }
    } catch (error) {
      console.error('Report generation failed:', error);
      
      // Mock successful generation for demo
      const newReport = {
        id: `report_${Date.now()}`,
        teamName: teams?.find(t => t.teamId === selectedTeam)?.teamName || selectedTeam,
        referees: selectedReferees.map(refId => 
          referees?.find(r => r.refId === refId)?.refName || refId
        ),
        format: reportFormat.toUpperCase(),
        generatedAt: new Date().toLocaleString(),
        downloadUrl: `#mock-download-${Date.now()}`
      };
      
      setGeneratedReports(prev => [newReport, ...prev]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (report: typeof generatedReports[0]) => {
    // In a real implementation, this would download the actual file
    console.log('Downloading report:', report);
    
    // Mock download
    const link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent('Mock report content');
    link.download = `referee-discipline-report-${report.teamName.replace(/\s+/g, '-')}.${report.format.toLowerCase()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedTeamName = teams?.find(t => t.teamId === selectedTeam)?.teamName;
  const hasActiveOverrides = Object.values(featureOverrides).some(value => value !== undefined && value !== 0);

  return (
    <div className="space-y-6">
      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Team Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Select Team</label>
            <Select value={selectedTeam} onValueChange={handleTeamSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a team to analyze" />
              </SelectTrigger>
              <SelectContent>
                {teams?.map(team => (
                  <SelectItem key={team.teamId} value={team.teamId}>
                    {team.teamName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Referee Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Select Referees ({selectedReferees.length} selected)
            </label>
            <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto">
              {referees?.map(referee => (
                <div
                  key={referee.refId}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                  onClick={() => handleRefereeToggle(referee.refId)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                      selectedReferees.includes(referee.refId)
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-gray-300'
                    }`}>
                      {selectedReferees.includes(referee.refId) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span className="text-sm">{referee.refName}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {referee.matches} matches
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Report Format</label>
            <div className="flex gap-2">
              <Button
                variant={reportFormat === 'pdf' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setReportFormat('pdf')}
              >
                PDF Report
              </Button>
              <Button
                variant={reportFormat === 'png' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setReportFormat('png')}
              >
                PNG Images
              </Button>
            </div>
          </div>

          {/* Configuration Summary */}
          {(selectedTeam || selectedReferees.length > 0 || hasActiveOverrides) && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Report Configuration</h4>
              <div className="space-y-2 text-sm">
                {selectedTeamName && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-700">Team:</span>
                    <Badge variant="secondary">{selectedTeamName}</Badge>
                  </div>
                )}
                {selectedReferees.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-700">Referees:</span>
                    <Badge variant="secondary">{selectedReferees.length} selected</Badge>
                  </div>
                )}
                {hasActiveOverrides && (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-700">Feature adjustments:</span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-blue-700">Season:</span>
                  <Badge variant="secondary">{filters.season}</Badge>
                  <span className="text-blue-700">Grid:</span>
                  <Badge variant="secondary">{filters.grid}</Badge>
                </div>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerateReport}
            disabled={!selectedTeam || selectedReferees.length === 0 || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Reports History */}
      {generatedReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generatedReports.map(report => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {report.teamName} vs {report.referees.length} referee(s)
                    </div>
                    <div className="text-sm text-gray-500">
                      Generated {report.generatedAt} • {report.format}
                    </div>
                    <div className="flex gap-1 mt-1">
                      {report.referees.slice(0, 3).map((ref, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {ref.length > 15 ? ref.substring(0, 15) + '...' : ref}
                        </Badge>
                      ))}
                      {report.referees.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{report.referees.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(report)}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReportBuilder;