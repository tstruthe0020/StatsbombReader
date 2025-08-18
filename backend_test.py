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

    def test_llm_query_endpoint_valid_queries(self):
        """Test LLM query endpoint with valid natural language queries"""
        test_queries = [
            "What are the most common foul types in soccer?",
            "Which referee gives the most cards?",
            "How do referee decisions vary by competition?"
        ]
        
        for query in test_queries:
            try:
                payload = {"query": query}
                response = requests.post(
                    f"{self.base_url}/api/query", 
                    json=payload, 
                    timeout=30,
                    headers={"Content-Type": "application/json"}
                )
                success = response.status_code == 200
                
                if success:
                    data = response.json()
                    has_success_key = "success" in data and data["success"]
                    has_data = "data" in data
                    if has_data:
                        query_data = data["data"]
                        required_fields = ["query", "response", "context_used", "model_used"]
                        has_required_fields = all(key in query_data for key in required_fields)
                        has_response_content = len(query_data.get("response", "")) > 0
                        success = has_success_key and has_required_fields and has_response_content
                        details = f"Status: {response.status_code}, Model: {query_data.get('model_used', 'N/A')}, Response length: {len(query_data.get('response', ''))}"
                    else:
                        success = False
                        details = "Missing data field"
                else:
                    details = f"Status: {response.status_code}, Response: {response.text[:200]}"
                    
                self.log_test(f"LLM Query: '{query[:30]}...'", success, details)
                
            except Exception as e:
                self.log_test(f"LLM Query: '{query[:30]}...'", False, str(e))

    def test_llm_query_endpoint_with_context(self):
        """Test LLM query endpoint with additional context"""
        try:
            payload = {
                "query": "Analyze referee strictness patterns",
                "context": "Focus on La Liga matches from 2020/2021 season"
            }
            response = requests.post(
                f"{self.base_url}/api/query", 
                json=payload, 
                timeout=30,
                headers={"Content-Type": "application/json"}
            )
            success = response.status_code == 200
            
            if success:
                data = response.json()
                has_success_key = "success" in data and data["success"]
                has_data = "data" in data
                if has_data:
                    query_data = data["data"]
                    has_context_used = "context_used" in query_data
                    has_response = len(query_data.get("response", "")) > 0
                    success = has_success_key and has_context_used and has_response
                    details = f"Status: {response.status_code}, Context provided: {has_context_used}, Response length: {len(query_data.get('response', ''))}"
                else:
                    success = False
                    details = "Missing data field"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
                
            self.log_test("LLM Query with Context", success, details)
            return success, response.json() if success else {}
            
        except Exception as e:
            self.log_test("LLM Query with Context", False, str(e))
            return False, {}

    def test_llm_query_validation(self):
        """Test LLM query endpoint input validation"""
        # Test empty query
        try:
            payload = {"query": ""}
            response = requests.post(
                f"{self.base_url}/api/query", 
                json=payload, 
                timeout=10,
                headers={"Content-Type": "application/json"}
            )
            # Should either accept empty query or return validation error
            success = response.status_code in [200, 400, 422]
            details = f"Empty query - Status: {response.status_code}"
            self.log_test("LLM Query Validation - Empty Query", success, details)
            
        except Exception as e:
            self.log_test("LLM Query Validation - Empty Query", False, str(e))

        # Test missing query field
        try:
            payload = {"context": "some context"}
            response = requests.post(
                f"{self.base_url}/api/query", 
                json=payload, 
                timeout=10,
                headers={"Content-Type": "application/json"}
            )
            # Should return validation error
            success = response.status_code in [400, 422]
            details = f"Missing query field - Status: {response.status_code}"
            self.log_test("LLM Query Validation - Missing Query", success, details)
            
        except Exception as e:
            self.log_test("LLM Query Validation - Missing Query", False, str(e))

        # Test invalid JSON
        try:
            response = requests.post(
                f"{self.base_url}/api/query", 
                data="invalid json", 
                timeout=10,
                headers={"Content-Type": "application/json"}
            )
            # Should return validation error
            success = response.status_code in [400, 422]
            details = f"Invalid JSON - Status: {response.status_code}"
            self.log_test("LLM Query Validation - Invalid JSON", success, details)
            
        except Exception as e:
            self.log_test("LLM Query Validation - Invalid JSON", False, str(e))

    def test_llm_error_handling(self):
        """Test LLM endpoint error handling scenarios"""
        # Test very long query (potential token limit)
        try:
            long_query = "Analyze referee patterns " * 200  # Very long query
            payload = {"query": long_query}
            response = requests.post(
                f"{self.base_url}/api/query", 
                json=payload, 
                timeout=30,
                headers={"Content-Type": "application/json"}
            )
            # Should either handle gracefully or return appropriate error
            success = response.status_code in [200, 400, 413, 500]
            details = f"Long query - Status: {response.status_code}"
            self.log_test("LLM Error Handling - Long Query", success, details)
            
        except Exception as e:
            self.log_test("LLM Error Handling - Long Query", False, str(e))

    def test_referees_list_endpoint(self):
        """Test referees list endpoint"""
        try:
            response = requests.get(f"{self.base_url}/api/analytics/referees", timeout=10)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                has_success_key = "success" in data and data["success"]
                has_data = "data" in data and isinstance(data["data"], list)
                if has_data:
                    referees = data["data"]
                    if referees:
                        # Check first referee has required fields
                        first_ref = referees[0]
                        required_fields = ["id", "name", "matches", "total_fouls"]
                        has_required_fields = all(key in first_ref for key in required_fields)
                        success = has_success_key and has_required_fields
                        details = f"Status: {response.status_code}, Referees count: {len(referees)}"
                    else:
                        success = has_success_key
                        details = f"Status: {response.status_code}, Empty referees list"
                else:
                    success = False
                    details = "Missing or invalid data field"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
                
            self.log_test("Referees List Endpoint", success, details)
            return success, response.json() if success else {}
            
        except Exception as e:
            self.log_test("Referees List Endpoint", False, str(e))
            return False, {}

    def test_referee_heatmap_endpoint(self):
        """Test referee heatmap endpoint"""
        try:
            # Test with a known referee ID
            referee_id = "ref_001"
            response = requests.get(f"{self.base_url}/api/analytics/referees/{referee_id}/heatmap", timeout=15)
            success = response.status_code == 200
            
            if success:
                data = response.json()
                has_success_key = "success" in data and data["success"]
                has_data = "data" in data
                if has_data:
                    heatmap_data = data["data"]
                    required_fields = ["referee_id", "referee_name", "total_fouls", "heatmap_zones", "field_dimensions"]
                    has_required_fields = all(key in heatmap_data for key in required_fields)
                    has_zones = isinstance(heatmap_data.get("heatmap_zones", []), list) and len(heatmap_data.get("heatmap_zones", [])) > 0
                    success = has_success_key and has_required_fields and has_zones
                    details = f"Status: {response.status_code}, Referee: {heatmap_data.get('referee_name', 'N/A')}, Zones: {len(heatmap_data.get('heatmap_zones', []))}"
                else:
                    success = False
                    details = "Missing data field"
            else:
                details = f"Status: {response.status_code}, Response: {response.text[:200]}"
                
            self.log_test("Referee Heatmap Endpoint", success, details)
            return success, response.json() if success else {}
            
        except Exception as e:
            self.log_test("Referee Heatmap Endpoint", False, str(e))
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
        
        # Test referee endpoints
        print("\n🔍 Testing referee analytics...")
        self.test_referees_list_endpoint()
        self.test_referee_heatmap_endpoint()
        
        # Test LLM integration endpoints
        print("\n🤖 Testing LLM Integration...")
        self.test_llm_query_endpoint_valid_queries()
        self.test_llm_query_endpoint_with_context()
        self.test_llm_query_validation()
        self.test_llm_error_handling()
        
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
    # Read the backend URL from frontend .env file
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    api_url = line.split('=', 1)[1].strip()
                    break
            else:
                # Fallback to localhost if not found
                api_url = "http://localhost:8001"
    except Exception as e:
        print(f"Warning: Could not read frontend .env file: {e}")
        api_url = "http://localhost:8001"
    
    print(f"🌐 Using API URL: {api_url}")
    tester = SoccerAnalyticsAPITester(api_url)
    return tester.run_full_test_suite()

if __name__ == "__main__":
    sys.exit(main())