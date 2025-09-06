"""
Referee Effects Visualization

Creates heatmaps, forest plots, and team reports for referee-playstyle interactions.
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import logging
from typing import Dict, List, Optional, Tuple, Any
from pathlib import Path
import warnings

logger = logging.getLogger(__name__)

class RefereeVisualizer:
    """Visualization tools for referee effects and playstyle interactions."""
    
    def __init__(self, config: Dict = None):
        """
        Initialize visualizer.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        self.viz_config = self.config.get('visualization', {})
        
        # Field dimensions
        self.field_length = self.viz_config.get('heatmap', {}).get('field_dimensions', {}).get('length', 120)
        self.field_width = self.viz_config.get('heatmap', {}).get('field_dimensions', {}).get('width', 80)
        
        # Zone configuration (5x3 grid)
        self.x_bins = 5
        self.y_bins = 3
        
        # Visual settings
        self.color_scheme = self.viz_config.get('heatmap', {}).get('color_scheme', 'RdYlBu_r')
        self.significance_alpha = self.viz_config.get('heatmap', {}).get('significance_alpha', 0.05)
        self.confidence_level = self.viz_config.get('forest_plot', {}).get('confidence_level', 0.95)
        
        # Setup matplotlib style
        plt.style.use('seaborn-v0_8')
        sns.set_palette("husl")
        
        logger.info("Initialized referee visualizer")
    
    def create_referee_heatmap_delta(self, modeler, referee_name: str, feature: str, 
                                   delta_sd: float = 1.0, output_file: Path = None) -> plt.Figure:
        """
        Create heatmap showing referee effect deltas for a feature.
        
        Args:
            modeler: Fitted ZoneNBModeler instance
            referee_name: Name of referee to analyze
            feature: Feature name (e.g., 'directness')
            delta_sd: Standard deviation change to analyze
            output_file: Optional output file path
            
        Returns:
            matplotlib Figure object
        """
        if not modeler.fitted_models:
            raise ValueError("No fitted models available")
        
        logger.info(f"Creating heatmap delta for {referee_name}, feature: {feature}")
        
        # Extract referee slopes for this feature
        slopes_df = modeler.extract_referee_slopes(feature)
        
        if slopes_df.empty:
            raise ValueError(f"No interaction slopes found for feature {feature}")
        
        # Filter for this referee
        ref_slopes = slopes_df[slopes_df['referee_name'] == referee_name]
        
        if ref_slopes.empty:
            raise ValueError(f"No slopes found for referee {referee_name}")
        
        # Create 5x3 grid for heatmap
        delta_grid = np.zeros((self.y_bins, self.x_bins))
        significance_grid = np.zeros((self.y_bins, self.x_bins), dtype=bool)
        
        for _, row in ref_slopes.iterrows():
            # Parse zone coordinates
            zone_parts = row['zone'].split('_')
            x_zone = int(zone_parts[1])
            y_zone = int(zone_parts[2])
            
            # Calculate delta (expected change for +1 SD in feature)
            slope = row['slope']
            delta_fouls = slope * delta_sd
            
            # Store in grid (flip y for proper field orientation)
            delta_grid[self.y_bins - 1 - y_zone, x_zone] = delta_fouls
            significance_grid[self.y_bins - 1 - y_zone, x_zone] = row['significant']
        
        # Create figure
        fig, ax = plt.subplots(figsize=(12, 8))
        
        # Create heatmap
        im = ax.imshow(delta_grid, cmap=self.color_scheme, aspect='auto', 
                      extent=[0, self.field_length, 0, self.field_width])
        
        # Add colorbar
        cbar = plt.colorbar(im, ax=ax, shrink=0.8)
        cbar.set_label(f'Δ Expected Fouls per {delta_sd}σ change in {feature.title()}', 
                      rotation=270, labelpad=20)
        
        # Add significance markers
        for y in range(self.y_bins):
            for x in range(self.x_bins):
                if significance_grid[y, x]:
                    # Add asterisk for significant effects
                    x_pos = (x + 0.5) * (self.field_length / self.x_bins)
                    y_pos = (y + 0.5) * (self.field_width / self.y_bins)
                    ax.text(x_pos, y_pos, '*', ha='center', va='center', 
                           fontsize=20, fontweight='bold', color='white')
        
        # Add field markings
        self._add_field_markings(ax)
        
        # Formatting
        ax.set_xlim(0, self.field_length)
        ax.set_ylim(0, self.field_width)
        ax.set_xlabel('Field Length (m)', fontsize=12)
        ax.set_ylabel('Field Width (m)', fontsize=12)
        ax.set_title(f'Referee Effect: {referee_name}\n'
                    f'{feature.title()} Impact on Foul Distribution\n'
                    f'(* = significant at α={self.significance_alpha})', 
                    fontsize=14, fontweight='bold')
        
        # Add interpretation text
        avg_delta = np.mean(delta_grid[delta_grid != 0])
        max_delta = np.max(np.abs(delta_grid))
        
        interpretation = (f"Average effect: {avg_delta:+.2f} fouls/game\n"
                         f"Max effect: ±{max_delta:.2f} fouls/game\n"
                         f"For {delta_sd}σ increase in {feature}")
        
        ax.text(0.02, 0.98, interpretation, transform=ax.transAxes,
               verticalalignment='top', bbox=dict(boxstyle='round', 
               facecolor='white', alpha=0.8), fontsize=10)
        
        plt.tight_layout()
        
        # Save if requested
        if output_file:
            plt.savefig(output_file, dpi=300, bbox_inches='tight')
            logger.info(f"Saved heatmap to {output_file}")
        
        return fig
    
    def create_forest_plot(self, modeler, feature: str, zones: List[str] = None,
                          max_referees: int = 15, output_file: Path = None) -> plt.Figure:
        """
        Create forest plot showing referee slopes for a feature.
        
        Args:
            modeler: Fitted ZoneNBModeler instance
            feature: Feature name
            zones: Specific zones to include (if None, averages across zones)
            max_referees: Maximum number of referees to display
            output_file: Optional output file path
            
        Returns:
            matplotlib Figure object
        """
        logger.info(f"Creating forest plot for feature: {feature}")
        
        # Extract referee slopes
        slopes_df = modeler.extract_referee_slopes(feature)
        
        if slopes_df.empty:
            raise ValueError(f"No slopes found for feature {feature}")
        
        # Calculate average slopes per referee if no specific zones requested
        if zones is None:
            ref_slopes = slopes_df.groupby('referee_name').agg({
                'slope': 'mean',
                'se': lambda x: np.sqrt(np.mean(x**2)),  # Average standard error
                'pvalue': lambda x: np.mean(x < self.significance_alpha)  # Prop. significant
            }).reset_index()
        else:
            ref_slopes = slopes_df[slopes_df['zone'].isin(zones)].copy()
        
        # Sort by effect size and limit
        ref_slopes = ref_slopes.reindex(
            ref_slopes['slope'].abs().sort_values(ascending=False).index
        ).head(max_referees)
        
        # Calculate confidence intervals
        z_score = 1.96  # 95% CI
        ref_slopes['ci_lower'] = ref_slopes['slope'] - z_score * ref_slopes['se']
        ref_slopes['ci_upper'] = ref_slopes['slope'] + z_score * ref_slopes['se']
        
        # Create figure
        fig, ax = plt.subplots(figsize=(10, max(6, len(ref_slopes) * 0.4)))
        
        # Create forest plot
        y_positions = range(len(ref_slopes))
        
        # Plot confidence intervals
        for i, (_, row) in enumerate(ref_slopes.iterrows()):
            ax.plot([row['ci_lower'], row['ci_upper']], [i, i], 'k-', alpha=0.6)
            
            # Plot point estimate
            color = 'red' if row['slope'] > 0 else 'blue'
            marker = 'o' if row.get('pvalue', 1) < self.significance_alpha else 's'
            ax.plot(row['slope'], i, marker, color=color, markersize=8)
        
        # Add vertical line at zero
        ax.axvline(x=0, color='gray', linestyle='--', alpha=0.7)
        
        # Formatting
        ax.set_yticks(y_positions)
        ax.set_yticklabels(ref_slopes['referee_name'])
        ax.set_xlabel(f'{feature.title()} Effect (Slope Coefficient)', fontsize=12)
        ax.set_ylabel('Referee', fontsize=12)
        ax.set_title(f'Referee-Specific {feature.title()} Effects\n'
                    f'(Circles = significant, Squares = non-significant)', 
                    fontsize=14, fontweight='bold')
        
        # Add legend
        ax.plot([], [], 'ro', label='Positive effect (significant)')
        ax.plot([], [], 'rs', label='Positive effect (non-significant)')  
        ax.plot([], [], 'bo', label='Negative effect (significant)')
        ax.plot([], [], 'bs', label='Negative effect (non-significant)')
        ax.legend(loc='best')
        
        # Grid
        ax.grid(True, alpha=0.3)
        
        plt.tight_layout()
        
        # Save if requested
        if output_file:
            plt.savefig(output_file, dpi=300, bbox_inches='tight')
            logger.info(f"Saved forest plot to {output_file}")
        
        return fig
    
    def create_team_report(self, modeler, team_features: Dict, referee_name: str,
                          output_file: Path = None) -> plt.Figure:
        """
        Create team scouting report for a specific referee.
        
        Args:
            modeler: Fitted ZoneNBModeler instance
            team_features: Dictionary with team's average features
            referee_name: Referee to analyze
            output_file: Optional output file path
            
        Returns:
            matplotlib Figure object
        """
        logger.info(f"Creating team report for referee: {referee_name}")
        
        # Create team features as pandas Series for prediction
        team_row = pd.Series(team_features)
        
        # Predict expected fouls per zone
        expected_fouls = modeler.predict_expected_fouls(team_row)
        
        # Create 5x3 grid
        foul_grid = np.zeros((self.y_bins, self.x_bins))
        
        for zone_id, fouls in expected_fouls.items():
            if zone_id.startswith('zone_'):
                parts = zone_id.split('_')
                x_zone = int(parts[1])
                y_zone = int(parts[2])
                foul_grid[self.y_bins - 1 - y_zone, x_zone] = fouls
        
        # Create figure with subplots
        fig = plt.figure(figsize=(15, 10))
        
        # Main heatmap
        ax1 = plt.subplot2grid((3, 2), (0, 0), colspan=2, rowspan=2)
        
        im = ax1.imshow(foul_grid, cmap='Reds', aspect='auto',
                       extent=[0, self.field_length, 0, self.field_width])
        
        # Add values to cells
        for y in range(self.y_bins):
            for x in range(self.x_bins):
                value = foul_grid[y, x]
                x_pos = (x + 0.5) * (self.field_length / self.x_bins)
                y_pos = (y + 0.5) * (self.field_width / self.y_bins)
                ax1.text(x_pos, y_pos, f'{value:.1f}', ha='center', va='center',
                        fontsize=12, fontweight='bold', 
                        color='white' if value > np.max(foul_grid) * 0.5 else 'black')
        
        # Add field markings
        self._add_field_markings(ax1)
        
        ax1.set_title(f'Expected Fouls per Zone\nReferee: {referee_name}', 
                     fontsize=16, fontweight='bold')
        ax1.set_xlabel('Field Length (m)')
        ax1.set_ylabel('Field Width (m)')
        
        # Colorbar
        cbar = plt.colorbar(im, ax=ax1, shrink=0.8)
        cbar.set_label('Expected Fouls per Match', rotation=270, labelpad=20)
        
        # Summary statistics table
        ax2 = plt.subplot2grid((3, 2), (2, 0))
        ax2.axis('off')
        
        total_fouls = np.sum(foul_grid)
        max_zone_fouls = np.max(foul_grid)
        hottest_zone = np.unravel_index(np.argmax(foul_grid), foul_grid.shape)
        
        summary_data = [
            ['Total Expected Fouls', f'{total_fouls:.1f}'],
            ['Hottest Zone Fouls', f'{max_zone_fouls:.1f}'],
            ['Hottest Zone Location', f'Zone {hottest_zone[1]}_{self.y_bins-1-hottest_zone[0]}'],
            ['Average per Zone', f'{total_fouls/15:.1f}']
        ]
        
        table = ax2.table(cellText=summary_data,
                         colLabels=['Metric', 'Value'],
                         cellLoc='center',
                         loc='center')
        table.auto_set_font_size(False)
        table.set_fontsize(11)
        table.scale(1, 2)
        ax2.set_title('Summary Statistics', fontweight='bold')
        
        # Team features display
        ax3 = plt.subplot2grid((3, 2), (2, 1))
        ax3.axis('off')
        
        key_features = ['directness', 'ppda', 'possession_share', 'wing_share']
        feature_data = []
        for feature in key_features:
            if feature in team_features:
                value = team_features[feature]
                if isinstance(value, (int, float)):
                    feature_data.append([feature.replace('_', ' ').title(), f'{value:.2f}'])
        
        if feature_data:
            table2 = ax3.table(cellText=feature_data,
                              colLabels=['Team Feature', 'Value'],
                              cellLoc='center',
                              loc='center')
            table2.auto_set_font_size(False)
            table2.set_fontsize(11)
            table2.scale(1, 2)
        
        ax3.set_title('Team Playstyle Profile', fontweight='bold')
        
        plt.tight_layout()
        
        # Save if requested
        if output_file:
            plt.savefig(output_file, dpi=300, bbox_inches='tight')
            logger.info(f"Saved team report to {output_file}")
        
        return fig
    
    def _add_field_markings(self, ax):
        """Add soccer field markings to the plot."""
        # Field boundaries
        ax.plot([0, self.field_length, self.field_length, 0, 0], 
               [0, 0, self.field_width, self.field_width, 0], 'k-', linewidth=2)
        
        # Center line
        ax.plot([self.field_length/2, self.field_length/2], [0, self.field_width], 'k-', linewidth=1)
        
        # Center circle
        circle = plt.Circle((self.field_length/2, self.field_width/2), 10, 
                           fill=False, color='black', linewidth=1)
        ax.add_patch(circle)
        
        # Penalty areas
        # Left penalty area
        ax.plot([0, 18, 18, 0], [self.field_width/2 - 20, self.field_width/2 - 20, 
                                self.field_width/2 + 20, self.field_width/2 + 20], 'k-', linewidth=1)
        
        # Right penalty area  
        ax.plot([self.field_length, self.field_length - 18, self.field_length - 18, self.field_length], 
               [self.field_width/2 - 20, self.field_width/2 - 20, 
                self.field_width/2 + 20, self.field_width/2 + 20], 'k-', linewidth=1)
        
        # Goal areas
        # Left goal area
        ax.plot([0, 6, 6, 0], [self.field_width/2 - 10, self.field_width/2 - 10,
                              self.field_width/2 + 10, self.field_width/2 + 10], 'k-', linewidth=1)
        
        # Right goal area
        ax.plot([self.field_length, self.field_length - 6, self.field_length - 6, self.field_length],
               [self.field_width/2 - 10, self.field_width/2 - 10,
                self.field_width/2 + 10, self.field_width/2 + 10], 'k-', linewidth=1)