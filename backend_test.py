#!/usr/bin/env python3
"""
Backend API Testing for Soccer Foul & Referee Analytics
Tests all API endpoints using the public URL from frontend configuration
"""

import requests
import sys
import json
from datetime import datetime

class SoccerAnalyticsAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "name": name,
            "success": success,
            "details": details
        })

    def test_root_endpoint(self):
        """Test root endpoint"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                expected_keys = ["message", "version", "description"]
                has_keys = all(key in data for key in expected_keys)
                success = has_keys
                details = f"Status: {response.status_code}, Keys present: {has_keys}"
            else:
                details = f"Status: {response.status_code}"
                
            self.log_test("Root Endpoint", success, details)
            return success, response.json() if success else {}
            
        except Exception as e:
            self.log_test("Root Endpoint", False, str(e))
            return False, {}

    def test_competitions_endpoint(self):
        """Test competitions endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/competitions", timeout=30)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                has_success_key = "success" in data and data["success"]
                has_data = "data" in data and isinstance(data["data"], list)
                success = has_success_key and has_data
                details = f"Status: {response.status_code}, Competitions count: {len(data.get('data', []))}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
                
            self.log_test("Competitions Endpoint", success, details)
            return success, response.json() if success else {}
            
        except Exception as e:
            self.log_test("Competitions Endpoint", False, str(e))
            return False, {}

    def test_matches_endpoint(self, competition_id=11, season_id=90):
        """Test matches endpoint with La Liga 2020/2021"""
        try:
            url = f"{self.base_url}/api/competitions/{competition_id}/seasons/{season_id}/matches"
            response = requests.get(url, timeout=30)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                has_success_key = "success" in data and data["success"]
                has_data = "data" in data and isinstance(data["data"], list)
                success = has_success_key and has_data
                details = f"Status: {response.status_code}, Matches count: {len(data.get('data', []))}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
                
            self.log_test("Matches Endpoint", success, details)
            return success, response.json() if success else {}
            
        except Exception as e:
            self.log_test("Matches Endpoint", False, str(e))
            return False, {}

    def test_match_fouls_endpoint(self, match_id):
        """Test match fouls endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/matches/{match_id}/fouls", timeout=30)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                has_success_key = "success" in data and data["success"]
                has_data = "data" in data
                if has_data:
                    match_data = data["data"]
                    has_required_fields = all(key in match_data for key in ["match_id", "total_fouls", "fouls"])
                    success = has_success_key and has_required_fields
                    details = f"Status: {response.status_code}, Total fouls: {match_data.get('total_fouls', 0)}"
                else:
                    success = False
                    details = "Missing data field"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
                
            self.log_test("Match Fouls Endpoint", success, details)
            return success, response.json() if success else {}
            
        except Exception as e:
            self.log_test("Match Fouls Endpoint", False, str(e))
            return False, {}

    def test_referee_decisions_endpoint(self, match_id):
        """Test referee decisions endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/matches/{match_id}/referee-decisions", timeout=30)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                has_success_key = "success" in data and data["success"]
                has_data = "data" in data
                if has_data:
                    match_data = data["data"]
                    has_required_fields = all(key in match_data for key in ["match_id", "total_decisions", "decisions"])
                    success = has_success_key and has_required_fields
                    details = f"Status: {response.status_code}, Total decisions: {match_data.get('total_decisions', 0)}"
                else:
                    success = False
                    details = "Missing data field"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
                
            self.log_test("Referee Decisions Endpoint", success, details)
            return success, response.json() if success else {}
            
        except Exception as e:
            self.log_test("Referee Decisions Endpoint", False, str(e))
            return False, {}

    def test_match_summary_endpoint(self, match_id):
        """Test match summary endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/matches/{match_id}/summary", timeout=30)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                has_success_key = "success" in data and data["success"]
                has_data = "data" in data
                if has_data:
                    summary_data = data["data"]
                    required_fields = ["match_id", "home_team", "away_team", "total_fouls", "total_cards", "yellow_cards", "red_cards"]
                    has_required_fields = all(key in summary_data for key in required_fields)
                    success = has_success_key and has_required_fields
                    details = f"Status: {response.status_code}, {summary_data.get('home_team', 'Unknown')} vs {summary_data.get('away_team', 'Unknown')}"
                else:
                    success = False
                    details = "Missing data field"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
                
            self.log_test("Match Summary Endpoint", success, details)
            return success, response.json() if success else {}
            
        except Exception as e:
            self.log_test("Match Summary Endpoint", False, str(e))
            return False, {}

    def test_foul_types_analytics(self):
        """Test foul types analytics endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/analytics/foul-types", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                has_success_key = "success" in data and data["success"]
                has_data = "data" in data and "foul_types" in data["data"]
                success = has_success_key and has_data
                details = f"Status: {response.status_code}, Foul types count: {len(data.get('data', {}).get('foul_types', []))}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
                
            self.log_test("Foul Types Analytics", success, details)
            return success, response.json() if success else {}
            
        except Exception as e:
            self.log_test("Foul Types Analytics", False, str(e))
            return False, {}

    def test_card_statistics_analytics(self):
        """Test card statistics analytics endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/analytics/card-statistics", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                has_success_key = "success" in data and data["success"]
                has_data = "data" in data
                if has_data:
                    card_data = data["data"]
                    required_fields = ["yellow_cards", "red_cards", "cards_per_match"]
                    has_required_fields = all(key in card_data for key in required_fields)
                    success = has_success_key and has_required_fields
                    details = f"Status: {response.status_code}, Yellow: {card_data.get('yellow_cards', 0)}, Red: {card_data.get('red_cards', 0)}"
                else:
                    success = False
                    details = "Missing data field"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
                
            self.log_test("Card Statistics Analytics", success, details)
            return success, response.json() if success else {}
            
        except Exception as e:
            self.log_test("Card Statistics Analytics", False, str(e))
            return False, {}

    def run_full_test_suite(self):
        """Run complete test suite"""
        print("🚀 Starting Soccer Analytics API Test Suite")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test basic endpoints
        root_success, _ = self.test_root_endpoint()
        competitions_success, competitions_data = self.test_competitions_endpoint()
        
        # Test analytics endpoints (these use sample data)
        self.test_foul_types_analytics()
        self.test_card_statistics_analytics()
        
        # Test match-specific endpoints if we have competition data
        if competitions_success and competitions_data.get("data"):
            print("\n🔍 Testing with real match data...")
            
            # Try La Liga 2020/2021 first
            matches_success, matches_data = self.test_matches_endpoint(11, 90)
            
            if matches_success and matches_data.get("data"):
                # Get first available match
                matches = matches_data["data"]
                if matches:
                    test_match = matches[0]
                    match_id = test_match.get("match_id")
                    
                    if match_id:
                        print(f"🎯 Testing with match ID: {match_id}")
                        self.test_match_fouls_endpoint(match_id)
                        self.test_referee_decisions_endpoint(match_id)
                        self.test_match_summary_endpoint(match_id)
                    else:
                        print("⚠️  No valid match ID found in match data")
                else:
                    print("⚠️  No matches found for La Liga 2020/2021")
            else:
                print("⚠️  Could not fetch matches, skipping match-specific tests")
        else:
            print("⚠️  Could not fetch competitions, skipping match-specific tests")
        
        # Print final results
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        for result in self.test_results:
            status = "✅ PASS" if result["success"] else "❌ FAIL"
            print(f"{status} | {result['name']}")
            if not result["success"] and result["details"]:
                print(f"     └─ {result['details']}")
        
        print(f"\n🎯 Overall: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed! Backend API is working correctly.")
            return 0
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return 1

def main():
    """Main test execution"""
    # Use the same URL as frontend
    api_url = "http://localhost:8001"
    
    tester = SoccerAnalyticsAPITester(api_url)
    return tester.run_full_test_suite()

if __name__ == "__main__":
    sys.exit(main())