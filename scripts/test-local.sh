echo "🚀 Testing CI Workflow Locally"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."
if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command_exists docker-compose; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"

# Start test services
echo "🐳 Starting test services..."
docker-compose -f docker-compose.test.yml up -d

# Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if ! docker-compose -f docker-compose.test.yml ps | grep -q "Up"; then
    echo -e "${RED}❌ Services failed to start${NC}"
    docker-compose -f docker-compose.test.yml logs
    exit 1
fi

echo -e "${GREEN}✅ Services are running${NC}"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf node_modules dist coverage

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Type checking
echo "🔍 Type checking..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Type check failed${NC}"
    docker-compose -f docker-compose.test.yml down
    exit 1
fi

# Linting
echo "✨ Linting code..."
npm run lint
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Linting issues found${NC}"
fi

# Run tests
echo "🧪 Running tests..."
npm test -- --coverage
TEST_RESULT=$?

# Build project
echo "🔨 Building project..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    TEST_RESULT=1
fi

# Stop services
echo "🛑 Stopping test services..."
docker-compose -f docker-compose.test.yml down

# Report results
if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo -e "${GREEN}✅ Build successful!${NC}"
    exit 0
else
    echo -e "${RED}❌ Tests or build failed${NC}"
    exit 1
fi