#!/bin/bash

# Company API Quick Test Script
# Este script hace un test rápido de los endpoints principales

API_URL="http://localhost:3000"
USER_ID=1

echo "========================================"
echo "  Company API Quick Test"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

# Function to print step
print_step() {
    echo -e "${YELLOW}→ $1${NC}"
}

echo "Prerequisites:"
echo "- Server running on ${API_URL}"
echo "- User with ID ${USER_ID} exists"
echo ""
read -p "Press Enter to continue..."
echo ""

# Test 1: Check name availability
print_step "1. Testing name availability check..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/api/company/check-name?name=TestCompany")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Name availability check works"
    echo "   Response: $BODY"
else
    print_result 1 "Name availability check failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 2: Create company
print_step "2. Creating test company..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/company" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": ${USER_ID}, \"name\": \"API Test Company\", \"description\": \"Created by test script\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "201" ]; then
    COMPANY_ID=$(echo "$BODY" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
    print_result 0 "Company created successfully (ID: $COMPANY_ID)"
    echo "   Response: $BODY"
else
    print_result 1 "Company creation failed (HTTP $HTTP_CODE)"
    echo "   Response: $BODY"
    exit 1
fi
echo ""

# Test 3: Get all companies
print_step "3. Getting all companies..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/api/company?userId=${USER_ID}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Get all companies works"
    echo "   Found companies: $(echo "$BODY" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')"
else
    print_result 1 "Get all companies failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 4: Get specific company
print_step "4. Getting company by ID..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/api/company/${COMPANY_ID}?userId=${USER_ID}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Get company by ID works"
else
    print_result 1 "Get company by ID failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 5: Update company
print_step "5. Updating company..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X PATCH "${API_URL}/api/company/${COMPANY_ID}" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": ${USER_ID}, \"description\": \"Updated by test script\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Company updated successfully"
else
    print_result 1 "Company update failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 6: Archive company
print_step "6. Archiving company..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/company/${COMPANY_ID}/archive" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": ${USER_ID}}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Company archived successfully"
else
    print_result 1 "Company archive failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 7: Get archived companies
print_step "7. Getting archived companies..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/api/company?userId=${USER_ID}&state=archived")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Get archived companies works"
    echo "   Archived companies: $(echo "$BODY" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')"
else
    print_result 1 "Get archived companies failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 8: Reactivate company
print_step "8. Reactivating company..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/company/${COMPANY_ID}/reactivate" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": ${USER_ID}}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Company reactivated successfully"
else
    print_result 1 "Company reactivation failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 9: Check permissions
print_step "9. Checking permissions..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/api/company/${COMPANY_ID}/permission?userId=${USER_ID}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    HAS_PERMISSION=$(echo "$BODY" | grep -o '"hasPermission":[a-z]*' | grep -o '[a-z]*$')
    if [ "$HAS_PERMISSION" = "true" ]; then
        print_result 0 "Permission check works (has permission: true)"
    else
        print_result 1 "Permission check returned false"
    fi
else
    print_result 1 "Permission check failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 10: Delete company
print_step "10. Deleting company..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "${API_URL}/api/company/${COMPANY_ID}?userId=${USER_ID}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    print_result 0 "Company deleted successfully"
else
    print_result 1 "Company deletion failed (HTTP $HTTP_CODE)"
fi
echo ""

echo "========================================"
echo "  Test completed!"
echo "========================================"
